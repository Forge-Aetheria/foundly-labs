# Contract: GraphQL execution layer & data seam (`apps/api`)

**Feature**: `specs/api/007-graphql-api-layer/` | **Date**: 2026-10-11

## Endpoint posture (unchanged)

`POST /graphql` (Apollo/NestJS, code-first, `autoSchemaFile`); playground/introspection only when
`NODE_ENV !== 'production'`.

## Request context

Every GraphQL request is executed with a typed context exposing the shared data seam:

```ts
interface GraphQLContext {
  prisma: typeof import('@foundly/database').prisma; // the workspace singleton
}
```

The context factory and the injectable `PrismaService` reference the **same** instance — one
persistence seam, one connection pool.

## Types

```graphql
type HealthPayload {
  service: String!    # "foundly-api"
  status: String!     # "ok" — liveness (API responding)
  database: String!   # "up" | "down" — data-layer readiness
  checkedAt: String!  # ISO-8601 UTC timestamp of the probe
}
```

## Queries

| Query    | Guards | Returns          | Behaviour                                                                                             |
| -------- | ------ | ---------------- | ----------------------------------------------------------------------------------------------------- |
| `health` | none   | `HealthPayload!` | Liveness `status: "ok"`; runs a read-only data probe: `database: "up"` on success, `"down"` on failure/timeout (2 s bound). Never throws, never crashes, never writes. |

The field name `health` is preserved from the bootstrap contract; the payload is additive.

## Error semantics

| Condition                        | Outcome                                                        |
| -------------------------------- | ------------------------------------------------------------- |
| data store reachable             | `{ status: "ok", database: "up", checkedAt }`                 |
| data store unreachable/slow/stopped | `{ status: "ok", database: "down", checkedAt }` — **no GraphQL error** |
| probe timeout (2 s)              | `database: "down"`; no `errors` entry                          |

Health never returns `errors`; it represents degraded state as data, so clients stay responsive.

## Data changes

None. No `schema.prisma` delta, no migrations, no client regeneration, no new dependencies.

## Tests (DB-free)

- Unit `contextFactory`: returns the shared prisma singleton (`@foundly/database`), typed as
  `GraphQLContext`.
- Unit `health.resolver.spec.ts`: `PrismaService` mocked — `$queryRaw` resolves → `database: "up"`;
  rejects → `database: "down"`; never-settling (timeout) → `"down"`; payload always includes
  `service`/`status`/`checkedAt`.
- E2E over `POST /graphql` (`{ health { service status database checkedAt } }`) with the mocked
  seam: HTTP 200, `errors` undefined, payload shape correct.