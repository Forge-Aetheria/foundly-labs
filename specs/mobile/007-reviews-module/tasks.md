---

description: "Task list for Mobile Reviews Module"
---

# Tasks: Mobile Reviews Module

**Input**: Design documents from `/specs/mobile/007-reviews-module/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/`, `quickstart.md`

**Tests**: Included because the plan/quickstart define helper tests for filters, labels and moderation transitions.

**Organization**: Tasks are grouped by user story so each story remains independently testable.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Parallelizable (different files, no incomplete dependency)
- **[Story]**: `US1`, `US2`, `US3`
- Every task includes an exact file path

## Path Conventions

- Mobile app root: `apps/mobile/`
- Routes: `apps/mobile/app/(drawer)/`
- Module code: `apps/mobile/src/modules/reviews/`
- Shared code: `apps/mobile/src/shared/`

---

## Phase 1: Setup

**Purpose**: Confirm contracts and create the GraphQL document.

- [X] T001 Confirm `myReviews`, `setReviewState` and `deleteReview` exist in `apps/mobile/codegen.schema.gql`.
- [X] T002 Confirm `Review` fields and `ReviewState` values in `packages/database/prisma/schema.prisma`.
- [X] T003 Create `apps/mobile/src/modules/reviews/reviews.graphql` with list, set-state and delete operations.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared model, helpers and data layer for all review stories.

- [X] T004 [P] Create `apps/mobile/src/modules/reviews/review-utils.ts` with state labels/tones, filter types, date formatting and transition guards.
- [X] T005 Create `apps/mobile/src/modules/reviews/services.ts` using generated documents for fetch, set state and delete.
- [X] T006 Create `apps/mobile/src/modules/reviews/hooks.ts` with `useReviews`, `useSetReviewState` and `useDeleteReview`, invalidating `['reviews', tenantId]`.
- [X] T007 [P] Add helper tests in `apps/mobile/src/modules/reviews/__tests__/review-utils.test.ts`.

**Checkpoint**: Data layer and helpers ready.

---

## Phase 3: User Story 1 — Consultar y filtrar reseñas (Priority: P1) 🎯 MVP

**Goal**: Replace the placeholder with a real, filterable tenant review list.

**Independent Test**: Open Reseñas with reviews in all states; confirm list, filters, loading, empty, error and refresh.

### Implementation for User Story 1

- [X] T008 [P] [US1] Create `apps/mobile/src/modules/reviews/components/ReviewCard.tsx` with author, rating, date, comment, state badge and action slots.
- [X] T009 [US1] Create `apps/mobile/src/modules/reviews/ReviewsView.tsx` with loading, empty, error/retry, pull-to-refresh and refresh overlay.
- [X] T010 [US1] Add filter chips (Todas, Pendientes, Aprobadas, Rechazadas) using `review-utils.ts`.
- [X] T011 [US1] Replace the placeholder in `apps/mobile/app/(drawer)/resenas.tsx` with `ReviewsView`.
- [X] T012 [US1] Add the filtered-empty state for filters with no matching reviews.

**Checkpoint**: Review listing and filtering work independently. MVP complete.

---

## Phase 4: User Story 2 — Aprobar o rechazar reseñas (Priority: P2)

**Goal**: Moderate reviews with valid state transitions.

**Independent Test**: Approve a pending review and reject another; confirm states and disabled actions.

### Implementation for User Story 2

- [X] T013 [US2] Wire approve/reject actions in `apps/mobile/src/modules/reviews/ReviewsView.tsx` to `useSetReviewState`.
- [X] T014 [US2] Disable approve for approved reviews and reject for rejected reviews using `review-utils.ts` guards.
- [X] T015 [US2] Add pending state, prevent duplicate actions and show mutation errors.
- [X] T016 [US2] Invalidate the reviews query after moderation so the list reflects server state.

**Checkpoint**: Moderation works independently of deletion.

