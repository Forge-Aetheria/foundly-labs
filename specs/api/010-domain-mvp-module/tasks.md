# Tasks: Foundly API — Domain MVP Module (Authenticated CRUD, Tenant-Isolated)

**Input**: Design documents from `/specs/api/010-domain-mvp-module/`

**Prerequisites**: plan.md (required), spec.md (user stories), research.md, data-model.md, contracts/catalog.contract.md

**Tests**: Included — the spec mandates resolver unit tests and GraphQL integration tests (spec.md
FR-011). All specs are **DB-free**: `catalog.store.ts` is a thin typed seam over the used Prisma
methods, overridden in specs by an in-memory store; tokens come from the 008 local-JWKS helper with a
`tenant_id` claim.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

> **Context**: additive. New `apps/api/src/modules/catalog/` module (`my*` GraphQL surface) + additive
> `AuthUser.tenantId` claim mapping in 008. 003–005 modules and 007/008/009 suites stay untouched. No
> schema/storage change. Test-first where noted (red state expected).

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: no new dependencies — nothing to scaffold beyond confirming the current baseline is green

- [X] T001 Verify baseline gates are green before any change: `npm run build -w @foundly/api && npm run typecheck -w @foundly/api && npm run test -w @foundly/api` (record output; used to detect regressions)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before any user story

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T002 [P] Extend `apps/api/src/modules/auth/jwt.types.ts` — add `tenantId?: string` to `AuthUser` (additive, optional)
- [X] T003 [P] Extend `apps/api/src/modules/auth/jwt.service.ts` — map `app_metadata.tenant_id ?? claims.tenant_id` to `AuthUser.tenantId` (absent → `undefined`; existing 008 specs unaffected) — depends on T002
- [X] T004 [P] Create `apps/api/src/modules/catalog/catalog.types.ts` — `MyService`, `MySpecialist` ObjectTypes, `Create*`/`Update*` inputs and (if needed) id input, per `contracts/catalog.contract.md`
- [X] T005 Create `apps/api/src/modules/catalog/catalog.store.ts` — typed seam (`CatalogStore`) over the used Prisma methods: `service.findMany/findUnique/create/update/delete`, `specialist.*`, `specialistService.deleteMany`, `$transaction` — implemented from the shared `PrismaService` client — depends on T004

**Checkpoint**: Foundation ready — tenant claim mapped and store seam declared

---

## Phase 3: User Story 1 - Manage core catalog resources within my own organization (Priority: P1) 🎯 MVP

**Goal**: Authenticated, `ctx.user.tenantId`-scoped CRUD round-trip on Services and Specialists via the
`my*` GraphQL surface.

**Independent Test**: `npm run test -w @foundly/api` — `catalog.service.spec` + `catalog.resolver.spec`
prove a T1 token creates/lists/fetches/updates/deletes within T1 only. Manual: `npm run dev -w
@foundly/api` + the quickstart CRUD walkthrough.

### Tests for User Story 1 (write FIRST, expect FAIL)

- [X] T006 [P] [US1] Create `apps/api/src/modules/catalog/catalog.service.spec.ts` — in-memory store; `listServices(tenant)` filters by tenant, `getService(id, tenant)` owned-only, `create*/update*/delete*` round-trip scope to tenant; run and confirm it fails (`catalog.service` missing)
- [X] T007 [P] [US1] Create `apps/api/src/modules/catalog/catalog.resolver.spec.ts` — adapter unit: `@AuthUser()` supplies `tenantId` to the service, guard is applied (`RequireAuth`), mutations delegate; run and confirm it fails

### Implementation for User Story 1

- [X] T008 [US1] Create `apps/api/src/modules/catalog/catalog.service.ts` — `CatalogService` using `CatalogStore`: tenant-scoped `findMany`/`findUnique({ id, tenantId })`/`create({ ..., tenantId })`/`update`/`delete`, validation via 009 `validationError`, `notFoundError` for missing/foreign, `conflictError` for duplicates, transaction cascade on specialist delete — depends on T005
- [X] T009 [US1] Create `apps/api/src/modules/catalog/catalog.resolver.ts` — `@Resolver()` with `myServices`/`myService`/`createMyService`/`updateMyService`/`deleteMyService` and the Specialist set, all `@RequireAuth()` + `@AuthUser()` (scope only from `ctx.user.tenantId`) — depends on T008
- [X] T010 [US1] Create `apps/api/src/modules/catalog/catalog.module.ts` (providers `CatalogService` + `CatalogStore` from `PrismaService`) and register `CatalogModule` in `apps/api/src/app.module.ts` — depends on T009
- [X] T011 [US1] Run `npm run build -w @foundly/api && npm run typecheck -w @foundly/api && npm run test -w @foundly/api` and make all green (US1 specs)

**Checkpoint**: US1 fully functional and testable independently (MVP)

---

## Phase 4: User Story 2 - Keep organizations isolated and failures predictable (Priority: P2)

**Goal**: Cross-tenant by-ID access → `NOT_FOUND` (no existence oracle), malformed input →
`VALIDATION_ERROR`, duplicates → `CONFLICT`, anonymous → `UNAUTHENTICATED`, tenant claims never client-driven.

**Independent Test**: `npm run test -w @foundly/api` — isolation matrix (T1 vs T2) in the service spec
and the e2e; every failure code asserted end-to-end over `POST /graphql`.

### Tests for User Story 2 (write FIRST, expect FAIL)

