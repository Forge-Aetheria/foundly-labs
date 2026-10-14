# Feature Specification: Foundly Book — Provider Landing & Public Portal (Setmore-style)

**Feature Branch**: `003-public-portal-minisite`

**Created**: 2026-10-09

**Status**: Implemented (two-column provider landing added 2026-10-10)

**Input**: User description: "Implementar la landing pública del proveedor en `apps/book` -> `/book/[tenantSlug]`: layout de dos columnas con sidebar sticky, header de navegación interna por secciones (Servicios, Equipo, Acerca de, Galería, Reseñas, Dirección), data mock de un negocio de prueba (rona-piercing) con galería, catálogo por categorías, equipo, políticas y reseñas, y CTA de reserva pill #6C5CE7 que abre el checkout guiado. Reutiliza el flujo de reserva guiado existente y los tokens canónicos de la landing (`@foundly/ui`)."

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Explore a business through its branded provider page (Priority: P1)

As a client, I want to open a business's public page and immediately understand who they are, what they offer, their photos, reviews and how to contact them so that I decide to book with confidence.

**Why this priority**: The storefront is the entry point of the provider landing; without a trustworthy, informative page there is no booking.

**Independent Test**: Open an active business page, confirm the cover/gallery, the identity (avatar/logo, name, category, rating), the service catalog grouped by category, the team, the "Acerca de" section, reviews with star ratings and the sticky sidebar with the Reservar CTA; unknown/inactive businesses show the "unavailable" state.

**Acceptance Scenarios**:

1. **Given** an active business, **When** I open its public page, **Then** I see a decorative cover, the brand avatar/logo, name, category and the rating (e.g. "4.6" with five-star row).
2. **Given** the provider landing, **When** I activate the internal nav (Servicios, Equipo, Acerca de, Galería, Reseñas, Ubicación), **Then** the page scrolls smoothly to the requested anchored section and the active item shows a primary border-bottom indicator.
3. **Given** the main column, **When** I scroll, **Then** I find the policies card, the service catalog grouped by category, the team cards, the "Acerca de" bio, the photo gallery and the reviews (summary rating + comments).
4. **Given** any viewport, **When** the page is opened, **Then** on desktop the sidebar stays sticky on the right and on mobile it becomes a compact header card above the content.
5. **Given** an unknown, draft or suspended business, **When** I open its page, **Then** only an "unavailable" state is shown and no business data is exposed.

---

### User Story 2 - Book a service through a guided flow (Priority: P1)

As a client, I want to book a service in a few guided steps so that the appointment is created online without calling the business.

**Why this priority**: Booking is the core value of the public portal; it turns the storefront into real appointments.

**Independent Test**: Choose a service (or use the sidebar Reservar CTA), confirm a specialist and an available slot, enter client data and confirm; verify an appointment with an "online" origin appears in the business's agenda.

**Acceptance Scenarios**:

1. **Given** the Servicios section, **When** I activate "Reservar" on a service, **Then** the guided flow opens with the service preselected.
2. **Given** the sticky sidebar, **When** I activate its primary pill "Reservar" (accent `#6C5CE7`), **Then** the guided flow opens preselected with the first bookable service.
3. **Given** a business with several specialists, **When** I reach step 1, **Then** I can choose a specialist (when the business offers more than one); otherwise the step is skipped.
4. **Given** a selected specialist and service, **When** I pick a date, **Then** only available time slots (respecting hours, blocks and existing appointments) are offered.
5. **Given** a chosen slot, **When** I submit my name, email, phone and optional notes, **Then** a confirmation step shows the appointment summary before finalizing.
6. **Given** an occupied slot at the moment of confirmation, **When** the booking is attempted, **Then** the client is informed and offered the remaining slots.
7. **Given** a completed flow, **When** the client confirms, **Then** the appointment is created with an "online" origin and an initial pending status.

---

### User Story 3 - Meet the team, reviews and policies (Priority: P2)

As a client, I want to see who works at the business, what its clients say and its scheduling policies so that I book with realistic expectations.

**Why this priority**: Trust and clarity reduce cancellations and no-shows; it enriches the page without enabling the booking itself.

**Independent Test**: Open the Equipo section and the reviews section and confirm specialists (avatar + role + bio), the review summary with stars and comments, and the weekly schedule plus booking/cancellation policies are readable.

**Acceptance Scenarios**:

1. **Given** the Equipo section, **When** I open it, **Then** the business's active specialists are listed with an avatar (or initials), their role and their bio.
2. **Given** the Reseñas section, **When** I open it, **Then** the average rating is shown with stars and each review shows its author, stars, date and comment.
3. **Given** the policies/horarios content, **When** I read it, **Then** the opening hours are shown per weekday and the booking/cancellation policies are explained.
4. **Given** a business with no specialists or reviews configured, **When** the section is opened, **Then** it is omitted gracefully rather than breaking the layout.

