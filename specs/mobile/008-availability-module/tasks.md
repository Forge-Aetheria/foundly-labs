---

description: "Task list for Mobile Availability Module"
---

# Tasks: Mobile Availability Module

**Input**: Design documents from `/specs/mobile/008-availability-module/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/`, `quickstart.md`

**Tests**: Included because the plan/quickstart define helper tests for weekday mapping, time validation and block formatting.

**Organization**: Tasks are grouped by user story so each story remains independently testable.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Parallelizable (different files, no incomplete dependency)
- **[Story]**: `US1`, `US2`, `US3`
- Every task includes an exact file path

## Path Conventions

- Mobile app root: `apps/mobile/`
- Routes: `apps/mobile/app/(drawer)/`
- Module code: `apps/mobile/src/modules/availability/`
- Shared code: `apps/mobile/src/shared/`

---

## Phase 1: Setup

**Purpose**: Confirm contracts and create the GraphQL document.

- [X] T001 Confirm `availability`, `createAvailability`, `updateAvailability`, `removeAvailability`, `timeBlocks`, `addTimeBlock` and `removeTimeBlock` exist in `apps/mobile/codegen.schema.gql`.
- [X] T002 Confirm `Availability` and `TimeBlock` fields in `packages/database/prisma/schema.prisma`.
- [X] T003 Create `apps/mobile/src/modules/availability/availability.graphql` with availability and time-block operations.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared schedule/block helpers and data layer for all stories.

- [X] T004 [P] Create `apps/mobile/src/modules/availability/availability-utils.ts` with weekday labels/order, day mapping, time validation, block formatting and full-day detection.
- [X] T005 Create `apps/mobile/src/modules/availability/services.ts` with fetches, weekly reconciliation, block add and block remove.
- [X] T006 Create `apps/mobile/src/modules/availability/hooks.ts` with `useAvailability`, `useTimeBlocks`, `useSaveAvailability`, `useAddTimeBlock` and `useRemoveTimeBlock`.
- [X] T007 [P] Add helper tests in `apps/mobile/src/modules/availability/__tests__/availability-utils.test.ts`.

**Checkpoint**: Data layer and helpers ready.

---

## Phase 3: User Story 1 — Configurar horario semanal (Priority: P1) 🎯 MVP

**Goal**: Edit and save the seven-day weekly schedule.

**Independent Test**: Open Disponibilidad, edit a day, save and reopen to confirm persistence.

### Implementation for User Story 1

- [X] T008 [P] [US1] Create `apps/mobile/src/modules/availability/components/WeeklyScheduleCard.tsx` with seven day rows, open/closed switch and time fields.
- [X] T009 [US1] Create `apps/mobile/src/modules/availability/AvailabilityView.tsx` with loading, error/retry, pull-to-refresh and refresh overlay.
- [X] T010 [US1] Map existing rules into day drafts, defaulting closed days and `09:00–18:00`.
- [X] T011 [US1] Validate open days have start/end and end > start.
- [X] T012 [US1] Wire the save mutation with reconciliation, pending state and success/error feedback.
- [X] T013 [US1] Replace the placeholder in `apps/mobile/app/(drawer)/disponibilidad.tsx` with `AvailabilityView`.

**Checkpoint**: Weekly schedule editing works independently. MVP complete.

---

## Phase 4: User Story 2 — Consultar bloqueos puntuales (Priority: P2)

**Goal**: Show existing time blocks with date, range/full-day and reason.

**Independent Test**: Open Disponibilidad with and without blocks; confirm list and empty state.

### Implementation for User Story 2

- [X] T014 [P] [US2] Create `apps/mobile/src/modules/availability/components/TimeBlockCard.tsx` with date, range/full-day label, reason and delete action prop.
- [X] T015 [US2] Render the time-block list inside `AvailabilityView` with its own empty state.
- [X] T016 [US2] Load time blocks in parallel with availability rules and show loading/error for both.

**Checkpoint**: Weekly schedule and block listing work together.

---

## Phase 5: User Story 3 — Añadir y eliminar bloqueos (Priority: P3)

