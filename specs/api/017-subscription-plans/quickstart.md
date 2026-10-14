# Quickstart — Foundly API — Subscription Plans (Free vs. Pro) & Plan Limits Enforcement

**Feature**: `specs/api/017-subscription-plans` · Runnable validation scenarios.

## Prerequisites

- `apps/api/.env` with `DATABASE_URL`, `SUPABASE_AUTH_URL`, `CORS_ORIGINS`.
- Postgres/Supabase reachable and migrated (`npm run db:migrate -w @foundly/database` — applies the new enums/columns).
- Two Supabase access tokens bound to different tenants (A and B) via the `app_metadata.tenant_id` claim.
- A business freshly created (defaults to Free/active) and, for the Pro scenarios, a business with `subscriptionPlan = PRO`, `subscriptionStatus = active`, `subscriptionExpiresAt = null` (set directly in the DB this phase; provisioning is out of band).

## Run

```bash
npm run db:migrate -w @foundly/database
npm run dev -w @foundly/api        # http://localhost:3002/graphql
```

## Scenario 1 — Default subscription on a new business

```graphql
query { mySubscription { plan effectivePlan status expiresAt limits { services { used limit unlimited } team { used limit unlimited } } } }
```

**Expected**: `plan: FREE`, `effectivePlan: FREE`, `status: active`, `expiresAt: null`, both limits `used: 0, limit: 1, unlimited: false`. No bearer → `UNAUTHENTICATED`.

## Scenario 2 — Free service limit (create + activation)

```graphql
mutation { createMyService(input: { name: "Corte", priceCents: 2000, durationMinutes: 30 }) { id active } }
```

**Expected**: the first active service succeeds. A second active service:

```graphql
mutation { createMyService(input: { name: "Tinte", priceCents: 4000, durationMinutes: 60 }) { id } }
```

**Expected**: `PLAN_LIMIT_REACHED` and **no** service created (`myServices` still shows one).

- Creating `{ name: "Tinte", priceCents: 4000, durationMinutes: 60, active: false }` → succeeds (inactive).
- Activating that inactive service while the first is active (`updateMyService(id, { active: true })`) → `PLAN_LIMIT_REACHED`.
- Deactivating the first, then activating the second → succeeds.
- `mySubscription.limits.services` reflects `used: 1, limit: 1`.

## Scenario 3 — Free team limit

```graphql
mutation { createMySpecialist(input: { name: "Ana" }) { id active } }
```

**Expected**: first succeeds; a second active specialist → `PLAN_LIMIT_REACHED`; an inactive one succeeds; activating it while one is active → `PLAN_LIMIT_REACHED`.

## Scenario 4 — Pro is unlimited and gates Pro features

- Set tenant A to Pro (active, no expiry). Re-run Scenarios 2–3: every create/activate succeeds; `mySubscription` reports `effectivePlan: PRO` with `unlimited: true`.
- A Pro-only operation decorated with `@RequiresSubscription(SubscriptionPlan.PRO)`, invoked as Free → `PLAN_LIMIT_REACHED`; as Pro → runs.

## Scenario 5 — Expiry and downgrade are fail-closed and non-destructive

- Set tenant A to `PRO` with `subscriptionExpiresAt` in the past (or `subscriptionStatus = expired`). `mySubscription` → `effectivePlan: FREE`; the previously created services/specialists are **still listed**; a new active create → `PLAN_LIMIT_REACHED`. Nothing was deleted.

## Scenario 6 — Cross-tenant isolation

- `mySubscription` for token B never reports tenant A's plan/usage.
- A limit rejection on tenant A leaves tenant B untouched; foreign ids in activation behave as `NOT_FOUND`.

## Automated checks

```bash
npm run typecheck -w @foundly/api
npm run test -w @foundly/api        # unit + e2e (AppModule + local JWKS + memory store)
npm run lint -w @foundly/api
npm run build -w @foundly/api
npm run test -w @foundly/database   # schema test asserts the subscription fields
```

> Environment note: the API test transform uses the pure-JS TypeScript compiler (`ts.transpileModule`) in `apps/api/vitest.config.ts`, so the suite runs locally on Windows.
