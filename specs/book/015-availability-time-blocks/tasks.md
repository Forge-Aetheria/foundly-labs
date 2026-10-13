---
description: "Task list for Foundly Book — Availability Time Blocks (Admin + Public Booking)"
---

# Tasks: Foundly Book — Availability Time Blocks (Admin + Public Booking)

**Input**: Design documents from `/specs/book/015-availability-time-blocks/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/availability-blocks-ui.contract.md, quickstart.md

**Tests**: Included — the constitution (§3.I gates) and FR-011 require the module to be covered by automated tests.

**Depends on**: `specs/api/014-availability-time-blocks` (time-block surface + SDL snapshot).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: US1 · US2 · US3
- Every task includes an exact file path.

## Path Conventions

- Frontend: `apps/book/src/…`; codegen snapshot: `apps/book/codegen.schema.gql`.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Make the API surface available to codegen.

- [x] T001 Sync the versioned SDL snapshot from the API before generating types — `apps/book/codegen.schema.gql` (depends on API `014` T018)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Operations, generated types, schema, actions and hooks shared by the stories.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T002 [P] Create the block operations (`TimeBlocks($tenantId: ID, $tenantSlug: String, $specialistId: ID)` selecting `id tenantId specialistId startAt endAt reason`; `AddTimeBlock($input: AddTimeBlockInput!)`; `RemoveTimeBlock($id: ID!)`) in `apps/book/src/modules/availability/timeBlocks.graphql`
- [x] T003 Run `npm run codegen -w @foundly/book` to regenerate the documents/types in `apps/book/src/shared/api/generated.ts` (depends on T001, T002)
- [x] T004 [P] Add `timeBlockSchema` (zod): `date` required `YYYY-MM-DD`; `startTime`/`endTime` required `HH:mm` with `end > start`; `reason` optional ≤ 200 in `apps/book/src/modules/availability/utils/schemas.ts`
- [x] T005 [P] Implement `listTimeBlocks(tenantId)` (via `apiRequestAdmin`), `addTimeBlock(input)` and `removeTimeBlock(input)` Server Actions (validate → compose ISO instants → call the API → map to the domain `TimeBlock`) in `apps/book/src/modules/availability/actions.ts`
- [x] T006 [P] Add hooks `useListTimeBlocks` / `useAddTimeBlock` / `useRemoveTimeBlock` in `apps/book/src/modules/availability/hooks.ts`

**Checkpoint**: Data layer ready.

---

## Phase 3: User Story 1 - Manage real time blocks (Priority: P1) 🎯 MVP

**Goal**: `/admin/availability` lists the real blocks and lets the owner add/remove them.

**Independent Test**: Open `/admin/availability`; with blocks present they render; add a valid range → it persists and appears; remove it → it disappears; no blocks → clean empty state.

### Tests for User Story 1 ⚠️

- [x] T007 [P] [US1] Unit test `availability/actions` (listTimeBlocks maps blocks; addTimeBlock `VALIDATION_ERROR` on invalid range without an API call; add/remove happy path) in `apps/book/src/modules/availability/tests/actions.test.ts`
- [x] T008 [P] [US1] RTL test `AvailabilityEditor` (renders real blocks; add-block flow; invalid range blocks save; remove confirmation) with `hooks.ts` mocked in `apps/book/src/modules/availability/tests/AvailabilityEditor.test.tsx`

### Implementation for User Story 1

- [x] T009 [US1] Update the server view to also read the blocks (`listAvailabilityRules(tenantId)` + `listTimeBlocks(tenantId)`, passing `rules`, `blocks`, `error`) in `apps/book/src/modules/availability/AvailabilityView.tsx`
- [x] T010 [US1] Update `AvailabilityEditor` to list the real blocks (start/end, optional reason) with a removal action (confirmation) and an add form (date + start/end + optional reason) consuming only `hooks.ts`, keeping the weekly configuration, with a clean empty state and `ApiErrorDialog` for transient failures in `apps/book/src/modules/availability/components/AvailabilityEditor.tsx`

**Checkpoint**: User Story 1 works with real data (MVP).

---

## Phase 4: User Story 2 - Blocked slots stop being bookable (Priority: P2)

**Goal**: The public booking flow excludes intervals covered by blocks.

**Independent Test**: Add a block covering an available slot, open the public booking flow for that day/specialist and confirm the slot is not offered; remove the block and confirm it becomes available again.

### Tests for User Story 2 ⚠️

- [x] T011 [P] [US2] Extend the public-booking test to cover block exclusion (a `TimeBlocks` mock whose interval removes the slot; specialist blocks apply to that specialist; business-wide apply to all) in `apps/book/src/modules/public-booking/tests/actions.test.ts`

### Implementation for User Story 2

- [x] T012 [US2] In `fetchOfferedSlots`, fetch the blocks (public `TimeBlocks` by slug + `resourceId`), map them to the `computeAvailability` block input, and pass them instead of the hardcoded `blocks: []` (business-wide + specialist) in `apps/book/src/modules/public-booking/actions.ts`

**Checkpoint**: User Stories 1 and 2 both work.

---

## Phase 5: User Story 3 - A session-safe, modular implementation (Priority: P2)

**Goal**: The availability module follows the canonical structure and routes session failures globally.

**Independent Test**: The module has `timeBlocks.graphql`/`actions.ts`/`hooks.ts`; the UI never imports the transport or Server Actions; an expired session on a block read/write routes to the global sign-in flow.

### Tests for User Story 3 ⚠️

- [x] T013 [P] [US3] Test that block actions route `UNAUTHENTICATED` through the session-aware transport (session handled globally) and never return raw provider text in `apps/book/src/modules/availability/tests/actions.test.ts`

### Implementation for User Story 3

- [x] T014 [US3] Verify/enforce that block data access uses `apiRequestAdmin` (no raw `apiRequest`/token handling) and that no view renders raw inline error copy (transient → `ApiErrorDialog`, validation → inline fields) across `apps/book/src/modules/availability/actions.ts`, `apps/book/src/modules/availability/components/AvailabilityEditor.tsx`

**Checkpoint**: All user stories are independently functional and session-safe.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [x] T015 Update `apps/book/README.md` to reflect that availability blocks are now backend-backed (admin + public exclusion), referencing `specs/book/015-availability-time-blocks`
- [x] T016 Run and pass book gates: `npm run test -w @foundly/book`, `npm run typecheck -w @foundly/book`, `npm run lint -w @foundly/book`, `npm run build -w @foundly/book` — `apps/book/package.json`
- [x] T017 Execute the `quickstart.md` scenarios (admin add/persist/remove; public slot excluded/restored; session safety) and confirm the expected outcomes — `specs/book/015-availability-time-blocks/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: depends on the API feature `014` producing the SDL.
- **Foundational (Phase 2)**: after Setup — BLOCKS all user stories.
- **US1 (Phase 3)** and **US2 (Phase 4)**: after Foundational; independent files.
- **US3 (Phase 5)**: after Foundational — validates the data layer built in Foundational + US1.
- **Polish (Phase 6)**: after the desired stories.

