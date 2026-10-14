---

description: "Task list for Foundly API — Super Admin Platform Console"
---

# Tasks: Foundly API — Super Admin Platform Console (Global Metrics & Subscription Override)

**Input**: Design documents from `/specs/api/019-super-admin-panel/`

**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/, quickstart.md

**Tests**: Included — the spec explicitly requires automated coverage (FR-014/SC-008). `apps/api` keeps the NestJS **colocated** `*.spec.ts` convention (the `code-rules.md` §10 migration remains deferred).

**Organization**: Tasks are grouped by user story. The privileged guard and the shared seams are built in Foundational (they block every platform operation); each story then adds a testable slice.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: US1–US4, mapped to the spec's user stories
- Exact file paths are included in every task

## Path Conventions

- API module code: `apps/api/src/modules/platform/`
- API auth: `apps/api/src/modules/auth/`
- SDL snapshot: `apps/book/codegen.schema.gql`

> **Shared-file note**: `platform.service.ts` (and its `platform.service.spec.ts`) is the hub edited by US1, US2 and US4; those phases are **sequential** on that file. The identity/guard are built in Foundational because every platform operation depends on them.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Baseline and module scaffold.

- [X] T001 Establish a green baseline: run `npm run typecheck -w @foundly/api`, `npm run test -w @foundly/api`, `npm run lint -w @foundly/api`, and `npm run test -w @foundly/database`; record the results (no code changes).
- [X] T002 [P] Create the module directory `apps/api/src/modules/platform/` per the plan.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The global platform role, the guard, the shared seams and types every story depends on.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T003 In `apps/api/src/modules/auth/jwt.types.ts` add `platformRole?: string` to `AuthUser` (additive, optional; document that it is the verified platform role).
- [X] T004 In `apps/api/src/modules/auth/jwt.service.ts` resolve `platformRole` from the verified `app_metadata.platform_role` (fallback to a top-level `platform_role`) and include it in the returned `AuthUser`.
- [X] T005 [P] In `apps/api/src/modules/platform/platform.types.ts` define the code-first types: `PlanDistributionObject { free: Int! pro: Int! }`, `UserMetricsObject { available: Boolean! total: Int active: Int }`, `BusinessMetricsObject { total: Int! active: Int! }`, `PlatformMetricsObject { businesses!, users!, plans!, proConversion: Float! }`, `ManagedBusinessObject { tenantId: ID! slug: String! name: String! plan: SubscriptionPlan! status: SubscriptionStatus! expiresAt: String }` and `OverrideTenantSubscriptionInput { tenantId: ID! plan: SubscriptionPlan status: SubscriptionStatus expiresAt: String }` (reusing the `SubscriptionPlan`/`SubscriptionStatus` enums from `specs/api/017-subscription-plans`).
- [X] T006 [P] In `apps/api/src/modules/platform/platform.store.ts` define `ManagedBusinessRow { tenantId; slug; name; plan; status; expiresAt: Date | null }`, the `PLATFORM_STORE` symbol, the `PlatformStore` interface (`countTenants`, `countActiveTenants`, `countByPlan`, `listTenants(query, limit, offset)`, `getTenant(tenantId)`, `updateSubscription(tenantId, patch)`), and `PrismaPlatformStore` (Prisma `tenant.count` / `groupBy(['subscriptionPlan'])` / `findMany({ include: { profile } }, orderBy name)` / `update`).
- [X] T007 [P] In `apps/api/src/modules/platform/platform.test-store.ts` add `createMemoryPlatformStore()` implementing `PlatformStore` for DB-free specs (seedable tenants with plan/status/expiry).
- [X] T008 [P] In `apps/api/src/modules/platform/platform.identity.ts` define the `PlatformIdentityClient` interface (`getUserStats(): Promise<{ total: number; active: number } | null>`), the `PLATFORM_IDENTITY` symbol, `SupabaseAdminIdentityClient` (calls `GET {SUPABASE_AUTH_URL}/admin/users` with `SUPABASE_SERVICE_ROLE_KEY`, bounded paging; returns `null` when the credential/URL is missing or the call fails) and `createMemoryIdentityClient()`.
- [X] T009 In `apps/api/src/modules/platform/platform.service.ts` create `@Injectable() PlatformService` with `isSuperAdmin(user)` (`platformRole === 'super_admin'` OR `email ∈ PLATFORM_ADMIN_EMAILS`, case-insensitive) and `requireSuperAdmin(user)` (missing user → `UNAUTHENTICATED`; not admin → `FORBIDDEN`).
- [X] T010 In `apps/api/src/modules/platform/platform.guard.ts` define `REQUIRED_SUPER_ADMIN_KEY` + `@Injectable() SuperAdminGuard` (delegates to `PlatformService.requireSuperAdmin` on the resolved `ctx.user`; anonymous → `UNAUTHENTICATED`, non-admin → `FORBIDDEN`), and `apps/api/src/modules/platform/platform.decorators.ts` with `@RequireSuperAdmin()` applying `UseGuards(SupabaseJwtGuard, SuperAdminGuard)`.
- [X] T011 In `apps/api/src/modules/platform/platform.module.ts` provide `{ provide: PLATFORM_STORE, useClass: PrismaPlatformStore }`, `{ provide: PLATFORM_IDENTITY, useClass: SupabaseAdminIdentityClient }`, `PlatformService`, `PlatformResolver`, `SuperAdminGuard`; export `PlatformService`/`SuperAdminGuard`; import `SharedPrismaModule`; register `PlatformModule` in `apps/api/src/app.module.ts`.

