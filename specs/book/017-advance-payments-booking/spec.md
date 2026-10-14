# Feature Specification: Foundly Book — Advance Payments, Booking Calendar & Agenda Control

**Feature Branch**: `017-advance-payments-booking`

**Created**: 2026-10-13

**Status**: Draft

**Input**: User description: "@apps/book @packages/database

### Contexto y Requerimientos de Funcionalidad (Fase de Endurecimiento y Monetización del MVP)

Se requiere implementar un conjunto de mejoras críticas en `apps/book` y la base de datos para habilitar la solicitud de adelantos, mejorar la selección de fechas en las reservas y dotar al administrador de control total sobre la agenda y la configuración de pagos.

#### 1. Configuración de Pagos y Métodos de Pago del Negocio
- **Base de Datos / Schema:** Actualizar el modelo del negocio para permitir almacenar métodos de pago configurados (ej: Pago Móvil, Transferencia bancaria, Binance) con sus respectivos datos e instrucciones. Añadir un campo en el modelo de `Service` que indique si el servicio **requiere adelanto** (`requiresAdvance: boolean`) y opcionalmente el monto o porcentaje.
- **Vista Configuración (`/admin/configuracion`):** Desbloquear la vista actual (que muestra un aviso de próxima versión) para permitir que el administrador del negocio configure y guarde sus métodos de pago activos (Pago Móvil, Transferencia, Binance) y sus datos de recepción.

#### 2. Flujo de Reserva del Cliente (UX de Calendario y Adelantos)
- **Selector de Fechas y Horarios:** Reemplazar las píldoras de fecha estáticas/absurdas del modal de reserva de la app pública por un **calendario real** interactivo. Al hacer clic en un día del calendario, deben desplegarse de forma limpia e intuitiva los horarios (huecos) disponibles debajo.
- **Pago de Adelanto:** Si el servicio seleccionado por el cliente tiene marcado `requiresAdvance: true`, el flujo de reserva debe incluir un paso obligatorio donde el cliente:
  - Seleccione el método de pago utilizado (Pago Móvil, Transferencia, Binance).
  - Introduzca los datos del pago: Monto, número de referencia.
  - Adjunte la imagen del comprobante (capture de pantalla).
  - Guarde esta información asociada a la reserva creada (estado inicial: *Pendiente*).

#### 3. Panel de Administración de Agenda y Detalles de Cita
- **Filtros de Fecha en la Agenda:** Reemplazar los botones de fechas individuales actuales de la vista de agenda de administración por **dos inputs de fecha (`desde` y `hasta`)** que permitan consultar rangos personalizados. Por defecto, el rango debe marcarse automáticamente desde el día actual hasta el último día del mes en curso.
- **Gestión de Estados de Cita:** El administrador debe poder cambiar el estado de una cita con opciones claras de acción y simulación/envío de notificación al cliente:
  - **Aceptar reserva** (pasa a Confirmada).
  - **Rechazar reserva** (pasa a Cancelada).
  - **Re-agendar** (permite mover fecha/hora con notificación).
- **Detalle de la Cita:** En el modal de detalles de la cita del administrador, si la reserva requirió adelanto, mostrar la información enviada por el cliente: método de pago, referencia, monto y la vista previa/enlace de la imagen del capture de pago para su verificación."

_This spec is governed by `constitution.md` v5.2.0, `specs/business-model.md` and `specs/architecture.md`. It lives in the `book` domain because the affected application is `apps/book`; it extends `specs/book/003-public-portal-minisite`, `specs/book/005-staff-management`, `specs/book/008-api-integration-catalog-sync` and `specs/book/015-availability-time-blocks`. The persistence/schema and GraphQL surface it depends on are the backend counterpart to be specified under the `api` domain._

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Configure the business payment methods (Priority: P1)

As a business owner, I want to configure my active payment methods (Pago Móvil, bank transfer, Binance) with the receiving details and instructions, so my clients know exactly how to pay an advance.

