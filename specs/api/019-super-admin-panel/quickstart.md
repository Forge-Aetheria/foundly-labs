# Quickstart — Foundly API — Super Admin Platform Console

**Feature**: `specs/api/019-super-admin-panel` · Runnable validation scenarios.

## Prerequisites

- `apps/api/.env` with `DATABASE_URL`, `SUPABASE_AUTH_URL`, `CORS_ORIGINS`.
- Postgres/Supabase reachable and migrated (schema from `017` is already applied — no new migration).
- **A Super Admin token**: a Supabase user whose access token carries `app_metadata.platform_role = "super_admin"`, **or** whose email is listed in `PLATFORM_ADMIN_EMAILS`.
- **A normal business owner token**: a Supabase user with `app_metadata.tenant_id` set and no platform role.
- Optional: `SUPABASE_SERVICE_ROLE_KEY` to enable real user counts (otherwise `users.available` is `false`).

## Run

```bash
npm run dev -w @foundly/api        # http://localhost:3002/graphql
```

## Scenario 1 — Platform metrics

```graphql
query { platformMetrics { businesses { total active } users { available total active } plans { free pro } proConversion } }
```

**Expected**: business totals and the plan distribution returned; `proConversion` consistent with `plans`; with the service-role key configured, `users.available = true` with counts, otherwise `available = false` and the business/plan metrics still return.

## Scenario 2 — Managed businesses list

```graphql
query { managedBusinesses(limit: 20, offset: 0) { tenantId slug name plan status expiresAt } }
```

**Expected**: every business with its plan/status/expiry, ordered by name. `managedBusinesses(query: "ana")` filters by name/slug; a nonsense term returns `[]`; `limit: 0` / `offset: -1` → `VALIDATION_ERROR`.

## Scenario 3 — Force a subscription

```graphql
mutation { overrideTenantSubscription(input: { tenantId: "<id>", plan: PRO, status: active, expiresAt: "2027-01-01T00:00:00.000Z" }) { tenantId plan status expiresAt } }
```

**Expected**: the business becomes Pro (the `mySubscription` effective plan for that business reports PRO). Setting `plan: FREE` or an expiry in the past reverts entitlement to Free. Updating only `expiresAt` leaves plan/status unchanged. `expiresAt: null` clears the expiry.

- Unknown `tenantId` → `NOT_FOUND`.
- Invalid `plan`/`status` or a malformed `expiresAt` → `VALIDATION_ERROR` (nothing changes).

## Scenario 4 — Authorization

- Anonymous call to `platformMetrics` / `managedBusinesses` / `overrideTenantSubscription` → `UNAUTHENTICATED`.
- Normal business-owner token → `FORBIDDEN` for all three, and nothing is read or written.
- Super Admin token → authorized.

## Scenario 5 — Grandfathering preserved

- Take a Pro business with several active services + team; override it to FREE. Confirm the services and team are **still present** and only entitlement/enforcement changes.

## Automated checks

```bash
npm run typecheck -w @foundly/api
npm run test -w @foundly/api        # unit + e2e (AppModule + local JWKS + memory stores)
npm run lint -w @foundly/api
npm run build -w @foundly/api
npm run test -w @foundly/database   # schema unchanged
```
