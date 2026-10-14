# Phase 1 — Data Model: Foundly API — Subscription Plans (Free vs. Pro) & Plan Limits Enforcement

**Feature**: `specs/api/017-subscription-plans` · **Date**: 2026-10-14

## Persistence entities (Prisma)

### `enum SubscriptionPlan` (NEW)

| Value | Meaning |
|---|---|
| `FREE` | At most 1 active service and 1 active team member; basic agenda/payments. |
| `PRO` | Unlimited services and team members; metrics and advanced rules. |

### `enum SubscriptionStatus` (NEW)

| Value | Meaning |
|---|---|
| `active` | Entitled when the plan is Pro and not expired. |
| `past_due` | Payment issue → enforced as Free. |
| `expired` | Lapsed → enforced as Free. |
| `canceled` | Voluntarily ended → enforced as Free. |

### `Tenant` (EXTENDED, +3 columns)

| Field | Type | Notes |
|---|---|---|
| `subscriptionPlan` | `SubscriptionPlan @default(FREE)` | **NEW** — subscription tier |
| `subscriptionStatus` | `SubscriptionStatus @default(active)` | **NEW** — lifecycle state |
| `subscriptionExpiresAt` | `DateTime?` | **NEW** — null = no expiry |

> The existing `plan String?` (Foundly Pass **module** entitlement consumed by `PlanGuard`/`@RequirePlan`) is **unchanged**; the tier is a separate axis (R1).

**Migration**: one new migration — create `SubscriptionPlan`/`SubscriptionStatus` enums, add the 3 `Tenant` columns with defaults. No backfill (defaults/nullable); existing rows become Free/active.

## Effective-plan rule (derived, not stored)

```
effective(tenant) = PRO  when  tenant.subscriptionPlan   === PRO
                         and tenant.subscriptionStatus  === active
                         and (tenant.subscriptionExpiresAt == null
                              or tenant.subscriptionExpiresAt > now)
                    otherwise FREE
```

- **Limits applied from the effective plan**: Free → `services.limit = 1`, `team.limit = 1`; Pro → both `unlimited`.
- **Fail-closed**: a missing, expired, past-due, canceled or unrecognized value yields Free (R2).

## GraphQL types (code-first)

```graphql
enum SubscriptionPlan { FREE PRO }

enum SubscriptionStatus { active past_due expired canceled }

type SubscriptionUsage {
  used: Int!
  limit: Int!          # 1 on Free; 0 when unlimited
  unlimited: Boolean!
}

type SubscriptionLimits {
  services: SubscriptionUsage!
  team: SubscriptionUsage!
}

type SubscriptionSummary {
  plan: SubscriptionPlan!          # raw stored plan
  effectivePlan: SubscriptionPlan! # enforcement plan after status/expiry
  status: SubscriptionStatus!
  expiresAt: String                # ISO-8601 or null
  limits: SubscriptionLimits!
}
```

`query mySubscription: SubscriptionSummary!` — authenticated (`@RequireAuth`), tenant from the verified identity (no tenant argument).

## Service-facing errors

| Situation | Code |
|---|---|
| Free business exceeds the active service or active team limit (create/activate) | `PLAN_LIMIT_REACHED` |
| Pro-gated operation invoked without an effective Pro plan | `PLAN_LIMIT_REACHED` |
| Anonymous / non-tenant-bound request | `UNAUTHENTICATED` |
| Invalid input on the creation (existing validations) | `VALIDATION_ERROR` |

`PLAN_LIMIT_REACHED` is added to `KNOWN_CODES` so the normalizer preserves it (R5).

## Internal seam types

### `SubscriptionRow` — `subscription.store.ts`

| Field | Type |
|---|---|
| `tenantId` | `string` |
| `plan` | `SubscriptionPlan` |
| `status` | `SubscriptionStatus` |
| `expiresAt` | `Date \| null` |

