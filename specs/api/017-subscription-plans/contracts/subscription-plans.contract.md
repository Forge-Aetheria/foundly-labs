# Contract — Subscription Plans (Free vs. Pro) & Plan Limits Enforcement (GraphQL surface)

**Feature**: `specs/api/017-subscription-plans` · **Surface**: `POST {API_URL}/graphql`

The subscription tier is exposed only through an authenticated read; the write surfaces that are limited stay as they are (public booking/availability untouched), and every limit check derives the business from the authenticated identity (or from the existing public scope argument on the legacy paths).

## Types

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
  effectivePlan: SubscriptionPlan! # after status/expiry
  status: SubscriptionStatus!
  expiresAt: String                # ISO-8601 or null
  limits: SubscriptionLimits!
}
```

## Read

### `query mySubscription: SubscriptionSummary!` — authenticated

- **Auth**: valid, tenant-bound bearer (Supabase JWT); tenant from the verified identity only (no tenant argument).
- **Behavior**: returns the raw plan/status/expiry, the **effective** plan (Pro only when plan is Pro, status is `active` and not expired; otherwise Free) and per-limit usage. `used` counts **active** rows; `limit` is `1` on Free and `unlimited: true` on Pro.
- **Errors**: `UNAUTHENTICATED`.

## Plan limits (enforced on creation/activation paths)

These are **not** new operations; they harden existing writes so the Free limits hold no matter which path is used.

| Operation | Surface | Rule |
|---|---|---|
| `createMyService` | authenticated (`catalog`) | Active create on Free with 1 active service → `PLAN_LIMIT_REACHED` |
| `updateMyService` (activation) | authenticated (`catalog`) | Activating a second service on Free → `PLAN_LIMIT_REACHED` |
| `createMySpecialist` | authenticated (`catalog`) | Active create on Free with 1 active specialist → `PLAN_LIMIT_REACHED` |
| `updateMySpecialist` (activation) | authenticated (`catalog`) | Activating a second specialist on Free → `PLAN_LIMIT_REACHED` |
| `createService` / `updateService` | public (`services`) | Same rules, resolved via `tenantId`/`tenantSlug` |
| `createSpecialist` / `updateSpecialist` | public (`specialists`) | Same rules, resolved via `tenantId`/`tenantSlug` |

- **Allowed**: creating a service/specialist with `active: false` on Free (does not consume the limit); every create/activate on Pro.
- **Rejection**: `PLAN_LIMIT_REACHED` and **nothing is persisted**.
- **Grandfathering**: existing over-limit assets are never deleted or deactivated; only new creations/activations beyond the limit are blocked.

## Pro-only gating

`@RequiresSubscription(SubscriptionPlan.PRO)` (`SupabaseJwtGuard` → `SubscriptionGuard`) protects Pro-only operations (metrics/analytics, advanced advance/notification rules). A Free (effective) tenant → `PLAN_LIMIT_REACHED` before the handler runs; a Pro (effective) tenant passes. The existing module-license `@RequirePlan` / `PlanGuard` (values like `"book"`) is **unchanged** and governs a different axis.

## Error codes (standardized envelope)

| Situation | Code |
|---|---|
| Free limit exceeded on service/team create or activation | `PLAN_LIMIT_REACHED` |
| Pro-only operation requested by a non-Pro (effective) tenant | `PLAN_LIMIT_REACHED` |
| Anonymous / invalid / non-tenant-bound token | `UNAUTHENTICATED` |
| Invalid creation input (existing validations) | `VALIDATION_ERROR` |
| Missing / foreign id | `NOT_FOUND` |

`PLAN_LIMIT_REACHED` is registered in `KNOWN_CODES` so the normalizer preserves it verbatim (not masked to `INTERNAL_SERVER_ERROR`).

## Tenant isolation guarantees

1. `mySubscription` resolves the tenant from the verified identity only; there is no tenant argument to spoof.
2. The limit check and the write use the same resolved tenant, so a Free business cannot exceed the limit through any creation path.
3. Rejection is all-or-nothing: on `PLAN_LIMIT_REACHED` no service/specialist row is created or activated.
4. The effective plan is fail-closed: expired, past-due, canceled, missing or unrecognized values never yield Pro.
