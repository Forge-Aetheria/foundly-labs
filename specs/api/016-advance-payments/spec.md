# Feature Specification: Foundly API — Advance Payments, Service Advance Rules & Agenda Control

**Feature Branch**: `016-advance-payments`

**Created**: 2026-10-13

**Status**: Draft _(payment-method enum, `title` and structured `details` amended by `specs/book/022-admin-payments-schedules-refactor`)_

**Input**: User description: "El negocio necesita configurar sus métodos de pago (Pago Móvil, Transferencia, Binance), marcar qué servicios requieren adelanto, guardar el adelanto que envía el cliente al reservar, y controlar la agenda por rango de fechas (aceptar/rechazar/reagendar) con notificación al cliente. Ajustar el backend/schema y la superficie GraphQL para soportarlo."

_This spec is governed by `constitution.md` v5.2.0, `specs/business-model.md` and `specs/architecture.md`. It lives in the `api` domain because the affected application is `apps/api`; it extends the catalog/`services`/`appointments` surfaces of `specs/api/004-services-specialists-availability`, `specs/api/005-appointments` and `specs/api/010-domain-mvp-module`, and is the backend counterpart of `specs/book/017-advance-payments-booking`._

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Configure the business payment methods (Priority: P1)

As an authenticated business owner, I want to store my active payment methods (Pago Móvil, bank transfer, Binance) with their receiving details and instructions, so my clients can be told exactly how to pay an advance.

**Why this priority**: The advance flow cannot exist without configured methods; it is the monetization foundation.

**Independent Test**: As the owner, upsert a method (type, details, instructions, active) and read it back; disable it and confirm it is no longer returned by the public read; another tenant cannot read or modify it.

**Acceptance Scenarios**:

1. **Given** an authenticated owner, **When** they upsert a method of each type, **Then** each is persisted with its details/instructions and active flag.
2. **Given** a saved method, **When** the owner disables it, **Then** it is excluded from the public read but remains visible in the admin read.
3. **Given** a foreign tenant, **When** it reads or modifies the methods, **Then** it only ever sees its own and cannot touch another business's methods.
4. **Given** an anonymous request, **When** a write is attempted, **Then** it is rejected with the stable authentication error and nothing changes.

---

### User Story 2 - Mark a service as requiring an advance (Priority: P1)

As an authenticated business owner, I want to mark a service as requiring an advance and define it as a fixed amount or a percentage of its price, so the public booking flow knows when a payment step is mandatory.

**Why this priority**: Without the per-service rule the booking flow cannot decide whether to ask for an advance.

**Independent Test**: Create/update a service with `requiresAdvance` and a fixed or percentage amount and read it back on both the admin and public surfaces; an invalid combination is rejected.

**Acceptance Scenarios**:

1. **Given** the owner, **When** they mark a service as requiring an advance with a fixed amount, **Then** the service exposes the rule (kind + value) on the admin and public reads.
2. **Given** a percentage rule, **When** the service is read, **Then** the percentage (1–100) is exposed.
3. **Given** `requiresAdvance: true` with no/invalid kind or value, **When** it is saved, **Then** it is rejected with a validation error.
4. **Given** `requiresAdvance: false`, **When** it is saved, **Then** any advance kind/value is cleared.

---

### User Story 3 - Capture the advance submitted with a booking (Priority: P1)

As a public client, I want my submitted advance (method, amount, reference and proof) to be stored with my booking, so it is held as Pending until the business verifies it.

**Why this priority**: It is the core monetization behavior; the payment information must be durable and verifiable.

**Independent Test**: Book an advance-required service with a complete payment payload and confirm the appointment is Pending and carries the payment; omit part of the payload or use an inactive method and confirm nothing is created.

**Acceptance Scenarios**:

