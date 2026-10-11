---
description: 'Task list for the Foundly API appointments GraphQL module'
---

# Tasks: Foundly API — Appointments & Bookings GraphQL Module

**Input**: Design documents from `/specs/api/005-appointments/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/appointments-graphql.contract.md, quickstart.md

**Tests**: Tests ARE requested by the feature spec (objective 3: TDD DB-free unit + e2e covering success
and error cases, overlap, missing service/specialist). Test tasks are included and written BEFORE
implementation.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of
each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

- Code lives in `apps/api/src/modules/appointments/`; the Prisma seam (`apps/api/src/shared/prisma/`),
  `tenant-scope` helpers and swc/vitest tooling already exist from `003`/`004`.
- One persistence change: `Appointment.cancellationReason String?` in `packages/database/prisma/schema.prisma` + client regeneration.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project scaffolding; the seam and test tooling already exist (from `003`/`004`).

- [x] T001 [P] Create the directory scaffolding `apps/api/src/modules/appointments/` (files are created in later phases).
- [x] T002 [P] Confirm the swc/vitest instrumentation, `SharedPrismaModule` and `tenant-scope` helpers resolve in `apps/api` (src/shared/*, vitest.config.ts) with no dependency changes needed.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Additive schema change + regeneration that MUST precede any appointment work.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T003 Add `cancellationReason String?` to the `Appointment` model in `packages/database/prisma/schema.prisma` (additive, nullable; per data-model.md).
- [x] T004 Extend `packages/database/test/schema.test.ts` to assert the `Appointment` model defines `cancellationReason String?`; RUN BEFORE T003 is applied — expected red.
- [x] T005 Run `npm run generate -w @foundly/database` to regenerate the Prisma client with the new field.
- [x] T006 Verify the database gates: `npm run build|typecheck|test -w @foundly/database` (schema test green).

**Checkpoint**: Foundation ready — `PrismaService.client.appointment` exposes `cancellationReason`; user stories can begin.

---

## Phase 3: User Story 1 - Book and read appointments (Priority: P1) 🎯 MVP

**Goal**: `appointments` reads (tenant + date-range + specialist + status filters; `appointment(id)`)
and `createAppointment` with service/specialist existence + cross-tenant validation, no-overlap
guarantee and service-derived snapshot.

**Independent Test**: `npm run test -w @foundly/api` green incl. appointments unit + e2e; manual
`appointments(...)`/`appointment`/`createAppointment` flows per contracts/appointments-graphql.contract.md.

### Tests for User Story 1 (requested, write FIRST — must FAIL before implementation) ⚠️

- [x] T007 [US1] Unit tests `apps/api/src/modules/appointments/appointments.service.spec.ts` (mocked `PrismaService`): agenda filters (tenantSlug/tenantId, inclusive `startDate`/`endDate`, `specialistId`, status normalization), `appointment(id)` row/null, `createAppointment` success (snapshot from service, `origin` default `online`, status `PENDING`), overlap → `CONFLICT`, missing/cross-tenant service or specialist → `NOT_FOUND`, invalid range/missing client name → `VALIDATION_ERROR`.
- [x] T008 [P] [US1] GraphQL e2e `apps/api/src/modules/appointments/appointments.resolver.spec.ts` via supertest `POST /graphql` (stubbed `PrismaService`): `appointments` filters, `appointment(id)`, `createAppointment` success + `CONFLICT`/`NOT_FOUND`/`VALIDATION_ERROR` codes.

### Implementation for User Story 1

- [x] T009 [P] [US1] Define code-first GraphQL types `apps/api/src/modules/appointments/appointments.types.ts` — `Appointment` (`@ObjectType('Appointment')`), local `AppointmentService`/`AppointmentSpecialist` refs, `AppointmentStatus` enum, `CreateAppointmentInput` — per contracts/appointments-graphql.contract.md.
- [x] T010 [US1] Implement `apps/api/src/modules/appointments/appointments.service.ts` using `PrismaService` + `tenant-scope`: `findAppointments` (AND filters), `findAppointment(id)`, `createAppointment` (resolve tenant, validate service/specialist existence + same tenant, `endAt > startAt`, overlap check on non-cancelled same-specialist appointments → `CONFLICT`, service snapshot, `origin: 'online'`).
- [x] T011 [US1] Implement the resolver `apps/api/src/modules/appointments/appointments.resolver.ts` (queries `appointments`/`appointment`, mutation `createAppointment`).
- [x] T012 [US1] Wire `apps/api/src/modules/appointments/appointments.module.ts` (imports `SharedPrismaModule`).
- [x] T013 [US1] Register `AppointmentsModule` in `apps/api/src/app.module.ts`.

**Checkpoint**: User Story 1 complete — policy creation and agenda reads are functional and independently tested.

---

## Phase 4: User Story 2 - Transition appointment status (Priority: P2)

**Goal**: `updateAppointmentStatus` enforcing the canonical set and the allowed-transitions map.

**Independent Test**: `npm run test -w @foundly/api` green incl. the status-map unit/e2e cases; manual
`updateAppointmentStatus` per contract.

### Tests for User Story 2 (requested, write FIRST — must FAIL before implementation) ⚠️

- [x] T014 [US2] Add unit cases to `apps/api/src/modules/appointments/appointments.service.spec.ts`: valid transitions (PENDING→CONFIRMED/COMPLETED, CONFIRMED→CANCELLED/COMPLETED), invalid status value → `VALIDATION_ERROR`, disallowed transition (CANCELLED→CONFIRMED, COMPLETED→any) → `VALIDATION_ERROR`, missing id → `NOT_FOUND`.
- [x] T015 [US2] Add e2e cases to `apps/api/src/modules/appointments/appointments.resolver.spec.ts`: `updateAppointmentStatus` valid + invalid/disallowed codes over `/graphql`.

### Implementation for User Story 2

- [x] T016 [US2] Implement `updateAppointmentStatus` in `apps/api/src/modules/appointments/appointments.service.ts` (normalize status; validate value + transition map; update; `NOT_FOUND` handling).
- [x] T017 [US2] Add the `updateAppointmentStatus` mutation to `apps/api/src/modules/appointments/appointments.resolver.ts`.

**Checkpoint**: User Stories 1 AND 2 work independently.

---

## Phase 5: User Story 3 - Cancel appointments with a reason (Priority: P3)

**Goal**: `cancelAppointment` sets `CANCELLED` + optional `cancellationReason` from cancellable states.

**Independent Test**: `npm run test -w @foundly/api` green incl. the cancel unit/e2e cases; manual
`cancelAppointment` per contract.

### Tests for User Story 3 (requested, write FIRST — must FAIL before implementation) ⚠️

- [x] T018 [US3] Add unit cases to `apps/api/src/modules/appointments/appointments.service.spec.ts`: cancel with reason, cancel without reason, illegal cancel (COMPLETED) → `VALIDATION_ERROR`, missing id → `NOT_FOUND`.
- [x] T019 [US3] Add e2e cases to `apps/api/src/modules/appointments/appointments.resolver.spec.ts`: `cancelAppointment` with/without reason + illegal-cancel code over `/graphql`.

### Implementation for User Story 3

- [x] T020 [US3] Implement `cancelAppointment` in `apps/api/src/modules/appointments/appointments.service.ts` (allowed only from `PENDING`/`CONFIRMED`; writes `CANCELLED` + `cancellationReason`).
- [x] T021 [US3] Add the `cancelAppointment` mutation to `apps/api/src/modules/appointments/appointments.resolver.ts`.

**Checkpoint**: All user stories function independently.

---

## Phase 6: User Story 4 - Keep the quality gates green (Priority: P3)

**Goal**: API and workspace gates stay green with DB-free coverage.

**Independent Test**: The quickstart.md verification matrix passes without a live database.

- [x] T022 [US4] Run the API gates: `npm run build|typecheck|test -w @foundly/api` (existing health/tenants/services/specialists/availability + appointments specs green).
- [x] T023 [US4] Run the regression gates: `npm run build -w @foundly/book`, `npm run test -w @foundly/ui`, `npm run build|typecheck|test -w @foundly/database`.
- [x] T024 [US4] Execute the quickstart.md verification matrix (generate → build → manual appointment/status/cancel GraphQL scenarios with error codes).

**Checkpoint**: Full workspace green with the appointments module.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T025 [P] Verify the regenerated `apps/api/src/schema.gql` (code-first output incl. appointments) stays ephemeral/git-ignored; do not commit it.
- [x] T026 [P] Run Prettier (`npx prettier --write apps/api/src packages/database/prisma/schema.prisma` — skip `.prisma` parser, use `prisma format` if needed) and ESLint (`npm run lint`); resolve any findings.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately.
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories (schema field + client regeneration).
- **User Stories (Phase 3+)**: All depend on Foundational. US2/US3 extend the same module files as US1, so they run sequentially after US1.
- **Polish (Final Phase)**: Depends on all desired user stories being complete.

### User Story Dependencies

- **User Story 1 (P1)**: after Foundational; no other story needed.
- **User Story 2 (P2)**: after US1 (adds to the appointments service/resolver).
- **User Story 3 (P3)**: after US1 (adds to the appointments service/resolver).
- **User Story 4 (P3)**: depends on US1 + US2 + US3 complete.

### Within Each User Story

- Tests are written FIRST and must FAIL before implementation.
- Types before service; service before resolver; resolver before module; module before `app.module.ts` registration.
- Story complete before moving to the next priority.

### Parallel Opportunities

- T001/T002 (Setup) marked [P].
- T007/T008 (US1 tests) run in parallel; T009 (US1 types) is [P] parallel with the tests.
- T004 (schema test) is sequential to T003/T005/T006 (TDD red→green).
- Polish T025/T026 are [P].
- US1 files share appointments.service/resolver; US2/US3 extend the same files → sequential.

---

## Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together (write-first, expect red):
Task: "Unit tests apps/api/src/modules/appointments/appointments.service.spec.ts"
Task: "GraphQL e2e apps/api/src/modules/appointments/appointments.resolver.spec.ts"

# Launch the code-first types while tests are being drafted:
Task: "Define code-first GraphQL types in apps/api/src/modules/appointments/appointments.types.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 (Setup): T001–T002.
2. Complete Phase 2 (Foundational): T003–T006 (schema field + client regenerate — CRITICAL).
3. Complete Phase 3 (US1): T007–T013 (read + create appointments + DB-free tests).
4. **STOP and VALIDATE**: `npm run build|typecheck|test -w @foundly/api` green; manual appointment walkthrough.
5. This is the MVP slice: booking + agenda over GraphQL.

### Incremental Delivery

1. Setup + Foundational → `cancellationReason` + regenerated client ready.
2. Add User Story 1 → bookings + agenda (MVP). Test independently.
3. Add User Story 2 → status transitions. Test independently.
4. Add User Story 3 → cancellation with reason. Test independently.
5. Add User Story 4 → full gate matrix.
6. Each story adds value without breaking previous stories.

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together (T001–T006).
2. Once Foundational is done:
   - Developer A: User Story 1 (read + create).
   - Developer B then takes User Story 2 (status) after US1 merges (same files).
   - Developer C takes User Story 3 (cancel) after US1 merges.
3. Developer D: User Story 4 verification + Polish once all stories merge.

---

## Notes

- [P] tasks = different files, no dependencies.
- [Story] label maps the task to its user story for traceability.
- Each user story is independently completable and testable.
- Verify tests fail before implementing (T007, T008, T014, T015, T018, T019).
- Commit after each task or logical group; keep `schema.gql` and generated Prisma output out of git.
- Reuse the `003`/`004` fakes/patterns for DB-free mocking; the mock must include `cancellationReason`.
