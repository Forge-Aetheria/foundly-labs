# Research: Foundly API — GraphQL Execution Layer & Data Integration

**Feature**: `specs/api/007-graphql-api-layer/` | **Date**: 2026-10-11

## Decision 1: Keep the ratified NestJS code-first execution layer (no new framework)

- **Decision**: the API keeps NestJS code-first GraphQL (Apollo via `@nestjs/apollo`,
  `autoSchemaFile`, `src/schema.gql`) already ratified in `002`/`003`. The spec's "typeDefs +
  resolvers / context.ts" map onto NestJS class-resolvers + a `GraphQLModule` context factory — not a
  schema-first (`typeDefs`/`graphql-js`/Yoga) layering.
- **Rationale**: "No spec, no code" and the established stack; a second GraphQL framework would
  violate the ratified surface and add dependencies for zero user value.
- **Alternatives considered**: graphql-yoga standalone server — rejected (new framework, breaks the
  ratified NestJS module posture); schema-first `typeDefs` files — rejected (code-first already owns
  the schema contract).

## Decision 2: Request context = typed seam over the same singleton (no dual instances)

- **Decision**: add `apps/api/src/graphql/context.ts` exporting `interface GraphQLContext { prisma }`
  and a `contextFactory` that returns `{ prisma }` from `@foundly/database` — the **same** singleton
  that `PrismaService` (`shared/prisma/prisma.service.ts`) exposes. Register it on
  `GraphQLModule.forRoot({ ..., context: contextFactory })`. Resolvers keep using `PrismaService` via
  DI; the context is available for request-scoped consumers (e.g., future guards/interceptors).
- **Rationale**: satisfies the spec's "prisma injected into the request context" while preserving a
  single persistence seam (FR-006/FR-007); avoids two clients and two connection pools, which would
  double Supavisor connections.
- **Alternatives considered**: constructing a new `PrismaClient` inside the factory — rejected
  (dual instances, defeats the shared seam, risks connection exhaustion on Supavisor); context
  without prisma — rejected (fails FR-006).

## Decision 3: Health probe — liveness + read-only readiness

- **Decision**: keep the ratified `health` query name. `HealthResolver.health` now runs a read-only
  `PrismaService.client.$queryRaw\`SELECT 1\`` inside try/catch with a **2 s `Promise.race`
  timeout**. Payload: `{ service: String!, status: String!, database: String!, checkedAt: String! }`.
  `status` = liveness of the API (`"ok"` whenever the resolver executes); `database` = readiness
  (`"up"` | `"down"`). A failed/timed-out probe returns `database: "down"` — **no GraphQL error, no
  crash** (FR-002–FR-005).
- **Rationale**: `status` (liveness) vs `database` (readiness) separation is the standard split and
  keeps the existing bootstrap contract (`{ service, status: 'ok' }`) additive — old fields are
  preserved, new ones are added.
- **Alternatives considered**: probing MySQL/other stores — rejected (single ratified store);
  renaming to `healthCheck` — rejected (breaks the `001`–`003` contract for zero benefit); no timeout —
  rejected (a hung probe would violate the bounded-latency edge case).

## Decision 4: Naming — preserve `health`

- **Decision**: the GraphQL field stays `health: HealthPayload!` (introduced at bootstrap). Clients
  keep working; the feature is additive.
- **Rationale**: contract stability and the existing e2e; the spec text is name-agnostic ("health
  query").
- **Alternatives considered**: alias `healthCheck` — rejected (two names, marker overhead).

## Decision 5: DB-free, deterministic tests (mock the seam)

- **Decision**: `health.resolver.spec.ts` builds a testing module and **overrides `PrismaService`**
  with a mock: `$queryRaw` resolves → `database === "up"`; rejects → `database === "down"`; plus a
  timeout path (never settles → `"down"`). A `contextFactory` unit spec asserts it returns the shared
  prisma singleton. E2e over `POST /graphql` asserts the payload shape and no `errors`.
- **Rationale**: matches FR-009 and the `003`–`006` DB-free posture; deterministic, no live DB, no
  Supavisor dependency in CI.
- **Alternatives considered**: hitting the real Supabase DB in specs — rejected (fragile, paused/offline
  breaks gates; contradicts the ratified posture).

## Decision 6: No storage or dependency changes

- **Decision**: zero `schema.prisma` delta, zero new npm deps. `npm run db:generate` produces the same
  client; the `.env` pooler pattern (`DATABASE_URL`/`DIRECT_URL`) ratified in the workspace DB work
  stays untouched.
- **Rationale**: the execution layer sits entirely above the persistence seam; touching storage would
  expand scope without user value.
- **Alternatives considered**: a `HealthCheck` table / sampling — rejected (readiness probes are
  read-only by definition).

## Risks

- **Probe latency**: a slow store delays the response — mitigated by the 2 s timeout (edge case); typical
  probes answer in tens of ms on the pooler.
- **Dangling query after timeout**: `Promise.race` may leave the underlying query in flight — bounded to a
  single `SELECT 1`; no data changes; acceptable for a health probe (documented).
- **Dual instances regressions**: future code must keep importing the shared prisma from
  `@foundly/database` (context factory and `PrismaService`) — enforced by review and the existing seam.
- **e2e DB dependency**: using a mocked `PrismaService` keeps the e2e green regardless of DB state;
  the real up/down behaviour is validated manually in quickstart.