**Why this priority**: Without configured payment methods the advance flow cannot exist; it is the monetization foundation.

**Independent Test**: Open `/admin/configuracion`, enable at least one method, fill its details and save; reload and confirm the values persist; confirm only active methods are offered in the public booking flow.

**Acceptance Scenarios**:

1. **Given** the configuration view, **When** the owner enables a method and saves its details, **Then** the method is persisted and shown as active.
2. **Given** a saved method, **When** the owner disables it and saves, **Then** it stops being offered to clients.
3. **Given** a saved method, **When** the owner reopens the view, **Then** the previously saved details are pre-filled.
4. **Given** an unauthenticated or non-owner request, **When** the configuration is accessed or saved, **Then** it is rejected and nothing changes.

---

### User Story 2 - Pick a real date and time when booking (Priority: P1)

As a client, I want an interactive calendar where choosing a day reveals the available time slots, so booking a date feels natural instead of scrolling through arbitrary pills.

**Why this priority**: It is the entry point of the public booking flow and a direct conversion lever.

**Independent Test**: Open the public booking flow, navigate months, select a day with availability and confirm the slots render below; select a day with none and confirm a clean empty state.

**Acceptance Scenarios**:

1. **Given** the booking modal, **When** it opens, **Then** a real month calendar is shown (not a fixed list of date pills).
2. **Given** a calendar day with availability, **When** the client selects it, **Then** the available time slots are listed below the calendar.
3. **Given** a day without availability, **When** the client selects it, **Then** a clean empty state is shown and no slot can be chosen.
4. **Given** the calendar, **When** the client navigates to another month, **Then** the days and their availability reflect the real backend data.

---

### User Story 3 - Pay an advance for a service that requires it (Priority: P1)

As a client booking a service that requires an advance, I want a mandatory payment step (method, amount, reference and proof) so my reservation is held as Pending until the business verifies it.

**Why this priority**: It is the core monetization behavior requested for this phase.

**Independent Test**: Configure a service with `requiresAdvance` and at least one active method; book it and confirm the payment step is mandatory, the data is stored with the Pending appointment, and a booking without the step is impossible; book a service without the flag and confirm no step appears.

**Acceptance Scenarios**:

1. **Given** a service that does not require an advance, **When** the client books, **Then** no payment step is shown.
2. **Given** a service that requires an advance, **When** the client reaches the payment step, **Then** they must choose a method, enter the amount and reference and attach the proof before confirming.
3. **Given** an incomplete payment step, **When** the client tries to confirm, **Then** the booking is blocked with inline guidance and nothing is created.
4. **Given** a completed payment step, **When** the client confirms, **Then** the appointment is created in **Pending** and carries the payment information.
5. **Given** a service that requires an advance but no active payment method is configured, **When** the client tries to book, **Then** the flow is blocked with a clear message.

---

### User Story 4 - Filter the agenda by a date range (Priority: P1)

As a business owner, I want to query my agenda between a `from` and a `to` date, so I can review any period instead of one day at a time.

**Why this priority**: It is the primary operational control requested for the admin agenda.

**Independent Test**: Open `/admin/agenda`, confirm the default range is today → last day of the current month, change both dates and confirm the list reflects the selected range.

**Acceptance Scenarios**:

1. **Given** the agenda view, **When** it loads, **Then** the range defaults to today → the last day of the current month.
2. **Given** the agenda view, **When** the owner sets a custom `from`/`to` range, **Then** only appointments inside that range are listed.
3. **Given** an empty range, **When** it is applied, **Then** a clean empty state is shown.
4. **Given** an invalid range (`to` before `from`), **When** it is applied, **Then** it is blocked or corrected with clear guidance.

---

### User Story 5 - Accept, reject or reschedule an appointment (Priority: P2)

As a business owner, I want clear actions to accept, reject or reschedule an appointment, with a notification to the client, so I control my agenda end-to-end.

**Why this priority**: It completes the appointment lifecycle control requested for the admin panel.

