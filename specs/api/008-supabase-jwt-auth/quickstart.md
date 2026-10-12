# Quickstart: Foundly API — Supabase Auth & JWT Identity for GraphQL

**Feature**: `specs/api/008-supabase-jwt-auth/` | **Date**: 2026-10-11

## Onboarding

1. `npm install` at the repository root (installs the new `jose` dependency).
2. Add the provider URL to `apps/api/.env` (gitignored):
   `SUPABASE_AUTH_URL=https://<project-ref>.supabase.co/auth/v1`
   (the project ref is the one already used in this workspace's Supabase connection strings).
3. No client regeneration, no storage changes.

## Manual walkthrough

1. `npm run dev -w @foundly/api` (port 3002); open `http://localhost:3002/graphql`.
2. Obtain a Supabase access token (dev): sign in a user via Supabase Auth (email/password through the
   provider) and copy the returned access token — or mint a short-lived token with the project's keys
   for a manual check.
3. Call the protected sample without a token:

   ```graphql
   query { viewer { sub email role aud } }
   ```

   → `errors[0].extensions.code === "UNAUTHENTICATED"` (no crash; the service keeps answering).

4. Call it with the token:

   ```graphql
   query { viewer { sub email role aud } }
   ```
   with header `Authorization: Bearer <access token>`.

   → `{ viewer: { sub: "<user uuid>", email, role: "authenticated", aud: "authenticated" } }`.

5. Public surface stays open: call an existing public query (e.g. `health`) without a token → still
   succeeds.

## Verification matrix

| Scenario                                                     | Expected                                                       |
| ------------------------------------------------------------ | -------------------------------------------------------------- |
| `npm run build                                               | typecheck -w @foundly/api`                                     | clean |
| `npm run test -w @foundly/api`                               | 100% pass (jwt.service unit, jwt.guard unit, jwt.resolver e2e) |
| `viewer` without token                                       | `errors[0].extensions.code === "UNAUTHENTICATED"`              |
| `viewer` with valid token                                    | `{ sub, email, role, aud }` from the token                     |
| `viewer` with expired / tampered token                       | `UNAUTHENTICATED`                                              |
| public query (`health`) without token                        | still succeeds (unchanged)                                     |
| existing 006 protected ops (`me`, `currentTenant`)           | unchanged (HMAC session path intact)                           |
| `npm run lint` (root)                                        | clean                                                          |
| `npm run build -w @foundly/book`, `npm run test -w @foundly/ui` | no regressions                                              |

Refer to `contracts/graphql-auth.contract.md` for the exact claims/error semantics and tests, and
`data-model.md` for the `AuthUser`/`GraphQLContext.user` shapes.

## Test commands

| Command                                                         | Scope                |
| --------------------------------------------------------------- | -------------------- |
| `npm run build                                               | typecheck            | test -w @foundly/api` | API gates (JWT identity layer) |
| `npm run lint` (root)                                           | workspace lint       |
| `npm run build -w @foundly/book`, `npm run test -w @foundly/ui` | regression gates     |