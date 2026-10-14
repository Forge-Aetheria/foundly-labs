# Phase 0 — Research: Foundly API — Subscription Plans (Free vs. Pro) & Plan Limits Enforcement

**Feature**: `specs/api/017-subscription-plans` · **Date**: 2026-10-14

All Technical Context unknowns are resolved below (no `NEEDS CLARIFICATION` remained).

## R1 — Subscription tier is additive to the existing module license

- **Decision**: Add **new** fields to `Tenant` — `subscriptionPlan SubscriptionPlan @default(FREE)`, `subscriptionStatus SubscriptionStatus @default(active)` and `subscriptionExpiresAt DateTime?` — and leave the existing `plan String?` (the Foundly Pass **module** entitlement consumed by `PlanGuard`/`@RequirePlan`, e.g. `"book"`) untouched. Expose the tier only through a new authenticated `mySubscription` read, not on the public `TenantObject`.
- **Rationale**: `specs/business-model.md` §3 defines Foundly Pass as per-module licensing (one axis) while this feature introduces a Free/Pro **tier** (a second axis). Repurposing `plan` would break the module guard and its tests (`auth.guards.spec.ts` uses `plan: 'book'`). Keeping them independent matches the business model and avoids a breaking change.
- **Alternatives considered**: Repurpose `plan` into FREE/PRO — rejected (breaks module licensing + existing guard tests). A single combined string — rejected (loses type safety and the two-axis clarity).

## R2 — Effective plan computed fail-closed

- **Decision**: A business is **Pro** only when `subscriptionPlan === PRO` **and** `subscriptionStatus === active` **and** (`subscriptionExpiresAt == null` **or** it is in the future); otherwise it is **Free**. Centralize this in `SubscriptionService.resolveEffectivePlan`.
- **Rationale**: FR-003/SC-005; an expired, past-due, canceled or unknown value must never yield Pro entitlements. Computing at read/enforcement time (rather than a nightly job) makes expiry automatic.
- **Alternatives considered**: A scheduled job flipping the plan on expiry — rejected (extra moving part; the rule is cheap to compute). Trusting the stored plan as-is — rejected (would let expiry/downgrade leak Pro).

## R3 — Count-based limits on active records only

- **Decision**: A Free business may hold at most **1 active service** and **1 active specialist**. Enforce on **creation** (when the new record would be active) and on **activation** (an `update*` that flips `active: false → true`). Creating an **inactive** record is always allowed. Pro is unlimited.
- **Rationale**: FR-004/FR-005/FR-006/FR-009; counting active rows mirrors the spec ("1 servicio activo", "1 miembro") and lets a Free owner keep drafts. Re-activation is where a client could otherwise bypass the limit.
- **Alternatives considered**: Count all rows — rejected (would block inactive drafts and punish a downgrade with assets). Block on creation only — rejected (activation bypass).

## R4 — Enforcement lives in the service layer, on every creation path

- **Decision**: Inject `SubscriptionService` into `CatalogService` (the authenticated admin surface used by `apps/book`) and into the legacy `ServicesService`/`SpecialistsService`, and call `assertCanAddActiveService(tenantId)` / `assertCanAddActiveSpecialist(tenantId)` before persisting an active create, and `assertCanActivate...` on an activation. Enforce **before** the DB write so nothing is created on rejection.
- **Rationale**: FR-005/FR-007/FR-012; the admin path is `createMyService`/`createMySpecialist` (confirmed in `apps/book/src/modules/{services,staff}/*.graphql`), but the public `createService`/`createSpecialist` mutations also exist and must not be a bypass. One authoritative check in the service covers both. Resolver-level guards cannot see the count.
- **Alternatives considered**: A method decorator/interceptor — rejected (needs the count and the "will this be active?" intent, which only the service knows). Enforcing only in `catalog` — rejected (leaves the public paths open).

## R5 — Stable `PLAN_LIMIT_REACHED` domain error

- **Decision**: Add a `planLimitError()` helper (code `PLAN_LIMIT_REACHED`) in `shared/tenant-scope.ts` and add `'PLAN_LIMIT_REACHED'` to `KNOWN_CODES` in `graphql/errors.ts` so the normalizer preserves it (it would otherwise be masked to `INTERNAL_SERVER_ERROR`).
- **Rationale**: FR-014/SC-003; the requirement names the code explicitly, and the Book companion (`018`) needs a distinguishable signal to show the limit/upgrade message (FR-007). Preserving an existing code is the smallest change to the standardized envelope.
- **Alternatives considered**: Reuse `FORBIDDEN`/`VALIDATION_ERROR` — rejected (the requirement names `PLAN_LIMIT_REACHED`; a distinct code lets the UI map the upgrade message without string matching).