### User Story Dependencies

- **US1 (P1)**: after Foundational — no dependency on other stories.
- **US2 (P2)**: after Foundational — independent (public path uses the generated `TimeBlocksDocument`).
- **US3 (P2)**: after Foundational — validates actions/UI.

### Parallel Opportunities

- T002, T004, T005, T006 are `[P]` (different files).
- Test tasks are `[P]` (different files): T007/T008, T011, T013.

---

## Parallel Example: Foundational

```bash
# Launch the Foundational files together (different files):
Task: "Create timeBlocks.graphql in apps/book/src/modules/availability/timeBlocks.graphql"
Task: "Add timeBlockSchema in apps/book/src/modules/availability/utils/schemas.ts"
Task: "Implement actions.ts in apps/book/src/modules/availability/actions.ts"
Task: "Add hooks.ts in apps/book/src/modules/availability/hooks.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1)

1. Phase 1 Setup (snapshot sync) → Phase 2 Foundational.
2. Phase 3 (US1) → validate `/admin/availability` with real blocks.
3. Then US2 (public exclusion) and US3 (session-safety).

### Incremental Delivery

1. Setup + Foundational → data layer ready.
2. US1 → the owner manages real blocks.
3. US2 → blocks affect public bookability.
4. US3 → session safety verified.
5. Phase 6 → docs updated + gates green.

---

## Notes

- `[P]` = different files, no dependencies.
- Constraint values quoted from `data-model.md` (`end` strictly after `start`; required `date`/`startTime`/`endTime`; `reason` ≤ 200).
- Depends on the API feature `specs/api/014-availability-time-blocks` for the GraphQL surface and the SDL snapshot.
