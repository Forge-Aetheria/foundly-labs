---
description: "Task list for Foundly API — Advance Payments, Service Advance Rules & Agenda Control"
---

# Tasks: Foundly API — Advance Payments, Service Advance Rules & Agenda Control

**Input**: Design documents from `/specs/api/016-advance-payments/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/advance-payments.contract.md, quickstart.md

**Tests**: Included — FR-014 requires automated coverage (unit + e2e).

**Organization**: Tasks are grouped by user story (US1 payment methods · US2 service advance rule · US3 advance on booking · US4 agenda range & controls) so each is independently implementable and testable.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: US1 · US2 · US3 · US4
- Every task includes an exact file path.

## Path Conventions

- Backend: `apps/api/src/…` (NestJS colocated `*.spec.ts`); Prisma: `packages/database/prisma/…`; codegen snapshot: `apps/book/codegen.schema.gql`.

---

## Phase 1: Setup (Shared Infrastructure)

- [x] T001 Confirm the persistence gaps before touching schema: no payment model, no advance fields on `Service`/`Appointment`, no notification model, no reschedule mutation — `packages/database/prisma/schema.prisma`, `apps/api/src/modules/appointments/appointments.service.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Persistence, enums, the `payments` seam and the advance fields threaded through the two service surfaces.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T002 [P] Add `enum PaymentMethodType { mobile_payment bank_transfer binance }`, `enum AdvanceKind { fixed percent }`, the `PaymentMethod` model (`@@unique([tenantId, type])`, `@@index([tenantId, active])`), the `Service` columns (`requiresAdvance`, `advanceKind`, `advanceValue`), the `Appointment` payment columns, the `AppointmentNotification` model (cascade) and the `Tenant`/`Appointment` relations; generate the migration — `packages/database/prisma/schema.prisma`, `packages/database/prisma/migrations/<new>/migration.sql`
- [x] T003 [P] Create `payments.types.ts`: register `PaymentMethodType`, declare `PaymentMethodObject`, `UpsertPaymentMethodInput` — `apps/api/src/modules/payments/payments.types.ts`
- [x] T004 [P] Create the `PaymentsStore` seam + `PAYMENTS_STORE` token + `PrismaPaymentsStore` (`resolveTenantId`, `listByTenant(tenantId, active?)`, `getByType`, `upsertByType`, `deleteById`) + `PaymentMethodRow` — `apps/api/src/modules/payments/payments.store.ts`
- [x] T005 [P] Create `createMemoryPaymentsStore()` implementing the same contract — `apps/api/src/modules/payments/payments.test-store.ts`
- [x] T006 [P] Add `requiresAdvance`/`advanceKind`/`advanceValue` to `Appointments`… i.e. the **catalog** `MyService`, `CreateMyServiceInput`, `UpdateMyServiceInput` — `apps/api/src/modules/catalog/catalog.types.ts`
- [x] T007 [P] Add the advance fields to `ServiceRow`, `serviceSelect`, `createService`/`updateService` — `apps/api/src/modules/catalog/catalog.store.ts` and `MemoryCatalogStore` — `apps/api/src/modules/catalog/catalog.test-store.ts`
- [x] T008 [P] Add `requiresAdvance`/`advanceKind`/`advanceValue` to the public `ServiceObject`, `CreateServiceInput`, `UpdateServiceInput` — `apps/api/src/modules/services/services.types.ts`
- [x] T009 Register `PaymentsModule` in the root module — `apps/api/src/app.module.ts`, `apps/api/src/modules/payments/payments.module.ts`

**Checkpoint**: Schema + payment seam + advance fields in place; no behavior wired yet.

---

## Phase 3: User Story 1 - Configure the business payment methods (Priority: P1) 🎯 MVP

**Goal**: Authenticated CRUD of the owner's methods + a public active-only read.

**Independent Test**: Upsert each type and read back; disable → excluded from the public read; anonymous → `UNAUTHENTICATED`; another tenant's methods are never returned/modified.

### Tests for User Story 1 ⚠️