---

### User Story 4 - Consistent, responsive and accessible provider landing (Priority: P2)

As any user, I want the public page to feel like the rest of the ecosystem (Clean Light UI, glassmorphism) and to work on any screen, including by keyboard.

**Why this priority**: Consistency and accessibility are product requirements that refine the storefront experience.

**Independent Test**: Traverse the nav, sections and the booking flow using only the keyboard on a mobile viewport and confirm no horizontal overflow and no accessibility violations.

**Acceptance Scenarios**:

1. **Given** the public page, **When** it renders, **Then** it uses the shared design system exclusively (pill buttons, `#6C5CE7` accents, glass/translucent cards, bold typography).
2. **Given** any viewport, **When** the page is opened, **Then** there is no horizontal overflow and the layout adapts (single column on small screens with the sidebar as a compact header card).
3. **Given** any interactive control (nav links, buttons, slots, fields), **When** navigated with the keyboard, **Then** focus is visible and every action is operable.

---

### Edge Cases

- A business has no specialists configured; the specialist step is skipped and the Equipo section is omitted.
- A business has no reviews: the rating summary and the reviews section are omitted.
- A business has no gallery photos: the gallery banner/grid is omitted.
- The selected date offers zero slots (closed day, past day or fully booked); the client sees the reason and can pick another date.
- Between slot selection and confirmation the slot is taken; the flow surfaces the conflict and the remaining slots without losing the client data already entered.
- A client enters an invalid email or phone; the flow blocks progression with inline errors.
- The business shows prices with multiple currencies; the presented price is the tenant's current rate for that service.
- A client books across the booking horizon, below the minimum lead time, or into a blocked period; those slots are never offered.
- Unknown, draft or suspended tenants must never expose any business data.

## Requirements _(mandatory)_

### Functional Requirements

**Provider identity & landing**

- **FR-001**: The public page MUST render the business cover photo as a **full-width hero banner** (`width: 100%`) placed **below the header and above the profile/two-column content** (not a reduced/floating container).
- **FR-002**: The public page MUST show the business avatar/logo, commercial name, category and its rating (average, one decimal) with a five-star row when reviews exist.
- **FR-003**: The public page MUST include an "Acerca de" section with the business biography when configured.
- **FR-004**: The public page MUST expose contact data when configured: physical address, phone and social links (Instagram, WhatsApp).
- **FR-005**: The public page MUST provide an internal navigation header whose **left** shows the business brand (avatar/logo + the current business name), whose **centre** shows plain-text anchored links (Servicios, Equipo, Acerca de, Galería, Reseñas, Ubicación) laid out as a clean horizontal bar with the active item marked by a thin primary border-bottom, and whose **right** shows the business contact (phone/WhatsApp). Anchored links MUST scroll smoothly to the matching sections.
- **FR-006**: The public page MUST group the active services into a catalog by category, each service showing name, description, duration and current rate with a pill "Reservar" button.
- **FR-007**: The public page MUST list the business's active specialists as cards with avatar (or initials), name, role and bio; if none exist, the section MUST be omitted.
- **FR-008**: The public page MUST show the opening hours per weekday and the business's booking/cancellation policies.
- **FR-023**: The public page MUST render a photo gallery (banner + grid) from the tenant's gallery when configured, and MUST omit it when empty.
- **FR-024**: The public page MUST render a reviews section with the average rating (stars + numeric) and each review's author, stars, date and comment; MUST be omitted when there are no reviews.

**Two-column layout & sticky sidebar**

- **FR-021**: The provider landing MUST use a two-column layout on desktop: a main column (gallery, policies, catalog, team, about, gallery, reviews, direction) and a right column with a **sticky** sidebar (`position: sticky; top: 1.5rem`, `align-items: flex-start` on the row) that accompanies the full vertical scroll of the main column (brand, rating, Reservar CTA, hours disclosure, address/contact).
- **FR-022**: On small viewports the sticky sidebar MUST collapse into a compact header card rendered above the content (responsive, no horizontal overflow).
- **FR-025**: The sidebar Reservar CTA MUST be the accent pill (`#6C5CE7`) and MUST open the guided booking checkout preselected with the first bookable service.

**Guided booking flow**

- **FR-009**: Activating "Reservar" on a service (card or sidebar) MUST open the guided booking flow with that service preselected, inside an `@foundly/ui` glass Modal over the shared canvas.
- **FR-010**: The flow MUST offer a specialist selection step when the business has more than one active specialist; otherwise it MUST be skipped.
- **FR-011**: The flow MUST offer an interactive date and time-slot selector that only shows slots respecting the business hours, blocks, lead time, horizon and existing appointments.
- **FR-012**: The flow MUST collect the client's name, email, phone and optional notes, with inline validation.
- **FR-013**: The flow MUST end with a confirmation step summarizing the service, specialist, date, time and client data before creating the appointment.
- **FR-014**: The confirmed booking MUST create an appointment with an "online" origin in a pending state and MUST be rejected (`CONFLICT`) if the slot was taken in the meantime.
- **FR-015**: Slots taken between rendering and confirmation MUST be removed from the offered set without losing already entered client data.

