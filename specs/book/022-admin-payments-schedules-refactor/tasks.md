---

description: "Task list for Foundly Book — Admin Payments & Schedules Redesign"
---

# Tasks: Foundly Book — Admin Payments & Schedules Redesign

**Input**: Design documents from `/specs/book/022-admin-payments-schedules-refactor/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Included (spec FR-012 and the constitution gates require automated coverage).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: US1 (payments), US2 (schedules), US3 (a11y/consistency)

## Phase 1: Setup

- [x] T001 Confirm the backend contract delta (enum + `title` + JSON `details`) is documented in `specs/api/016-advance-payments` and the book SDL snapshot `apps/book/codegen.schema.gql`.

---

## Phase 2: Foundational (blocking prerequisites)

- [x] T002 Extend `apps/book/src/shared/types/payments.ts`: five `PaymentMethodType` values, labels, `PaymentMethodDetails`, `PAYMENT_TYPE_FIELDS`, `PAYMENT_DETAIL_LABELS`, `parse/serializePaymentDetails`, `paymentDetailSummary`.
- [x] T003 Update the API payments module (`apps/api/src/modules/payments/*`) + `apps/api/src/schema.gql` to the new enum + `title` (Prisma `label` mapped), keeping `details: String`.
- [x] T004 Update `apps/book/codegen.schema.gql` + module `.graphql` ops (`configuration`, `public-booking`) to `title`; regenerate `generated.ts` via codegen.

**Checkpoint**: shared types + contract ready → US1/US2 can proceed.

---

## Phase 3: User Story 1 - Payment methods as structured cards (Priority: P1) 🎯 MVP

- [x] T005 [US1] Update `apps/book/src/modules/configuration/utils/schemas.ts` (five-type enum + structured `details` object).
- [x] T006 [US1] Update `apps/book/src/modules/configuration/actions.ts` (parse/serialize `details`, map `title`).
- [x] T007 [US1] Rebuild `apps/book/src/modules/configuration/components/PaymentsConfig.tsx` (card list + create/edit modal + type-specific fields + delete/toggle).
- [x] T008 [US1] Update `apps/book/src/modules/configuration/tests/{PaymentsConfig,actions}.test.tsx` (cards, modal, structured save, toggle preserving data, delete, serialization).
- [x] T009 [US1] Update the public read/step: `public-booking/actions.ts`, `public-booking/dialogs/PaymentStep.tsx`, `public-booking/utils/schemas.ts` and `agenda` label usage.

**Checkpoint**: US1 fully functional and independently testable.

---

## Phase 4: User Story 2 - Weekly schedule & blocks (Priority: P1)

- [x] T010 [US2] Rebuild `apps/book/src/modules/availability/components/AvailabilityEditor.tsx` (weekly Switch rows + Monday-first order + "Guardar horario semanal"; blocks card with Rango/Días completos).
- [x] T011 [US2] Update `apps/book/src/modules/availability/tests/AvailabilityEditor.test.tsx` (weekly save, range block, full-day block, inline error, removal).

**Checkpoint**: US2 fully functional and independently testable.

---

## Phase 5: User Story 3 - Consistency & accessibility (Priority: P2)

- [x] T012 [US3] Verify both surfaces use `@foundly/ui` + tokens, are keyboard-operable and pass `vitest-axe` (asserted in T008/T011).

---

## Phase 6: Spec amendments & polish

- [x] T013 [P] Amend `specs/book/017-advance-payments-booking/spec.md` (FR-001/US1/assumptions) + its contract/data-model/research for the structured five-type contract.
- [x] T014 [P] Amend `specs/book/015-availability-time-blocks/spec.md` (FR-002/FR-004) for the redesigned schedule + full-day blocks.
- [x] T015 [P] Amend `specs/api/016-advance-payments` (spec/data-model/contract) for the enum + `title` + JSON `details`.
- [x] T016 Update `.specify/feature.json` to `specs/book/022-admin-payments-schedules-refactor`.
- [x] T017 Run book gates (`typecheck`, `lint`, `test`, `build`) and the API test suite until green.