- [x] T010 [P] [US1] Unit tests `payments.service`: `listForAdmin` scoped; `upsert` create + replace by type; `listPublic` active-only; `remove` owned/foreign; anonymous → `UNAUTHENTICATED` — `apps/api/src/modules/payments/payments.service.spec.ts`
- [x] T011 [P] [US1] e2e: authenticated upsert/list/delete; public `paymentMethods` active-only + unknown slug empty; anonymous → `UNAUTHENTICATED` — `apps/api/src/modules/payments/payments.e2e.spec.ts`

### Implementation for User Story 1

- [x] T012 [US1] Implement `PaymentsService` (`requireTenant`, `listForAdmin`, `listPublic`, `upsert`, `remove`) with type validation — `apps/api/src/modules/payments/payments.service.ts`
- [x] T013 [US1] Implement the resolver: `myPaymentMethods`/`upsertPaymentMethod`/`deletePaymentMethod` (`@RequireAuth`) and the public `paymentMethods` query — `apps/api/src/modules/payments/payments.resolver.ts`

**Checkpoint**: Payment methods work end-to-end.

---

## Phase 4: User Story 2 - Mark a service as requiring an advance (Priority: P1)

**Goal**: The advance rule is persisted, validated and exposed on both service surfaces.

**Independent Test**: Create/update with `requiresAdvance` + fixed/percent and read back on admin + public; invalid combination → `VALIDATION_ERROR`; disabling clears the rule.

### Tests for User Story 2 ⚠️

- [x] T014 [P] [US2] Unit tests catalog: create/update advance rule validation + mapping (valid fixed/percent, missing kind, percent > 100, clears on false) — `apps/api/src/modules/catalog/catalog.service.spec.ts`
- [x] T015 [P] [US2] Unit tests public services: advance fields are mapped on the service read — `apps/api/src/modules/services/services.service.spec.ts`

### Implementation for User Story 2

- [x] T016 [US2] Validate the advance rule in `assertServiceCreate`/`assertServiceUpdate` and copy it through the store — `apps/api/src/modules/catalog/catalog.service.ts`, `apps/api/src/modules/catalog/catalog.store.ts`
- [x] T017 [US2] Validate the advance rule in `validateCreate`/`validateUpdate` and map it in `toServiceObject` — `apps/api/src/modules/services/services.service.ts`

**Checkpoint**: The advance rule is served to the Book app on both surfaces.

---

## Phase 5: User Story 3 - Capture the advance submitted with a booking (Priority: P1)

**Goal**: Public booking stores a validated advance and is Pending; manual (admin) creation is exempt.

**Independent Test**: Book an advance service with a complete payload → Pending + payment; incomplete/mismatched/inactive → `VALIDATION_ERROR` and nothing created; non-advance → ignored; `createMyAppointment` skips the rule.

### Tests for User Story 3 ⚠️

- [x] T018 [P] [US3] Unit tests appointments: advance-required happy path persists payment + `PENDING`; missing field / inactive method / amount mismatch → `VALIDATION_ERROR`; non-advance ignores the payload; `createMyAppointment` sets `admin` and skips — `apps/api/src/modules/appointments/appointments.service.spec.ts`
- [x] T019 [P] [US3] e2e: public `createAppointment` with a complete advance returns the payment; a missing/inactive method → `VALIDATION_ERROR` — `apps/api/src/modules/appointments/appointments.e2e.spec.ts`

### Implementation for User Story 3

- [x] T020 [US3] Add the payment columns + `paymentMethodType` to `AppointmentObject`, the optional payment fields to `CreateAppointmentInput`, and the notification object type — `apps/api/src/modules/appointments/appointments.types.ts`
- [x] T021 [US3] Extend `createAppointment` to force `origin = 'online'`, enforce the advance (active method + matching amount + valid proof URL) and persist the payment; add `createMyAppointment` (auth, `admin`, exempt) — `apps/api/src/modules/appointments/appointments.service.ts`
- [x] T022 [US3] Add the `createMyAppointment` mutation (`@RequireAuth` + `@AuthUser`) — `apps/api/src/modules/appointments/appointments.resolver.ts`

