# Quickstart: Foundly — Persistence & GraphQL

**Feature**: `specs/api/002-persistence-graphql/` | **Date**: 2026-10-11

## Onboarding

1. `npm install` at the repository root (wires `@foundly/database` + GraphQL deps).
2. Generate the Prisma client: `npm run generate -w @foundly/database`.
3. (Optional, DB-backed uses) start local Postgres: `docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=postgres postgres:16` and export `DATABASE_URL`. Not required for this feature's gates.

## Manual walkthrough

1. Run `npm run dev -w @foundly/api` (port 3002).
2. Open `http://localhost:3002/graphql` → the Apollo sandbox/playground loads (dev mode).
3. Run the query:
   ```graphql
   query { health { service status } }
   ```
   → `{ "data": { "health": { "service": "foundly-api", "status": "ok" } } }`.
4. Inspect the generated schema via introspection / `schema.gql` (code-first output).

## Verification matrix (contract `contracts/api-graphql.contract.md`)

| Scenario                                | Expected                                              |
| --------------------------------------- | ----------------------------------------------------- |
| `npm run generate -w @foundly/database` | Prisma client generated (no errors)                   |
| `npm run build -w @foundly/database`    | exit 0                                               |
| `npm run build -w @foundly/api`         | exit 0 (GraphQL code-first compiles)                  |
| `npm run test -w @foundly/api`          | 100% pass (incl. `health` via supertest `/graphql`)   |
| `npm run typecheck -w @foundly/api`     | `tsc --noEmit` clean                                 |
| `POST /graphql { health }`              | correct payload, no DB required                       |
| `npm run build -w @foundly/book`, `test -w @foundly/ui` | no regressions                       |

## Test commands

| Command                                        | Scope                    |
| ---------------------------------------------- | ------------------------ |
| `npm run generate -w @foundly/database`        | Prisma DB-First client   |
| `npm run build|test -w @foundly/database`      | DB package gates         |
| `npm run build|test|typecheck -w @foundly/api` | API gates                |
| `npm run build -w @foundly/book`, `test -w @foundly/ui` | Regression gates |