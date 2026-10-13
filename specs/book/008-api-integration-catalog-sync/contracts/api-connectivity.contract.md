# Contract: API Connectivity (CORS + environment)

**Feature**: `specs/book/008-api-integration-catalog-sync` | **Date**: 2026-10-12

## Endpoint posture

- GraphQL: `POST {API_URL}/graphql` (Apollo/NestJS code-first; playground/introspection only when
  `NODE_ENV !== 'production'`).
- Health: `GET {API_URL}/` → `200 {"service":"foundly-api","status":"ok"}`.

## CORS policy (apps/api)

Applied in `apps/api/src/main.ts` via `app.enableCors(...)` with an **allowlist read from the
environment** — no `*` with credentials, no `origin: true` reflect:

| Config                     | Value                                                                        |
| -------------------------- | ---------------------------------------------------------------------------- |
| `CORS_ORIGINS` (env)       | comma-separated allowlist; dev default `http://localhost:3001`               |
| production (example)       | `https://foundly-book.vercel.app,https://book.foundlylabs.com` (book origins) |
| `methods`                  | `GET, HEAD, POST, OPTIONS`                                                    |
| `allowedHeaders`           | `Content-Type, Authorization, apollo-require-preflight`                       |
| `credentials`              | not required (Bearer-token auth) — keep `false` unless cookies must cross     |

- Requests without an `Origin` header (curl, server-to-server, tests) are always allowed.
- Security boundary remains the API guards (`@RequireAuth`/JWT); CORS is navigation policy only.
- Server Components / Server Actions → API calls are server-to-server and bypass CORS entirely.

## Environment contract

| Variable                        | Project | Visibility | Purpose                                             |
| ------------------------------- | ------- | ---------- | ---------------------------------------------------- |
| `API_URL`                       | book    | server     | GraphQL base (dev `http://localhost:3002`)           |
| `NEXT_PUBLIC_API_URL` (optional)| book    | public     | client-side diagnostics/health indicator             |
| `SUPABASE_URL`                  | book    | public     | Supabase project URL (browser + server client)       |
| `SUPABASE_ANON_KEY`             | book    | public     | Supabase public anon key                             |
| `SUPABASE_SERVICE_ROLE_KEY`     | book    | **secret** | Admin `updateUserById` for `tenant_id` binding (server-only) |
| `DATABASE_URL` / `DIRECT_URL`   | api + database | secret | PostgreSQL connection (existing)          |
| `SUPABASE_AUTH_URL`             | api     | secret (server) | JWKS/JWT issuer (existing, spec 008) |
| `FOUNDLY_PASS_SECRET`           | api     | secured | HMAC sessions (existing). Not used by this feature iteration. |
| `PORT` (optional)               | api     | server | API port, default `3002`                              |
| `CORS_ORIGINS`                  | api     | server | CORS allowlist (this feature)                         |

- **No secrets in the repository**: values are configured per environment (local `.env`, Vercel
  project env vars). `.env.example` files are committed (`.gitignore` allows `!.env.example`).
- `specs/architecture.md` §3.1 must be amended (per its policy) to add this table (API_URL,
  CORS_ORIGINS, SUPABASE_* for book).
- `apps/book/next.config.mjs`: configure `serverActions.allowedOrigins` so Server Actions are accepted
  from the custom apex / multi-zone origin.

## Failure semantics

| Condition                            | Observable behaviour (book)                                 |
| ------------------------------------ | ------------------------------------------------------------ |
| Missing `API_URL`                    | fail-fast on first GraphQL call with clear config error       |
| Wrong origin / missing CORS header   | browser console CORS error; caller receives parseable failure |
| API down / timeout                   | network failure mapped to a clear `ActionResult` error        |
| Health check                        | `GET {API_URL}/` returns ok payload used by the dev quickstart |