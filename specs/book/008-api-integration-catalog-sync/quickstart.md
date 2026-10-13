# Quickstart: Front-to-Back API Integration & Admin Catalog Sync

**Feature**: `specs/book/008-api-integration-catalog-sync` | **Date**: 2026-10-12

Validation guide for the integration. Implements none of the code — runnable scenarios that prove the
feature works end to end. See contracts for precise shapes
([api-connectivity](./contracts/api-connectivity.contract.md), [session-auth](./contracts/session-auth.contract.md),
[admin-catalog](./contracts/admin-catalog.contract.md), [tenancy](./contracts/tenancy.contract.md)) and
[data-model.md](./data-model.md) for mappings.

## Prerequisites

- Node.js ≥ 20, npm (npm workspaces monorepo, install from repo root: `npm install`).
- PostgreSQL (Supabase project) reachable with `DATABASE_URL` / `DIRECT_URL`.
- Supabase Auth project with `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.
- git branch: `008-api-integration-catalog-sync`.

## Setup

```bash
# 1) Environment (values never committed)
cp apps/api/.env.example apps/api/.env          # DATABASE_URL, DIRECT_URL, SUPABASE_AUTH_URL,
                                                # FOUNDLY_PASS_SECRET, PORT=3002, CORS_ORIGINS
cp apps/book/.env.example apps/book/.env        # API_URL=http://localhost:3002, SUPABASE_URL,
                                                # SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
cp packages/database/.env.example packages/database/.env   # DATABASE_URL (matching api)

# 2) Database
npm run db:generate
npm run db:migrate -- --name 008_api_integration_catalog_sync   # (or db:push for dev)

# 3) Backend
npm run dev -w @foundly/api        # GraphQL at http://localhost:3002/graphql, health GET /

# 4) Frontend
npm run dev -w @foundly/book       # http://localhost:3001
```

> Ensure `CORS_ORIGINS` on the API includes `http://localhost:3001` (dev default).

## Validation scenarios

### 1. Connectivity (FR-008/FR-009)
- `curl http://localhost:3002/` → `200 {"service":"foundly-api","status":"ok"}`.
- With the app open, the connection indicator (health via `API_URL`) shows connected; an intentionally
  wrong `API_URL` produces a clear config failure message.

### 2. Session & tenant binding (FR-003/FR-005)
- Complete onboarding: sign up → business data → `createTenant` succeeds.
- Verify the owner's `app_metadata.tenant_id` is set and the refreshed access token carries
  `tenant_id` (decode JWT payload).
- Open an admin URL without a session → redirected to `/onboarding`.

### 3. Admin catalog sync (FR-001/FR-002, SC-001)
- In `/admin/*` create and edit a service (name, price, duration) and a team member (name, role,
  active), save, then **reload**: values persist.
- Open the public page `/book/<slug>`: the updated service/team reflects immediately, and a
  deactivated professional is no longer bookable.
- From a second session/device: the panel shows the same current state (server is source of truth).

### 4. Tenant guard (FR-004, SC-002)
- Change the session reference or attempt data for a foreign tenant → requests return `FORBIDDEN` (or
  scoped results) — zero cross-tenant exposure in requests and UI.

### 5. Graceful degradation (FR-006/FR-007, SC-003/SC-006)
- Stop the API, then attempt a catalog save → clear error, nothing reported as saved.
- With the API stopped, open gallery/reviews/policies sections → they keep working with local data.
- Restart the API and retry the save → completes normally.

### 6. Quality gates (FR-010, SC-005)
```bash
npm run typecheck -w @foundly/book && npm run test -w @foundly/book && npm run build -w @foundly/book
npm run build -w @foundly/api && npm run test -w @foundly/api
npm run lint
```
All pass with zero regressions.

## Expected outcomes

- 100% of catalog edits persist across reloads and appear on the public portal (SC-001).
- 100% of unauthenticated/foreign access attempts blocked (SC-002).
- 100% of outage cases show a clear error with no lost work (SC-003); unmigrated sections unaffected (SC-006).
- New environment connectable in <10 minutes following this guide (SC-004).
- All gates green (SC-005).

## Out of scope (this iteration)

- Migration of gallery, reviews, policies, availability, agenda (remain on the local seam).
- Production deployment of `apps/api` and per-environment Vercel env vars (operational, run by
  deployment tasks); the env/CORS contract they rely on is fixed here (`architecture.md` amendment).