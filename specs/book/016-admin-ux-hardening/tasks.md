---
description: "Task list for Foundly Book — Admin UX Hardening (Toasts, Loading, Moderation, Image Rules, Orphan Actions)"
---

# Tasks: Foundly Book — Admin UX Hardening

**Input**: Design documents from `/specs/book/016-admin-ux-hardening/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/admin-ux.contract.md, quickstart.md

**Tests**: Included — the constitution (§3.I gates) and FR-013 require automated coverage (RTL + vitest-axe + action tests).

**Depends on**: `specs/api/015-review-moderation` (moderation surface + SDL snapshot) for US3 only.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: US1 (toasts) · US2 (loading/double-submit) · US3 (moderation) · US4 (image rules) · US5 (orphan actions)
- Every task includes an exact file path.

## Path Conventions

- Frontend: `apps/book/src/…`; codegen snapshot: `apps/book/codegen.schema.gql`; tests in each module's `tests/`.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Make the API `015` moderation surface available to codegen.

- [x] T001 Sync the versioned SDL snapshot from the API and regenerate types (`npm run codegen -w @foundly/book`) — `apps/book/codegen.schema.gql`, `apps/book/src/shared/api/generated.ts` (depends on API `015` T020)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The cross-cutting toast system, async-action helper and navigation shared by the stories.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T002 [P] Create the client `ToastProvider` + `useToast()` with four semantic kinds, auto-dismiss, dismiss control and an `aria-live` region using `@foundly/ui` tokens — `apps/book/src/shared/components/Toaster.tsx`
- [x] T003 [P] Create the `useAsyncAction()` pending/double-submit helper (re-entrancy guard + error routing) — `apps/book/src/shared/hooks/useAsyncAction.ts`
- [x] T004 Mount `<ToastProvider>` at the app boundary so toasts are available across the panel and public portal — `apps/book/src/app/layout.tsx`
- [x] T005 [P] Add the "Reseñas" item to the primary admin navigation — `apps/book/src/shared/components/AdminNavigation.ts`

**Checkpoint**: Toasts + async helper available.

---

## Phase 3: User Story 1 - Consistent floating notifications (Priority: P1)

**Goal**: Every success/validation/info/error event is surfaced with the correct semantic color.

**Independent Test**: Trigger a successful save (green), a validation error (yellow), an info event (blue) and an API/connection failure (red); each toast is dismissible, accessible and auto-hides.

### Tests for User Story 1 ⚠️

- [x] T006 [P] [US1] RTL test `Toaster`: renders each kind with the right role/`aria-live`, dismisses on click, auto-hides after the delay — `apps/book/src/shared/components/tests/Toaster.test.tsx`

### Implementation for User Story 1

- [x] T007 [US1] Wire success/validation/error toasts into the gallery, staff, services, agenda, profile and review surfaces (validation stays inline; toast is complementary) — `apps/book/src/modules/gallery/components/GalleryManager.tsx`, `apps/book/src/modules/staff/components/StaffManager.tsx`, `apps/book/src/modules/services/components/ServiceCatalog.tsx`, `apps/book/src/modules/agenda/components/Agenda.tsx`, `apps/book/src/modules/profile/components/ProfileEditor.tsx`, `apps/book/src/modules/reviews/components/ReviewForm.tsx`

**Checkpoint**: US1 works across the app.

---

## Phase 4: User Story 2 - Loading state and double-submit prevention (Priority: P1)

**Goal**: Every create/edit form disables its submit while in flight, closes on success and revalidates.

**Independent Test**: Click each submit repeatedly; the button disables on the first click, shows a pending state, only one request is sent, and on success the modal closes and the list refreshes.

### Tests for User Story 2 ⚠️

- [x] T008 [P] [US2] RTL test the gallery add modal: rapid clicks send one request; pending disables the button; success closes + refreshes — `apps/book/src/modules/gallery/tests/GalleryManager.test.tsx`
- [x] T009 [P] [US2] RTL test the add-professional modal for the same guarantees — `apps/book/src/modules/staff/tests/StaffManager.test.tsx`
- [x] T010 [P] [US2] RTL test the service create modal and the appointment modal for the same guarantees — `apps/book/src/modules/services/tests/ServiceCatalog.test.tsx`, `apps/book/src/modules/agenda/tests/Agenda.test.tsx`

### Implementation for User Story 2

- [x] T011 [US2] Add the pending/disable guard, success auto-close and `router.refresh()` revalidation to the gallery add modal (replace the optimistic local list mutation) — `apps/book/src/modules/gallery/components/GalleryManager.tsx`
- [x] T012 [P] [US2] Same hardening for the add-professional modal — `apps/book/src/modules/staff/components/StaffManager.tsx`
- [x] T013 [P] [US2] Same hardening for the appointment create modal (see also US5) — `apps/book/src/modules/agenda/components/Agenda.tsx`
- [x] T014 [P] [US2] Same hardening for the service create modal (see also US5) — `apps/book/src/modules/services/components/ServiceCatalog.tsx`
- [x] T015 [US2] Verify the already-hardened surfaces (review form, profile editor, availability editor, auth) keep the pending/revalidate behavior — `apps/book/src/modules/reviews/components/ReviewForm.tsx`, `apps/book/src/modules/profile/components/ProfileEditor.tsx`

**Checkpoint**: US2 works across all forms.

---

## Phase 5: User Story 3 - Moderate reviews from the panel (Priority: P1) — depends on API 015

**Goal**: `/admin/reviews` lists the business's reviews (pending flagged) and approves/rejects/deletes them.

**Independent Test**: Open `/admin/reviews`; pending reviews are flagged; approve → public; reject/delete → not public; filter by state; failures surface cleanly.

### Tests for User Story 3 ⚠️

- [x] T016 [P] [US3] Action tests: `listMyReviews` maps `state`; `setReviewState` `VALIDATION_ERROR` on `pending` without an API call; approve/reject/delete happy path; `UNAUTHENTICATED` returned unchanged — `apps/book/src/modules/reviews/tests/actions.test.ts`
- [x] T017 [P] [US3] RTL test `ReviewModerationList`: pending flag, state filter, approve/reject, delete confirmation, empty state, `vitest-axe` clean — `apps/book/src/modules/reviews/tests/ReviewModerationList.test.tsx`

### Implementation for User Story 3

- [x] T018 [P] [US3] Add the moderation operations (`MyReviews($state)`, `SetReviewState($id, $state)`, `DeleteReview($id)`) — `apps/book/src/modules/reviews/reviews.graphql`
- [x] T019 [P] [US3] Add `setReviewStateSchema` / `deleteReviewSchema` (zod) — `apps/book/src/modules/reviews/utils/schemas.ts`
- [x] T020 [US3] Implement `listMyReviews` / `setReviewState` / `deleteReview` (via `apiRequestAdmin`, map API → domain `Review` incl. `state`) and extend `ReviewState`/`state` on the domain type — `apps/book/src/modules/reviews/actions.ts`, `apps/book/src/shared/types/tenancy.ts`
- [x] T021 [P] [US3] Add `useFetchMyReviews` / `useSetReviewState` / `useDeleteReview` — `apps/book/src/modules/reviews/hooks.ts`
- [x] T022 [US3] Create the client `ReviewModerationList` (pending flag, state filter, approve/reject, delete confirmation, empty state, toasts, `ApiErrorDialog`) — `apps/book/src/modules/reviews/components/ReviewModerationList.tsx`
- [x] T023 [US3] Create the server `ModerationView` (resolve tenant → `listMyReviews`, pass reviews/error) and the thin route — `apps/book/src/modules/reviews/ModerationView.tsx`, `apps/book/src/app/admin/reviews/page.tsx`

**Checkpoint**: Moderation works end-to-end with API `015`.

---

## Phase 6: User Story 4 - Image dimension rules for the profile (Priority: P2)

**Goal**: Logo (square) and cover (banner) rules are documented and enforced when measurable.

**Independent Test**: A measurable non-compliant image blocks the save with an inline error; a compliant one is previewed and saved; an unmeasurable one degrades to guidance.

### Tests for User Story 4 ⚠️

- [x] T024 [P] [US4] Unit test `image-rules` (`checkImage` blocks on aspect violation, allows within tolerance, returns guidance when unmeasurable) — `apps/book/src/modules/profile/tests/image-rules.test.ts`
- [x] T025 [P] [US4] RTL test `ProfileEditor`: shows the recommended dimensions; blocks a non-compliant logo with an inline error; saves a compliant image; `vitest-axe` clean — `apps/book/src/modules/profile/tests/ProfileEditor.test.tsx`

### Implementation for User Story 4

- [x] T026 [US4] Create the image rules + `measureImage`/`checkImage` helper (avatar 1:1 512×512; cover 3:1 1200×400; ±2% tolerance) — `apps/book/src/modules/profile/utils/image-rules.ts`
- [x] T027 [US4] Update `ProfileEditor` to show the recommended dimensions/aspect, validate on save, block non-compliant measurable images inline and show guidance otherwise — `apps/book/src/modules/profile/components/ProfileEditor.tsx`

**Checkpoint**: US4 works.

---

## Phase 7: User Story 5 - Enable the orphan actions (agenda + services) (Priority: P1)

**Goal**: "Crear servicio" and "Nueva cita" complete end-to-end (persisted + reflected).

**Independent Test**: Create a service → appears in the admin catalog and on the public page; create an appointment → appears in the agenda; both show a success toast and a pending button.

### Tests for User Story 5 ⚠️

- [x] T028 [P] [US5] Action tests `services`: `createService` validates with `serviceSchema`, calls `CreateMyServiceDocument`; delete happy path — `apps/book/src/modules/services/tests/actions.test.ts`
- [x] T029 [P] [US5] Action test `agenda`: `createAppointment` composes an offset ISO `startAt` and does not fail validation — `apps/book/src/modules/agenda/tests/actions.test.ts`
- [x] T030 [P] [US5] RTL test `ServiceCatalog` create flow (persists, closes, refreshes, toast) — `apps/book/src/modules/services/tests/ServiceCatalog.test.tsx`

### Implementation for User Story 5

- [x] T031 [P] [US5] Add `serviceSchema` — `apps/book/src/modules/services/utils/schemas.ts`
- [x] T032 [US5] Implement `createService` / `updateService` / `deleteService` (via `apiRequestAdmin`) — `apps/book/src/modules/services/actions.ts`
- [x] T033 [P] [US5] Add `hooks.ts` (`useCreateService` / `useUpdateService` / `useDeleteService`) — `apps/book/src/modules/services/hooks.ts`
- [x] T034 [US5] Replace the placeholder modal in `ServiceCatalog` with the real create form + delete confirmation (pending, close, refresh, toast) — `apps/book/src/modules/services/components/ServiceCatalog.tsx`
- [x] T035 [US5] Fix `Agenda.tsx` `saveCreate` to compose an offset ISO `startAt` (`new Date(\`${date}T${time}:00\`).toISOString()`) and add the pending/close/refresh/toast behavior — `apps/book/src/modules/agenda/components/Agenda.tsx`