**Checkpoint**: The platform role, guard and seams are ready; operations can now be built and are protected from the start.

---

## Phase 3: User Story 1 - See global platform metrics (Priority: P1) 🎯 MVP

**Goal**: `platformMetrics` returns businesses total/active, users total/active (degrading gracefully), the plan distribution and the PRO conversion, Super-Admin only.

**Independent Test**: As the Super Admin, request `platformMetrics` → consistent counts, distribution and conversion; with the identity source unavailable, `users.available` is false while business/plan metrics still return; a non-admin is refused.

### Tests for User Story 1

- [X] T012 [P] [US1] In `apps/api/src/modules/platform/platform.service.spec.ts` cover `getMetrics`: business total/active counts; plan distribution over `{FREE, PRO}`; `proConversion` (`pro/total`, 0 when total 0); and `users.available: false` with null counts when the identity client returns `null`.
- [X] T013 [P] [US1] In `apps/api/src/modules/platform/platform.identity.spec.ts` cover `SupabaseAdminIdentityClient.getUserStats`: returns `null` when the service-role key/URL is absent or the request fails; counts total/active from a paged provider response (mocked `fetch`).

### Implementation for User Story 1

- [X] T014 [US1] In `apps/api/src/modules/platform/platform.service.ts` add `getMetrics()` composing `PlatformStore` counts (`businesses.total/active`, `plans {free,pro}`) with the `PlatformIdentityClient` user stats (mapping `null` → `{ available: false, total: null, active: null }`), and compute `proConversion = total > 0 ? pro / total : 0`.
- [X] T015 [US1] In `apps/api/src/modules/platform/platform.resolver.ts` implement `@Query(() => PlatformMetricsObject) platformMetrics` guarded by `@RequireSuperAdmin()`.

**Checkpoint**: The dashboard data source works independently — MVP.

---

## Phase 4: User Story 2 - Force a business subscription (Priority: P1)

**Goal**: `overrideTenantSubscription` sets plan/status/expiry of any business (partial), Super-Admin only, with immediate entitlement effect and grandfathering.

**Independent Test**: Override a business to PRO/active with a future expiry → its effective plan becomes PRO; set FREE → reverts; update only `expiresAt` → plan/status unchanged; `expiresAt: null` clears it; invalid/unknown → error, nothing changes; a non-admin is refused.