1. **Given** a service that does not require an advance, **When** a booking is submitted, **Then** no payment is required or stored.
2. **Given** a service that requires an advance, **When** a booking is submitted with method, amount, reference and proof, **Then** the appointment is created in **Pending** and carries the payment.
3. **Given** an advance-required service, **When** the payload is incomplete, the amount does not match the rule, or the method is not active, **Then** the booking is rejected and nothing is created.
4. **Given** an advance-required service with no active method configured, **When** a booking is submitted, **Then** it is rejected with a clear message.
5. **Given** a manually created appointment (owner), **When** it is created, **Then** the advance step is exempt.

---

### User Story 4 - Read and control the agenda by date range (Priority: P2)

As an authenticated business owner, I want to read my appointments in a `from`/`to` range and accept, reject or reschedule them, recording a client notification, so I control my agenda end-to-end.

**Why this priority**: It completes the operational control requested for the admin panel.

**Independent Test**: Read appointments inside a range; accept (→ Confirmed), reject (→ Cancelled) and reschedule one, confirming the new state/date and that each action records a notification; a conflicting slot is rejected.

**Acceptance Scenarios**:

1. **Given** the owner, **When** they read appointments with a `from`/`to` range, **Then** only appointments inside the range (and their tenant) are returned.
2. **Given** a pending appointment, **When** the owner accepts it, **Then** its status becomes Confirmed and a notification is recorded.
3. **Given** an appointment, **When** the owner rejects it, **Then** its status becomes Cancelled and a notification is recorded.
4. **Given** an appointment, **When** the owner reschedules it to a free slot, **Then** its start/end move and a notification is recorded.
5. **Given** a conflicting or foreign appointment, **When** the owner reschedules or changes its state, **Then** it fails as `CONFLICT`/`NOT_FOUND` and the record is unchanged.
6. **Given** an anonymous request, **When** a control action runs, **Then** it is rejected with the stable authentication error.

---

### Edge Cases

- Repeating an accept/reject to the current target state is idempotent (no error, no duplicate notification spam — a notification is recorded only when the status actually changes).
- Rescheduling into a slot already taken (excluding the appointment itself) is rejected with `CONFLICT`; the original slot is preserved.
- Rescheduling a `CANCELLED`/`COMPLETED` appointment is rejected.
- A payment method of a type the business has not configured, or that is inactive, is rejected.
- Amount zero/negative/non-numeric, or a negative percentage, is rejected inline.
- A public read of a business with no active methods returns an empty list (never an error); an unknown slug returns empty.
- Proof URL missing/blank or not an absolute http(s) URL is rejected.
- Deleting an appointment removes its notifications (cascade).
- Advance-required service whose price is zero with a percentage rule: the computed amount is zero → rejected (an advance must be positive).

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: The API MUST persist payment methods per business, each with a **type** (the closed set `pago_movil`, `binance`, `zelle`, `transfer`, `cash`), a **title**, **structured `details`** (JSON-encoded receiving object: holder, cedula, phone, bank, payId, email, account), free-form **instructions** and an **active** flag; at most one method per type per business.
- **FR-002**: The API MUST expose an authenticated, tenant-scoped read and upsert for the caller's payment methods; the tenant MUST be derived from the authenticated identity, never from client input.
- **FR-003**: The API MUST expose a public read of a business's **active** payment methods only, scoped by `tenantId` or public slug; unknown slug → empty list.
- **FR-004**: The API MUST persist an optional per-service advance rule: `requiresAdvance` plus, when true, a kind (`fixed` | `percent`) and a positive value (cents when fixed; 1–100 when percent).
- **FR-005**: The advance rule MUST be exposed on both the admin service catalog and the public service read, and MUST be validated on create/update (an invalid combination is rejected; disabling clears the rule).
- **FR-006**: The API MUST accept an optional advance payment on public appointment creation: payment method type, amount, reference and proof URL; and MUST persist it with the appointment in **Pending** state.
- **FR-007**: When the target service requires an advance, public creation MUST require a complete payment payload, MUST require the referenced method type to be configured and **active**, and MUST require the amount to match the service's rule (fixed value, or the rounded percentage of its price); otherwise it MUST reject with a stable validation/conflict error and create nothing.
- **FR-008**: Manually created appointments (owner, `origin: admin`) MUST be exempt from the advance requirement.
- **FR-009**: The API MUST support reading appointments scoped to the caller's tenant within an inclusive `from`/`to` range (the existing read stays public for availability computation; a new authenticated, tenant-scoped agenda read is added or the existing one is hardened).
- **FR-010**: The API MUST expose authenticated, tenant-scoped operations to accept (→ Confirmed) and reject (→ Cancelled) an appointment and to **reschedule** it (`startAt`, optional `specialistId`), enforcing the existing status transitions and a conflict-free slot.
- **FR-011**: Every state change that actually changes the status and every reschedule MUST record a client notification (simulated channel) linked to the appointment and tenant.
- **FR-012**: The appointment read MUST expose, when present, the advance payment (method type, amount, reference, proof URL, submitted-at) so the admin detail can render it; it MUST be absent/empty otherwise.
- **FR-013**: All write operations MUST be tenant-scoped from the authenticated identity; anonymous/foreign requests MUST be rejected with the stable errors and MUST NOT change data.
- **FR-014**: Automated tests MUST cover: payment-method CRUD + public active read + tenant isolation; service advance rule validation; public booking with/without a valid advance; reschedule conflict + notification; status change notification; agenda range read; and appointment payment exposure.
- **FR-015**: All API gates (`build`, `typecheck`, `test`, lint) MUST pass with no regressions under strict TypeScript.

