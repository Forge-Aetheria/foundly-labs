# Feature Specification: Foundly Book — Admin Payments & Schedules Redesign

**Feature Branch**: `022-admin-payments-schedules-refactor`

**Created**: 2026-10-14

**Status**: Draft

**Input**: User description: "@apps/book — Refactorización del Admin (/admin): Métodos de Pago Estructurados y Gestión de Horarios. Rediseñar Métodos de Pago como lista de cards por método (Pago Móvil, Binance Pay, Zelle, Transferencia, Efectivo) con modal de creación/edición y campos estructurados según el tipo; y rediseñar Horarios/Disponibilidad con horario semanal (toggle + hora inicio/fin) y bloqueos (rango de horas / días completos). Mantener la paleta Foundly Book, rounded, badges de estado. Actualizar mutaciones/queries y specs."

_This spec is governed by `constitution.md` v5.2.0, `specs/business-model.md` (Foundly Book, §2.3) and `specs/architecture.md`. It lives in the `book` domain. It amends the payment-method configuration described in `specs/book/017-advance-payments-booking` and the admin availability surface in `specs/book/015-availability-time-blocks`. It requires a coordinated contract change on the backend, specified in `specs/api/016-advance-payments` (enum + structured `details` + `title`)._

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Manage payment methods as structured cards (Priority: P1)

As a business owner, I want my payment methods shown as cards (one per method) and a structured modal to create/edit them, so that I can define exactly which receiving data each method needs (Pago Móvil, Binance Pay, Zelle, Transferencia, Efectivo) without writing free-form text.

**Why this priority**: The current single free-form form is hard to operate and cannot express the requested method kinds. Structured, card-based management is the core of the redesign.

**Independent Test**: Open `/admin/configuracion`, click "+ Nuevo Método de Pago", choose a type, fill its structured fields and save; confirm a card appears with title, type, a data summary and an active badge; edit it, toggle it off and delete it, confirming persistence each time.

**Acceptance Scenarios**:

1. **Given** the configuration view with no methods, **When** it renders, **Then** it shows an empty state and a "+ Nuevo Método de Pago" action.
2. **Given** the create modal, **When** I pick "Pago Móvil", **Then** the form shows Título, Cédula/RIF, Teléfono, Banco, Titular and Instrucciones.
3. **Given** the create modal, **When** I pick "Binance Pay" / "Zelle" / "Transferencia", **Then** the form shows the type-specific fields (Pay ID / Email / Cuenta) plus Titular and Instrucciones.
4. **Given** a saved method, **When** I view its card, **Then** it shows the title, the type, a summary of the structured data and an Activo/Inactivo badge.
5. **Given** a saved method, **When** I edit it, toggle its state, or delete it (with confirmation), **Then** the change persists and the card list reflects it.

---

### User Story 2 - Redesigned weekly schedule & availability blocks (Priority: P1)

As a business owner, I want a clean weekly schedule with per-day activation and start/end times, plus a dedicated block section that supports blocking a time range or a full day, so that managing my open hours and exceptions is quick and unambiguous.

**Why this priority**: The schedules module is the operational core for availability; the current layout mixes weekly rules and blocks without a clear structure.

**Independent Test**: Open `/admin/availability`, toggle days, set times, save the weekly schedule; then add a time-range block and a full-day block and remove one, confirming each persists and renders correctly.

**Acceptance Scenarios**:

1. **Given** the weekly schedule, **When** it renders, **Then** each weekday (Lunes–Domingo) has an activation toggle and, when enabled, start and end time selectors, plus a "Guardar horario semanal" action.
2. **Given** a day is toggled off, **When** the schedule is saved, **Then** that day is stored as closed.
3. **Given** the blocks card, **When** I switch between "Rango de horas" and "Días completos", **Then** the inputs adapt (time range vs full-day) accordingly.
4. **Given** "Días completos", **When** I pick a date and confirm, **Then** the whole day is blocked.
5. **Given** "Rango de horas", **When** I pick a date, start and end, **Then** only that range is blocked; an end not after the start is blocked inline.
6. **Given** an existing block, **When** I remove it with confirmation, **Then** it disappears and the slot is available again.

---

### User Story 3 - Consistent, accessible admin surfaces (Priority: P2)

As an operator, I want the payments and schedules screens to reuse the shared design system (cards, rounded corners, badges, structured inputs) and to be keyboard-accessible, consistent with the rest of the panel.

**Why this priority**: Consistency and accessibility are ecosystem requirements that refine, not enable, the core flows.

**Independent Test**: Traverse both redesigned screens by keyboard (toggles, selects, modal, tabs, actions) and confirm focus is visible, labels are announced and automated accessibility checks report zero critical violations.

**Acceptance Scenarios**:

1. **Given** any redesigned screen, **When** it renders, **Then** it uses `@foundly/ui` components and tokens with rounded cards and status badges and no ad-hoc brand colors.
2. **Given** the redesigned screens, **When** navigated by keyboard, **Then** all controls are reachable and labelled and automated accessibility checks pass with zero critical violations.

---

### Edge Cases

