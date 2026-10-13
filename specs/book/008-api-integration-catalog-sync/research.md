# Research: Front-to-Back API Integration & Admin Catalog Sync

**Feature**: `specs/book/008-api-integration-catalog-sync` | **Date**: 2026-10-12

Phase 0 research output. Each unknown/decision is resolved as **Decision / Rationale / Alternatives**.
Sources cited inline; validated against the actual codebase where noted.

---

## 1. Authentication & session transport (books Supabase JWT into GraphQL header)

- **Decision**: Use `@supabase/supabase-js` + `@supabase/ssr` with the official cookie pattern:
  `src/shared/infra/supabase/client.ts` (`createBrowserClient`), `src/shared/infra/supabase/server.ts`
  (`createServerClient` built **per request** with async Next 15 `cookies()`), and `src/middleware.ts`
  that refreshes the session cookie on every request via `getClaims()` and returns the Supabase response
  (propagating `cache-control`/`expires`/`pragma`). The access token for GraphQL is obtained from
  `supabase.auth.getSession()` on the server and injected as `Authorization: Bearer <access_token>`;
  getClaims is used for guard/authorization decisions, never the (unvalidated) session user.
- **Rationale**: This is the currently-supported SSR integration; it gives a *refreshed* cookie on every
  request so Server Actions/Components always have a fresh token; `getSession()` is the documented way to
  forward the token to another service; Edge-safe and local (JWKS via WebCrypto in `getClaims`).
- **Alternatives considered**: (a) Manual `getUser()` per request (deprecated; no refresh), (b) Auth.js /
  NextAuth Supabase provider (extra provider layer, unnecessary), (c) fully client-side auth (breaks
  server-first GraphQL).
- **Gotchas captured**: `cookies()` is async in Next 15 (must `await`); cookie writes during RSC render
  are forbidden (delegate refresh to middleware); avoid double refresh (single-use refresh tokens);
  server actions from a non-default origin need `serverActions.allowedOrigins`.
- **Sources**: https://supabase.com/docs/guides/auth/server-side/nextjs · https://nextjs.org/docs/app/api-reference/functions/cookies

## 2. Binding `tenant_id` to the owner at onboarding

- **Decision**: Server-side Supabase Admin (`service_role` key) `auth.admin.updateUserById(userId, { app_metadata: { ...existing, tenant_id } })` — **merging**, not replacing — executed in the book's onboarding Server Action after `createTenant` returns the new tenant id; then the client **refreshes the session** (`refreshSession()`) before the first authenticated catalog call.
- **Rationale**: Client-side `auth.updateUser()` cannot set `app_metadata`; the admin API is the only
  mechanism. `app_metadata.tenant_id` is embedded in new JWTs, which is exactly what `apps/api`
  `jwt.service.ts` reads (claim priority `app_metadata.tenant_id` → `tenant_id`). The service-role key
  lives server-side only (never `NEXT_PUBLIC_*`), and the target user id comes from the verified claims,
  preventing privilege escalation.
- **Alternatives considered**: (a) Custom Access Token Hook that computes `tenant_id` at every issuance
  (fresh claims with zero metadata maintenance, but adds an auth-hook service to operate), (b) DB
  membership table resolved per request (defense-in-depth, adds a query per request). Both are viable
  future hardening; `updateUserById` is the right current path per the feature scope.
- **Known limitation**: an already-issued token keeps old claims until `exp`, so the post-onboarding
  `refreshSession()` is mandatory ([research validated in repo: catalog `requireTenant` throws
  `UNAUTHENTICATED` when `user.tenantId` is missing]).
- **Sources**: https://supabase.com/docs/reference/javascript/auth-admin-updateuserbyid · https://supabase.com/docs/guides/auth/jwts

## 3. Typed GraphQL transport

