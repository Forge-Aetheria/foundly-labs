---
description: "Task list for Foundly Book — Advance Payments, Booking Calendar & Agenda Control"
---

# Tasks: Foundly Book — Advance Payments, Booking Calendar & Agenda Control

**Input**: Design documents from `/specs/book/017-advance-payments-booking/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/advance-payments-booking.contract.md, quickstart.md

**Tests**: Included — the constitution (§3.I gates) and FR-013 require automated coverage (RTL + vitest-axe + action tests).

**Depends on**: `specs/api/016-advance-payments` (payments + appointment advance/controls + SDL snapshot).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: US1 (config) · US2 (calendar) · US3 (advance step) · US4 (agenda range) · US5 (status actions) · US6 (detail advance)
- Every task includes an exact file path.

## Path Conventions

- Frontend: `apps/book/src/…`; codegen snapshot: `apps/book/codegen.schema.gql`; tests in each module's `tests/`.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Make the API `016` surface available to codegen.

- [x] T001 Sync the versioned SDL snapshot from the API and regenerate types (`npm run codegen -w @foundly/book`) — `apps/book/codegen.schema.gql`, `apps/book/src/shared/api/generated.ts` (depends on API `016` T028)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared domain types and the advance-field plumbing consumed by several stories.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T002 [P] Create the payments domain types (`PaymentMethodType`, `AdvanceKind`, `PaymentMethod`, `AdvancePayment`, labels/order) — `apps/book/src/shared/types/payments.ts`
- [x] T003 [P] Extend `Service` (advance rule) and `Appointment` (`payment`, `notifications`) domain types — `apps/book/src/shared/types/appointments.ts`
- [x] T004 Add the advance fields to the public service reads and map them onto `PublicService` — `apps/book/src/shared/tenancy/tenancy.graphql`, `apps/book/src/modules/public-booking/actions.ts`, `apps/book/src/modules/public-booking/utils/types.ts`

**Checkpoint**: Shared types available; the portal can see the advance rule.

---

## Phase 3: User Story 1 - Configure the business payment methods (Priority: P1) 🎯 MVP

**Goal**: `/admin/configuracion` edits the three methods (details/instructions/active) end-to-end.

**Independent Test**: Enable a method, fill details, save; reload and confirm persistence; disable and confirm it is no longer public.

### Tests for User Story 1 ⚠️

- [x] T005 [P] [US1] Action tests `configuration`: `listPaymentMethods` maps DTOs; `upsertPaymentMethod` validates with `paymentMethodSchema`; `deletePaymentMethod` happy path; `UNAUTHENTICATED` returned unchanged — `apps/book/src/modules/configuration/tests/actions.test.ts`
- [x] T006 [P] [US1] RTL test `PaymentsConfig`: renders the three methods, toggles active, saves, empty/error states, `vitest-axe` clean — `apps/book/src/modules/configuration/tests/PaymentsConfig.test.tsx`

### Implementation for User Story 1

- [x] T007 [P] [US1] Add the configuration operations (`MyPaymentMethods`, `UpsertPaymentMethod`, `DeletePaymentMethod`, `PublicPaymentMethods`) — `apps/book/src/modules/configuration/configuration.graphql`
- [x] T008 [P] [US1] Add `paymentMethodSchema` (type enum, label/details/instructions, active) — `apps/book/src/modules/configuration/utils/schemas.ts`
- [x] T009 [US1] Implement `listPaymentMethods`/`upsertPaymentMethod`/`deletePaymentMethod`/`listPublicPaymentMethods` (via `apiRequestAdmin`/`apiRequest`, map API → domain) — `apps/book/src/modules/configuration/actions.ts`
- [x] T010 [P] [US1] Add `useFetchPaymentMethods`/`useUpsertPaymentMethod`/`useDeletePaymentMethod` — `apps/book/src/modules/configuration/hooks.ts`
- [x] T011 [US1] Create the client `PaymentsConfig` (three method cards, Switch, details/instructions, pending save, toasts, `ApiErrorDialog`) — `apps/book/src/modules/configuration/components/PaymentsConfig.tsx`
- [x] T012 [US1] Create the server `ConfigurationView` and replace the page — `apps/book/src/modules/configuration/ConfigurationView.tsx`, `apps/book/src/app/admin/configuracion/page.tsx`

**Checkpoint**: US1 works end-to-end.

---

## Phase 4: User Story 2 - Pick a real date and time (Priority: P1)

**Goal**: The booking flow shows a real month calendar with slots revealed below.

**Independent Test**: Navigate months, select a day with availability and see slots below; select a day with none and see a clean empty state.

### Tests for User Story 2 ⚠️

- [x] T013 [P] [US2] RTL test `CalendarStep`: renders a month grid, disables days without availability, reveals slots on day select, month navigation refetches — `apps/book/src/modules/public-booking/tests/CalendarStep.test.tsx`

### Implementation for User Story 2

- [x] T014 [US2] Create the month calendar `CalendarStep` (grid, navigation, availability, slots below, a11y labels) — `apps/book/src/modules/public-booking/dialogs/CalendarStep.tsx`
- [x] T015 [US2] Replace `SlotStep` usage with `CalendarStep` in the flow — `apps/book/src/modules/public-booking/dialogs/BookingFlow.tsx` (and remove `dialogs/SlotStep.tsx`)

**Checkpoint**: US2 works; the pills are gone.

---

## Phase 5: User Story 3 - Pay an advance for a service that requires it (Priority: P1)

**Goal**: A mandatory advance step (method/amount/reference/upload) when the service requires it.

**Independent Test**: Configure an advance service + active method; book it and confirm the step is mandatory and the data is stored Pending; a service without the flag shows no step; no active method blocks the flow.

### Tests for User Story 3 ⚠️

- [x] T016 [P] [US3] Action tests `public-booking`: `bookPublicAppointment` forwards the payment payload; `listPublicPaymentMethods` active-only; `advancePaymentSchema` rejects incomplete/mismatched input — `apps/book/src/modules/public-booking/tests/actions.test.ts`
- [x] T017 [P] [US3] RTL test `PaymentStep`: requires method/amount/reference/proof, validates the file type/size, blocks continuation when incomplete, `vitest-axe` clean — `apps/book/src/modules/public-booking/tests/PaymentStep.test.tsx`
- [x] T018 [P] [US3] RTL test `BookingFlow`: inserts the advance step only when `requiresAdvance` and forwards the payload — `apps/book/src/modules/public-booking/tests/BookingFlow.test.tsx`

### Implementation for User Story 3

- [x] T019 [P] [US3] Create the Supabase Storage upload util (mime/size validation + uuid path) — `apps/book/src/modules/public-booking/utils/uploadProof.ts`
- [x] T020 [P] [US3] Add `advancePaymentSchema`/`proofUrlSchema` — `apps/book/src/modules/public-booking/utils/schemas.ts`
- [x] T021 [US3] Extend `bookPublicAppointment` to forward the advance and add `listPublicPaymentMethods` — `apps/book/src/modules/public-booking/actions.ts`
- [x] T022 [US3] Add `useUploadPaymentProof`/`useFetchPublicPaymentMethods` — `apps/book/src/modules/public-booking/hooks.ts`
- [x] T023 [US3] Create `PaymentStep` (method picker, amount, reference, file upload, blocking message) — `apps/book/src/modules/public-booking/dialogs/PaymentStep.tsx`
- [x] T024 [US3] Wire the dynamic step list + payment payload in `BookingFlow` — `apps/book/src/modules/public-booking/dialogs/BookingFlow.tsx`

**Checkpoint**: US3 works end-to-end with the upload.

---

## Phase 6: User Story 4 - Filter the agenda by a date range (Priority: P1)

**Goal**: `desde`/`hasta` inputs defaulting to today → end of month, server-filtered.

**Independent Test**: Open `/admin/agenda`, confirm the default range, change both dates and confirm the list reflects the range.

### Tests for User Story 4 ⚠️

- [x] T025 [P] [US4] Action test `agenda`: `listAgenda` sends the inclusive `from`/`to` and maps payment/notifications — `apps/book/src/modules/agenda/tests/actions.test.ts`
- [x] T026 [P] [US4] RTL test `Agenda`: renders the two date inputs, applies the range, corrects `hasta < desde`, empty state — `apps/book/src/modules/agenda/tests/Agenda.test.tsx`

### Implementation for User Story 4

- [x] T027 [US4] Add `MyAppointments`/`MyAppointment` operations and the payment/notification fields — `apps/book/src/modules/agenda/agenda.graphql`
- [x] T028 [US4] Switch `listAgenda` to `myAppointments` (via `apiRequestAdmin`) and map payment/notifications — `apps/book/src/modules/agenda/actions.ts`
- [x] T029 [US4] Read `from`/`to` `searchParams` (default month) and map the rows — `apps/book/src/app/admin/agenda/page.tsx`, `apps/book/src/modules/agenda/AgendaView.tsx`
- [x] T030 [US4] Replace the per-day buttons with two date inputs applied via `router.push` — `apps/book/src/modules/agenda/components/Agenda.tsx`

**Checkpoint**: US4 works.

---

## Phase 7: User Story 5 - Accept, reject or reschedule an appointment (Priority: P2)

**Goal**: Clear control actions with notifications.

**Independent Test**: Accept → Confirmed; reject → Cancelled; reschedule → moved; each records a notification; a conflicting slot is blocked.

### Tests for User Story 5 ⚠️

- [x] T031 [P] [US5] Action test `agenda`: `rescheduleAppointment` validates with `rescheduleAppointmentSchema` and maps the result; controls go through `apiRequestAdmin` — `apps/book/src/modules/agenda/tests/actions.test.ts`
- [x] T032 [P] [US5] RTL test `Agenda`: accept/reject/confirm + reschedule modal (conflict surfaced) — `apps/book/src/modules/agenda/tests/Agenda.test.tsx`

### Implementation for User Story 5

- [x] T033 [P] [US5] Add the `RescheduleAppointment` operation — `apps/book/src/modules/agenda/agenda.graphql`
- [x] T034 [US5] Implement `rescheduleAppointment` and switch controls to `apiRequestAdmin` — `apps/book/src/modules/agenda/actions.ts`
- [x] T035 [P] [US5] Add `useRescheduleAppointment` — `apps/book/src/modules/agenda/hooks.ts`
- [x] T036 [US5] Wire accept/reject/reschedule into `Agenda` (pending/disable, toasts, refresh, conflict inline) — `apps/book/src/modules/agenda/components/Agenda.tsx`

**Checkpoint**: US5 works end-to-end.

---

## Phase 8: User Story 6 - Verify the advance payment from the appointment detail (Priority: P2)

**Goal**: The detail shows method/amount/reference/proof (preview + link fallback).

**Independent Test**: Open an advance appointment detail → the Adelanto section is shown; a non-advance one → hidden; an unrenderable proof → link/fallback.

### Tests for User Story 6 ⚠️

- [x] T037 [P] [US6] RTL test `Agenda` detail: shows the Adelanto section for an advance appointment, omits it otherwise, and falls back to a link when the image fails — `apps/book/src/modules/agenda/tests/Agenda.test.tsx`

### Implementation for User Story 6

- [x] T038 [US6] Render the "Adelanto" section in the detail modal (method label, amount, reference, `<img>` preview + `onError` link fallback) — `apps/book/src/modules/agenda/components/Agenda.tsx`

**Checkpoint**: US6 works.

---

## Phase 9: Polish & Cross-Cutting Concerns

- [x] T039 Update `apps/book/README.md` to document the payment-method config, the calendar, the advance step/upload, the agenda range and controls, the Supabase Storage bucket requirement, referencing `specs/book/017-advance-payments-booking`
- [x] T040 Run and pass book gates: `npm run test -w @foundly/book`, `npm run typecheck -w @foundly/book`, `npm run lint -w @foundly/book`, `npm run build -w @foundly/book` — `apps/book/package.json`
- [ ] T041 Execute the `quickstart.md` scenarios and confirm the expected outcomes — `specs/book/017-advance-payments-booking/quickstart.md` (scenarios 1/3/6 need the live API + Storage; automated gates covered by T040)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: depends on the API feature `016` producing the SDL.
- **Foundational (Phase 2)**: after Setup — BLOCKS all user stories.
- **US1/US2/US4**: after Foundational; independent modules.
- **US3 (Phase 5)**: after Foundational (needs the payment reads + the advance rule).
- **US5/US6 (Phases 7/8)**: after US4 (same `Agenda` component/actions file, edited sequentially).
- **Polish (Phase 9)**: after the desired stories.

### User Story Dependencies

- **US1 (P1)**: after Foundational — configuration module.
- **US2 (P1)**: after Foundational — `public-booking` calendar.
- **US3 (P1)**: after Foundational — `public-booking` payment step + upload.
- **US4 (P1)**: after Foundational — agenda read/range.
- **US5 (P2)**: after US4 — agenda controls.
- **US6 (P2)**: after US4 — agenda detail (shares `Agenda.tsx` with US5).

### Parallel Opportunities

- T002, T003 are `[P]`.
- Test tasks are `[P]` within a story (different files).
- After Foundational, US1/US2/US4 can proceed in parallel by module; US3 continues in `public-booking` after US2 (same BookingFlow).

---

## Implementation Strategy

### MVP First (US1 + US2 + US4)

1. Phase 1 Setup → Phase 2 Foundational.
2. US1 (config) + US4 (agenda range) + US2 (calendar) → the visible wins.
3. US3 (advance step + upload).
4. US5 (controls) + US6 (detail advance).
5. Phase 9 → docs updated + gates green.

### Incremental Delivery

1. Setup + Foundational → types + portal advance rule.
2. US1 → `/admin/configuracion` unlocked.
3. US2 → real calendar.
4. US3 → advance step + Supabase upload.
5. US4 → agenda range; US5 → controls; US6 → detail advance.
6. Phase 9 → docs + gates.

---

## Notes

- `[P]` = different files, no dependencies.
- Constitution §5.VI: UI calls only `hooks.ts`; codegen-only DTOs; `actions.ts` is the single API door per module.
- RSC boundary: client components receive only serializable props.
- Depends on `specs/api/016-advance-payments` (payments + appointment advance/controls + SDL snapshot).
- The Supabase Storage bucket `payment-proofs` is an operations prerequisite (quickstart).