```ts
type UsageKind = 'services' | 'team';

interface SubscriptionStore {
  getTenantSubscription(tenantId: string): Promise<SubscriptionRow | null>;
  countActive(tenantId: string, kind: UsageKind): Promise<number>;
  findServiceActive(id: string, tenantId: string): Promise<boolean | null>;   // null = not found/foreign
  findSpecialistActive(id: string, tenantId: string): Promise<boolean | null>;
  createServiceIfAllowed(...): Promise<ServiceRow>;   // used by catalog's seam path where applicable
}
```

> The real `PrismaSubscriptionStore` implements `getTenantSubscription` (tenant select) and `countActive` (`service.count` / `specialist.count` with `{ tenantId, active: true }`). The in-memory `createMemorySubscriptionStore()` backs the unit specs.

### `SubscriptionService` (public surface to consumers)

| Method | Purpose |
|---|---|
| `resolveEffectivePlan(row)` | Pure: apply the effective-plan rule (R2). |
| `getSummary(user)` | Build `SubscriptionSummary` (tenant from `user.tenantId`). |
| `assertCanAddActiveService(tenantId, tx?)` | Reject if Free and active-service count ≥ 1. |
| `assertCanAddActiveSpecialist(tenantId, tx?)` | Reject if Free and active-team count ≥ 1. |
| `assertCanActivateService(id, tenantId, tx?)` | Reject if activating while at the Free limit. |
| `assertCanActivateSpecialist(id, tenantId, tx?)` | Reject if activating while at the Free limit. |
| `assertEffectivePlan(tenantId, required)` | Guard helper: reject unless the effective plan is in `required`. |

## Validation & enforcement rules (from requirements)

- **FR-002/FR-003** — every business carries `subscriptionPlan` (default `FREE`), `subscriptionStatus` (default `active`) and an optional `subscriptionExpiresAt`; the effective plan is computed per the rule above.
- **FR-005** — `catalog.createService` / `services.createService`: when the resolved effective plan is Free and the new service would be **active** and the tenant already has **1** active service → `PLAN_LIMIT_REACHED`, nothing created.
- **FR-006** — `catalog.updateService` / `services.updateService` flipping an inactive service to active while already at the Free limit → `PLAN_LIMIT_REACHED`.
- **FR-007/FR-008** — the same for `create*Specialist` / activation.
- **FR-009** — creating with `active: false` is always allowed on Free.
- **FR-010** — with an effective Pro plan, no count check blocks the operation.
- **FR-011** — `@RequiresSubscription(PRO)` rejects a non-Pro (effective) tenant with `PLAN_LIMIT_REACHED` before the handler runs.
- **FR-012/FR-016** — the tenant used for the check is the authenticated identity on the catalog surface; on the legacy public surface it is the existing resolved `tenantId`/`tenantSlug` scope (unchanged semantics), so a Free tenant cannot exceed the limit by any path.
- **FR-013** — `mySubscription` derives the tenant from the verified identity only.
- **FR-015** — no enforcement path deletes or deactivates existing services/specialists.

## State transitions (subscription)

Subscription state is provisioned out of band in this phase; the API only **derives** the effective plan. For enforcement purposes:

| Stored plan | Status | Expiry | Effective |
|---|---|---|---|
| `FREE` | any | any | `FREE` |
| `PRO` | `active` | null or future | `PRO` |
| `PRO` | `active` | past | `FREE` |
| `PRO` | `past_due` / `expired` / `canceled` | any | `FREE` |
| *missing/unrecognized* | any | any | `FREE` |

## Derived / served projections

- **`mySubscription` (authenticated)**: effective plan + raw plan/status/expiry + `limits.services{used,limit,unlimited}` and `limits.team{used,limit,unlimited}`, where `used` counts **active** rows.
- **Enforcement (write paths)**: the same `resolveEffectivePlan` + active counts drive the create/activate checks, so the read and the enforcement never disagree (SC-006).
- **Consumer side (Book `018`)**: the admin panel reads `mySubscription` for the plan badge/usage/upgrade prompt and maps `PLAN_LIMIT_REACHED` to the limit message.
