# Data Model: Foundly API — GraphQL Execution Layer & Data Integration

**Feature**: `specs/api/007-graphql-api-layer/` | **Date**: 2026-10-11

## Storage strategy

- **No persistence changes.** Reuses the ratified Prisma + PostgreSQL seam via `@foundly/database`
  and the Supabase pooler pattern (`DATABASE_URL` runtime / `DIRECT_URL` CLI). No tables, no
  migrations, no client regeneration.

## Entities (runtime — not persisted)

### HealthCheck payload (GraphQL)

| Field       | Type     | Notes                                                            |
| ----------- | -------- | ---------------------------------------------------------------- |
| `service`   | String   | `"foundly-api"` — stable service identifier (bootstrap contract) |
| `status`    | String   | **liveness**: `"ok"` whenever the API resolver executes          |
| `database`  | String   | **readiness**: `"up"` \| `"down"` from the read-only probe       |
| `checkedAt` | String   | ISO-8601 UTC timestamp of the probe                              |

Additive over the bootstrap `{ service, status }` shape: old fields keep their meaning, new fields
extend the contract.

### GraphQLContext (request scope, not persisted)

| Field    | Type            | Source                        |
| -------- | --------------- | ----------------------------- |
| `prisma` | shared client   | `@foundly/database` singleton |

`GraphQLContext` is populated by the `GraphQLModule` context factory for every request; resolvers keep
using the injected `PrismaService` (the same singleton) as the persistence seam.

## Validation rules

- Probe is **read-only**: `SELECT 1` never mutates data (FR-003).
- Probe is **bounded**: resolves within 2 s; failure or timeout yields `database: "down"` with **no
  GraphQL error** and no crash (FR-002, FR-004).
- On recovery the next probe returns `database: "up"` automatically — no restart (FR-005).
- Every request is resolved with access to the shared data seam (FR-006); the seam is the workspace
  package singleton (FR-007).

## GraphQL surface (this feature)

| Operation | Kind  | Guards | Returns           | Notes                                                                          |
| --------- | ----- | ------ | ----------------- | ------------------------------------------------------------------------------ |
| `health`  | Query | none   | `HealthPayload!`  | liveness + readiness; `database` reflects the shared seam reachability          |

Public, unauthenticated (operational posture). Playground/introspection follow the ratified dev
posture (outside production only).