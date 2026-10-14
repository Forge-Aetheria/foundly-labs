# Phase 0 — Research: Foundly API — Super Admin Platform Console

**Feature**: `specs/api/019-super-admin-panel` · **Date**: 2026-10-14

All Technical Context unknowns are resolved below (no `NEEDS CLARIFICATION` remained).

## R1 — Super Admin identified by a verified global role (JWT claim + env allowlist)

- **Decision**: Extend `AuthUser` with `platformRole?: string`, resolved in `SupabaseJwtService.verify` from the already-parsed `app_metadata` (`app_metadata.platform_role`, falling back to a top-level `platform_role`). Treat the caller as Super Admin when `platformRole === 'super_admin'` **or** their verified `email` is listed in the `PLATFORM_ADMIN_EMAILS` env allowlist. Both signals come from the **verified** token / server config.
- **Rationale**: There is **no `User`/`Account` table** — the platform's identities live in the identity provider (Supabase Auth) and the API already verifies their tokens. A claim is not client-supplied, so a business cannot self-grant it; the env allowlist provides a bootstrap path and a break-glass fallback without a schema change. The role is independent of the module license (`plan`) and the subscription tier (`subscriptionPlan`).
- **Alternatives considered**: A `User`/`PlatformAdmin` DB table — rejected (duplicates the identity provider, adds a migration and sync burden for no gain this phase). A separate admin credential/login — rejected (breaks SSO; out of scope). A top-level `role: 'super_admin'` — rejected (`role` is the Supabase `authenticated` role; overloading it would break token semantics).

## R2 — A reusable Super Admin guard/decorator

- **Decision**: Add `SuperAdminGuard` + `@RequireSuperAdmin()` (applying `SupabaseJwtGuard` then the platform-role check) in the `platform` module. Anonymous → `UNAUTHENTICATED`; authenticated without the platform role → `FORBIDDEN`; authorized → pass. Nothing is read or written on rejection (guards run before the handler).
- **Rationale**: FR-002/FR-003; mirrors the existing `@RequireAuth`/`PlanGuard`/`SubscriptionGuard` pattern and keeps a single enforcement point. Distinct from the module-license `PlanGuard` and the tier `SubscriptionGuard`.
- **Alternatives considered**: An inline `if` per resolver — rejected (not reusable; easy to forget). Overloading `PlanGuard`/`SubscriptionGuard` — rejected (conflates three orthogonal axes).

## R3 — A dedicated `platform` module with a store seam

- **Decision**: Create `apps/api/src/modules/platform/` using the store-seam pattern (`PlatformStore` + `PrismaPlatformStore` + `createMemoryPlatformStore()`), owning metrics, the managed list and the override.
- **Rationale**: FR-003/FR-006/FR-013; consistent with the ratified `payments`/`subscription`/`reviews` modules and enables DB-free specs.
- **Alternatives considered**: Extending `tenants` — rejected (platform operations are cross-tenant and privileged; a separate module keeps the boundary explicit).

## R4 — Metrics computed from aggregates

- **Decision**: `platformMetrics` returns `businesses { total, active }` (`tenant.count()` / `tenant.count({ status: 'active' })`), `plans` (a `groupBy(['subscriptionPlan'])` mapped to a closed `{ free, pro }` set), and `users { total, active, available }`. PRO conversion is derived from the counts (not stored).
- **Rationale**: FR-003/FR-004/SC-001; counts are cheap and always consistent with the stored subscription state.
- **Alternatives considered**: Caching counters — rejected (premature; counts are simple and correctness matters more).

## R5 — User metrics from the identity provider, degrading gracefully