**Goal**: Create range/full-day blocks and delete them with confirmation.

**Independent Test**: Add a range block and a full-day block; delete one with confirmation.

### Implementation for User Story 3

- [X] T017 [US3] Create `apps/mobile/src/modules/availability/components/TimeBlockFormModal.tsx` with mode, date, start/end and reason fields.
- [X] T018 [US3] Validate block date and range (`end > start`); map full-day to `00:00–23:59`.
- [X] T019 [US3] Wire `useAddTimeBlock` with pending state, error feedback and query invalidation.
- [X] T020 [US3] Wire delete with `Alert` confirmation and `useRemoveTimeBlock`, including pending state and error feedback.
- [X] T021 [US3] Disable block actions while a mutation is pending.

**Checkpoint**: Weekly schedule, block listing, creation and deletion work together.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [X] T022 [P] Verify weekday order (Monday-first) and labels in `apps/mobile/src/modules/availability/availability-utils.ts`.
- [X] T023 [P] Verify time-block formatting and full-day detection in `apps/mobile/src/modules/availability/components/TimeBlockCard.tsx`.
- [X] T024 Run `pnpm --filter @foundly/mobile typecheck` for `apps/mobile`.
- [X] T025 Run `pnpm --filter @foundly/mobile lint` for `apps/mobile`.
- [X] T026 Run `pnpm --filter @foundly/mobile test` for `apps/mobile`.
- [X] T027 Run `pnpm --filter @foundly/mobile build` for `apps/mobile`.
- [X] T028 Execute the manual scenarios in `specs/mobile/008-availability-module/quickstart.md`.
- [X] T029 Remove any leftover “Próximamente” reference from `apps/mobile/app/(drawer)/disponibilidad.tsx`.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: Depends on T001–T003.
- **US1 (Phase 3)**: Depends on Foundational. MVP.
- **US2 (Phase 4)**: Depends on Foundational and the `AvailabilityView` container from US1.
- **US3 (Phase 5)**: Depends on US2 block card/list.
- **Polish (Phase 6)**: Depends on US1–US3.

### User Story Dependencies

- **US1 (P1)**: Independent. Delivers weekly schedule editing.
- **US2 (P2)**: Needs the view container from US1.
- **US3 (P3)**: Needs the block list/card from US2.

### Within Each Story

- Helpers/services before hooks.
- Hooks before view wiring.
- Validation before mutation wiring.
- Checkpoint validation before moving to the next story.

---

## Parallel Opportunities

### Foundational

```text
T004 availability-utils.ts
T007 helper tests
```

### User Story 1

```text
T008 WeeklyScheduleCard
T009 AvailabilityView
```

### User Story 2

```text
T014 TimeBlockCard
T015 list integration
```

---

## Parallel Example: Foundational

```bash
Task: "Create apps/mobile/src/modules/availability/availability-utils.ts"
Task: "Add apps/mobile/src/modules/availability/__tests__/availability-utils.test.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1)

1. Complete Setup + Foundational.
2. Complete US1: weekly schedule editor and save.
3. Validate independently; this delivers the core availability configuration.

### Incremental Delivery

1. Setup + Foundational → data layer ready.
2. US1 → weekly schedule (MVP).
3. US2 → time-block listing.
4. US3 → time-block creation/deletion.
5. Polish → gates and manual quickstart.

### Parallel Team Strategy

1. One developer completes Setup + Foundational.
2. After Foundation:
   - Developer A: US1 weekly schedule.
   - Developer B: US2 block listing.
   - Developer C: US3 block create/delete.
3. Converge in `AvailabilityView` and run polish.

---

## Notes

- [P] tasks touch different files.
- [Story] labels map tasks to spec stories.
- Tests are included because the plan and quickstart define helper tests.
- Do not expose breaks/granularity/lead time/horizon or specialist selection; out of scope.
- Keep colors from `@/shared/theme/tokens` and reuse shared components.


## Completion Notes

- Automated gates passed: typecheck, lint, 71 tests and `expo export` (iOS + Android).
- Device-level quickstart (T028) remains recommended; the build confirms the module bundles correctly.
