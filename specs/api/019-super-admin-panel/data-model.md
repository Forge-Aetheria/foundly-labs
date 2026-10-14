# Phase 1 — Data Model: Foundly API — Super Admin Platform Console

**Feature**: `specs/api/019-super-admin-panel` · **Date**: 2026-10-14

No new persistence entities. The console reads/writes the existing `Tenant` subscription columns and derives user metrics from the identity provider. The platform role is carried by the verified identity (no table).

## Identity extension (not persisted)

| Field | Type | Source |
|---|---|---|
| `AuthUser.platformRole` | `string \| undefined` | Verified JWT `app_metadata.platform_role` (fallback `platform_role`) |
| Super Admin predicate | `boolean` | `platformRole === 'super_admin'` OR `email ∈ PLATFORM_ADMIN_EMAILS` |

## GraphQL types (code-first)

```graphql
type PlanDistribution {
  free: Int!
  pro: Int!
}

type UserMetrics {
  available: Boolean!   # false when the identity source is unconfigured/unreachable
  total: Int
  active: Int
}

type BusinessMetrics {
  total: Int!
  active: Int!
}

type PlatformMetrics {
  businesses: BusinessMetrics!
  users: UserMetrics!
  plans: PlanDistribution!
  proConversion: Float!   # pro / total rounded, 0 when total = 0
}

type ManagedBusiness {
  tenantId: ID!
  slug: String!
  name: String!
  plan: SubscriptionPlan!        # FREE | PRO (from 017)
  status: SubscriptionStatus!    # active | past_due | expired | canceled (from 017)
  expiresAt: String              # ISO-8601 or null
}

input OverrideTenantSubscriptionInput {
  tenantId: ID!
  plan: SubscriptionPlan
  status: SubscriptionStatus
  expiresAt: String      # ISO-8601, or null to clear
}
```

Operations (all `@RequireSuperAdmin`):

```graphql
type Query {
  platformMetrics: PlatformMetrics!
  managedBusinesses(query: String, limit: Int, offset: Int): [ManagedBusiness!]!
}

type Mutation {
  overrideTenantSubscription(input: OverrideTenantSubscriptionInput!): ManagedBusiness!
}
```

## Internal seam types

### `PlatformStore` — `platform.store.ts`

```ts
interface PlatformStore {
  countTenants(): Promise<number>;
  countActiveTenants(): Promise<number>;
  countByPlan(): Promise<{ plan: SubscriptionPlan; count: number }[]>;
  listTenants(query: string | null, limit: number, offset: number): Promise<ManagedBusinessRow[]>;
  getTenant(tenantId: string): Promise<ManagedBusinessRow | null>;
  updateSubscription(
    tenantId: string,
    patch: { plan?: SubscriptionPlan; status?: SubscriptionStatus; expiresAt?: Date | null },
  ): Promise<ManagedBusinessRow | null>;
}
```

`ManagedBusinessRow = { tenantId; slug; name; plan; status; expiresAt: Date | null }`. The real store uses Prisma `tenant.count`, `tenant.groupBy(['subscriptionPlan'])`, `tenant.findMany({ include: { profile } })` and `tenant.update`; the subscription enums come from `specs/api/017-subscription-plans`.

### `PlatformIdentityClient` — `platform.identity.ts`

```ts
interface PlatformIdentityClient {
  getUserStats(): Promise<{ total: number; active: number } | null>;
}
```

`SupabaseAdminIdentityClient` calls `GET {SUPABASE_AUTH_URL}/admin/users` with `Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>`, walking pages with a bounded cap; returns `null` when the credential/URL is missing or the request fails. `createMemoryIdentityClient()` backs the unit specs.

## Validation rules (from requirements)

- **FR-001/FR-002** — authorization: anonymous → `UNAUTHENTICATED`; non-admin → `FORBIDDEN`; only `super_admin` / allowlist passes; no side effects on rejection.
- **FR-003/FR-004** — metrics: businesses total/active from counts; plans from `groupBy` over the closed `{FREE, PRO}`; `proConversion = total > 0 ? pro / total : 0`.
- **FR-005** — users: `{ available }` reflects whether the identity client returned stats; missing → `available: false` with null counts; metrics must not fail.
- **FR-007** — override: `plan ∈ {FREE, PRO}`, `status ∈ {active, past_due, expired, canceled}`, `expiresAt` ISO-8601 or null (clear); invalid → `VALIDATION_ERROR`.
- **FR-008** — override is partial: only provided fields change.
- **FR-009/FR-010** — override is persist-only; the effective-plan rule (017) applies immediately; no service/team mutation (grandfathering preserved).
- **FR-011** — unknown tenant → `NOT_FOUND`.
- **FR-013** — managed list: ordered by name, bounded (default 20, max 100), offset ≥ 0; search over name/slug case-insensitive.

## Effective subscription (unchanged, from 017)

```
effective = PRO  when plan === PRO and status === active and (expiresAt == null or expiresAt > now)
           otherwise FREE
```

An override writes the stored fields; the next read/enforcement derives the effective plan accordingly.

## Derived / served projections

- **`platformMetrics`**: the dashboard indicators (businesses, users, plan split, PRO conversion).
- **`managedBusinesses`**: the console table rows (identity + subscription state).
- **`overrideTenantSubscription`**: returns the updated `ManagedBusiness` so the console can refresh the row.
