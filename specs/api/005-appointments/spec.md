# Feature Specification: Foundly API — Appointments & Bookings GraphQL Module

**Feature Branch**: `005-appointments`

**Created**: 2026-10-11

**Status**: Draft

**Input**: User description: "Atención: Vamos a avanzar con la Spec 005 del backend: Módulo GraphQL de Citas y Reservas (`Appointments`) en `apps/api`. Objetivos: (1) Módulo de Citas (`apps/api/src/modules/appointments/`): DTOs/Input types, Resolver y Service para la gestión de citas (`Appointment`); consultas de agenda (`appointments`/`appointment`) con filtros por `tenantSlug`/`tenantId`, rango de fechas (`startDate`/`endDate`), `specialistId` y estado (`status`); mutaciones `createAppointment` (validación de existencia del servicio y especialista y verificación de no solapamiento de horarios), `updateAppointmentStatus` (estados PENDING, CONFIRMED, CANCELLED, COMPLETED) y `cancelAppointment` (registro de motivo opcional). (2) Registrar `AppointmentsModule` en `AppModule`. (3) Pruebas TDD y Quality Gates: pruebas unitarias y e2e (DB-free con mocks de Prisma) cubriendo casos exitosos y validaciones de error (solapamiento, servicio/especialista inexistente); ejecutar `npm run build -w @foundly/api`, `npm run test -w @foundly/api` y comprobación de no-regresión en el monorepo."

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Book and read appointments (Priority: P1)

As a business (operator or client), I want to register a booking once the service and specialist exist and the time slot is free, and read the agenda with filters, so that scheduling reflects reality.

**Why this priority**: Creating and listing appointments is the core outcome of a booking system; without it no agenda exists.

**Independent Test**: Create an appointment for an existing service+specialist and query the agenda with date/status/specialist filters — all DB-free green, including the no-overlap guarantee.

**Acceptance Scenarios**:

1. **Given** a valid service and specialist for the business, **When** a booking is created for a free time range, **Then** it is persisted and returned with its identifier.
2. **Given** an existing appointment in the same time range for the same specialist, **When** another booking overlaps it, **Then** it is rejected with a clear error and nothing is persisted.
3. **Given** the agenda, **When** I query with tenant, date range, specialist and status filters, **Then** only the matching appointments are returned.

---

### User Story 2 - Transition appointment status (Priority: P2)

As a business operator, I want to change the state of an appointment (pending, confirmed, cancelled, completed), so that the agenda reflects the real lifecycle.

**Why this priority**: Status transitions keep the agenda truthful and gate later reporting/checkout.

**Independent Test**: Update the status of an existing appointment and read it back; invalid/unknown transitions are rejected — DB-free green.

**Acceptance Scenarios**:

1. **Given** an appointment, **When** I set a valid next status, **Then** the status is persisted and returned.
2. **Given** an appointment, **When** I submit an invalid or unsupported status value, **Then** it is rejected with a clear error.
3. **Given** an appointment id that does not exist, **When** I update it, **Then** a clear not-found error is returned.

---

### User Story 3 - Cancel appointments with a reason (Priority: P3)

As a business operator, I want to cancel an appointment recording an optional reason, so that cancellations are auditable and the now-free slot can be rebooked.

**Why this priority**: Cancellation closes the lifecycle and frees capacity.

**Independent Test**: Cancel an existing appointment (with and without a reason) and read it back as cancelled — DB-free green.

**Acceptance Scenarios**:

1. **Given** an appointment, **When** I cancel it with an optional reason, **Then** it is marked cancelled and the reason is stored.
2. **Given** an already non-cancellable state, **When** I cancel it, **Then** the system rejects the transition with a clear error.
3. **Given** a missing appointment id, **When** I cancel it, **Then** a clear not-found error is returned.

---

### User Story 4 - Keep the quality gates green (Priority: P3)

As a maintainer, I want workspace build/typecheck/test to stay green after the module.

**Acceptance Scenarios**:

1. **Given** the module, **When** its unit and e2e specs run, **Then** they pass DB-free.
2. **Given** the API, **When** `build`, `typecheck` and `test` run, **Then** they pass.
3. **Given** the workspace, **When** existing apps/packages are built and tested, **Then** there are no regressions.

---

### Edge Cases

