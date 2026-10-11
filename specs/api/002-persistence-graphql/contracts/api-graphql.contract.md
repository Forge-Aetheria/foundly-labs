# Contract: API GraphQL (health) + Database package

**Feature**: `specs/api/002-persistence-graphql/` | **Date**: 2026-10-11

## Database package contract (`@foundly/database`)

| Script        | Command / expectation                                        |
| ------------- | ------------------------------------------------------------ |
| `generate`    | `prisma generate` (DB-First client).                         |
| `build`       | `tsc` over `src/` (no emit friction; strict).                |
| `typecheck`   | `tsc --noEmit`.                                              |
| `test`        | vitest suite (schema/model sanity).                          |

- Exports: `PrismaClient` instance + generated types (from `@prisma/client`).
- `schema.prisma`: provider `postgresql`, models Tenant/Profile/Service/Staff/Appointment/Gallery/Availability.

## GraphQL endpoint contract (`apps/api`)

| Method | Path       | Engine              | Playground/sandbox            |
| ------ | ---------- | ------------------- | ----------------------------- |
| POST   | `/graphql` | Apollo (NestJS)     | Enabled when `NODE_ENV !== 'production'` |
| GET    | `/graphql` | Apollo              | Introspection/playground in dev |

### Query: `health`

```graphql
query { health { service status } }
```

Response: `{ "data": { "health": { "service": "foundly-api", "status": "ok" } } }`. No DB required.

## Governance ratification

`specs/architecture.md` declares **persistence = Prisma + PostgreSQL** (Supabase or local docker) and
the single seam `@foundly/database`, resolving the constitution TODO(PERSISTENCE).

## Gates

- `npm run generate -w @foundly/database` then `npm run build -w @foundly/database` and `test -w @foundly/database`.
- `npm run build -w @foundly/api`, `npm run test -w @foundly/api`, `npm run typecheck -w @foundly/api`.
- No regressions: `npm run build -w @foundly/book`, `npm run test -w @foundly/ui`.