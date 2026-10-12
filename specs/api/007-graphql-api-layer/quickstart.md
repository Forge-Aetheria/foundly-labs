# Quickstart: Foundly API — GraphQL Execution Layer & Data Integration

**Feature**: `specs/api/007-graphql-api-layer/` | **Date**: 2026-10-11

## Onboarding

1. `npm install` at the repository root.
2. Ensure the data connection is configured (Supabase pooler pattern already ratified):
   - `apps/api/.env` → `DATABASE_URL` (runtime) / `DIRECT_URL` (CLI).
   - `packages/database/.env` → same values for Prisma CLI.
   - No client regeneration needed (no schema change).

## Manual walkthrough

1. `npm run dev -w @foundly/api` (port 3002); open `http://localhost:3002/graphql`.
2. Run the health probe:

   ```graphql
   query {
     health {
       service
       status
       database
       checkedAt
     }
   }
   ```

   → with the data store up:

   ```json
   { "service": "foundly-api", "status": "ok", "database": "up", "checkedAt": "<iso8601>" }
   ```

3. Readiness degradation (manual): with the API up, point `DATABASE_URL` at an unreachable host (or
   pause the Supabase project) and rerun the query → `database: "down"` (no GraphQL errors, service
   alive). Restore the URL and the next call returns `database: "up"` without a restart.

## Verification matrix

| Scenario                                                     | Expected                                                        |
| ------------------------------------------------------------ | --------------------------------------------------------------- |
| `npm run build                                               | typecheck -w @foundly/api`                                      | clean |
| `npm run test -w @foundly/api`                               | 100% pass (health unit up/down/timeout, context unit, e2e)      |
| `health` with data store up (mocked seam)                    | `{ status: "ok", database: "up", checkedAt }`, no `errors`      |
| `health` with data store down / timeout (mocked seam)        | `{ status: "ok", database: "down", checkedAt }`, no `errors`    |
| `health` over `POST /graphql`                                | HTTP 200, `errors` undefined, payload shape per contract         |
| `npm run db:generate`                                        | client produced (same schema — no-op delta)                     |
| `npm run lint` (root)                                        | clean                                                           |
| `npm run build -w @foundly/book`, `npm run test -w @foundly/ui` | no regressions                                               |

Refer to `contracts/graphql-execution-layer.contract.md` for the exact payload/behaviour and
`data-model.md` for the `HealthPayload`/`GraphQLContext` shapes.

## Test commands

| Command                                                         | Scope                |
| --------------------------------------------------------------- | -------------------- |
| `npm run build                                               | typecheck            | test -w @foundly/api` | API gates (execution layer) |
| `npm run lint` (root)                                           | workspace lint       |
| `npm run build -w @foundly/book`, `npm run test -w @foundly/ui` | regression gates     |