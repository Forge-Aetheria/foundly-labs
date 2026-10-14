# Contract — Super Admin Platform Console (GraphQL surface)

**Feature**: `specs/api/019-super-admin-panel` · **Surface**: `POST {API_URL}/graphql`

All operations in this contract are **Super-Admin-only**: a valid, tenant-bound or global bearer whose verified identity carries the platform role (or whose email is allow-listed). Business accounts never reach them.

## Types

```graphql
type PlanDistribution { free: Int! pro: Int! }
type UserMetrics { available: Boolean! total: Int active: Int }
type BusinessMetrics { total: Int! active: Int! }
type PlatformMetrics {
  businesses: BusinessMetrics!
  users: UserMetrics!
  plans: PlanDistribution!
  proConversion: Float!
}
type ManagedBusiness {
  tenantId: ID!
  slug: String!
  name: String!
  plan: SubscriptionPlan!
  status: SubscriptionStatus!
  expiresAt: String
}
input OverrideTenantSubscriptionInput {
  tenantId: ID!
  plan: SubscriptionPlan
  status: SubscriptionStatus
  expiresAt: String
}
```

`SubscriptionPlan` and `SubscriptionStatus` are the enums from `specs/api/017-subscription-plans`.

## Operations

### `query platformMetrics: PlatformMetrics!` — Super Admin

- **Behavior**: `businesses.total` = all businesses; `businesses.active` = those with an active status; `plans` = distribution over `{FREE, PRO}`; `users` from the identity provider (`available` false and null counts when unconfigured/unreachable); `proConversion` = `pro / total` (0 when total 0).
- **Auth**: platform role required.
- **Errors**: `UNAUTHENTICATED` · `FORBIDDEN`.

### `query managedBusinesses(query: String, limit: Int, offset: Int): [ManagedBusiness!]!` — Super Admin

- **Behavior**: every business (any status) with name/slug/plan/status/expiry, ordered by name, bounded by default 20 / max 100, optional case-insensitive search over name/slug.
- **Auth**: platform role required.
- **Errors**: `UNAUTHENTICATED` · `FORBIDDEN` · `VALIDATION_ERROR` (non-positive limit / negative offset).

### `mutation overrideTenantSubscription(input: OverrideTenantSubscriptionInput!): ManagedBusiness!` — Super Admin

- **Behavior**: partial update of any business's `plan`, `status` and/or `expiresAt` (null clears the expiry). Persist-only; the effective entitlement follows the rule from `017` immediately. Never mutates services/team.
- **Auth**: platform role required.
- **Errors**: `UNAUTHENTICATED` · `FORBIDDEN` · `VALIDATION_ERROR` (invalid plan/status/expiry) · `NOT_FOUND` (unknown tenant).

## Authorization matrix

| Caller | Result |
|---|---|
| Anonymous | `UNAUTHENTICATED`, nothing read/written |
| Authenticated business owner (any tier) | `FORBIDDEN`, nothing read/written |
| Platform role (`super_admin`) or allow-listed email | Authorized |

## Error codes (standardized envelope)

| Situation | Code |
|---|---|
| No/invalid bearer | `UNAUTHENTICATED` |
| Authenticated without the platform role | `FORBIDDEN` |
| Unknown tenant on override | `NOT_FOUND` |
| Invalid plan/status/expiry or paging | `VALIDATION_ERROR` |
| User metric source unavailable | success with `users.available = false` (not an error) |

## Cross-tenant guarantee

1. Platform operations intentionally act across **all** businesses; there is no tenant argument that a business can supply to reach them.
2. Rejection happens in the guard, before any read/write.
3. The override writes only the subscription fields and returns the updated row; existing services/team are untouched.