### Tests for User Story 2

- [X] T016 [P] [US2] In `apps/api/src/modules/platform/platform.service.spec.ts` add override cases: partial update changes only provided fields; `expiresAt: null` clears expiry; PRO grant and FREE revocation; unknown tenant → `NOT_FOUND`; invalid plan/status/expiry → `VALIDATION_ERROR` and nothing changes.

### Implementation for User Story 2

- [X] T017 [US2] In `apps/api/src/modules/platform/platform.service.ts` add `overrideSubscription(user, input)`: `requireSuperAdmin(user)`; validate `plan ∈ {FREE, PRO}`, `status ∈ {active, past_due, expired, canceled}`, `expiresAt` ISO-8601 or null (invalid → `VALIDATION_ERROR`); build a partial patch; `updateSubscription`; return the updated `ManagedBusiness` (null → `NOT_FOUND`).
- [X] T018 [US2] In `apps/api/src/modules/platform/platform.resolver.ts` implement `@Mutation(() => ManagedBusinessObject) overrideTenantSubscription(@Args('input'))` guarded by `@RequireSuperAdmin()`.

**Checkpoint**: Subscription override works and is privileged; US1 still passes.

---

## Phase 5: User Story 3 - Keep platform operations exclusive (Priority: P1)

**Goal**: Verify and harden the authorization of every platform-only operation (anonymous → `UNAUTHENTICATED`, non-admin → `FORBIDDEN`, admin → allowed), with no data read/written on rejection.

**Independent Test**: For each of `platformMetrics`, `managedBusinesses`, `overrideTenantSubscription`: anonymous fails, a business owner fails, the Super Admin passes; a rejection changes nothing.

### Tests for User Story 3

- [X] T019 [P] [US3] In `apps/api/src/modules/platform/platform.guard.spec.ts` cover `SuperAdminGuard`: anonymous → `UNAUTHENTICATED`; authenticated non-admin → `FORBIDDEN`; `platformRole === 'super_admin'` → pass; allow-listed email (`PLATFORM_ADMIN_EMAILS`) → pass; no metadata → pass.
- [X] T020 [P] [US3] In `apps/api/src/modules/platform/platform.e2e.spec.ts` cover the authorization matrix over `/graphql` (AppModule + local JWKS + memory stores): anonymous → `UNAUTHENTICATED`, business token → `FORBIDDEN`, super-admin token → allowed, for all three operations; a rejected override leaves the store unchanged.

### Implementation for User Story 3

- [X] T021 [US3] Verify `@RequireSuperAdmin()` is applied to `platformMetrics`, `managedBusinesses` and `overrideTenantSubscription` in `apps/api/src/modules/platform/platform.resolver.ts`, and that the guard runs before any read/write (adjust if a resolver is missing it).

**Checkpoint**: All platform operations are provably exclusive; US1–US2 pass.

---

## Phase 6: User Story 4 - Review every business (Priority: P2)

**Goal**: `managedBusinesses` lists every business with its subscription state, bounded/paginated, searchable by name/slug, Super-Admin only.

**Independent Test**: `managedBusinesses` returns all businesses ordered by name with plan/status/expiry; paging is stable; `query` filters by name/slug case-insensitively; a nonsense term returns `[]`; `limit: 0`/`offset: -1` → `VALIDATION_ERROR`; a non-admin is refused.

### Tests for User Story 4

- [X] T022 [P] [US4] In `apps/api/src/modules/platform/platform.service.spec.ts` add list cases: rows with plan/status/expiry; default limit 20 and max 100 with offset; search over name/slug (case-insensitive, no match → `[]`); invalid paging → `VALIDATION_ERROR`.

### Implementation for User Story 4