### Key Entities

- **Payment method**: a way the business receives an advance — type (mobile payment / bank transfer / Binance), free-form details, free-form instructions and an active flag; unique per (business, type).
- **Service advance rule**: whether a service requires an advance and, when so, the kind (fixed amount / percent of price) and value.
- **Advance payment**: the payment attached to a public appointment — method type, amount (cents), reference, proof URL and submitted-at.
- **Appointment**: a booking with a lifecycle status (Pending, Confirmed, Cancelled, Completed), an optional advance payment and an origin (`online` | `admin`).
- **Client notification**: a recorded, simulated message produced by a status change or reschedule, linked to the appointment and business.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: 100% of advance-required public bookings carry complete payment information before the appointment is created; 0 are created otherwise.
- **SC-002**: 100% of anonymous or cross-business write attempts are rejected with the stable errors and change nothing.
- **SC-003**: The public read exposes only active methods; disabling a method is reflected on the next read.
- **SC-004**: 100% of accept/reject/reschedule actions leave the appointment in the expected state and record a notification on a real change.
- **SC-005**: The appointment read exposes the advance payment for 100% of advance-required appointments and omits it otherwise.
- **SC-006**: All API gates pass with zero regressions.

## Assumptions

- **Advance payment as an embedded value object**: the payment (method type, amount, reference, proof URL, submitted-at) is stored on the appointment row (a set of nullable columns) rather than a separate table, because it is a 1:1, non-recurring attribute in v1. A future re-submission history would be a separate feature.
- **Proof image = uploaded file**: this feature stores only the resulting **URL**; the upload itself (format/size validation + storage) is performed by the `book` app against Supabase Storage (`specs/book/017-advance-payments-booking`). The API validates that the URL is an absolute `http(s)` URL.
- **Method types are a closed set**: `pago_movil`, `binance`, `zelle`, `transfer`, `cash` (amended by `specs/book/022-admin-payments-schedules-refactor`). `details` is a JSON-encoded object stored on the existing string column; `title` replaced the previous `label`.
- **Notifications are simulated**: no email/SMS/WhatsApp provider in this phase; a `client notification` record exists so a real channel can be wired later without changing the flow.
- **Amount must match the rule**: the server recomputes the expected advance (fixed value, or `round(priceCents * percent / 100)`) and rejects a mismatch; this protects the monetization invariant.
- **Agenda read remains dual**: the unauthenticated appointment read used by the public availability engine stays public; the admin range read is authenticated and tenant-scoped. The share of work is defined in `plan.md`.
- **Respect for the governance hierarchy**: follows `specs/business-model.md` (a trustworthy, monetizable Foundly Book) and the authority order of `constitution.md`.
