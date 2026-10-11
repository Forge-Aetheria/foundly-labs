# Quickstart: Foundly API — Tenant Auth, Sessions & Guards (Foundly Pass)

**Feature**: `specs/api/006-foundly-pass-auth/` | **Date**: 2026-10-11

## Onboarding

1. `npm install` at the repository root.
2. Regenerate the Prisma client after the additive `Tenant.plan` field:
   `npm run generate -w @foundly/database`.
3. Export the signing secret: `export FOUNDLY_PASS_SECRET="local-dev-secret"` (dev only).

## Manual walkthrough

1. `npm run dev -w @foundly/api` (port 3002); open `http://localhost:3002/graphql`.
2. Obtain a session token (dev): use the sample resolver to sign one, or call
   `me`/`currentTenant` with a token minted via `AuthService.signSession` (documented in
   `contracts/foundly-pass-auth.contract.md`).
3. Call a protected query with `Authorization: Bearer <token>`:

   ```graphql
   query {
     me {
       userId
       role
       tenant {
         id
         status
         plan
       }
     }
   }
   ```

   → identity + tenant (status/plan) for an `active` tenant with the token; `UNAUTHENTICATED` without it.

4. Plan gating sample:

   ```graphql
   query {
     bookCapability {
       tenantId
       enabled
     }
   }
   ```

   → allowed when `tenant.plan = "book"`; `FORBIDDEN` otherwise.

## Verification matrix

| Scenario                                                        | Expected                                           |
| --------------------------------------------------------------- | -------------------------------------------------- |
| `npm run generate -w @foundly/database`                         | client regenerated (adds `Tenant.plan`)            |
| `npm run build                                                  | typecheck -w @foundly/api`                         | clean |
| `npm run test -w @foundly/api`                                  | 100% pass (auth unit + guards unit + resolver e2e) |
| `me`/`currentTenant` without token                              | `errors[0].extensions.code === "UNAUTHENTICATED"`  |
| `me`/`currentTenant` with valid token                           | session identity + tenant status/plan              |
| inactive/suspended tenant with valid token                      | `FORBIDDEN`                                        |
| `bookCapability` tenant plan != `book`                          | `FORBIDDEN`                                        |
| `bookCapability` tenant plan == `book`                          | `{ tenantId, enabled: true }`                      |
| `npm run lint` (root)                                           | clean                                              |
| `npm run build -w @foundly/book`, `npm run test -w @foundly/ui` | no regressions                                     |

Refer to `contracts/foundly-pass-auth.contract.md` for exact token/query/error semantics and
`data-model.md` for the `Tenant.plan` field and `AuthContext`.

## Test commands

| Command                                                         | Scope                  |
| --------------------------------------------------------------- | ---------------------- |
| `npm run generate -w @foundly/database`                         | Prisma DB-First client |
| `npm run build                                                  | typecheck              | test -w @foundly/api` | API gates (incl. auth) |
| `npm run lint` (root)                                           | workspace lint         |
| `npm run build -w @foundly/book`, `npm run test -w @foundly/ui` | regression gates       |
