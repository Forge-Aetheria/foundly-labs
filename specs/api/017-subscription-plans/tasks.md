---

description: "Task list for Foundly API — Subscription Plans (Free vs. Pro) & Plan Limits Enforcement"
---

# Tasks: Foundly API — Subscription Plans (Free vs. Pro) & Plan Limits Enforcement

**Input**: Design documents from `/specs/api/017-subscription-plans/`

**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/, quickstart.md

**Tests**: Included — the spec explicitly requires automated coverage (FR-017/FR-018/SC-007). `apps/api` keeps the NestJS **colocated** `*.spec.ts` convention (the `code-rules.md` §10 migration remains deferred).

**Organization**: Tasks are grouped by user story so each can be implemented and tested independently.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: US1–US5, mapped to the spec's user stories
- Exact file paths are included in every task

## Path Conventions

- API module code: `apps/api/src/modules/<module>/`
- API shared/infra: `apps/api/src/shared/`, `apps/api/src/graphql/`
- Persistence: `packages/database/prisma/`, `packages/database/test/`
- SDL snapshot: `apps/book/codegen.schema.gql`

> **Shared-file note**: `subscription.service.ts` is the hub edited by US1–US5. Those phases are therefore **sequential** on that file, even though their consumer files (specs, resolver, guards, catalog/services/specialists) can be worked in parallel. Each story remains independently testable.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm a green baseline and scaffold the new module directory.