- **Decision**: Introduce a `PlatformIdentityClient` seam with `getUserStats(): Promise<{ total: number; active: number } | null>`. The real `SupabaseAdminIdentityClient` calls the Supabase Admin API (`{SUPABASE_AUTH_URL}/admin/users`) with `SUPABASE_SERVICE_ROLE_KEY`, walking pages with a bounded cap; it returns `null` when the credential/URL is not configured or the call fails. `platformMetrics` then reports `users.available: false` (user counts absent) while still returning business/plan metrics.
- **Rationale**: FR-005/SC-006; users are owned by the identity provider. A seam keeps the API free of hard credentials in tests and prevents an external outage from breaking the console. "Active" = email confirmed and not banned (per the provider's user record).
- **Alternatives considered**: Counting a business's owner as a user — rejected (conflates users with businesses). A hard dependency on the Admin API — rejected (a missing secret or provider outage would break the whole metrics query). A new Postgres user table — rejected (R1).

## R6 — Managed businesses list: bounded, searchable, stable

- **Decision**: `managedBusinesses(limit, offset, query)` returns every business (any status) with `tenantId`, `slug`, `name`, `plan`, `status`, `expiresAt`, ordered by name, bounded by a default/max limit and offset, optionally filtered case-insensitively by name/slug.
- **Rationale**: FR-013/SC-007; the book console table needs to locate and act on any business. Mirrors the directory query's paging/validation conventions (`specs/api/018-business-directory`).
- **Alternatives considered**: Reusing `tenants` (which returns all tenants but no paging/search and mixes public shape) — rejected (no subscription state, unbounded).

## R7 — Forced subscription override: partial, validated, immediate

- **Decision**: `overrideTenantSubscription(input)` where `input = { tenantId, plan?, status?, expiresAt? }`: validate `plan ∈ {FREE, PRO}`, `status ∈ {active, past_due, expired, canceled}`, `expiresAt` ISO-8601 or explicitly null (clear). Only provided fields change; unknown tenant → `NOT_FOUND`; invalid value → `VALIDATION_ERROR`. The change is persist-only — the effective-plan rule from `specs/api/017-subscription-plans` applies immediately on the next read/enforcement.
- **Rationale**: FR-006…FR-010/SC-003/SC-004; reuses the subscription enums and the existing effective-plan rule; no asset mutation, so grandfathering is preserved.
- **Alternatives considered**: A full "set subscription" replace (requiring all fields) — rejected (breaks partial updates). Cascading entitlement changes onto services/team — rejected (grandfathering; FR-010).

## R8 — Error envelope and role errors

- **Decision**: Reuse the standardized envelope: `UNAUTHENTICATED` (anonymous), `FORBIDDEN` (non-admin), `NOT_FOUND` (unknown tenant), `VALIDATION_ERROR` (invalid plan/status/expiry/paging). `FORBIDDEN` is already in `KNOWN_CODES`, so no normalizer change is needed.
- **Rationale**: FR-002/FR-007/FR-011; consistent with `006`/`008`/`017`.
- **Alternatives considered**: A new `PLATFORM_FORBIDDEN` code — rejected (the existing `FORBIDDEN` is precise and already preserved).

## R9 — Identity claim plumbing

- **Decision**: Extend `AuthUser` with `platformRole?: string` and populate it in `SupabaseJwtService.verify` from `app_metadata.platform_role`/`platform_role`. The allowlist is read from `process.env.PLATFORM_ADMIN_EMAILS` (comma-separated, trimmed, case-insensitive) inside the guard. Existing consumers are unaffected (the field is optional).
- **Rationale**: R1/R2; additive and backward-compatible; keeps identity parsing in one place.
- **Alternatives considered**: A separate decorator that re-parses the raw token — rejected (duplicate verification).

## R10 — No schema change; snapshot sync

- **Decision**: No Prisma migration (the subscription columns already exist; the platform role is a claim/allowlist). Sync `apps/book/codegen.schema.gql` with the new platform types/operations for the `book` console.
- **Rationale**: FR-005; keeps the `packages/database` surface stable and the two apps in lockstep.
- **Alternatives considered**: Adding a `platform_role` DB column — rejected (R1: no user table; a tenant-level flag would be wrong, since a tenant is a business, not a platform admin).
