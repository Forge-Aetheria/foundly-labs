# Contract: Session & Authentication (Supabase Auth seam)

**Feature**: `specs/book/008-api-integration-catalog-sync` | **Date**: 2026-10-12

## Objective

Replace the hardcoded session producer
(`apps/book/src/shared/infra/auth.ts` → `getCurrentSession()` returning `store.sessions[0]`) with a
live Supabase Auth session, while keeping the **consumers** unchanged (`requireRole`,
`requireTenant`, admin layout guard, tenancy seam).

## Session shape (book)

The book `Session` type is retained verbatim; only its producer changes:

```ts
interface Session { userId: string; role: 'admin' | 'professional'; tenantId?: string; }
```

Producer mapping from Supabase claims:

| `Session` field | Source                                                                  |
| --------------- | ----------------------------------------------------------------------- |
| `userId`        | JWT `sub` (from verified claims via `getClaims()`)                       |
| `tenantId`      | claims `app_metadata.tenant_id` (fallback top-level `tenant_id`)         |
| `role`          | `'admin'` when `tenantId` is present (owner); `'professional'` otherwise |

Rules:
- Authorization decisions use **verified claims** (`getClaims()`), never the unvalidated session user.
- No session / expired / invalid → `getCurrentSession()` returns `null` → existing `requireTenant`
  yields `UNAUTHENTICATED` → admin layout redirects to `/onboarding` (unchanged behaviour).
- No direct DB access in the book; tenancy data comes from the API.

## Bearer injection

Every authenticated GraphQL request sends `Authorization: Bearer <access_token>`.

- Server (Server Action / Component / Route Handler): token from `await supabase.auth.getSession()` →
  `session.access_token`; the `apiClient` injects it per request (never cached at module scope).
- Client Components: do **not** perform GraphQL calls; interactions go through Server Actions so the
  token never ships to the browser bundle. `NEXT_PUBLIC_API_URL` is diagnostic-only.
- On `UNAUTHENTICATED` error:
  - stale token → refresh via middleware at next navigation, or browser client `refreshSession()`,
    then retry; if refresh fails → redirect to onboarding.

## Cookie/session lifecycle

- `src/middleware.ts`: refresh session cookies on every request (Next 15 pattern with `getClaims()`),
  return via the Supabase response (propagate `cache-control`/`expires`/`pragma`).
- `server.ts`: `createServerClient` per request with async `cookies()` (`getAll`/`setAll` wrapped in
  try/catch — writes are only legal in Actions/Route Handlers).
- Avoid double refresh (refresh tokens are single-use); middleware is the single refresh point.

## Tenant binding at onboarding (sequence)

```text
1. signUp/signIn (Supabase)                    → session cookie
2. createTenant(input)  [tenancy contract]     → tenantId
3. Server Action (verified sub):
     admin.auth.admin.updateUserById(userId, { app_metadata: { ...existing, tenant_id: tenantId } })
   (SUPABASE_SERVICE_ROLE_KEY — server-only, merged, never replacing provider/roles)
4. refreshSession()                            → next token carries tenant_id
5. first authenticated catalog call            → satisfies @RequireAuth + tenant scoping
```

- Privilege-escalation guard: the target `userId` MUST equal the verified `sub` of the caller.
- `idempotency`: the onboarding draft id maps to one provision (existing `OnboardingProvision`
  semantics); re-running with the same draft returns the existing tenant and skips binding.

## Guard semantics (API side, unchanged)

| Case                                              | API response                                   | Book behaviour                        |
| ------------------------------------------------- | ---------------------------------------------- | ------------------------------------- |
| missing/invalid/expired bearer                    | `UNAUTHENTICATED`                              | refresh/redirect, typed `fail`        |
| valid identity without `tenant_id`                | `UNAUTHENTICATED` (catalog `requireTenant`)    | onboarding (not yet bound)            |
| identity bound to another tenant                  | `FORBIDDEN` / scoped results (never leak)      | typed `FORBIDDEN`                     |
| inactive tenant                                   | `FORBIDDEN` ("Tenant is not active")           | typed `FORBIDDEN`, support message    |