**Checkpoint**: Advance booking is durable and enforced server-side.

---

## Phase 6: User Story 4 - Read and control the agenda by date range (Priority: P2)

**Goal**: Authenticated ranged read + accept/reject/reschedule, each recording a notification.

**Independent Test**: `myAppointments(from,to)` returns only in-range tenant rows; accept → Confirmed + notification; reject → Cancelled + notification; reschedule moves dates + notification; overlap → `CONFLICT`; anonymous → `UNAUTHENTICATED`; foreign → `NOT_FOUND`.

### Tests for User Story 4 ⚠️

- [x] T023 [P] [US4] Unit tests appointments: `myAppointments` range+tenant scoping and invalid range; `reschedule` moves dates + records notification; conflict (excluding self) → `CONFLICT`; terminal → `VALIDATION_ERROR`; status change records a notification only on a real change — `apps/api/src/modules/appointments/appointments.service.spec.ts`
- [x] T024 [P] [US4] e2e: authenticated `myAppointments` + `rescheduleAppointment`; status change emits a notification; anonymous → `UNAUTHENTICATED` — `apps/api/src/modules/appointments/appointments.e2e.spec.ts`

### Implementation for User Story 4

- [x] T025 [US4] Add `RescheduleAppointmentInput`/`MyAppointments` args, include notifications in `APPOINTMENT_INCLUDE`, and map payment + notifications in `toAppointmentObject` — `apps/api/src/modules/appointments/appointments.types.ts`, `apps/api/src/modules/appointments/appointments.service.ts`
- [x] T026 [US4] Implement `rescheduleAppointment`, `listMyAppointments`, `findMyAppointment`, the notification writer, and harden `updateAppointmentStatus`/`cancelAppointment` with tenant scoping + notification on a real change — `apps/api/src/modules/appointments/appointments.service.ts`
- [x] T027 [US4] Add `myAppointments`/`myAppointment` queries and the `rescheduleAppointment` mutation; add `@RequireAuth` + `@AuthUser` to the control mutations — `apps/api/src/modules/appointments/appointments.resolver.ts`

**Checkpoint**: The agenda can be queried and controlled safely.

---

## Phase 7: Polish & Cross-Cutting Concerns

- [x] T028 Sync the versioned codegen schema snapshot with the new SDL (regenerate from the running API `schema.gql`) — `apps/book/codegen.schema.gql`
- [x] T029 Run and pass API gates: `npm run typecheck -w @foundly/api`, `npm run test -w @foundly/api`, `npm run lint -w @foundly/api`, `npm run build -w @foundly/api` — `apps/api/package.json`
- [ ] T030 Execute the `quickstart.md` scenarios and confirm the expected outcomes — `specs/api/016-advance-payments/quickstart.md` (requires live DB + token; automated gates covered by T029)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: none.
- **Foundational (Phase 2)**: after Setup — BLOCKS all user stories (schema + seam + advance fields).
- **US1/US2/US3/US4**: after Foundational. `appointments.*` files are shared by US3/US4 (edited sequentially), as are the `appointment` resolver/service.
- **Polish (Phase 7)**: after the stories; T028 also unblocks the Book feature `017`.

### Parallel Opportunities

- T002–T008 are `[P]` (different files).
- Test tasks are `[P]` within a story (different files).

---

## Implementation Strategy

### MVP First (US1)

1. Phase 1 Setup → Phase 2 Foundational (schema + payments seam + advance fields).
2. US1 → payment-method configuration (MVP).
3. US2 → service advance rule; US3 → advance on booking; US4 → agenda controls.
4. Phase 7 → snapshot synced + gates green.

---

## Notes

- `[P]` = different files, no dependencies.
- `apps/api` keeps the NestJS colocated `*.spec.ts` convention (code-rules §10 migration deferred; confirmed with the owner).
- Constraint values quoted from `data-model.md` (type ∈ {mobile_payment, bank_transfer, binance}; kind ∈ {fixed, percent}; tenant from `ctx.user`).
- Depends on nothing new; extends the `004`/`005`/`010` surfaces.
