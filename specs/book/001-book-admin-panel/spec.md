# Feature Specification: Foundly Book — Admin Panel (Appointments, Services & Availability)

**Feature Branch**: `001-book-admin-panel`

**Created**: 2026-10-08

**Status**: Draft

**Input**: User description: "Crear la especificación para el panel de administración de Foundly Book en el dominio book. Debe incluir el modelo de datos para citas, catálogo de servicios/tarifas y reglas de disponibilidad/bloqueo de horarios, utilizando la interfaz de @foundly/ui."

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Manage the appointment schedule (Priority: P1)

As an administrator or professional, I want to see and manage the appointment calendar so that I can create, review, reschedule and cancel bookings for the business without double-bookings.

**Why this priority**: The agenda is the core of Foundly Book. Nothing else delivers value until appointments can be managed reliably.

**Independent Test**: Open the agenda for a given day/resource, create an appointment in an available slot, reschedule and cancel it, and confirm no two appointments ever occupy the same resource and time.

**Acceptance Scenarios**:

1. **Given** the agenda view, **When** the administrator opens a day and selects a resource, **Then** all existing appointments for that resource are shown with their status.
2. **Given** an available slot, **When** the administrator creates an appointment choosing a service, a resource and a start time, **Then** the appointment is created with the correct duration and enters its initial lifecycle state.
3. **Given** an existing appointment, **When** the administrator reschedules it to another available slot, **Then** the original slot is freed and the appointment moves.
4. **Given** an existing appointment, **When** the administrator cancels it with a reason, **Then** it is marked cancelled and retains an audit trail of the change.
5. **Given** a slot already occupied, **When** the administrator tries to book it, **Then** the system prevents the double-booking and offers only valid alternatives.

---

### User Story 2 - Manage the services and pricing catalog (Priority: P2)

As an administrator, I want to maintain the catalog of services with their durations and prices so that appointments always use accurate service definitions.

**Why this priority**: Appointments and availability depend on service duration and pricing; the catalog is the second foundational pillar.

**Independent Test**: Create, edit, deactivate and reactivate a service with a duration and price, and confirm it is offered (or withheld) appropriately in the appointment flow.

**Acceptance Scenarios**:

1. **Given** the catalog, **When** the administrator creates a service with name, duration and price, **Then** it becomes available for new appointments.
2. **Given** an existing service, **When** the administrator updates its duration or price, **Then** new appointments use the updated definition.
3. **Given** a service with future appointments, **When** the administrator deactivates it, **Then** it is no longer offered for new bookings but existing appointments remain intact.
4. **Given** a service, **When** the administrator defines a rate (price and currency) with an effective period, **Then** the correct rate is applied according to the appointment date.

---

### User Story 3 - Configure availability and time blocking (Priority: P3)

As an administrator, I want to define working hours, breaks and blocked periods so that bookable slots reflect real availability.

**Why this priority**: Availability rules determine which slots are offered; without them the agenda cannot prevent invalid bookings.

**Independent Test**: Define weekly working hours and a blocked period for a resource, then confirm offered slots exclude breaks, blocks and existing appointments.

**Acceptance Scenarios**:

1. **Given** a resource, **When** the administrator sets weekly working hours, **Then** only slots inside those hours are offered.
2. **Given** a resource, **When** the administrator creates a one-off or recurring block, **Then** the affected slots are no longer offered.
3. **Given** a service with a required buffer (e.g., cleanup time), **When** availability is computed, **Then** the buffer is respected around appointments.
4. **Given** an existing appointment that would fall inside a newly created block, **When** the block is saved, **Then** the conflict is surfaced and must be resolved (keep, move or cancel).

---

### User Story 4 - Consistent, accessible administration experience (Priority: P4)

As an operator, I want every admin screen to share the ecosystem's visual identity and be keyboard-accessible so that the panel is consistent and usable for everyone.

**Why this priority**: Consistency and accessibility are product requirements of the ecosystem, but they refine rather than enable the core flows.

**Independent Test**: Traverse the agenda, catalog and availability screens using only the keyboard and confirm the shared visual system is applied with no ad-hoc styling.

**Acceptance Scenarios**:

