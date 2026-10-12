# Quickstart: Foundly API — Domain MVP Module (Authenticated CRUD, Tenant-Isolated)

**Feature**: `specs/api/010-domain-mvp-module/` | **Date**: 2026-10-11

## Onboarding

1. `npm install` at the repository root (no new dependencies).
2. No `.env`/schema changes. Tokens MUST carry the `tenant_id` claim (`app_metadata.tenant_id`).

## Manual walkthrough

1. `npm run dev -w @foundly/api` (port 3002); open `http://localhost:3002/graphql`.
2. Obtain (dev) an access token for tenant `T1` carrying `tenant_id: "T1"` (008 local-JWKS mint or a
   real Supabase token with the claim customized).
3. Create and list:

   ```graphql
   mutation { createMyService(input: {
     name: "Corte de pelo", priceCents: 1500, durationMin: 30
   }) { id name priceCents durationMin } }

   query { myServices { id name } }
   ```

   → the created service appears; an empty tenant sees `[]`.

4. Update and delete:

   ```graphql
   mutation { updateMyService(id: "<id>", input: { active: false }) { id active } }
   mutation { deleteMyService(id: "<id>") }
   ```

   → `false` result; the fetch afterwards returns `NOT_FOUND`.

5. Isolation: with a token for tenant `T2` (different `tenant_id`), call
   `myService(id: "<T1-id>")` and `deleteMyService(id: "<T1-id>")` → both return `NOT_FOUND`; the T1
   record is untouched.

## Verification matrix

| Scenario (test)                                             | Expected                                                  |
| ----------------------------------------------------------- | --------------------------------------------------------- |
| `npm run build                                             | typecheck -w @foundly/api`                                | clean |
| `npm run test -w @foundly/api`                             | 008/009 suites still green + new catalog specs pass       |
| ownership CRUD round-trip (T1)                              | create→list→fetch→update→delete consistent, tenant-scoped |
| T2 reads/updates/deletes a T1 resource by id                | `errors[0].extensions.code === "NOT_FOUND"`, record intact |
| anonymous `myServices`                                      | `UNAUTHENTICATED`                                         |
| malformed `createMyService`                                 | `VALIDATION_ERROR`, nothing persisted                          |
| duplicate tenant-scoped unique value                         | `CONFLICT`, nothing persisted                             |
| brand-new tenant list                                       | `[]`                                                      |
| `npm run lint` (root)                                       | clean                                                     |
| `npm run build -w @foundly/book`, `npm run test -w @foundly/ui` | no regressions                                       |

Refer to `contracts/catalog.contract.md` for the exact SDL/error semantics and
`data-model.md` for the `tenant_id` claim mapping and validation rules.

## Test commands

| Command                                                         | Scope                |
| --------------------------------------------------------------- | -------------------- |
| `npm run build                                               | typecheck            | test -w @foundly/api` | API gates (catalog MVP) |
| `npm run lint` (root)                                           | workspace lint       |
| `npm run build -w @foundly/book`, `npm run test -w @foundly/ui` | regression gates     |