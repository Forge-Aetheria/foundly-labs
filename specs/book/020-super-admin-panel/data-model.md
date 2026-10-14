# Phase 1 — Data Model: Foundly Book — Super Admin Console

**Feature**: `specs/book/020-super-admin-panel` · **Date**: 2026-10-14

The console owns no persistence. It consumes the platform surface (`specs/api/019-super-admin-panel`) and maps responses to module view models. All API-facing types come from `graphql-codegen` (`shared/api/generated.ts`).

## Consumed API shape (codegen — from api 019)

```graphql
query PlatformMetrics {
  platformMetrics {
    businesses { total active }
    users { available total active }
    plans { free pro }
    proConversion
  }
}

query ManagedBusinesses($query: String, $limit: Int, $offset: Int) {
  managedBusinesses(query: $query, limit: $limit, offset: $offset) {
    tenantId slug name plan status expiresAt
  }
}

mutation OverrideTenantSubscription($input: OverrideTenantSubscriptionInput!) {
  overrideTenantSubscription(input: $input) {
    tenantId slug name plan status expiresAt
  }
}
```

`SubscriptionPlan` (FREE | PRO) and `SubscriptionStatus` (active | past_due | expired | canceled) are enums from the snapshot.

## View-model entities (module)

### `PlatformMetricsView`

| Field | Type | Notes |
|---|---|---|
| `businessesTotal` | `number` | Total registered businesses |
| `businessesActive` | `number` | Active businesses |
| `usersTotal` | `number \| null` | `null` when unavailable |
| `usersActive` | `number \| null` | `null` when unavailable |
| `usersAvailable` | `boolean` | Drives the "unavailable" card state |
| `plansFree` | `number` | FREE count |
| `plansPro` | `number` | PRO count |
| `proConversion` | `number` | `pro / total` (0–1) |

### `ManagedBusinessView`

| Field | Type | Notes |
|---|---|---|
| `tenantId` | `string` | Row identity |
| `slug` | `string` | Public slug |
| `name` | `string` | Business name |
| `plan` | `'FREE' \| 'PRO'` | Current plan |
| `status` | `'active' \| 'past_due' \| 'expired' \| 'canceled'` | Subscription status |
| `expiresAt` | `string \| null` | ISO-8601 or null |

### `OverrideFormValues` (validated with zod before submit)

| Field | Type | Constraint |
|---|---|---|
| `plan` | `'FREE' \| 'PRO' \| null` | Optional; closed set |
| `status` | `'active' \| 'past_due' \| 'expired' \| 'canceled' \| null` | Optional; closed set |
| `expiresAt` | `string \| null` | Optional; ISO-8601 or null (clear) |

## Mapping (actions.ts)

```
PlatformMetricsQuery['platformMetrics']  → PlatformMetricsView
ManagedBusinessesQuery['managedBusinesses'][number] → ManagedBusinessView
OverrideTenantSubscriptionMutation['overrideTenantSubscription'] → ManagedBusinessView
```

- A failed read/write returns the `ActionResult` failure unchanged (localized by `apiRequest`/`apiRequestAdmin`).
- `UNAUTHENTICATED` is routed by `apiRequestAdmin` to the session-expiry flow; `FORBIDDEN` is returned to the caller so the view can render the **access-denied** state.

## Validation rules (from requirements)

- **FR-002/FR-003** — anonymous is handled by the guard (redirect to sign-in); a `FORBIDDEN` read renders AccessDenied with no data.
- **FR-006** — `usersAvailable: false` renders the user card as "unavailable" without breaking the dashboard.
- **FR-008** — list paging uses `limit` (default 20, max 100) and `offset ≥ 0`; the API rejects invalid values (mapped to a validation error).
- **FR-010/FR-011** — the override form validates `plan`/`status` closed sets and an ISO-8601 `expiresAt` (or null) before submitting; a rejected override surfaces the typed error and leaves the row unchanged.

## Derived / served projections

- **Dashboard**: `MetricsCards` + `PlanDistribution` from `PlatformMetricsView`.
- **Table**: `ManagedBusinessesTable` from `ManagedBusinessView[]` for the current `q`/page.
- **Dialog**: prefilled from the selected `ManagedBusinessView`; on success the page refreshes.