- **Overlapping booking**: createAppointment rejects overlaps for the same specialist and returns an error; nothing is persisted.
- **Missing service/specialist**: createAppointment rejects a non-existent service or specialist (or cross-tenant pair) with a clear error.
- **Invalid date range**: end date/time not after start returns a clear validation error.
- **Unknown tenant**: agenda queries with an unknown slug return an empty list; writes return a clear error.
- **Invalid status value**: updateAppointmentStatus rejects values outside the allowed set.
- **Illegal transitions**: completing/cancelling from excluded terminal states is rejected (e.g., cancelling an already-completed appointment).
- **Boundary dates**: appointments whose range touches the filter boundary (inclusive start/end) are handled deterministically.
- **Empty agenda**: an empty filtered result is returned, not an error.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: The system MUST scope appointment operations to a single business, addressable by its identifier or its public slug.
- **FR-002**: The system MUST list appointments for a business, optionally filtered by date range (inclusive `startDate`/`endDate`), `specialistId` and `status`.
- **FR-003**: The system MUST return an appointment's details by identifier (including its service, specialist and client info).
- **FR-004**: The system MUST create an appointment for a client with the business, service, specialist, start/end time and status, persisting the applied snapshot (duration, amount, currency, origin).
- **FR-005**: The system MUST validate that the referenced service and specialist exist and belong to the same business before creating.
- **FR-006**: The system MUST reject a creation whose time range overlaps an existing appointment for the same specialist, persisting nothing.
- **FR-007**: The system MUST reject invalid time ranges (end not after start) with a clear error.
- **FR-008**: The system MUST update an appointment's status to one of PENDING, CONFIRMED, CANCELLED or COMPLETED, and reject invalid or non-allowed transitions for the current state.
- **FR-009**: The system MUST cancel an appointment recording an optional reason and marking the status CANCELLED.
- **FR-010**: Write operations MUST return machine-readable errors (invalid data → validation; missing targets → not-found; overlap → conflict).
- **FR-011**: The module MUST include DB-free unit and end-to-end coverage for the read, create, status-update and cancel flows, including the validation error cases.
- **FR-012**: The API gates MUST pass (`build`, `typecheck`, `test`) with no regressions in the existing workspace.

### Key Entities _(include if feature involves data)_

- **Appointment**: a booking referencing a Tenant, Service, Specialist, client identity/contact, start/end time and status, with the applied snapshot (duration, amount, currency, origin) and an optional cancellation note.
- **Service** / **Specialist**: referenced by the appointment; existence + same-business constraints gate creation (per existing 003/004 relations).
- **Tenant / BusinessProfile**: scoping root; the public slug resolves the business for reads/writes.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: A user can create a booking for a free slot and read it back with tenant, date-range, specialist and status filters in a single session, with no errors.
- **SC-002**: Overlapping and missing-target bookings are rejected with clear errors and nothing is persisted (0 invalid rows created).
- **SC-003**: A user can transition an appointment to any allowed status and cancel it with/without a reason; illegal transitions are rejected with clear errors.
- **SC-004**: The module's read, create, update-status and cancel flows are covered by DB-free unit and e2e tests.
- **SC-005**: The API `build`, `typecheck` and `test` gates pass and the full workspace shows no regressions.

## Assumptions

- **Connection with existing modules**: the module reuses `PrismaService`, `tenant-scope` helpers and the error-code conventions (`VALIDATION_ERROR`/`NOT_FOUND`/`CONFLICT`) established in `003`/`004`, and the entities (Appointment with its snapshot fields, Service, Specialist) ratified there.
- **Status vocabulary**: the canonical statuses are stored uppercase (`PENDING`, `CONFIRMED`, `CANCELLED`, `COMPLETED`); the API normalizes input case-insensitively. `updateAppointmentStatus` accepts any value in the set for the current state per an allowed-transitions map; `cancelAppointment` sets `CANCELLED` with an optional reason.
- **Overlap rule**: a creation overlaps when the new range intersects an existing non-cancelled appointment of the same specialist in the same tenant.
- **Date semantics**: `startDate`/`endDate` are inclusive filters over `startAt`; times stored as UTC.
- **Snapshot**: on creation the applied snapshot (duration, amount, currency) is derived from the service; `origin` default `online`.
- **Removal/deactivation**: changing/removing a service/specialist referenced by past appointments is out of scope (historical snapshots stay intact).
- **Surface posture**: GraphQL code-first; playground/introspection only outside production; no tenant-level auth added by this feature.
- **Scope boundary**: notifications, rescheduling, no-show handling, payments and check-in flows are out of scope and arrive in later features.
- **This spec respects `specs/business-model.md`** (rates/pricing source for the snapshot) and the hierarchy of `constitution.md`; persistence continues under the ratified strategy (Prisma + PostgreSQL via `@foundly/database`).