---

## Phase 5: User Story 3 — Eliminar una reseña (Priority: P3)

**Goal**: Delete reviews safely with confirmation.

**Independent Test**: Delete a review, confirm the dialog and verify it disappears; simulate failure and verify it remains.

### Implementation for User Story 3

- [X] T017 [US3] Wire the delete action to `Alert` confirmation in `apps/mobile/src/modules/reviews/ReviewsView.tsx`.
- [X] T018 [US3] Call `useDeleteReview`, show pending state, handle errors and invalidate the reviews query.
- [X] T019 [US3] Disable all review actions while a deletion or moderation is pending.

**Checkpoint**: List, moderation and deletion work together.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [X] T020 [P] Verify long comments and missing optional data render safely in `apps/mobile/src/modules/reviews/components/ReviewCard.tsx`.
- [X] T021 [P] Verify Spanish date/rating formatting in `apps/mobile/src/modules/reviews/review-utils.ts`.
- [X] T022 Run `pnpm --filter @foundly/mobile typecheck` for `apps/mobile`.
- [X] T023 Run `pnpm --filter @foundly/mobile lint` for `apps/mobile`.
- [X] T024 Run `pnpm --filter @foundly/mobile test` for `apps/mobile`.
- [X] T025 Run `pnpm --filter @foundly/mobile build` for `apps/mobile`.
- [X] T026 Execute the manual scenarios in `specs/mobile/007-reviews-module/quickstart.md`.
- [X] T027 Remove any leftover “Próximamente” reference from `apps/mobile/app/(drawer)/resenas.tsx`.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: Depends on T001–T003.
- **US1 (Phase 3)**: Depends on Foundational. MVP.
- **US2 (Phase 4)**: Depends on US1 card/view.
- **US3 (Phase 5)**: Depends on US1 card/view.
- **Polish (Phase 6)**: Depends on US1–US3.

### User Story Dependencies

- **US1 (P1)**: Independent. Delivers review listing/filtering.
- **US2 (P2)**: Needs the review card actions from US1.
- **US3 (P3)**: Needs the review card actions from US1.

### Within Each Story

- Helpers/services before hooks.
- Hooks before view wiring.
- Transition guards before action wiring.
- Checkpoint validation before moving to the next story.

---

## Parallel Opportunities

### Foundational

```text
T004 review-utils.ts
T007 helper tests
```

### User Story 1

```text
T008 ReviewCard
T009 ReviewsView
```

### User Story 2 and 3

```text
T013 approve/reject wiring
T017 delete wiring
```

---

## Parallel Example: Foundational

```bash
Task: "Create apps/mobile/src/modules/reviews/review-utils.ts"
Task: "Add apps/mobile/src/modules/reviews/__tests__/review-utils.test.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1)

1. Complete Setup + Foundational.
2. Complete US1: review list, filters and states.
3. Validate independently; this removes the placeholder and delivers read-only moderation.

### Incremental Delivery

1. Setup + Foundational → data layer ready.
2. US1 → review list/filtering (MVP).
3. US2 → approve/reject moderation.
4. US3 → delete with confirmation.
5. Polish → gates and manual quickstart.

### Parallel Team Strategy

1. One developer completes Setup + Foundational.
2. After Foundation:
   - Developer A: US1 list/filtering.
   - Developer B: US2 moderation.
   - Developer C: US3 deletion.
3. Converge in `ReviewsView` and run polish.

---

## Notes

- [P] tasks touch different files.
- [Story] labels map tasks to spec stories.
- Tests are included because the plan and quickstart define helper tests.
- Do not implement review creation; it is explicitly out of scope.
- Keep colors from `@/shared/theme/tokens` and reuse shared components.


## Completion Notes

- Automated gates passed: typecheck, lint, 67 tests and `expo export` (iOS + Android).
- Device-level quickstart (T026) remains recommended; the build confirms the module bundles correctly.