- [X] T023 [US4] In `apps/api/src/modules/platform/platform.service.ts` add `managedBusinesses(user, { query, limit, offset })` delegating to `requireSuperAdmin` + `PlatformStore.listTenants` with paging validation (default 20, max 100, offset ≥ 0, `query` trimmed/null).
- [X] T024 [US4] In `apps/api/src/modules/platform/platform.resolver.ts` implement `@Query(() => [ManagedBusinessObject]) managedBusinesses(query, limit, offset)` guarded by `@RequireSuperAdmin()`.

**Checkpoint**: The console table has its data source; all four stories work.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Snapshot sync, gates and validation.

- [X] T025 [P] Sync `apps/book/codegen.schema.gql` with the new `PlatformMetrics`/`BusinessMetrics`/`UserMetrics`/`PlanDistribution`/`ManagedBusiness` types, `OverrideTenantSubscriptionInput` and the `platformMetrics`/`managedBusinesses`/`overrideTenantSubscription` operations (consumed by `specs/book/020-super-admin-panel`).
- [X] T026 Run the API gates: `npm run typecheck -w @foundly/api`, `npm run build -w @foundly/api`, `npm run test -w @foundly/api`, `npm run lint -w @foundly/api` (zero regressions, strict TS, no `any`).
- [ ] T027 Execute the `specs/api/019-super-admin-panel/quickstart.md` scenarios (1–5) against a running API. **DEFERRED — requires a live Postgres + Supabase + a Super Admin token; the behaviors are covered by the automated suites.**
- [X] T028 [P] Confirm `FORBIDDEN` is preserved by the error normalizer (`apps/api/src/graphql/errors.ts`) and that existing auth/subscription guards and specs are unchanged.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: Depends on Setup — **BLOCKS all user stories**.
- **User Stories (Phases 3–6)**: Depend on Foundational. US3 (authorization) is verified after US1/US2 exist; US1/US2/US4 each add operations through the shared `platform.service.ts`.
- **Polish (Phase 7)**: Depends on the desired stories being complete.

### User Story Dependencies

- **US1 (P1)**: after Foundational — no other story dependency. **MVP.**
- **US2 (P1)**: after Foundational; shares `platform.service.ts` with US1 (sequential edits).
- **US3 (P1)**: after US1/US2/US4 exist to cover the matrix (can start once the guard exists).
- **US4 (P2)**: after Foundational; shares `platform.service.ts` (sequential edits).

### Within Each User Story

- Tests first (they must fail), then the service method, then the resolver.
- Reject before any read/write (guard runs first).

### Parallel Opportunities

- T002, T005, T006, T007, T008 (Foundational) run in parallel where marked `[P]`.
- Within each story, the `*.spec.ts` tasks marked `[P]` run in parallel.
- After Foundational, US1 and US4 service work can proceed in parallel by different people (one edits `platform.service.ts` at a time).

---

## Parallel Example: User Story 1

```bash
# Launch both spec files together:
Task: "T012 [US1] platform.service.spec.ts metrics cases"
Task: "T013 [US1] platform.identity.spec.ts user-stats cases"

# Then the implementation:
Task: "T014 [US1] PlatformService.getMetrics"
Task: "T015 [US1] resolver platformMetrics"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1 Setup → 2. Phase 2 Foundational → 3. Phase 3 US1 → 4. **STOP and VALIDATE** (metrics + degradation) → 5. Demo.

### Incremental Delivery

1. Setup + Foundational (role + guard + seams) → foundation ready.
2. US1 → validate → deploy (metrics).
3. US2 → validate (override) → deploy.
4. US3 → validate (authorization matrix) → deploy.
5. US4 → validate (managed list) → deploy.
6. Polish → snapshot + gates + quickstart.

### Notes

- `[P]` = different files, no incomplete dependency.
- Platform operations are intentionally cross-tenant; authorization is fail-closed.
- The identity-provider call must stay bounded and degrade to `users.available = false` (never fail the metrics).
- No Prisma migration and no new dependencies.