- **Decision**: `graphql-request` v7 (pure ESM) as the thin isomorphic client wrapped in
  `apps/book/src/shared/infra/apiClient.ts`, plus `@graphql-codegen/cli` +
  `typescript` + `typed-document-node` (dev-only) so operations and payloads type-check end to end.
  The wrapper (1) reads `API_URL`, (2) injects `Authorization: Bearer <token>` per call
  (server: from `getSession()`; client-rare), and (3) maps `errors[].extensions.code` from the
  API's normalized envelope (`UNAUTHENTICATED | FORBIDDEN | NOT_FOUND | CONFLICT | VALIDATION_ERROR |
  BAD_REQUEST | INTERNAL_SERVER_ERROR` — verified in `apps/api/src/graphql/errors.ts`) to the book's
  `ActionResult` `ErrorCode`.
- **Rationale**: graphql-request is the smallest maintained client (~4 kB, one dependency) with
  first-class `TypedDocumentNode` support and thrown errors that carry `extensions.code`; no React
  provider/state; works in Node (Server Actions) and the browser. The API's error normalizer already
  matches this pattern exactly, so mapping is mechanical.
- **Alternatives considered**: (a) Native `fetch` wrapper (zero deps but hand-rolls error shaping,
  HTTP-200-with-errors handling and typing — acceptable only if "zero deps" is a hard rule), (b) urql
  (stateful client with caching/subscriptions the server-first app does not need).
- **Sources**: https://www.npmjs.com/package/graphql-request · https://the-guild.dev/graphql/codegen/plugins/typescript/typed-document-node

## 4. CORS configuration

- **Decision**: In `apps/api/src/main.ts`, `app.enableCors({ origin: allowlist-from-env,
  methods: ['GET','HEAD','POST','OPTIONS'], allowedHeaders: ['Content-Type','Authorization',
  'apollo-require-preflight'] })`, with `CORS_ORIGINS` (comma-separated) defaulting to
  `http://localhost:3001` locally and set per environment in production (book zone URL + custom apex).
  Reject unknown origins explicitly (no `origin: true` reflect, no `*` with credentials).
- **Rationale**: Nest `enableCors` wraps the express `cors` package and handles preflight; `Authorization`
  must be in `allowedHeaders`; explicit origin echo is required for browser POSTs. CORS is *not* the
  security boundary — the API's `@RequireAuth`/JWT guards protect everything — but the allowlist keeps
  the surface tight. Server Components/Server Actions → API calls are server-to-server and don't need CORS.
- **Alternatives considered**: (a) Reverse-proxying `/graphql` through the Next app's rewrites
  (same-origin, no CORS at all — valid for multi-zone but couples routing to the frontend platform),
  (b) `origin: true` reflect (convenient but effectively open; rejected).
- **Sources**: https://docs.nestjs.com/security/cors · https://github.com/expressjs/cors · https://nextjs.org/docs/app/guides/multi-zones

## 5. Environment contract & API surface verification (repo findings)

- **Verified in repo**: API GraphQL is served at `POST /graphql` (Apollo/Nest, `autoSchemaFile`);
  health at `GET /` → `{service:'foundly-api', status:'ok'}`; catalog module
  (`apps/api/src/modules/catalog/*`) is `@RequireAuth()`-guarded and tenant-scoped, backed by real
  Prisma (`PrismaCatalogStore`); tenancy module (`createTenant`, `tenant(slug)`) is public; book has
  **no** env, fetch, Supabase or GraphQL dependency today; book `ErrorCode` matches the API codes
  except `STATE_ERROR`, `EMAIL_TAKEN`, `SLUG_TAKEN` (extra local codes preserved by mapping).
- **Decisions**: env names → `API_URL` (server; endpooint incl. `/graphql` is optional suffix),
  optional `NEXT_PUBLIC_API_URL` for client diagnostics; `CORS_ORIGINS` (api); book Supabase env
  `SUPABASE_URL`, `SUPABASE_ANON_KEY` (public) and `SUPABASE_SERVICE_ROLE_KEY` (secret, server-only).
  `specs/architecture.md` §3.1 must be amended to document these (per its amendment policy), plus a
  `.env.example` in `apps/api` and `apps/book`.