- [X] T001 Establish a green baseline: run `npm run typecheck -w @foundly/api`, `npm run test -w @foundly/api`, `npm run lint -w @foundly/api`, and `npm run test -w @foundly/database`; record the results (no code changes).
- [X] T002 [P] Create the module directory `apps/api/src/modules/subscription/` (per the plan's source structure).

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Tier persistence and the storage/error/contract foundations that every story depends on.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T003 [P] In `packages/database/prisma/schema.prisma` add `enum SubscriptionPlan { FREE PRO }` and `enum SubscriptionStatus { active past_due expired canceled }`, and add these `Tenant` fields verbatim: `subscriptionPlan SubscriptionPlan @default(FREE)`, `subscriptionStatus SubscriptionStatus @default(active)`, `subscriptionExpiresAt DateTime?`. Do **not** modify the existing `plan String?` field.
- [X] T004 Create migration `packages/database/prisma/migrations/<YYYYMMDDHHMMSS>_add_subscription_plans/migration.sql`: `CREATE TYPE "SubscriptionPlan" AS ENUM ('FREE','PRO');`, `CREATE TYPE "SubscriptionStatus" AS ENUM ('active','past_due','expired','canceled');`, then `ALTER TABLE "Tenant" ADD COLUMN "subscriptionPlan" "SubscriptionPlan" NOT NULL DEFAULT 'FREE';`, `... "subscriptionStatus" "SubscriptionStatus" NOT NULL DEFAULT 'active';`, `... "subscriptionExpiresAt" TIMESTAMP(3);` (no backfill) — depends on T003.
- [X] T005 [P] In `packages/database/test/schema.test.ts` add a case asserting the `SubscriptionPlan`/`SubscriptionStatus` enums and the three `Tenant` subscription fields exist.
- [X] T006 [P] In `apps/api/src/graphql/errors.ts` add `'PLAN_LIMIT_REACHED'` to the `KNOWN_CODES` array so the normalizer preserves it verbatim.
- [X] T007 [P] In `apps/api/src/shared/tenant-scope.ts` add `planLimitError(message)` returning a `GraphQLError` with `extensions: { code: 'PLAN_LIMIT_REACHED' }`.
- [X] T008 [P] In `apps/api/src/modules/subscription/subscription.types.ts` define code-first `enum SubscriptionPlan { FREE PRO }` and `enum SubscriptionStatus { active past_due expired canceled }` (via `registerEnumType`), and `@ObjectType() SubscriptionSummary { plan: SubscriptionPlan!, effectivePlan: SubscriptionPlan!, status: SubscriptionStatus!, expiresAt: String }` (the `limits` field is added in US5).
- [X] T009 [P] In `apps/api/src/modules/subscription/subscription.store.ts` define `SubscriptionRow { tenantId; plan: SubscriptionPlan; status: SubscriptionStatus; expiresAt: Date | null }`, `type UsageKind = 'services' | 'team'`, the `SUBSCRIPTION_STORE` symbol, the `SubscriptionStore` interface (`getTenantSubscription(tenantId): Promise<SubscriptionRow | null>`; `countActive(tenantId, kind): Promise<number>` using `{ tenantId, active: true }`), and `PrismaSubscriptionStore` implementing it over `PrismaService`.
- [X] T010 [P] In `apps/api/src/modules/subscription/subscription.test-store.ts` add `createMemorySubscriptionStore()` implementing `SubscriptionStore` for DB-free specs (seeded tenants + rows for counting).

**Checkpoint**: Schema, migration, error plumbing, types and the storage seam are ready.

---

## Phase 3: User Story 1 - Model the business subscription (Priority: P1) 🎯 MVP

**Goal**: Every business carries a plan/status/expiry, and the effective plan (Pro only when plan is Pro, status active and not expired; else Free) is exposed via an authenticated `mySubscription` read.

**Independent Test**: Read `mySubscription` for a new business → `FREE`/`active`/no expiry. Set it to Pro (active, no expiry) → `effectivePlan: PRO`. Set Pro with a past expiry → `effectivePlan: FREE`. Absent/unknown values → `FREE`. Anonymous → `UNAUTHENTICATED`.

### Tests for User Story 1

- [X] T011 [P] [US1] In `apps/api/src/modules/subscription/subscription.service.spec.ts` cover `resolveEffectivePlan` for: FREE→FREE; PRO+active+no expiry→PRO; PRO+active+future expiry→PRO; PRO+active+past expiry→FREE; PRO+past_due/canceled/expired→FREE; missing/unrecognized→FREE.
- [X] T012 [P] [US1] In `apps/api/src/modules/subscription/subscription.resolver.spec.ts` cover `mySubscription`: default Free business, Pro business, and that the tenant comes from the verified identity (no tenant argument).

### Implementation for User Story 1

- [X] T013 [US1] In `apps/api/src/modules/subscription/subscription.service.ts` implement `@Injectable() SubscriptionService` with `requireTenant(user)` (missing tenant → `UNAUTHENTICATED`), `resolveEffectivePlan(row)` (pure, fail-closed) and `getSummary(user)` returning `{ plan, effectivePlan, status, expiresAt }` (no usage yet).
- [X] T014 [US1] In `apps/api/src/modules/subscription/subscription.resolver.ts` implement `@Query(() => SubscriptionSummary) mySubscription` guarded by `@RequireAuth()` + `@AuthUser()`.
- [X] T015 [US1] In `apps/api/src/modules/subscription/subscription.module.ts` provide `{ provide: SUBSCRIPTION_STORE, useClass: PrismaSubscriptionStore }`, `SubscriptionService`, `SubscriptionResolver`, export `SubscriptionService`; import `SharedPrismaModule`; then register `SubscriptionModule` in `apps/api/src/app.module.ts`.

**Checkpoint**: US1 deliverable (model + effective plan + authenticated read) works independently — MVP.

---

## Phase 4: User Story 2 - Enforce the Free service limit (Priority: P1)

**Goal**: A Free business cannot hold more than **1 active service**, on create or activation, across the admin catalog and the legacy public path; rejection is `PLAN_LIMIT_REACHED` and creates/activates nothing. Pro is unlimited; inactive creates are allowed.

**Independent Test**: On a Free business with 1 active service, `createMyService` → `PLAN_LIMIT_REACHED` (nothing created); `createMyService({active:false})` succeeds; activating it → `PLAN_LIMIT_REACHED`; deactivating the first then activating the second succeeds; Pro creates freely.

### Tests for User Story 2

- [X] T016 [P] [US2] In `apps/api/src/modules/catalog/catalog.service.spec.ts` add cases: first active service succeeds; second active → `PLAN_LIMIT_REACHED`; inactive create allowed; activation at limit rejected; deactivation frees capacity; Pro unlimited.
- [X] T017 [P] [US2] In `apps/api/src/modules/services/services.service.spec.ts` add the same limit cases for the public `createService`/`updateService` path (resolved via `tenantId`/`tenantSlug`).

### Implementation for User Story 2

- [X] T018 [US2] In `apps/api/src/modules/subscription/subscription.service.ts` add `assertCanAddActiveService(tenantId)` and `assertCanActivateService(serviceId, tenantId)` — resolve the effective plan; when Free, `countActive(tenantId,'services')` and throw `planLimitError(...)` if it is already ≥ 1; no-op when effective plan is Pro.
- [X] T019 [US2] In `apps/api/src/modules/catalog/catalog.service.ts` inject `SubscriptionService` and call `assertCanAddActiveService` before an active `createService` and `assertCanActivateService` on an activation in `updateService` (default `active: true` on create must be treated as active).
- [X] T020 [US2] In `apps/api/src/modules/services/services.service.ts` inject `SubscriptionService` and apply the same checks in `createService`/`updateService`.
- [X] T021 [US2] In `apps/api/src/modules/catalog/catalog.module.ts` and `apps/api/src/modules/services/services.module.ts` import `SubscriptionModule` so `SubscriptionService` is injectable.

**Checkpoint**: Service limit enforced on every path; US1 still passes.

---

## Phase 5: User Story 3 - Enforce the Free team limit (Priority: P1)

**Goal**: A Free business cannot hold more than **1 active specialist/team member**, on create or activation, on both the admin and legacy paths; `PLAN_LIMIT_REACHED` and nothing persisted. Pro unlimited; inactive allowed.

**Independent Test**: On a Free business with 1 active specialist, `createMySpecialist` → `PLAN_LIMIT_REACHED`; inactive create succeeds; activation at limit rejected; deactivation/removal frees capacity; Pro unlimited.

### Tests for User Story 3

- [X] T022 [P] [US3] In `apps/api/src/modules/catalog/catalog.service.spec.ts` add specialist cases: first active succeeds; second active → `PLAN_LIMIT_REACHED`; inactive allowed; activation at limit rejected; Pro unlimited.
- [X] T023 [P] [US3] In `apps/api/src/modules/specialists/specialists.service.spec.ts` add the same cases for the public `createSpecialist`/`updateSpecialist` path.

### Implementation for User Story 3

- [X] T024 [US3] In `apps/api/src/modules/subscription/subscription.service.ts` add `assertCanAddActiveSpecialist(tenantId)` and `assertCanActivateSpecialist(specialistId, tenantId)` using `countActive(tenantId,'team')` (same shape as T018).
- [X] T025 [US3] In `apps/api/src/modules/catalog/catalog.service.ts` call `assertCanAddActiveSpecialist` before an active `createSpecialist` and `assertCanActivateSpecialist` on an activation in `updateSpecialist`.
- [X] T026 [US3] In `apps/api/src/modules/specialists/specialists.service.ts` apply the same checks in `createSpecialist`/`updateSpecialist`.
- [X] T027 [US3] In `apps/api/src/modules/specialists/specialists.module.ts` import `SubscriptionModule` (catalog already imports it from T021).

**Checkpoint**: Both Free limits enforced; US1–US2 pass.

---

## Phase 6: User Story 4 - Gate Pro-only capabilities (Priority: P2)

**Goal**: A reusable `SubscriptionGuard` + `@RequiresSubscription(PRO)` rejects non-Pro (effective) businesses from Pro-only operations with `PLAN_LIMIT_REACHED`, distinct from the existing module-license `PlanGuard`/`@RequirePlan`.

**Independent Test**: A Pro-decorated handler: Free (effective) tenant → `PLAN_LIMIT_REACHED` with no side effect; Pro tenant → runs; no metadata → passes; anonymous → `UNAUTHENTICATED`. The existing `PlanGuard` tests still pass unchanged.

### Tests for User Story 4

- [X] T028 [P] [US4] In `apps/api/src/modules/subscription/subscription.guard.spec.ts` cover: no `@RequiresSubscription` metadata → pass; effective Pro tenant → pass; effective Free tenant → `PLAN_LIMIT_REACHED`; missing tenant/auth → `UNAUTHENTICATED`.

### Implementation for User Story 4

- [X] T029 [US4] In `apps/api/src/modules/subscription/subscription.service.ts` add `assertEffectivePlan(tenantId, required: SubscriptionPlan[])` returning/throwing per the effective plan (used by the guard).
- [X] T030 [US4] In `apps/api/src/modules/subscription/subscription.guard.ts` implement `@Injectable() SubscriptionGuard` reading `REQUIRED_SUBSCRIPTION_KEY` via `Reflector` and enforcing through `SubscriptionService`; reject with `planLimitError(...)`.
- [X] T031 [US4] In `apps/api/src/modules/subscription/subscription.decorators.ts` add `REQUIRED_SUBSCRIPTION_KEY` + `RequiresSubscription(...plans: SubscriptionPlan[])` applying `UseGuards(SupabaseJwtGuard, SubscriptionGuard)`.
- [X] T032 [US4] In `apps/api/src/modules/subscription/subscription.module.ts` provide and export `SubscriptionGuard` (and the decorator's dependencies) so `@RequiresSubscription` is usable across modules.

**Checkpoint**: Pro-only gating available and reusable; US1–US3 pass.

---

## Phase 7: User Story 5 - Read the effective plan and usage (Priority: P2)

**Goal**: `mySubscription` also exposes per-limit usage: `limits.services { used, limit, unlimited }` and `limits.team { used, limit, unlimited }` — `used` counts **active** rows, `limit` is `1` on Free, `unlimited: true` on Pro; the tenant is the verified identity only.

**Independent Test**: Free business with 1 service + 1 team member → services/team `used: 1, limit: 1, unlimited: false`. Pro → `unlimited: true`. Expired Pro → Free limits with `effectivePlan: FREE`. Token B never sees tenant A's usage.

### Tests for User Story 5

- [X] T033 [P] [US5] In `apps/api/src/modules/subscription/subscription.service.spec.ts` add cases: Free usage/limit 1; Pro `unlimited: true`; expired Pro → Free limits; `used` counts only active rows.
- [X] T034 [P] [US5] In `apps/api/src/modules/subscription/subscription.resolver.spec.ts` add a cross-tenant isolation case for `mySubscription`.

### Implementation for User Story 5

- [X] T035 [US5] In `apps/api/src/modules/subscription/subscription.types.ts` add `@ObjectType() SubscriptionUsage { used: Int!, limit: Int!, unlimited: Boolean! }`, `@ObjectType() SubscriptionLimits { services: SubscriptionUsage!, team: SubscriptionUsage! }`, and add `limits: SubscriptionLimits!` to `SubscriptionSummary`.
- [X] T036 [US5] In `apps/api/src/modules/subscription/subscription.service.ts` extend `getSummary` to populate `limits` via `countActive(tenantId,'services')`/`countActive(tenantId,'team')` and the effective plan (Free → `limit: 1, unlimited: false`; Pro → `limit: 0, unlimited: true`).

**Checkpoint**: The read matches enforcement (SC-006); all P1/P2 stories functional.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Snapshot sync, validation and final gates.

- [X] T037 [P] Regenerate/sync `apps/book/codegen.schema.gql` with the new `SubscriptionPlan`/`SubscriptionStatus` enums, `SubscriptionSummary`/`SubscriptionLimits`/`SubscriptionUsage` types and the `mySubscription` query.
- [X] T038 Run the API gates: `npm run typecheck -w @foundly/api`, `npm run build -w @foundly/api`, `npm run test -w @foundly/api`, `npm run lint -w @foundly/api` (zero regressions, strict TS, no `any`).
- [X] T039 Run the database gates: `npm run test -w @foundly/database` and confirm the subscription schema test passes.
- [ ] T040 Execute the `specs/api/017-subscription-plans/quickstart.md` scenarios (Scenarios 1–6) and confirm each expected outcome, including default Free, service/team limits, Pro unlimited, expiry fail-closed (non-destructive) and cross-tenant isolation. **DEFERRED — requires a live Postgres + Supabase tokens (not available in this environment).** The same behaviors are covered by the automated suites (`subscription.service.spec.ts`, `catalog.service.spec.ts`, `services.service.spec.ts`, `specialists.service.spec.ts`).
- [X] T041 [P] In `apps/api/src/modules/auth/auth.guards.spec.ts` verify the existing `PlanGuard`/`@RequirePlan` module-license behavior and its specs are unchanged (the tier guard is additive, not a replacement).

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: Depends on Setup — **BLOCKS all user stories**.
- **User Stories (Phases 3–7)**: Depend on Foundational. US1 must complete before US2–US5 (it creates the service the others extend). US2 before US3 (both edit `catalog.service.ts`). US4 and US5 depend on US1; they touch different files from US2/US3 except the shared `subscription.service.ts`.
- **Polish (Phase 8)**: Depends on the desired stories being complete (T037 needs US5's types final).

### User Story Dependencies

- **US1 (P1)**: after Foundational — no other story dependency. **MVP.**
- **US2 (P1)**: after US1 (uses `SubscriptionService` and appends to `catalog.service.ts`).
- **US3 (P1)**: after US2 (same `catalog.service.ts`); otherwise independent.
- **US4 (P2)**: after US1 (extends `SubscriptionService`); no dependency on US2/US3.
- **US5 (P2)**: after US1 (extends the summary); no dependency on US2/US3/US4.

### Within Each User Story

- Tests first (they must fail), then service method, then consumer wiring, then module registration.
- Reject before persisting (nothing created/activated on `PLAN_LIMIT_REACHED`).

### Parallel Opportunities

- T002, T005, T006, T007, T008, T009, T010 (Foundational) run in parallel after T003/T004 where noted.
- Within each story, the `*.spec.ts` tasks marked `[P]` run in parallel.
- US4 and US5 can be developed in parallel by different people once US1 lands (separate files, one shared service edit each).

---

## Parallel Example: User Story 2

```bash
# Launch both spec updates together:
Task: "T016 [US2] catalog.service.spec.ts service-limit cases"
Task: "T017 [US2] services.service.spec.ts public-path limit cases"

# Then implementation (shared service first, then consumers):
Task: "T018 [US2] SubscriptionService assertCanAddActiveService/assertCanActivateService"
Task: "T019 [US2] CatalogService enforcement"
Task: "T020 [US2] ServicesService enforcement"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1 Setup → 2. Phase 2 Foundational → 3. Phase 3 US1 → 4. **STOP and VALIDATE** (`mySubscription` defaults + effective plan) → 5. Demo.

### Incremental Delivery

1. Setup + Foundational → foundation ready.
2. US1 → validate → deploy (MVP: subscription model + read).
3. US2 → validate (service limit) → deploy.
4. US3 → validate (team limit) → deploy.
5. US4 → validate (Pro gate) → deploy.
6. US5 → validate (usage limits) → deploy.
7. Polish → snapshot + full gates + quickstart.

### Notes

- `[P]` = different files, no incomplete dependency.
- The Free limits count **active** rows only; inactive creates are always allowed and free the capacity when deactivated.
- `PLAN_LIMIT_REACHED` must survive the error normalizer (T006).
- The existing module-license `plan` field and `PlanGuard`/`@RequirePlan` are untouched (T041).
