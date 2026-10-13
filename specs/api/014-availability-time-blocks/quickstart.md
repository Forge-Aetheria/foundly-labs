# Quickstart — Foundly API — Availability Time Blocks

**Feature**: `specs/api/014-availability-time-blocks` · Runnable validation scenarios.

## Prerequisites

- `apps/api/.env` with `DATABASE_URL`, `SUPABASE_AUTH_URL`, `CORS_ORIGINS`.
- Postgres/Supabase reachable and migrated (`npm run db:migrate` — applies the new `TimeBlock` migration).
- A Supabase access token with `app_metadata.tenant_id` set (obtained by signing in through the app).

## Run

```bash
npm run db:migrate -w @foundly/database
npm run dev -w @foundly/api        # http://localhost:3002/graphql
```

## Scenario 1 — Public read (no credential)

```graphql
query { timeBlocks(tenantId: "no-such-tenant") { id startAt endAt reason } }
```

**Expected**: `{ "data": { "timeBlocks": [] } }` — empty list, no error.

## Scenario 2 — Anonymous write is rejected

```graphql
mutation { addTimeBlock(input: { startAt: "2026-12-24T09:00:00.000Z", endAt: "2026-12-24T18:00:00.000Z" }) { id } }
```

**Expected**: error envelope with `extensions.code = "UNAUTHENTICATED"`, `data: null`.

## Scenario 3 — Authenticated round-trip (bearer token)

```graphql
mutation ($input: AddTimeBlockInput!) { addTimeBlock(input: $input) { id startAt endAt reason specialistId } }
# variables: { "input": { "startAt": "2026-12-24T09:00:00.000Z", "endAt": "2026-12-24T18:00:00.000Z", "reason": "Nochebuena" } }
```

**Expected**: the created block. Then:

```graphql
query { timeBlocks(tenantSlug: "<my-slug>") { id startAt endAt } }
```

**Expected**: the created block appears, ordered by start.

## Scenario 4 — Validation

- `endAt` before `startAt` → `VALIDATION_ERROR`.
- Malformed `startAt` → `VALIDATION_ERROR`.
- `specialistId` of another business → `VALIDATION_ERROR`/`NOT_FOUND`.

## Scenario 5 — Removal & isolation

- `removeTimeBlock(id: "<mine>")` → `true`; a second call → `NOT_FOUND`.
- With a token bound to another tenant, `removeTimeBlock(id: "<mine>")` → `NOT_FOUND` and the record remains.

## Automated checks

```bash
npm run typecheck -w @foundly/api
npm run test -w @foundly/api        # unit + e2e (AppModule + local JWKS + memory store)
npm run lint -w @foundly/api
npm run build -w @foundly/api
```

> Environment note: if a WDAC policy blocks the unsigned `@swc/core` addon used by the API test transform, run the suite where that policy is absent (type-checking and direct unit specs are unaffected).
