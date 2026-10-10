# Feature Specification: Foundly Book — Public Portal Mini-Site (Setmore-style)

**Feature Branch**: `003-public-portal-minisite`

**Created**: 2026-10-09

**Status**: Draft

**Input**: User description: "Refactor completo del portal público `/book/[tenantSlug]` para llevarlo al estándar de experiencia de un mini-sitio completo tipo Setmore (ej. ronapiercing.setmore.com): (1) Brand Hero / cabecera comercial con cover lavanda, avatar/logo, nombre, categoría, badges, biografía y contacto (dirección, teléfono, Instagram, WhatsApp); (2) sistema de pestañas: Servicios (tarjetas con nombre, descripción, duración, precio y botón pill 'Reservar'), Equipo / Especialistas (avatares y roles), e Información & Políticas (horarios por día y políticas); (3) flujo de agendamiento guiado en 4 pasos (especialista → fecha y franjas → datos del cliente → confirmación); (4) garantía UI/UX con @foundly/ui, tests en verde y build correcto."

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Explore a business through its branded public page (Priority: P1)

As a client, I want to open a business's public page and immediately understand who they are, what they offer, and how to contact them so that I decide to book with confidence.

**Why this priority**: The branded hero and catalog are the storefront; without a trustworthy, informative page there is no booking.

**Independent Test**: Open an active business page, confirm the cover, identity (avatar/logo, name, category, badges), the "Sobre nosotros" biography, and the contact data (address, phone, Instagram, WhatsApp) are all visible; unknown/inactive businesses show the "unavailable" state.

**Acceptance Scenarios**:

1. **Given** an active business, **When** I open its public page, **Then** I see a decorative cover, the brand avatar/logo, name, category and status badges.
2. **Given** the public page, **When** I scroll, **Then** a biography section ("Sobre nosotros") and the contact details (physical address, phone, social links) are shown.
3. **Given** an unknown, draft or suspended business, **When** I open its page, **Then** only an "unavailable" state is shown and no business data is exposed.

---

### User Story 2 - Book a service through a guided flow (Priority: P1)

As a client, I want to book a service in a few guided steps so that the appointment is created online without calling the business.

**Why this priority**: Booking is the core value of the public portal; it turns the storefront into real appointments.

**Independent Test**: Choose a service, confirm a specialist and an available slot, enter client data and confirm; verify an appointment with an "online" origin appears in the business's agenda.

**Acceptance Scenarios**:

1. **Given** the Servicios tab, **When** I activate "Reservar" on a service, **Then** the guided flow opens with the service preselected.
2. **Given** a business with several specialists, **When** I reach step 1, **Then** I can choose a specialist (when the business offers more than one); otherwise the step is skipped.
3. **Given** a selected specialist and service, **When** I pick a date, **Then** only available time slots (respecting hours, blocks and existing appointments) are offered.
4. **Given** a chosen slot, **When** I submit my name, email, phone and optional notes, **Then** a confirmation step shows the appointment summary before finalizing.
5. **Given** an occupied slot at the moment of confirmation, **When** the booking is attempted, **Then** the client is informed and offered the remaining slots.
6. **Given** a completed flow, **When** the client confirms, **Then** the appointment is created with an "online" origin and an initial pending status.

---

### User Story 3 - Meet the team and the policies (Priority: P2)

As a client, I want to see who works at the business and its scheduling policies so that I book with realistic expectations.

**Why this priority**: Trust and clarity reduce cancellations and no-shows; it enriches the mini-site without enabling the booking itself.

**Independent Test**: Open the Equipo tab and the Información & Políticas tab and confirm specialists (avatar + role) and the weekly schedule plus booking/cancellation policies are readable.

**Acceptance Scenarios**:

1. **Given** the Equipo tab, **When** I open it, **Then** the business's active specialists are listed with an avatar and their role.
2. **Given** the Información & Políticas tab, **When** I open it, **Then** the opening hours are shown per weekday and the booking/cancellation policies are explained.
3. **Given** a business with no specialists configured, **When** the Equipo tab is opened, **Then** an empty state explains that the team will be listed soon.

---

### User Story 4 - Consistent, responsive and accessible mini-site (Priority: P2)

As any user, I want the public page to feel like the rest of the ecosystem (Clean Light UI) and to work on any screen, including by keyboard.

**Why this priority**: Consistency and accessibility are product requirements that refine the storefront experience.

**Independent Test**: Traverse the three tabs and the booking flow using only the keyboard on a mobile viewport and confirm no horizontal overflow and no accessibility violations.

**Acceptance Scenarios**:

1. **Given** the public page, **When** it renders, **Then** it uses the shared design system exclusively (pill buttons, `#6C5CE7` accents, bold typography, rounded cards).
2. **Given** any viewport, **When** the page is opened, **Then** there is no horizontal overflow and the layout adapts (single column on small screens).
3. **Given** any interactive control (tabs, buttons, slots, fields), **When** navigated with the keyboard, **Then** focus is visible and every action is operable.

---

### Edge Cases

- A business has no specialists configured; the specialist step is skipped and the Equipo tab shows an empty state.
- The selected date offers zero slots (closed day, past day or fully booked); the client sees the reason and can pick another date.
- Between slot selection and confirmation the slot is taken; the flow surfaces the conflict and the remaining slots without losing the client data already entered.
- A client enters an invalid email or phone; the flow blocks progression with inline errors.
- The business shows prices with multiple currencies; the presented price is the tenant's current rate for that service.
- The business has no biography, address or social links configured; those sections are omitted or show tasteful placeholders rather than breaking the layout.
- A client books across the booking horizon, below the minimum lead time, or into a blocked period; those slots are never offered.
- Unknown, draft or suspended tenants must never expose any business data.