**Content guardrails & data**

- **FR-016**: The public page MUST expose no data for unknown, draft or suspended tenants (unavailable state only).
- **FR-017**: The presented service price MUST be the tenant's current applicable rate.
- **FR-018**: Every surface MUST use the shared design system and its tokens; no ad-hoc brand styling is permitted. Every surface MUST render over the module's continuous brand canvas (`004-book-brand-canvas`) with no opaque full-screen background layer; cards and pills MUST replicate the landing's glassmorphism and pill style (`landingCanon.ts`).
- **FR-019**: The page MUST be fully keyboard-operable and pass automated accessibility checks with zero critical violations.
- **FR-020**: The page MUST adapt to small viewports without horizontal overflow.
- **FR-026**: The store MUST seed a full provider test business (`rona-piercing`) with identity, gallery photo URLs, categories/services with durations and rates, team, business hours, policies and client reviews, so the landing can be visualised with the existing mock data.

### Key Entities _(include if feature involves data)_

- **Tenant (Negocio)**: extended with provider-landing fields: `gallery` (photo URLs) and existing portal profile (bio, avatar/logo, cover, address, phone, social links). Existing fields (name, category, slug, status, hours, timezone) remain the contract.
- **Service (Servicio)**: card content is name, description, duration in minutes, the current rate and a `category` used to group the catalog; "Reservar" triggers the booking flow.
- **Specialist (Especialista)**: an active resource of the business with avatar, name, role and bio, surfaced in the team section and as an optional booking step.
- **Review (Reseña)**: a mock client review `{ author, rating (1–5), comment, date }` scoped to a tenant; the rating average and review list are computed in the public queries.
- **BusinessHours**: weekly opening schedule shown in the sidebar disclosure and the direction section.
- **Appointment (Cita)**: booked from the portal with `origin: 'online'`, a `pending` status and a snapshot of the service data, exactly as the existing booking flow.

**Relationships**: A Tenant owns Services (grouped by `category`), Resources (specialists), PortalPolicies and Reviews (all read in `getPublicBusiness`); the public portal resolves a Tenant from its slug and creates Appointments with an "online" origin.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: A client can go from opening a business page to a confirmed booking in under 3 minutes.
- **SC-002**: 100% of confirmed bookings never overlap another active appointment for the same specialist.
- **SC-003**: 100% of offered slots respect business hours, blocks, lead time, horizon and existing appointments.
- **SC-004**: 0% of unknown, draft or suspended tenants expose any business data.
- **SC-005**: 0 critical accessibility violations across the nav, sections and the booking flow; the whole flow is keyboard-operable.
- **SC-006**: 100% of the provider landing uses the shared design system components and tokens (glass cards, pill buttons, `#6C5CE7`).
- **SC-007**: 0 horizontal overflow on mobile viewports; the sticky sidebar collapses into a compact header card.
- **SC-008**: The seeded `rona-piercing` business renders the full landing (gallery, categories, team, policies, reviews and rating) with the existing booking actions green.

## Assumptions

- **Governance**: Governed by `specs/business-model.md` (Foundly Book §2.3 and Foundly Pass §3), plus `constitution.md`, `specs/architecture.md`, `specs/system-design.md` and `code-rules.md`. This feature refines the public portal introduced in `002-onboarding-and-tenant-flow`; it lives in the `book` domain per `constitution.md` §2.
- **Data**: For this version, the portal-facing profile (gallery, bio, avatar/logo, address, phone, social links), specialists, policies and **reviews are seeded mock data** (`Review`) in the existing in-memory store seam; no persistence or CMS technology is added.
- **Seed**: a second seeded tenant (`rona-piercing`) provides the full provider landing reference; `estudio-ana` remains the admin/onboarding seed.
- **Specialists**: a specialist is an active `Resource` of the tenant; the specialist step applies only when the tenant has more than one active resource.
- **Prices**: the price shown for a service is the current applicable `Rate` (same rule as the admin panel snapshot).
- **Payments**: online payment is out of scope; the portal confirms the booking without charging.
- **Social links**: Instagram and WhatsApp are plain public links (https) shown as contact anchors.
- **Localization**: all copy is delivered in Spanish, consistent with the ecosystem.
- **Design token**: the portal uses exclusively the Clean Light UI tokens (`#6C5CE7` primary, `#FAF8FF` canvas, zinc text/borders) exposed by `@foundly/ui`; it renders over the module's continuous brand canvas (`004-book-brand-canvas`) shared by the product page, onboarding, admin shell and portal. The booking checkout (modal + steps) reuses the landing-canonic glass/pill overrides (`landingCanon.ts`) of the product page.
