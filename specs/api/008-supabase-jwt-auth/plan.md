# Implementation Plan: Foundly API — Supabase Auth & JWT Identity for GraphQL

**Branch**: `008-supabase-jwt-auth` | **Date**: 2026-10-11 | **Spec**: `specs/api/008-supabase-jwt-auth/spec.md`

**Input**: Feature specification from `/specs/api/008-supabase-jwt-auth/spec.md`

## Summary

Add an **additive** Supabase Auth JWT identity layer to `apps/api`: verify Supabase access tokens
(signature via JWKS, `exp`/`iss`/`aud` claims), resolve the caller identity, attach it to the GraphQL
request context as `ctx.user` (the 007 `GraphQLContext`), and protect individual operations with an
opt-in `@RequireAuth()` guard plus `@AuthUser()` injection. The ratified 006 Foundly Pass HMAC
sessions and every existing module stay untouched. New dependency: `jose` (RS256 + JWKS). New env:
`SUPABASE_AUTH_URL`. Zero storage/persistence changes.

## Technical Context

**Language/Version**: TypeScript strict · Node 20+ · NestJS 11 · GraphQL 16 · `jose` v6 (new)

**Primary Dependencies**: `jose` (**new**) — `createRemoteJWKSet` (cached, `kid`-indexed) over the
Supabase JWKS + `jwtVerify` (RS256); `@nestjs/common`, `@nestjs/graphql` (guards/decorators,
`GqlExecutionContext`). `@foundly/database` only via the existing 007 context/prisma seam. dev:
`@nestjs/testing`, `supertest`, vitest.

**Storage**: none changed — identity comes from the credential claims; no new tables, no
`schema.prisma` delta, no client regeneration. Supabase Auth is the external identity provider.

**Testing**: Vitest + `@nestjs/testing` + supertest; DB-free and offline. Specs generate an ephemeral
RSA key pair (`node:crypto`), build a local JWKS, sign test tokens with `jose`, and inject the key
set into the verifier (custom `getKeys`), so no network/Db is touched. Unit: verifier (valid/expired/
tampered/wrong-iss/wrong-aud/key-fetch-fail); guard (attach `user`, reject missing/malformed);
e2e: guarded sample over `POST /graphql`.

**Target Platform**: Node.js HTTP server (NestJS), npm workspaces monorepo.

**Project Type**: Monorepo — one `apps/api` auth-module increment (JWT verifier + guard + context.user).

**Performance Goals**: verification is local + cached keys (JWKS fetched once, cooldown reused) —
typically <100 ms per request; no per-request network round-trip after first load.

**Constraints**: additive — no collision with 006 decorators/guards (`UseAuth`/`CurrentUser`/
`CurrentTenant`/`RequirePlan` stay untouched); no committed secrets (`SUPABASE_AUTH_URL` is a URL,
not a key); fail-closed — any verification failure rejects protected ops without crashing;
`packages/*` never import from `apps/*`; strict typing (no `any`); reuse GraphQL `extensions.code`
convention (`UNAUTHENTICATED`).

**Scale/Scope**: `SupabaseJwtService` (verify → `AuthUser`), `SupabaseJwtGuard` + `RequireAuth`/
`AuthUser` decorators, `GraphQLContext.user`, one guarded sample (`viewer`), DB-free specs. Out of
scope: signup/login flows (provider handles), refresh/revocation, token issuance HTTP,
entitlement/plan gating (006 `PlanGuard`), persisting user profiles, changing 006 sessions.

## Constitution Check

_GATE: must pass before Phase 0 research. Re-check after Phase 1 design._

- **SDD**: passes — spec exists (`specs/api/008-supabase-jwt-auth/spec.md`) and explicitly references
  `specs/business-model.md` and the authority hierarchy.
- **Persistence governance**: no storage changes; identity is external (Supabase Auth), no new tables.
- **`packages/*` never import from `apps/*`**: unchanged.
- **Strict typing (constitution §5.IV)**: `AuthUser`, `GraphQLContext`, guard types fully typed; no `any`.
- **Security posture (constitution §5, business-model)**: standard, transparent credential verification
  (signature + claims); fail-closed; no secrets in the repo; per-request identity from the verified
  token, never from client-supplied fields.
- **GraphQL dev posture**: code-first; opt-in guard keeps existing modules and playground posture intact.
- **Module structure**: additive files inside the existing `@Global` `AuthModule`
  (`apps/api/src/modules/auth/`), so guards/decorators are reusable anywhere with zero wiring.
- **Workspace gates (constitution §3.I, §8)**: `build`, `typecheck`, `test`, lint for `@foundly/api`;
  regression gates for `book`/`ui`.

**Post-design re-check**: PASS — additive and opt-in; only one new dependency and one env URL; DB-free
tests; gates preserved.

## Project Structure

### Documentation (this feature)

```text
specs/api/008-supabase-jwt-auth/
├── plan.md                    # This file (/speckit.plan command output)
├── research.md                # Phase 0 output
├── data-model.md              # Phase 1 output
├── quickstart.md              # Phase 1 output
├── contracts/
│   └── graphql-auth.contract.md
└── tasks.md                   # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
apps/api/
├── package.json                       # EDIT: add "jose" dependency
├── .env                               # EDIT (gitignored): SUPABASE_AUTH_URL=https://<ref>.supabase.co/auth/v1
└── src/
    ├── graphql/
    │   ├── context.ts                 # EDIT: GraphQLContext { prisma; user?: AuthUser } (type-import from auth)
    │   └── context.spec.ts            # EDIT (optional assertion update)
    └── modules/auth/
        ├── auth.module.ts             # EDIT: register + export SupabaseJwtService, SupabaseJwtGuard
        ├── jwt.types.ts               # NEW: AuthUser (sub, email, role, aud, exp, iat)
        ├── jwt.service.ts             # NEW: SupabaseJwtService — verify(JWT, keys provider?) → AuthUser
        ├── jwt.guard.ts               # NEW: SupabaseJwtGuard (CanActivate) + attach ctx.user
        ├── jwt.decorators.ts          # NEW: @RequireAuth(), @AuthUser()
        ├── jwt.service.spec.ts        # NEW: unit (valid/expired/tampered/iss/aud/key-fetch-fail)
        ├── jwt.guard.spec.ts          # NEW: unit (attach user / reject)
        └── jwt.resolver.ts            # NEW: guarded sample `viewer`
        └── jwt.resolver.spec.ts       # NEW: e2e over POST /graphql
```

**Structure Decision**: the identity layer lives in the ratified `@Global` AuthModule (reusable
guards/decorators anywhere, zero wiring, existing 006 files untouched). `jwt.service.ts` owns
verification (keys injected via a small `KeysProvider` seam so specs stay offline); the guard is a
thin `CanActivate` that verifies and mutates the GraphQL request context's `user` (same object the 007
factory created), so resolvers read `ctx.user` via `@AuthUser()`.

## Complexity Tracking

> Fill ONLY if Constitution Check has violations that must be justified

| Violation | Why Needed | Simpler Alternative Rejected Because |
| --------- | ---------- | ------------------------------------ |
| _None_    | —          | —                                    |