- [X] T012 [P] [US2] Extend `apps/api/src/modules/catalog/catalog.service.spec.ts` — T2 read/update/delete of a T1 id → `NOT_FOUND`; missing `tenantId` claim error; malformed create input → `VALIDATION_ERROR`; duplicate tenant-scoped unique → `CONFLICT` (nothing persisted)
- [X] T013 [P] [US2] Create `apps/api/src/modules/catalog/catalog.e2e.spec.ts` — `POST /graphql` (AppModule, in-memory store override, local-JWKS tokens T1/T2): T1 CRUD round-trip; T2 list empty + T2 fetch/delete of T1 id → `NOT_FOUND` (record intact); anonymous → `UNAUTHENTICATED`; malformed input → `VALIDATION_ERROR`

### Implementation for User Story 2

- [X] T014 [US2] Harden `apps/api/src/modules/catalog/catalog.service.ts` — reconcile every rejection path with the new specs (scoped write yields zero rows → `NOT_FOUND`; validate required fields/bounds → `VALIDATION_ERROR`; map unique violations → `CONFLICT`; no tenant argument accepted on the surface) — depends on T012
- [X] T015 [US2] Run `npm run build -w @foundly/api && npm run typecheck -w @foundly/api && npm run test -w @foundly/api` and make all green

**Checkpoint**: US1 AND US2 work independently

---

## Phase 5: User Story 3 - Keep the workspace green with zero regressions (Priority: P3)

**Goal**: 007 execution layer, 008 identity and 009 logging/error suites still pass with the module registered.

**Independent Test**: Full API suite (incl. 007/008/009) + root lint + book build + ui tests all green.

### Implementation for User Story 3

- [X] T016 [US3] Run full regression gates and fix any failure: `npm run lint` (root), `npm run build -w @foundly/book`, `npm run test -w @foundly/ui`, re-run `npm run build|typecheck|test -w @foundly/api` (007/008/009 suites must stay green)

**Checkpoint**: All user stories independently functional; workspace green

---

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [X] T017 [P] Validate the live quickstart: `npm run dev -w @foundly/api` → anonymous `myServices` returns `UNAUTHENTICATED`; document that a token with a `tenant_id` claim is required for the CRUD walkthrough (manual, real Supabase claim customization) and reconcile `specs/api/010-domain-mvp-module/quickstart.md` on drift
- [X] T018 [P] Final SDD/strict-typing review: `catalog.*`, `apps/api/src/modules/auth/jwt.{types,service}.ts`, `apps/api/src/app.module.ts` — no `any`, `tenantId` additive, 003–005 field names/contracts untouched, `packages/*` untouched, single Prisma seam via the store
- [X] T019 Run the verification matrix and confirm `contracts/catalog.contract.md` matches the shipped SDL/errors (update docs on drift)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: After Setup — BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational
- **Polish (Final Phase)**: After all desired user stories

### User Story Dependencies

- **US1 (P1)**: after Foundational — independent of US2
- **US2 (P2)**: after Foundational — extends US1 files/specs (coordinate on `catalog.service.ts`), independently testable
- **US3 (P3)**: after US1/US2 — full-workspace regression

### Within Each User Story

- Tests (where included) MUST be written and FAIL before implementation
- Types/store before service before resolver before module wiring (US1)
- Rejection paths before hardening (US2)
- Core implementation before gate verification

### Parallel Opportunities

- Foundational: T002, T003, T004 independent files → parallel; T005 needs T004
- US1: T006, T007 independent spec files → parallel; impl T008 → T009 → T010 sequential; T011 waits
- US2: T012, T013 independent files → parallel; T014 needs T012; T015 waits
- Polish: T017, T018 independent → parallel

---

## Parallel Example: User Story 1

```bash
# Launch the two US1 spec files together (independent files, fail first):
Task: "Create apps/api/src/modules/catalog/catalog.service.spec.ts (in-memory store, scoped CRUD)"
Task: "Create apps/api/src/modules/catalog/catalog.resolver.spec.ts (delegation + AuthUser scope)"

# Launch US1 implementation (dependent order):
Task: "Create apps/api/src/modules/catalog/catalog.service.ts"
Task: "Create apps/api/src/modules/catalog/catalog.resolver.ts"
Task: "Create catalog.module.ts + register in apps/api/src/app.module.ts"
# Then: run `npm run build|typecheck|test -w @foundly/api` and make green (T011)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Foundational: `tenantId` claim mapping + `catalog.types.ts` + `catalog.store.ts`
2. Complete US1: scoped CRUD service/resolver/module green
3. **STOP and VALIDATE**: T1 CRUD round-trip specs green; manual walkthrough
4. Deploy/demo the scoped MVP if ready

### Incremental Delivery

1. Foundational → claim mapped + store seam ready
2. US1 → tenant-scoped CRUD round-trip → Deploy/Demo (MVP)
3. US2 → isolation matrix + predictable errors → Deploy/Demo
4. US3 → full-workspace regression green → Deploy/Demo

### Parallel Team Strategy

1. Team completes Foundational together
2. Developer A: US1 (CRUD) — Developer B: US2 (isolation/validation specs) — coordinate on `catalog.service.ts`
3. Developer C: US3 regression after both land

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to a user story for traceability
- Specs never touch a live DB (in-memory store seam) or the network (008 local JWKS)
- No `schema.prisma`/storage change; `packages/*` untouched; 003–005 field names untouched
- Commit after each task or logical group; keep `apps/api/src/schema.gql` out of git