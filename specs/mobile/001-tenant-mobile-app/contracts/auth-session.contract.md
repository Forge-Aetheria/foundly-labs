# Contract: Authentication and Session

**Feature**: `specs/mobile/001-tenant-mobile-app` | **Date**: 2026-10-24

## Identity provider

- Supabase Auth, same project as `apps/book` (`EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`).
- Sign-in: `supabase.auth.signInWithPassword({ email, password })`.
- Access token: `session.access_token`, sent as `Authorization: Bearer <token>` to `POST /graphql`.
- The API validates issuer, audience `authenticated`, asymmetric algorithms, and resolves `tenant_id` from verified claims.

## Session persistence

- Adapter: chunked `expo-secure-store` implementation of the Supabase storage interface.
- `autoRefreshToken: true`; `persistSession: true`; `detectSessionInUrl: false`.
- On app foreground (`AppState`), call `supabase.auth.startAutoRefresh()`/`stopAutoRefresh()` as appropriate and validate the session.
- On `signOut`, call `supabase.auth.signOut()`, clear secure storage, clear the React Query cache and attempt push-token unregistration.

## Guard rules

| Condition                               | Behaviour                                                              |
| --------------------------------------- | ---------------------------------------------------------------------- |
| No session on a protected route         | Redirect to `/(auth)/login` without rendering protected content        |
| Session on `login`                      | Redirect to `/(tabs)` (agenda)                                         |
| Session present but no `tenantId` claim | Show a "sin negocio asociado" state; do not call tenant-scoped queries |
| GraphQL `UNAUTHENTICATED`               | Clear session, show "sesión expirada", redirect to login               |
| Network failure during restore          | Keep the cached session, show offline state; do not force logout       |

## Security rules

- Passwords are never persisted, logged or included in analytics.
- Tokens are never logged; error surfaces expose only typed codes and user-facing messages.
- The tenant scope always comes from the verified JWT, never from a request argument.
- The login screen toggles password visibility locally only; it never copies the password elsewhere.

## Typed errors

`UNAUTHENTICATED`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT`, `VALIDATION_ERROR`, `NETWORK_ERROR`, `STATE_ERROR`, mapped to Spanish user-facing messages. Provider/English raw messages are never shown.