## R6 — Tier guard is separate from the module guard

- **Decision**: Add `SubscriptionGuard` + `@RequiresSubscription(...plans: SubscriptionPlan[])` (applying `SupabaseJwtGuard` then `SubscriptionGuard`). Leave the existing `PlanGuard`/`@RequirePlan` (module entitlement) and its tests unchanged. Pro-gated operations use `@RequiresSubscription(SubscriptionPlan.PRO)`.
- **Rationale**: FR-011; the requirement allows "`SubscriptionGuard` **or** `@RequiresPlan()`". `@RequirePlan` already exists for a different meaning (module license), so a distinct name avoids an overloaded/silently-broken contract. The guard resolves the effective plan from the verified tenant and rejects non-qualifying businesses with a stable plan error.
- **Alternatives considered**: Reuse/extend `PlanGuard` to also check the tier — rejected (conflates two axes and risks the existing behavior). A resolver-level `if` only — rejected (not reusable; the requirement asks for a guard).

## R7 — Concurrency is best-effort within a transaction

- **Decision**: Perform the count and the write for an active creation inside a Prisma transaction, and document that a hard, race-proof guarantee would require a plan-dependent partial unique index (out of scope for this phase).
- **Rationale**: FR scaling/edge "Concurrency"; a transaction closes the common race (two parallel creates for the same Free tenant) without a schema-level constraint that cannot express a plan-dependent rule cleanly in Prisma.
- **Alternatives considered**: A partial unique index on `Service(tenantId) WHERE active` — rejected (would forbid >1 active service even on Pro). Serializable isolation everywhere — rejected (over-broad; affects unrelated writes).

## R8 — Defaults and migration, no backfill

- **Decision**: One migration creates the two enums and adds the three `Tenant` columns with defaults (`FREE`, `active`, nullable expiry). Existing rows become Free/active automatically; no data backfill.
- **Rationale**: SC-001; every existing business lands on Free with an active status, matching the required default and the "fail-closed" rule (R2).
- **Alternatives considered**: Backfilling Pro for some tenants — rejected (not requested; plan provisioning is out of band in this phase).

## R9 — Enum value casing and the SDL snapshot

- **Decision**: Register code-first enums `SubscriptionPlan { FREE PRO }` and `SubscriptionStatus { active past_due expired canceled }` with the casing shown (the tier values exactly as the requirement names them; status values lower-case like the existing `ReviewState`). Sync the versioned `apps/book/codegen.schema.gql` snapshot and the `packages/database` schema test.
- **Rationale**: FR-001 names Free/Pro; the Book consumes the surface via codegen-only DTOs (constitution §5.VI). The snapshot keeps the two apps in lockstep.
- **Alternatives considered**: Lower-case `free`/`pro` — rejected (the requirement writes `FREE | PRO`; keeping that casing avoids a mapping layer).

## R10 — Subscription summary shape

- **Decision**: `mySubscription` returns the effective plan, the raw plan/status/expiry, and a `limits` object with `services { used, limit, unlimited }` and `team { used, limit, unlimited }` (`limit` = 1 on Free, `unlimited: true` on Pro). Authenticated, tenant from the verified identity; no tenant argument.
- **Rationale**: FR-013/SC-006; the Book needs one consistent source of truth for the plan badge, the usage meters and the upgrade prompt, and it must match what enforcement applies (both read the same `resolveEffectivePlan`).
- **Alternatives considered**: Computing usage in the Book via separate list calls — rejected (N+1 reads, and the enforcement rule must be owned by the API). Adding the tier to the public `TenantObject` — rejected (leaks entitlement/expiry publicly).

## R11 — No new dependencies; error envelope reused

- **Decision**: Reuse `validationError`/`notFoundError` and the JWT `UNAUTHENTICATED` scope error; add only `planLimitError` (`PLAN_LIMIT_REACHED`). No storage, billing or scheduling dependency is added.
- **Rationale**: R5/R6; the existing standardized envelope and guards already express everything needed. Payment/collection is explicitly a later phase.
- **Alternatives considered**: A billing SDK — rejected (out of scope; the phase models entitlements only).