**Independent Test**: On a pending appointment, accept it (→ Confirmed), reject it (→ Cancelled) and reschedule it to another date/time, confirming the status/date update and that each action records a notification to the client.

**Acceptance Scenarios**:

1. **Given** a pending appointment, **When** the owner accepts it, **Then** its status becomes Confirmed and a notification is recorded for the client.
2. **Given** an appointment, **When** the owner rejects it, **Then** its status becomes Cancelled and a notification is recorded.
3. **Given** an appointment, **When** the owner reschedules it to a new date/time, **Then** the appointment moves and a notification is recorded.
4. **Given** an unavailable or conflicting slot, **When** the owner reschedules, **Then** it is blocked with a clear message and the appointment is unchanged.

---

### User Story 6 - Verify the advance payment from the appointment detail (Priority: P2)

As a business owner, I want to see the payment information the client submitted (method, reference, amount and the proof image), so I can verify it before accepting the reservation.

**Why this priority**: It closes the loop between the client's payment and the owner's decision.

**Independent Test**: Open the detail of an appointment created with an advance and confirm the method, reference, amount and proof preview/link are shown; open a non-advance appointment and confirm no payment section appears.

**Acceptance Scenarios**:

1. **Given** an appointment that required an advance, **When** the owner opens its detail, **Then** the method, reference, amount and proof preview/link are shown.
2. **Given** an appointment that did not require an advance, **When** the owner opens its detail, **Then** no payment section is shown.
3. **Given** a proof image that cannot be rendered, **When** the detail opens, **Then** a link/fallback is shown instead of a broken image.

---

### Edge Cases

- A service requires an advance but the business has no active payment method: the public booking is blocked with a clear, actionable message.
- The client selects a payment method and then the owner disables it mid-session: the booking is rejected cleanly and no appointment is created.
- Proof image with unknown dimensions or that fails to load: a link/fallback is shown; the flow is not broken.
- Amount entered as zero, negative or non-numeric: blocked inline.
- The `from`/`to` range crosses months or is entirely in the past: allowed, with a clean empty state when nothing matches.
- Rescheduling into a slot that is already taken: blocked with a conflict message; the original slot is preserved.
- Accepting/rejecting an appointment already in the target state: succeeds without error (idempotent).
- A client abandons the payment step: no appointment is created (no orphan Pending records without payment data).
- Proof file is missing, exceeds the maximum size or is an unsupported format: the booking is blocked inline with clear guidance and nothing is created.
- The proof upload fails (network/storage error): the booking is not created and the client can retry without losing the entered data.
- The public page is opened by the owner while the client is mid-flow: the calendar/slots always reflect the persisted availability.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: The business MUST be able to store a set of configured payment methods, each with a type (at least: mobile payment, bank transfer, Binance), receiving details/instructions and an active flag.
- **FR-002**: The configuration view at `/admin/configuracion` MUST be unlocked and MUST allow the owner to view, edit, enable/disable and save the business payment methods; the current "coming soon" notice MUST be removed.
- **FR-003**: Only active payment methods MUST be offered in the public booking advance step.
- **FR-004**: A service MUST be able to be marked as requiring an advance, and MUST optionally define the advance as a fixed amount or a percentage of its price.
- **FR-005**: The public booking flow MUST present an interactive calendar; selecting a day MUST reveal the available time slots below it, based on the real persisted availability.
- **FR-006**: When the selected service requires an advance, the booking flow MUST include a mandatory payment step: choose a method, enter the amount and a reference, and attach the proof image as an **uploaded file** (screenshot), validated for supported format and a maximum size.
- **FR-007**: The booking MUST NOT be created if a required advance step is incomplete; an advance-required service with no active method MUST block the booking with a clear message.
- **FR-008**: An appointment created with an advance MUST be persisted in **Pending** state together with its payment information (method, amount, reference, proof).
- **FR-009**: The admin agenda MUST offer `from`/`to` date inputs, defaulting to today → the last day of the current month, and MUST list only appointments inside the selected range.
- **FR-010**: The admin MUST be able to accept (→ Confirmed), reject (→ Cancelled) and reschedule an appointment; each action MUST record a notification to the client (simulated or sent).
- **FR-011**: The appointment detail modal MUST show the advance payment information (method, reference, amount, proof preview/link) when the appointment required an advance, and MUST omit it otherwise.
- **FR-012**: All write operations MUST be tenant-scoped from the authenticated owner; anonymous or foreign requests MUST be rejected with the stable errors and MUST NOT change data.
- **FR-013**: Automated tests MUST cover: payment-method configuration (save/enable/disable, tenant scope), the calendar + slots rendering, the mandatory advance step (present/absent, incomplete blocked, created Pending with payment), the agenda range filter (default + custom + empty), the status actions (accept/reject/reschedule + notification) and the appointment detail (advance shown/omitted).
- **FR-014**: All book gates (`build`, `typecheck`, `test`, lint) MUST pass with no regressions under strict TypeScript.