- All five method types already configured: the "+ Nuevo Método de Pago" action is disabled and the modal offers no new type.
- Only one method per type per business: choosing a type already in use (while creating) is not offered; editing keeps the type fixed.
- Optional structured fields left blank: the method is still saved; blank fields are dropped from the persisted data and the card shows "Sin datos configurados".
- Toggling a method's state preserves its structured data (it does not clear the fields).
- Deleting a method removes it from the list immediately and from the public advance step after revalidation.
- Saving the weekly schedule with no days open: all days are stored closed.
- Full-day block while a time-range block already covers part of the day: both are allowed (union of blocked intervals).
- Block with end not after start (range mode) or missing date: blocked inline before saving.
- A method type removed/renamed in the backend but referenced by old data: the UI falls back to a readable label instead of crashing.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: `/admin/configuracion` MUST present payment methods as a list of cards, one per configured method, each showing its title, type, a summary of its structured data and an Activo/Inactivo badge, with Editar, toggle and Eliminar actions.
- **FR-002**: The view MUST provide a "+ Nuevo Método de Pago" action that opens a create/edit modal; the modal MUST offer the type selector (Pago Móvil, Binance Pay, Zelle, Transferencia, Efectivo) and MUST render structured fields specific to the selected type.
- **FR-003**: The structured fields MUST be: Pago Móvil → Título, Cédula/RIF, Teléfono, Banco, Titular, Instrucciones; Binance Pay → Pay ID, Titular, Instrucciones; Zelle → Email, Titular, Instrucciones; Transferencia → Cuenta, Titular, Instrucciones; Efectivo → Titular, Instrucciones. Título and Instrucciones apply to every type.
- **FR-004**: Payment method data MUST be persisted as a structured object (receiving data) plus a title, instructions and an active flag; at most one method per type per business; editing keeps the type fixed.
- **FR-005**: `/admin/availability` MUST present the weekly schedule as rows (Lunes–Domingo) with a per-day activation toggle and, when enabled, start/end time selectors, plus a "Guardar horario semanal" action that persists open/closed days and their times.
- **FR-006**: The availability view MUST include a dedicated blocks card with a "Rango de horas" / "Días completos" selector and structured inputs (Fecha; Hora de inicio/fin when range).
- **FR-007**: A "Días completos" block MUST block the whole selected day; a "Rango de horas" block MUST block only the selected interval; invalid ranges (end not after start) or missing date MUST be blocked inline and MUST NOT persist.
- **FR-008**: Removing a block MUST require confirmation and MUST delete it on the server; the public slot computation MUST exclude every blocked interval.
- **FR-009**: The payment-method and schedule mutations/queries MUST be updated to the structured contract; the UI MUST reach data only through each module's `actions.ts`/`hooks.ts` (constitution §5.VI).
- **FR-010**: The backend contract MUST be extended (payment method types and structured `details`) consistently with `specs/api/016-advance-payments`; the versioned SDL snapshot and generated types MUST be regenerated by codegen.
- **FR-011**: The redesigned screens MUST use the shared design system (rounded cards, tokens, status badges) and MUST pass automated accessibility checks with zero critical violations.
- **FR-012**: All book gates (`typecheck`, `lint`, `test`, `build`) MUST pass under strict TypeScript.

### Key Entities _(include if feature involves data)_

- **PaymentMethod**: A way the business receives an advance. Attributes: `type` (Pago Móvil · Binance Pay · Zelle · Transferencia · Efectivo), `title`, structured `details` (holder, cedula, phone, bank, payId, email, account), `instructions`, `active`. Unique per (business, type).
- **WeeklySchedule (AvailabilityRule)**: The business's opening hours per weekday (open flag + start/end time).
- **TimeBlock**: A concrete unavailability interval (start, end, optional reason); a full-day block spans 00:00–23:59. Part of the tenant's availability.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: An owner can create a payment method with its structured fields in under 1 minute.
- **SC-002**: 100% of payment methods render as a card with title, type, data summary and an active badge; 100% of create/edit flows use the type-specific fields.
- **SC-003**: 100% of unsupported states are handled cleanly: no duplicate type per business, blank optional fields allowed, invalid block ranges blocked inline.
- **SC-004**: An owner can save the weekly schedule and add both a time-range and a full-day block in under 2 minutes, each persisting after a reload.
- **SC-005**: The redesigned screens pass automated accessibility checks with zero critical violations and use the shared design system exclusively.

## Assumptions

- Governed by `constitution.md` v5.2.0 and `specs/business-model.md` (Foundly Book, §2.3).
- The payment-method contract change (new type values + `title` + JSON-encoded `details`) is specified in `specs/api/016-advance-payments`; this feature consumes it. A database enum migration is required on the backend (documented in the API spec/quickstart).
- The type set is a closed set of five values; a new type would be a future addition, not a free-form field.
- Structured receiving data is persisted as a JSON string on the existing `details` string field (no new database columns beyond the enum/`title`).
- Weekly schedule and blocks reuse the existing availability/time-block backend surface; "full day" is expressed as 00:00–23:59 (no new backend flag).
- This feature amends `specs/book/017-advance-payments-booking` (payment-method configuration) and `specs/book/015-availability-time-blocks` (admin availability layout); the public booking advance step and the seeded data keep working.
