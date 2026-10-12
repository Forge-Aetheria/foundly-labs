# Data Model: Foundly API — Supabase Auth & JWT Identity for GraphQL

**Feature**: `specs/api/008-supabase-jwt-auth/` | **Date**: 2026-10-11

## Storage strategy

- **No persistence changes.** Identity is external: Supabase Auth issues the access tokens; no new
  tables, no `schema.prisma` delta, no migrations, no client regeneration.

## Entities (runtime — from verified credential)

### AuthUser (resolved identity, not persisted)

Derived strictly from the verified access-token claims:

| Field   | Type     | Source claim     | Notes                                                 |
| ------- | -------- | ---------------- | ----------------------------------------------------- |
| `sub`   | String   | `sub`            | user uuid — required                                  |
| `email` | String?  | `email`          | optional, present on email-based users                |
| `role`  | String   | `role`           | defaults to `"authenticated"`                         |
| `aud`   | String   | `aud`            | validated to `"authenticated"`                        |
| `exp`   | number   | `exp`            | epoch seconds — validated within 30 s leeway          |
| `iat`   | number?  | `iat`            | epoch seconds                                        |

### GraphQLContext (extended)

| Field    | Type                | Source                                   |
| -------- | ------------------- | ---------------------------------------- |
| `prisma` | shared client       | `@foundly/database` singleton (007)      |
| `user`   | `AuthUser` \| undefined | attached by `SupabaseJwtGuard` on protected ops |

Public requests keep `user` `undefined`; protected ops always have a verified `user` before the
resolver runs.

## Validation rules

- Verify signature against the project JWKS (RS256) — invalid signature rejected.
- `exp` must be present and within 30 s leeway of now; `sub` required (non-empty).
- `iss` must equal `SUPABASE_AUTH_URL`; `aud` must be `"authenticated"`.
- Any failure (missing/malformed header, bad signature, expired, wrong issuer/audience, missing `sub`,
  provider/key fetch error) → reject with GraphQL `extensions.code = "UNAUTHENTICATED"` (fail-closed),
  never crash, public operations unaffected.
- Identity always comes from the verified token — never from client-supplied fields.

## GraphQL surface (this feature)

| Operation | Kind  | Guards           | Returns     | Notes                                                  |
| --------- | ----- | ---------------- | ----------- | ------------------------------------------------------ |
| `viewer`  | Query | `@RequireAuth()` | `Viewer!`   | sample protected query proving `ctx.user` (opt-in)     |

Additive: only `viewer` is new; every existing resolver/schema entry is unchanged.