### Key Entities _(include if feature involves data)_

- **Payment method**: a way the business receives an advance, with a type (mobile payment / bank transfer / Binance), receiving details/instructions and an active flag.
- **Service advance rule**: whether a service requires an advance and, optionally, the required amount (fixed amount or percentage of its price).
- **Advance payment**: the payment a client submits for a booking (method used, amount, reference, proof image) attached to the appointment.
- **Appointment**: a booking with a lifecycle status (at least Pending, Confirmed, Cancelled) and, when applicable, an advance payment.
- **Client notification**: a record of the message produced by a status change or reschedule, intended for the client (simulated or sent in this phase).

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: 100% of bookings for advance-required services carry complete payment information (method, amount, reference, proof) before the appointment is created.
- **SC-002**: 0 appointments are created without the payment data required by their service.
- **SC-003**: An owner can configure or update payment methods and see them reflected in the public flow within the same interaction (no manual reload).
- **SC-004**: A client can move from opening the booking flow to selecting a day and a time slot in a single continuous interaction, with slots appearing directly below the calendar.
- **SC-005**: An owner can query any custom date range in at most two interactions, with the default range already covering the current month.
- **SC-006**: 100% of accept/reject/reschedule actions record a client notification and leave the appointment in the expected state.
- **SC-007**: The appointment detail shows the submitted advance payment for 100% of advance-required appointments and omits it for the rest.
- **SC-008**: All book gates pass with zero regressions.

## Assumptions

- **Companion backend feature**: the persistence/schema (payment methods, `requiresAdvance` + amount/percentage, advance payment data, appointment status/reschedule) and its GraphQL surface are the `api` counterpart of this spec, to be specified under `/specs/api/`; this spec defines the user-facing behavior only.
- **Manual verification**: there is no payment gateway integration; the owner verifies the client's submitted proof manually. No automatic charge or reconciliation is in scope.
- **Fixed method types**: the method *types* are the requested closed set (mobile payment, bank transfer, Binance); the receiving details and instructions are free-form per method.
- **Advance amount**: configurable per service as either a fixed amount or a percentage of the service price; a reasonable default is a percentage when only the price is known.
- **Client notification is simulated/recorded in this phase** (no email/SMS/WhatsApp provider); the record exists so a real channel can be wired later without changing the flow.
- **Advance step scope**: the advance step applies to public online bookings; appointments created manually by the owner are exempt.
- **Calendar behavior**: only days within the configured booking horizon and with real availability are selectable; the calendar reflects the business timezone.
- **Proof image = uploaded file (resolved)**: the client uploads a screenshot in the advance step; this feature introduces an image upload/storage path for the booking flow with format and maximum-size validation, and the admin detail renders a preview with a link fallback. Pasting an image URL is out of scope for v1.
- **Respect for the governance hierarchy**: follows `specs/business-model.md` (a trustworthy, monetizable Foundly Book) and the authority order of `constitution.md`.
