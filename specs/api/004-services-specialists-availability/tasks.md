---
description: 'Task list for the Foundly API GraphQL modules feature (services, specialists, availability)'
---

# Tasks: Foundly API — GraphQL Modules for Services, Specialists & Availability

**Input**: Design documents from `/specs/api/004-services-specialists-availability/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/services-graphql.contract.md, contracts/specialists-graphql.contract.md, contracts/availability-graphql.contract.md, quickstart.md

**Tests**: Tests ARE requested by the feature spec (FR-013 requires DB-free unit + e2e coverage per module; US4 gates). Test tasks are included and written BEFORE implementation (TDD).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

- Code lives in `apps/api/src/` (three new modules under `apps/api/src/modules/`); the Prisma seam
  (`apps/api/src/shared/prisma/`) and vitest/swc instrumentation already exist from `003`. No new
  top-level project and no schema change.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project scaffolding; the seam and test tooling already exist (from `003`), no new deps.

- [x] T001 [P] Create the directory scaffolding for the three modules: `apps/api/src/modules/services/`, `apps/api/src/modules/specialists/` and `apps/api/src/modules/availability/` (files are created in later phases).
- [x] T002 [P] Confirm the swc/vitest instrumentation and `SharedPrismaModule` from `003` resolve in `apps/api` (vitest.config.ts, src/shared/prisma/*) and no dependency changes are needed.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared helper that every module needs; MUST be complete before ANY user story.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T003 Create the shared tenant-scope helper `apps/api/src/shared/tenant-scope.ts` — `resolveTenantId(client, { tenantId?, tenantSlug? })` returning `tenantId` (resolving `tenantSlug` via `businessProfile.findUnique({ where: { slug } }).tenantId`) or `null`; throws `VALIDATION_ERROR` when neither is provided.

**Checkpoint**: Foundation ready — modules can resolve their tenant scope and start in parallel.

---

## Phase 3: User Story 1 - Manage the service catalog (Priority: P1) 🎯 MVP

**Goal**: `services` module — catalog CRUD scoped to a business (`tenantId`/`tenantSlug`) with category
(exact) and duration (range) filters, and removal that cleans specialist assignments.

**Independent Test**: `npm run test -w @foundly/api` green incl. services unit + e2e; manual
`services(...)`/`service`/`createService`/`updateService`/`removeService` in the dev sandbox per
contracts/services-graphql.contract.md.

### Tests for User Story 1 (requested, write FIRST — must FAIL before implementation) ⚠️

- [x] T004 [US1] Unit tests `apps/api/src/modules/services/services.service.spec.ts` (mocked `PrismaService` + `tenant-scope`): list with `tenantId`/`tenantSlug` scoping, category exact filter, duration min/max range, create/update/remove validation (`VALIDATION_ERROR`), `removeService` cleans `SpecialistService` rows transactionally, unknown slug → `[]`, missing id → `NOT_FOUND`.
- [x] T005 [P] [US1] GraphQL e2e `apps/api/src/modules/services/services.resolver.spec.ts` via supertest `POST /graphql` (stubbed `PrismaService`): `services` filters, `service(id)`, `createService`, `updateService`, `removeService` + error codes.

### Implementation for User Story 1

- [x] T006 [P] [US1] Define code-first GraphQL types `apps/api/src/modules/services/services.types.ts` — `ServiceObject`, local `SpecialistRefObject`, `CreateServiceInput`, `UpdateServiceInput`, filter args — per contracts/services-graphql.contract.md.
- [x] T007 [US1] Implement `apps/api/src/modules/services/services.service.ts` using `PrismaService` + `tenant-scope`: list + filters, `service(id)` (incl. specialists via join), create/update (validation → `VALIDATION_ERROR`), remove (deletes service + its `SpecialistService` rows transactionally; `NOT_FOUND` when missing).
- [x] T008 [US1] Implement the resolver `apps/api/src/modules/services/services.resolver.ts` (`@Query services`/`service`, `@Mutation createService`/`updateService`/`removeService`).
- [x] T009 [US1] Wire `apps/api/src/modules/services/services.module.ts` (imports `SharedPrismaModule`, providers service+resolver).
- [x] T010 [US1] Register `ServicesModule` in `apps/api/src/app.module.ts`.

**Checkpoint**: User Story 1 complete — catalog reads, filters and writes work and are independently tested.

---

## Phase 4: User Story 2 - Manage specialists and their services (Priority: P2)

**Goal**: `specialists` module — professional CRUD (name/role/bio/avatar) + assign/unassign services
through `SpecialistService` with both-direction reads and atomic removal cleanup.

**Independent Test**: `npm run test -w @foundly/api` green incl. specialists unit + e2e; manual
`specialists`/`specialist`/`serviceSpecialists`/`createSpecialist`/`updateSpecialist`/`removeSpecialist`/
`assignServiceToSpecialist`/`unassignServiceFromSpecialist` per contracts/specialists-graphql.contract.md.

### Tests for User Story 2 (requested, write FIRST — must FAIL before implementation) ⚠️

- [x] T011 [US2] Unit tests `apps/api/src/modules/specialists/specialists.service.spec.ts` (mocked `PrismaService`): list by tenant, detail with assigned services, create/update/remove validation, assign (duplicate → `CONFLICT`, cross-tenant/missing target → `NOT_FOUND`), unassign (absent → `NOT_FOUND`), removal cleans joins.
- [x] T012 [P] [US2] GraphQL e2e `apps/api/src/modules/specialists/specialists.resolver.spec.ts` via supertest `POST /graphql` (stubbed `PrismaService`): `specialists`, `specialist`, `serviceSpecialists`, `createSpecialist`, `updateSpecialist`, `removeSpecialist`, assign/unassign + error codes.

### Implementation for User Story 2

- [x] T013 [P] [US2] Define code-first GraphQL types `apps/api/src/modules/specialists/specialists.types.ts` — `SpecialistObject`, local `ServiceRefObject`, `CreateSpecialistInput`, `UpdateSpecialistInput` — per contracts/specialists-graphql.contract.md.
- [x] T014 [US2] Implement `apps/api/src/modules/specialists/specialists.service.ts` using `PrismaService` + `tenant-scope`: CRUD, `serviceSpecialists(serviceId)`, assign/unassign via `SpecialistService` (duplicate `P2002` → `CONFLICT`, cross-tenant → `NOT_FOUND`), remove deletes specialist + assignment rows transactionally.
- [x] T015 [US2] Implement the resolver `apps/api/src/modules/specialists/specialists.resolver.ts` (queries `specialists`/`specialist`/`serviceSpecialists`, mutations create/update/remove/assign/unassign).
- [x] T016 [US2] Wire `apps/api/src/modules/specialists/specialists.module.ts`.
- [x] T017 [US2] Register `SpecialistsModule` in `apps/api/src/app.module.ts`.

**Checkpoint**: User Stories 1 AND 2 work independently — specialists and their assignments are manageable over GraphQL.

---

## Phase 5: User Story 3 - Configure availability (Priority: P3)

**Goal**: `availability` module — weekly schedule read/write scoped to a business and optionally a
specialist, with strict weekday/`HH:mm`/`endTime>startTime` validation.

**Independent Test**: `npm run test -w @foundly/api` green incl. availability unit + e2e; manual
`availability`/`createAvailability`/`updateAvailability`/`removeAvailability` per
contracts/availability-graphql.contract.md.

### Tests for User Story 3 (requested, write FIRST — must FAIL before implementation) ⚠️

- [x] T018 [US3] Unit tests `apps/api/src/modules/availability/availability.service.spec.ts` (mocked `PrismaService`): read by tenant and by specialist (business-wide + scoped), create/update/remove validation (weekday 0–6, `HH:mm`, `endTime > startTime`, granularity/lead/horizon), empty lists, missing id → `NOT_FOUND`.
- [x] T019 [P] [US3] GraphQL e2e `apps/api/src/modules/availability/availability.resolver.spec.ts` via supertest `POST /graphql` (stubbed `PrismaService`): `availability`, `createAvailability`, `updateAvailability`, `removeAvailability` + error codes.

### Implementation for User Story 3

- [x] T020 [P] [US3] Define code-first GraphQL types `apps/api/src/modules/availability/availability.types.ts` — `AvailabilityObject`, `CreateAvailabilityInput`, `UpdateAvailabilityInput` — per contracts/availability-graphql.contract.md.
- [x] T021 [US3] Implement `apps/api/src/modules/availability/availability.service.ts` using `PrismaService` + `tenant-scope`: read (business-wide + `specialistId` scoped), create/update/remove with validation (`VALIDATION_ERROR`) and `NOT_FOUND`.
- [x] T022 [US3] Implement the resolver `apps/api/src/modules/availability/availability.resolver.ts` (query `availability`, mutations create/update/remove).
- [x] T023 [US3] Wire `apps/api/src/modules/availability/availability.module.ts`.
- [x] T024 [US3] Register `AvailabilityModule` in `apps/api/src/app.module.ts`.

**Checkpoint**: All three user stories function independently.

---

## Phase 6: User Story 4 - Keep the quality gates green (Priority: P3)

**Goal**: Confirm the API and the workspace stay green after the three modules with DB-free coverage.

**Independent Test**: The full gate matrix in quickstart.md passes without a live database.

- [x] T025 [US4] Run the API gates: `npm run build|typecheck|test -w @foundly/api` (existing health/tenants + services/specialists/availability specs green).
- [x] T026 [US4] Run the regression gates: `npm run build -w @foundly/book`, `npm run test -w @foundly/ui`, `npm run build|typecheck|test -w @foundly/database`.
- [x] T027 [US4] Execute the quickstart.md verification matrix (generate/build → manual GraphQL scenarios with `VALIDATION_ERROR`/`NOT_FOUND`/`CONFLICT` codes).

**Checkpoint**: Full workspace green with the three new modules.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T028 [P] Verify the regenerated `apps/api/src/schema.gql` (code-first output incl. the three modules) stays ephemeral/git-ignored; do not commit it.
- [x] T029 [P] Run Prettier (`npx prettier --write apps/api/src`) and ESLint (`npm run lint`) over the changed files; resolve any findings.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately.
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories (T003 `tenant-scope`).
- **User Stories (Phase 3+)**: All depend on Foundational completion. Modules are independent of each
  other (different files) and can proceed in parallel; each ships with its own tests.
- **Polish (Final Phase)**: Depends on all desired user stories being complete.

### User Story Dependencies

- **User Story 1 (P1)**: after Foundational; depends on the `003` services types/entities (existing) — no other story needed.
- **User Story 2 (P2)**: after Foundational; references the Service entity (already ratified) but is independently testable.
- **User Story 3 (P3)**: after Foundational; independent (Availability entity).
- **User Story 4 (P3)**: depends on US1 + US2 + US3 being complete.

### Within Each User Story

- Tests are written FIRST and must FAIL before implementation.
- Types before service; service before resolver; resolver before module wiring; module before `app.module.ts` registration.
- Story complete before moving to the next priority.

### Parallel Opportunities

- T001/T002 (Setup) marked [P].
- T004/T005 (US1 tests), T011/T012 (US2 tests), T018/T019 (US3 tests) run in parallel within their stories.
- T006 (US1 types) is [P]; T013 (US2 types) is [P]; T020 (US3 types) is [P] — parallel with the other stories.
- The three modules (US1/US2/US3) can be developed in parallel by different developers once T003 lands.
- T028/T029 (Polish) marked [P].
- T025/T026/T027 (US4) run sequentially as verification.

---

## Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together (write-first, expect red):
Task: "Unit tests apps/api/src/modules/services/services.service.spec.ts"
Task: "GraphQL e2e apps/api/src/modules/services/services.resolver.spec.ts"

# Launch the code-first types while tests are being drafted:
Task: "Define code-first GraphQL types in apps/api/src/modules/services/services.types.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 (Setup): T001–T002.
2. Complete Phase 2 (Foundational): T003 (tenant-scope helper — CRITICAL).
3. Complete Phase 3 (US1): T004–T010 (services catalog + DB-free tests).
4. **STOP and VALIDATE**: `npm run build|typecheck|test -w @foundly/api` green; manual `services` walkthrough.
5. This is the MVP slice: the service catalog over GraphQL.

### Incremental Delivery

1. Setup + Foundational → tenant-scope helper ready.
2. Add User Story 1 → services module (MVP). Test independently.
3. Add User Story 2 → specialists module + assignments. Test independently.
4. Add User Story 3 → availability module. Test independently.
5. Add User Story 4 → full gate matrix.
6. Each story adds value without breaking previous stories.

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together (T001–T003).
2. Once Foundational is done:
   - Developer A: User Story 1 (services).
   - Developer B: User Story 2 (specialists).
   - Developer C: User Story 3 (availability).
3. Developer D: User Story 4 verification + Polish once the modules merge.

---

## Notes

- [P] tasks = different files, no dependencies.
- [Story] label maps the task to its user story for traceability.
- Each user story is independently completable and testable.
- Verify tests fail before implementing (T004, T005, T011, T012, T018, T019).
- Commit after each task or logical group; keep `schema.gql` and generated Prisma output out of git.
- Reuse the `003` fakes/patterns for elastic DB-free mocking; do not introduce a live-database requirement.