## Requirements _(mandatory)_

### Functional Requirements

**Brand hero & identity**

- **FR-001**: The public page MUST render a decorative cover banner using the brand's lavender surface to frame the business identity.
- **FR-002**: The public page MUST show the business avatar/logo, commercial name, category and relevant status badges.
- **FR-003**: The public page MUST include a "Sobre nosotros" biography section.
- **FR-004**: The public page MUST expose contact data when configured: physical address, phone and social links (Instagram, WhatsApp).

**Tabs system**

- **FR-005**: The public page MUST organize its content in tabs, with 'Servicios' as the default.
- **FR-006**: The 'Servicios' tab MUST list each active service as a card showing name, description, duration in minutes, current price and a pill "Reservar" button.
- **FR-007**: The 'Equipo / Especialistas' tab MUST list the business's active specialists with their avatar and role; if none exist, it MUST show an empty state.
- **FR-008**: The 'Información & Políticas' tab MUST show the weekly opening hours per weekday and the business's booking and cancellation policies.

**Guided booking flow**

- **FR-009**: Activating "Reservar" on a service MUST open a guided booking flow with that service preselected, inside an `@foundly/ui` glass Modal over the shared canvas.
- **FR-010**: The flow MUST offer a specialist selection step when the business has more than one active specialist; otherwise it MUST be skipped.
- **FR-011**: The flow MUST offer an interactive date and time-slot selector that only shows slots respecting the business hours, blocks, lead time, horizon and existing appointments.
- **FR-012**: The flow MUST collect the client's name, email, phone and optional notes, with inline validation.
- **FR-013**: The flow MUST end with a confirmation step summarizing the service, specialist, date, time and client data before creating the appointment.
- **FR-014**: The confirmed booking MUST create an appointment with an "online" origin in a pending state and MUST be rejected (`CONFLICT`) if the slot was taken in the meantime.
- **FR-015**: Slots taken between rendering and confirmation MUST be removed from the offered set without losing already entered client data.

**Content guardrails**

- **FR-016**: The public page MUST expose no data for unknown, draft or suspended tenants (unavailable state only).
- **FR-017**: The presented service price MUST be the tenant's current applicable rate.
- **FR-018**: Every surface MUST use the shared design system and its tokens; no ad-hoc brand styling is permitted. Every surface MUST render over the module's continuous brand canvas (`004-book-brand-canvas`) with no opaque full-screen background layer; cards and pills MUST replicate the landing's glassmorphism and pill style (`landingCanon.ts`).
- **FR-019**: The page MUST be fully keyboard-operable and pass automated accessibility checks with zero critical violations.
- **FR-020**: The page MUST adapt to small viewports without horizontal overflow.

### Key Entities _(include if feature involves data)_

- **Tenant (Negocio)**: extended with portal-facing profile fields: biography, avatar/logo reference, physical address, phone and social links (Instagram, WhatsApp). Existing fields (name, category, slug, status, hours, timezone) remain the contract.
- **Service (Servicio)**: card content is name, description, duration in minutes and the current rate; "Reservar" triggers the booking flow.
- **Specialist (Especialista)**: an active resource of the business with an avatar and a role, surfaced in the Equipo tab and as an optional booking step.
- **BusinessHours**: weekly opening schedule shown per weekday in the policies tab and used to derive offered slots.
- **Appointment (Cita)**: booked from the portal with `origin: 'online'`, a `pending` status and a snapshot of the service data, exactly as the existing booking flow.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: A client can go from opening a business page to a confirmed booking in under 3 minutes.
- **SC-002**: 100% of confirmed bookings never overlap another active appointment for the same specialist.
- **SC-003**: 100% of offered slots respect business hours, blocks, lead time, horizon and existing appointments.
- **SC-004**: 0% of unknown, draft or suspended tenants expose any business data.
- **SC-005**: 0 critical accessibility violations across the tabs and the booking flow; the whole flow is keyboard-operable.
- **SC-006**: 100% of the public page uses the shared design system components and tokens.
- **SC-007**: 0 horizontal overflow on mobile viewports across the three tabs.

## Assumptions

- **Governance**: Governed by `specs/business-model.md` (Foundly Book §2.3 and Foundly Pass §3), plus `constitution.md`, `specs/architecture.md`, `specs/system-design.md` and `code-rules.md`. This feature refines the public portal introduced in `002-onboarding-and-tenant-flow`; it lives in the `book` domain per `constitution.md` §2.
- **Data**: For this version, the portal-facing profile (biography, avatar/logo, address, phone, social links), specialists and policies are **seeded mock data** in the existing in-memory store seam; no persistence or CMS technology is added.
- **Specialists**: a specialist is an active `Resource` of the tenant; the specialist step applies only when the tenant has more than one active resource.
- **Prices**: the price shown for a service is the current applicable `Rate` (same rule as the admin panel snapshot).
- **Payments**: online payment is out of scope; the portal confirms the booking without charging.
- **Social links**: Instagram and WhatsApp are plain public links (https) shown as contact anchors.
- **Localization**: all copy is delivered in Spanish, consistent with the ecosystem.
- **Design token**: the portal uses exclusively the Clean Light UI tokens (`#6C5CE7` primary, `#FAF8FF` canvas, zinc text/borders) exposed by `@foundly/ui`; it renders over the module's continuous brand canvas (`004-book-brand-canvas`) shared by the product page, onboarding, admin shell and portal. The booking checkout (modal + steps) reuses the landing-canonic glass/pill overrides (`landingCanon.ts`) of the product page.