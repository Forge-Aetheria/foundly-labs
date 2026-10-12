# Research: Foundly API — Supabase Auth & JWT Identity for GraphQL

**Feature**: `specs/api/008-supabase-jwt-auth/` | **Date**: 2026-10-11

## Decision 1: Verify Supabase access tokens with `jose` + JWKS (RS256)

- **Decision**: add `jose` (v6) and verify user access tokens with `jwtVerify(token, remoteJWKSet, { issuer, audience })`, where `remoteJWKSet = createRemoteJWKSet(new URL(jwksUrl))` for the Supabase project JWKS (`https://<ref>.supabase.co/auth/v1/.well-known/jwks.json`). Keys are fetched once and cached/cooldown-managed by jose.
- **Rationale**: Supabase issues RS256 JWT access tokens signed by a JWKS; jose is the standard, typed, zero-native-dependency library and is the exact verification model the provider expects; no per-request network after key warm-up.
- **Alternatives considered**: `@supabase/supabase-js` — rejected (server-side token verification is not its role; pulls the whole client SDK); manual RS256 via `node:crypto` — rejected (reimplements JWKS/JWK handling, more code, more risk); HS256 with `SUPABASE_JWT_SECRET` — rejected (legacy mode, deprecated by the provider).

## Decision 2: Trusted claims — issuer, audience, expiry, and required fields

- **Decision**: require and validate `iss === SUPABASE_AUTH_URL` (e.g., `https://<ref>.supabase.co/auth/v1`), `aud === "authenticated"` (standard end-user access token audience), `exp` present and within a 30 s leeway (`now - 30s`), and `sub` present (non-empty user uuid). Map to `AuthUser { sub, email, role, aud, exp, iat }`; `role` defaults to the claim or `"authenticated"`.
- **Rationale**: matches the spec FR-002/FR-003/FR-009 and the provider's actual token shape; the 30 s leeway absorbs clock skew (spec edge case) without weakening security materially.
- **Alternatives considered**: trusting any `aud` — rejected (audience confusion); no leeway — rejected (flaky at expiry boundaries).

## Decision 3: Context enrichment — additive `user` on the 007 context

- **Decision**: extend `apps/api/src/graphql/context.ts` to `GraphQLContext { prisma; user?: AuthUser }`. The factory still returns `{ prisma }`; the guard mutates the same context object (`ctx.user = user`) after a successful verify, because Apollo creates the context once per request and guards run per-operation on that same object.
- **Rationale**: preserves the single persistence seam and the ratified context; decorators read `ctx.user` via `getContext().user`; public requests keep `user` undefined (FR-006).
- **Alternatives considered**: adding `user` synchronously in the factory — impossible (verification happens at guard time); a second context scheme — rejected (duplication, breaks 007 contract).

## Decision 4: Opt-in guard + decorators without colliding with 006

- **Decision**: new `SupabaseJwtGuard` (`CanActivate`, reads bearer via `GqlExecutionContext`), plus decorators `@RequireAuth()` (= `UseGuards(SupabaseJwtGuard)`) and `@AuthUser()` (param decorator → `ctx.user`). The 006 `UseAuth`/`CurrentUser`/`CurrentTenant`/`RequirePlan` remain untouched.
- **Rationale**: additive per spec/plan; distinct names avoid overload ambiguity; the `@Global` AuthModule makes them reusable with zero wiring.
- **Alternatives considered**: overloading `UseAuth`/`CurrentUser` — rejected (breaks 006 contract and test determinism).

## Decision 5: Injectable key provider to keep tests DB-free and offline

- **Decision**: `SupabaseJwtService` depends on a tiny `KeysProvider` seam (`interface { getRemoteJwkSet(): RemoteJWKSet<Uint8Array> }`); production returns `createRemoteJWKSet(jwksUrl)`, tests inject a local `createLocalJWKSet` over an ephemeral RSA key pair. Verify failures surface stable `UNAUTHENTICATED` GraphQL errors.
- **Rationale**: deterministic unit/e2e (valid/expired/tampered/wrong-iss/wrong-aud/key-fetch-fail) with **no network and no live DB** (spec FR-010, 003–007 posture); jose's `createLocalJWKSet` mirrors the remote one exactly.
- **Alternatives considered**: let tests hit Supabase JWKS — rejected (fragile, network-dependent gates).

## Decision 6: Fail-closed error semantics

- **Decision**: missing/malformed `Authorization` header, invalid signature, expired, wrong issuer/audience, missing `sub`, or key-fetch failure → GraphQL error `extensions.code = "UNAUTHENTICATED"`; the service never crashes (catch → unauth), and public operations are unaffected.
- **Rationale**: spec FR-004/FR-007 and the ratified `extensions.code` convention; fail-closed prevents accidental access when the provider is unreachable.
- **Alternatives considered**: distinct codes per failure mode — rejected (client value is low; 006 already standardized `UNAUTHENTICATED`); allow-through on provider failure — rejected (security).

## Decision 7: Configuration — one new env var, no secrets

- **Decision**: read `SUPABASE_AUTH_URL` (`https://<ref>.supabase.co/auth/v1`) from the environment; it supplies both the issuer claim and the JWKS URL base. Default none → service fails fast with a clear config error. `.env` is gitignored; no keys are committed (the verifier needs only the public keys).
- **Rationale**: single source for provider identity; mirrors the ratified env-management pattern (`FOUNDLY_PASS_SECRET` precedent, 006).
- **Alternatives considered**: hardcoding the ref — rejected; deriving the URL from `DATABASE_URL` — rejected (mixes concerns).

## Decision 8: Sample guarded surface — `viewer`

- **Decision**: add one guarded query `viewer: Viewer!` (`{ sub, email, role, aud }`) under `@RequireAuth()` as the opt-in proof (FR-008), leaving all existing resolvers unchanged.
- **Rationale**: demonstrates the mechanism end-to-end without migrating modules; e2e exercises a real guarded route.
- **Alternatives considered**: migrating existing `me`/appointments to the JWT guard — rejected (violates additive scope).

## Risks

- **JWKS cold start**: the first verify after boot fetches keys (one network call); mitigated by jose cooldown caching; quickstart notes a warm-up call.
- **Supabase claim drift**: if the provider changes `aud`/issuer formats, verification fails closed — deployment must update `SUPABASE_AUTH_URL`; config is per-env.
- **006 vs 008 confusion**: distinct guard/decorator names prevent accidental cross-use; documented in contracts.
- **Offline specs vs live provider**: production path is exercised manually via quickstart; automated gates never depend on the network.