1. **Given** any admin screen, **When** it renders, **Then** it uses the shared design-system components and tokens with no ad-hoc brand styling.
2. **Given** any admin screen, **When** navigated by keyboard only, **Then** all interactive controls are reachable, focus is visible and actions are operable.
3. **Given** a data-entry form (appointment, service, block), **When** validation fails, **Then** clear, accessible error messaging is shown inline.
4. **Given** any admin screen, **When** it renders, **Then** a persistent left navigation shell groups the module sections (Agenda, Servicios, Disponibilidad) and the secondary options (Configuración, Ayuda/Soporte, Acerca de Foundly), shows the Foundly Book brand identity (logo/icon) at the top and the active user profile (avatar + name + role) at the bottom, and highlights the current section.
5. **Given** a small viewport, **When** the operator opens the navigation, **Then** the shell collapses into a temporary drawer that can be dismissed by keyboard and by selecting a section.
6. **Given** the services catalog view, **When** it renders, **Then** the operator can search services by name from a quick-search bar, see the tariff and state as styled badges, and access per-service row actions (edit/delete entry points) with clear feedback when the underlying mutation is still pending.
7. **Given** the agenda view, **When** it renders, **Then** the operator can filter by day (with a "today" shortcut) and by status, inspect an appointment's details (client, date/time, service, professional, state) and open a "new appointment" flow from the header.
8. **Given** any admin screen, **When** it renders, **Then** the shell's content area shares the module's continuous brand canvas (`004-book-brand-canvas`): no opaque full-screen background hides the lavender gradient, and the white sidebar (panel) plus the routed cards pop over it with the shared soft shadows.

---

### Edge Cases

- Two administrators attempt to book the same slot concurrently; only one booking succeeds and the other is told to choose another slot.
- A blocked period is created on top of existing appointments; the conflict must be reported before the block is confirmed.
- A service is deactivated while it has future appointments; those appointments must remain valid and visible.
- A price or duration changes after an appointment was booked; the booked appointment keeps the value it was created with.
- An appointment's end time crosses midnight into the next day.
- Daylight-saving transitions or timezone changes shift the offset of existing appointments.
- A resource is temporarily unavailable (sick leave); affected appointments must be identifiable for reassignment or cancellation.
- The panel is used offline or with intermittent connectivity (local-first): changes must not be silently lost.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: The panel MUST provide an agenda view filterable by date range and by resource (professional/resource).
- **FR-002**: The panel MUST allow creating an appointment by selecting a service, a resource and a start time from the set of available slots.
- **FR-003**: The panel MUST allow rescheduling and cancelling an appointment, capturing a reason, and MUST retain an audit trail of these changes.
- **FR-004**: The panel MUST prevent double-booking: a resource cannot have two overlapping appointments unless capacity for that slot allows it.
- **FR-005**: An appointment MUST have a lifecycle with at least the states: pending, confirmed, checked-in, completed, cancelled and no-show.
- **FR-006**: The panel MUST allow creating, editing, activating and deactivating services, each with a name, duration and price.
- **FR-007**: The panel MUST support a rate (price + currency) per service with an effective period, and MUST apply the correct rate for the appointment date.
- **FR-008**: An appointment MUST store a snapshot of the service duration and price applied at booking time, independent of later catalog changes.
- **FR-009**: The panel MUST allow defining weekly working hours per resource.
- **FR-010**: The panel MUST allow creating one-off and recurring blocked periods per resource, including breaks.
- **FR-011**: The panel MUST support a configurable slot granularity, a minimum booking lead time and a booking horizon.
- **FR-012**: Computed availability MUST respect working hours, breaks, blocks, service duration, required buffers and existing appointments.
- **FR-013**: When a new block or reschedule conflicts with existing appointments, the panel MUST surface the conflict and require the administrator to resolve it (keep, move or cancel).
- **FR-014**: Deactivating a service or resource MUST NOT alter or delete existing appointments.
- **FR-015**: The panel MUST restrict administrative capabilities to licensed, authorized users (roles), consistent with the ecosystem's centralized identity.
- **FR-016**: Every admin screen MUST be fully operable by keyboard and expose accessible labels, roles and inline validation messages.
- **FR-017**: Every admin screen MUST use the shared design system and its tokens; no ad-hoc brand styling is permitted. Every admin screen MUST render over the module's continuous brand canvas (`004-book-brand-canvas`) without any opaque full-screen background layer.
- **FR-018**: Administrative changes MUST follow the ecosystem's local-first principle: work must not be blocked by connectivity and pending changes must be recoverable.
- **FR-021**: The services catalog view MUST offer a quick search by service name, a create entry point and per-service row actions (edit/delete), presenting explicit feedback when a mutation is not yet available; the catalogue MUST keep the Servicio/Duración/Tarifa/Estado columns and render the tariff as a clean badge.
- **FR-022**: The agenda view MUST offer date filtering (including a "today" shortcut) and a status filter, show each appointment's service, professional and contact information, render semantic status badges, and provide detail and "new appointment" entry points (UI-level, backed by mock data until mutations land).
- **FR-019**: The admin panel MUST present a persistent left navigation shell that groups the module's primary sections (agenda, services, availability) and its secondary options (settings, help/support, about), carrying the Foundly Book brand identity (logo/icon) at the top and the active user profile (avatar, display name and role) at the bottom.
- **FR-020**: The navigation shell MUST mark the active section, remain fully keyboard-operable, and collapse into a temporary drawer on small viewports; navigation must use the ecosystem's shared iconography.

