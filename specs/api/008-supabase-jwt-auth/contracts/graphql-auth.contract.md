# Contract: Supabase JWT identity layer (`apps/api`)

**Feature**: `specs/api/008-supabase-jwt-auth/` | **Date**: 2026-10-11

## Endpoint posture (unchanged)

`POST /graphql` (Apollo/NestJS, code-first, `autoSchemaFile`); playground/introspection only when
`NODE_ENV !== 'production'`.

## Credential

- Header: `Authorization: Bearer <Supabase access token>`.
- Token: RS256 JWT issued by Supabase Auth for the project at `SUPABASE_AUTH_URL`
  (`https://<ref>.supabase.co/auth/v1`), signature verified against the project JWKS
  (`GET /auth/v1/.well-known/jwks.json`).
- Required/validated claims: `sub` (non-empty), `exp` (within 30 s leeway), `iss` == `SUPABASE_AUTH_URL`,
  `aud` == `"authenticated"`. Optional: `email`, `role` (defaults to `"authenticated"`), `iat`.

## Context

Every request carries the typed `GraphQLContext { prisma, user? }`. The `user` field is set by
`SupabaseJwtGuard` on protected operations:

```ts
interface AuthUser {
  sub: string;
  email?: string | null;
  role: string;
  aud: string;
  exp: number;
  iat?: number;
}
```

## Guards & decorators (additive — 006 `UseAuth`/`CurrentUser`/`CurrentTenant`/`RequirePlan` unchanged)

| Decorator    | Applies                    | Effect                                                            |
| ------------ | -------------------------- | ----------------------------------------------------------------- |
| `@RequireAuth()` | `UseGuards(SupabaseJwtGuard)` | rejects anonymous/invalid/expired credentials; sets `ctx.user`  |
| `@AuthUser()` | parameter (resolver arg)  | injects `ctx.user` (`AuthUser`) into the resolver                 |

Public queries are unaffected; only decorated operations require an identity.

## Types

```graphql
type Viewer {
  sub: ID!
  email: String
  role: String!
  aud: String!
}
```

## Queries

| Query    | Guards           | Returns    | Behaviour                                                   |
| -------- | ---------------- | ---------- | ----------------------------------------------------------- |
| `viewer` | `@RequireAuth()` | `Viewer!`  | returns `{ sub, email, role, aud }` from the verified token |

## Error semantics

| Condition                                                             | Code              |
| --------------------------------------------------------------------- | ----------------- |
| missing `Authorization` header / not `Bearer <token>`                  | `UNAUTHENTICATED` |
| invalid signature / tampered / wrong-iss / wrong-aud                   | `UNAUTHENTICATED` |
| expired token (>30 s past `exp`)                                       | `UNAUTHENTICATED` |
| missing `sub`                                                          | `UNAUTHENTICATED` |
| JWKS/key fetch failure (provider unreachable)                          | `UNAUTHENTICATED` |
| missing `SUPABASE_AUTH_URL`                                           | config error (env) |
| valid identity but insufficient entitlement (006 `PlanGuard`)          | `FORBIDDEN` (unchanged) |

Errors are GraphQL `errors` entries with stable `extensions.code`.

## Configuration & data changes

- `apps/api/.env` (gitignored): add `SUPABASE_AUTH_URL=https://<ref>.supabase.co/auth/v1`.
- `apps/api/package.json`: add `jose` dependency.
- No `packages/*` or `schema.prisma` changes; no client regeneration.

## Tests (DB-free, offline)

- Unit `jwt.service.spec.ts`: ephemeral RSA key pair → local JWKS; sign tokens with `jose`. Cases:
  round-trip valid; expired (beyond leeway); invalid signature; wrong `iss`; wrong `aud`; missing
  `sub`; key-fetch failure (injected throwing provider).
- Unit `jwt.guard.spec.ts`: attach `ctx.user` on valid token; reject missing/malformed/expired.
- E2E `jwt.resolver.spec.ts` (`POST /graphql`): `viewer` without token → `UNAUTHENTICATED`; with valid
  token → payload; with expired token → `UNAUTHENTICATED`; a public query still works without token.
- `context.spec.ts`: `GraphQLContext` still exposes the shared prisma singleton (007) — unchanged.