# Contract: Auth Session Actions (sign-in / sign-out / password change)

**Feature**: `specs/book/009-admin-auth` | **Date**: 2026-10-12

## Scope

Server Actions exposed by `apps/book/src/shared/infra/sessionActions.ts` (`'use server'`) and consumed by the login form, the password form and the admin shell. All return the typed `ActionResult` from `shared/infra/result.ts`.

## Actions

### `signIn(input)`

```ts
signIn(input: unknown): Promise<ActionResult<{ redirectTo: string }>>
```

- Validates with `loginSchema`; on failure → `VALIDATION_ERROR` with `fields`.
- **Live mode**: `createServerSupabaseClient()` → `auth.signInWithPassword({ email, password })`.
  - Success → session cookies persisted by the adapter → `ok({ redirectTo: '/admin/agenda' })`.
  - Invalid credentials → `UNAUTHENTICATED` with a non-revealing message.
- **Local mode**: match `email` (lowercased) + `credential` against `store.users` (active only).
  - Success → set `foundly_book_session` (httpOnly) with the `userId` → `ok({ redirectTo: '/admin/agenda' })`.
  - No match → `UNAUTHENTICATED`; disabled account → `UNAUTHENTICATED`.
- The action never returns the password, token or raw provider error to the client.

### `signOut()`

```ts
signOut(): Promise<never>   // performs a redirect
```

- **Live mode**: `supabase.auth.signOut()` (clears provider cookies).
- **Local mode**: clear `foundly_book_session`.
- Then `redirect('/login')`.
- Idempotent: signing out without a session still lands on `/login`.

### `changePassword(input)`

```ts
changePassword(input: unknown): Promise<ActionResult<{ updated: true }>>
```

- Requires an authenticated session; otherwise `UNAUTHENTICATED`.
- Validates with `passwordChangeSchema`; policy/confirmation failures → `VALIDATION_ERROR` with `fields`.
- **Live mode**: re-authenticate `currentPassword` via `signInWithPassword`; on failure → `UNAUTHENTICATED` (password unchanged); on success → `auth.updateUser({ password: newPassword })`.
- **Local mode**: verify current password against the store credential; on failure → `UNAUTHENTICATED`; on success → update `store.users[].credential`.
- Success → `ok({ updated: true })`; the form shows a success confirmation.

## Session resolution (server)

`getEffectiveSession()` in `shared/infra/authServer.ts`:

```text
live Supabase claims (getClaims)  →  Session | null
        │ null
        ▼
local cookie → store user lookup  →  Session | null
        │ null
        ▼
null   (NO store.sessions fallback)
```

- `requireTenant` / `requireRole` (`shared/infra/auth.ts`) are unchanged and consume this session.
- The seeded `store.sessions` is emptied; nothing is authenticated until a sign-in occurs.

## Errors

| Code               | When                                                       |
| ------------------ | ---------------------------------------------------------- |
| `VALIDATION_ERROR` | Missing/invalid fields (login, password policy, mismatch). |
| `UNAUTHENTICATED`  | Bad credentials, disabled account, wrong current password. |
| `STATE_ERROR`      | Provider unavailable / update failed (password unchanged). |

## Rules

- Secrets and access tokens never reach the browser bundle (Server-First).
- Session scoping always derives from the account, never from client input.
- No `any`/implicit casts; inputs are `unknown` and narrowed by Zod.