### Key Entities _(include if feature involves data)_

- **Appointment (Cita)**: A booking of a service for a client with a specific resource and time range. Key attributes: client reference, resource, service reference, start, end, status (lifecycle), notes, applied duration and price snapshot, origin (admin/online), audit trail.
- **Service (Servicio)**: A bookable offering. Key attributes: name, description, default duration, category, active flag, required buffer, resources that provide it.
- **Rate (Tarifa)**: The price of a service. Key attributes: service reference, amount, currency, effective-from / effective-to.
- **Resource (Profesional/Recurso)**: A bookable professional, room or asset. Key attributes: name, type, services offered, active flag.
- **AvailabilityRule (Regla de disponibilidad)**: Recurring working hours for a resource. Key attributes: resource reference, weekday, start time, end time, slot granularity, minimum lead time, booking horizon.
- **TimeBlock (Bloqueo de horario)**: A period when a resource is unavailable. Key attributes: resource reference, start, end, reason, recurrence (one-off/daily/weekly), created-by.
- **AppointmentStatus (Estado de cita)**: The lifecycle state of an appointment: pending → confirmed → checked-in → completed, plus cancelled and no-show.

**Relationships**: A Resource provides many Services; a Service has one or more Rates; an Appointment references exactly one Resource and one Service and is constrained by AvailabilityRules and TimeBlocks; appointment availability is the intersection of working hours, minus breaks and blocks, minus existing appointments, adjusted by service duration and buffers.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: An administrator can open today's agenda for a resource in under 30 seconds from login.
- **SC-002**: An administrator can create a correctly-slotted appointment in under 1 minute.
- **SC-003**: 100% of overlapping-booking attempts are prevented by the system.
- **SC-004**: 100% of offered slots respect working hours, breaks, blocks, service duration and buffers.
- **SC-005**: Price or duration changes in the catalog affect 100% of new appointments and 0% of already-booked appointments.
- **SC-006**: Every admin screen passes automated accessibility checks with zero critical violations and is fully keyboard-operable.
- **SC-007**: 100% of admin UI uses shared design-system components and tokens (no ad-hoc brand colors).
- **SC-008**: 100% of admin screens render inside the shared navigation shell, which exposes the brand identity, the active user profile and the current section on every route.

## Assumptions

- Governed by `specs/business-model.md` (maximum authority) — specifically the Foundly Book module definition (§2.3) and the licensing/SSO rules of Foundly Pass (§3); plus `constitution.md` v5.0.0, `specs/architecture.md`, `specs/system-design.md` and `code-rules.md`.
- The admin panel is a module of `apps/book` (Next.js / React 19) and consumes the shared design system `@foundly/ui` for its interface.
- Data is held in an in-memory store (mock) for this version; the ecosystem's persistence strategy is not yet defined, so the panel keeps storage behind a single decoupled seam.
- Access is governed by Foundly Pass (centralized identity); the panel supports at least an administrator role and a professional role, with administrators able to configure catalog and availability.
- A calendar operates in a single timezone per business by default; multi-timezone scheduling is out of scope for this version.
- Client-facing online booking is out of scope; this feature covers the administrative panel only.
- Payments/checkout are out of scope; the panel may reference prices but does not process payments.
- Notifications/reminders are out of scope for this version (they belong to the appointment lifecycle roadmap).
- The panel uses the Foundly Book branding assets (full logo and isotipo) and the ecosystem's shared iconography for its navigation shell.
- The panel shares the module's continuous brand canvas (`004-book-brand-canvas`): its content area sits over the same lavender gradient as `/onboarding`, while the white sidebar and cards remain intentional panels over it.