**Checkpoint**: US5 works end-to-end.

---

## Phase 8: Polish & Cross-Cutting Concerns

- [x] T036 Update `apps/book/README.md` to document the toast system, moderation surface, image rules and the enabled orphan actions, referencing `specs/book/016-admin-ux-hardening`
- [x] T037 Run and pass book gates: `npm run test -w @foundly/book`, `npm run typecheck -w @foundly/book`, `npm run lint -w @foundly/book`, `npm run build -w @foundly/book` — `apps/book/package.json`
- [ ] T038 Execute the `quickstart.md` scenarios and confirm the expected outcomes — `specs/book/016-admin-ux-hardening/quickstart.md` (scenarios 3/5 need the live API + DB; automated gates covered by T037)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: depends on the API feature `015` producing the SDL.
- **Foundational (Phase 2)**: after Setup — BLOCKS all user stories.
- **US1/US2/US4/US5**: after Foundational; independent files (US5 touches services/agenda, also hardened by US2 tasks T013/T014).
- **US3 (Phase 5)**: after Foundational + Setup (needs the regenerated moderation documents).
- **Polish (Phase 8)**: after the desired stories.

### User Story Dependencies

- **US1 (P1)**: after Foundational — the toast system.
- **US2 (P1)**: after Foundational — independent per form.
- **US3 (P1)**: after Setup + Foundational — depends on API `015`.
- **US4 (P2)**: after Foundational — independent (profile module).
- **US5 (P1)**: after Foundational — independent (services/agenda modules).

### Parallel Opportunities

- T002, T003, T005 are `[P]`.
- Test tasks are `[P]` within a story (different files).
- After Foundational, US1/US2/US4/US5 can proceed in parallel by module; US3 starts once codegen is ready.

---

## Implementation Strategy

### MVP First (US1 + US2 + US5)

1. Phase 1 Setup → Phase 2 Foundational.
2. US1 (toasts) + US2 (loading) + US5 (orphan actions) → the visible UX wins with no API dependency.
3. US4 (image rules).
4. US3 (moderation) once API `015` lands.

### Incremental Delivery

1. Setup + Foundational → toaster + async helper + nav.
2. US1/US2 → consistent feedback + no duplicate submits.
3. US5 → the orphan buttons work.
4. US4 → image rules.
5. US3 → moderation (backend-dependent).
6. Phase 8 → docs updated + gates green.

---

## Notes

- `[P]` = different files, no dependencies.
- Constitution §5.VI: UI calls only `hooks.ts`; codegen-only DTOs; `actions.ts` is the single API door per module.
- RSC boundary: client components receive only serializable props.
- US3 depends on `specs/api/015-review-moderation` (moderation operations + SDL snapshot).
