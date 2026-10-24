# Feature Specification: Foundly Book — Business Onboarding & Tenant Flow

**Feature Branch**: `002-onboarding-and-tenant-flow`

**Created**: 2026-10-08

**Status**: Draft

**Input**: User description: "Crea una nueva spec que defina el flujo de registro de negocios y la estructura de rutas para Foundly Book: (1) Estructura de rutas: `/book` (landing informativa del producto Foundly Book con features y CTA para registrar negocio), `/book/onboarding` (wizard paso a paso para crear negocio/servicio), `/book/admin/*` (dashboard privado del negocio, el layout con Drawer ya construido) y `/book/[tenantSlug]` (portal público donde los clientes finales agendan sus citas). (2) Onboarding en 3 pasos: Paso 1 datos de la cuenta (Nombre, Email, Password); Paso 2 datos del negocio (Nombre comercial, Slug/URL pública, Categoría); Paso 3 configuración inicial (Duración por defecto de citas, Horario de atención general). (3) Entidades/Mock Schema: definir los tipos de TypeScript para `Tenant` (Negocio) y `User` alineados con el enfoque local-first/mock state."

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Register a business through the onboarding wizard (Priority: P1)

As a business owner, I want to sign up and create my business through a short guided wizard so that I end up with a ready-to-use booking workspace without any technical setup.

**Why this priority**: Registration and provisioning are the entry point of Foundly Book. Until a tenant (business) and its owner exist, no agenda, catalog or availability can be used, so this is the foundation of the module's value.

**Independent Test**: Starting from the product page, complete the three wizard steps with valid data and confirm that a business and its owner account are created, the initial configuration is provisioned, and the owner lands in the private workspace.

**Acceptance Scenarios**:

1. **Given** a visitor on the registration entry point, **When** they open the wizard, **Then** they see a full-height balanced split layout with the Foundly Book logo and a subtle "¿Ya tienes cuenta? Iniciar sesión" link in the header, a discreet centered footer with Terms, Privacy and the Foundly Labs copyright, a single form card containing the three-step visual stepper above the step title, and a clean upright white/neutral business preview card.
2. **Given** step 1, **When** the owner enters a name, a valid email and an acceptable password, **Then** they can continue to step 2; otherwise the step blocks progress and shows an inline error for each invalid field.
3. **Given** step 2, **When** the owner types the commercial name, public URL (slug) and category, **Then** the preview card updates in real time with those values and the wizard verifies that the public URL is available, valid and not reserved before allowing progress.
4. **Given** step 3, **When** the owner sets the default appointment duration and the general business hours, **Then** those values are ready to be applied to the new workspace.
5. **Given** a completed wizard, **When** the owner confirms creation, **Then** the business and its owner account are created, the chosen defaults are provisioned, and the owner is taken to the private dashboard.
6. **Given** a partially completed wizard, **When** the owner navigates back or the page is reloaded, **Then** previously entered data is preserved (local-first) and no step is lost.

---

### User Story 2 - Book an appointment on a business's public page (Priority: P2)

As a final client, I want to open a business's public page and book one of its services online so that I can reserve an appointment without calling or messaging the business.

**Why this priority**: The public portal is the main value the business gets from registering; it turns the agenda into real bookings. It depends on a tenant existing first.

**Independent Test**: Open the public page of an existing active business, choose a service and an available slot, confirm the booking, and verify the appointment appears in that business's agenda.

**Acceptance Scenarios**:

1. **Given** an active business with a public URL, **When** a client opens its public page, **Then** they see the business identity (name and category) and its bookable services.
2. **Given** a requested service, **When** the client picks a date, **Then** only slots that respect the business hours, its availability and existing appointments are offered.
3. **Given** a valid slot, **When** the client confirms with their details, **Then** an appointment is created for that business with an "online" origin and enters its initial lifecycle state.
4. **Given** an unknown or inactive business URL, **When** a client opens it, **Then** they see a clear "not available" state and no business data is exposed.

---

### User Story 3 - Use the private workspace of my business (Priority: P2)

As an owner or professional, I want every private screen to operate inside my own business's workspace so that I only see and manage my own agenda, services and availability.

**Why this priority**: The dashboard already exists as a shell; this story establishes tenant scoping and access control, which are required before any real business uses it.

**Independent Test**: Sign in as an owner, open the private dashboard, and confirm all screens reflect the owner's business and that direct access without a session (or across businesses) is blocked.

**Acceptance Scenarios**:

1. **Given** an authenticated owner, **When** they open the private dashboard, **Then** the shell (brand, navigation, user profile) renders and all screens are scoped to their business.
2. **Given** a request to a private screen without a valid session, **When** it is made, **Then** the owner is redirected to the registration/sign-in entry point.
3. **Given** a user of business A, **When** they try to reach data of business B, **Then** access is denied and no business B data is shown.

---

### User Story 4 - Learn about Foundly Book from its product page (Priority: P3)

As a prospective customer, I want an informative page that explains what Foundly Book does so that I can decide to register my business.

**Why this priority**: The product page drives acquisition, but it only refines an already working registration and booking flow.

**Independent Test**: Open the product page and confirm it presents the module's capabilities and a clear path to register a business.

**Acceptance Scenarios**:

1. **Given** a visitor, **When** they open the product page, **Then** they see the module's key capabilities (agenda, services, availability, online booking) and a prominent call to action.
2. **Given** the product page, **When** it renders, **Then** it flows from the continuous lavender hero canvas into the content with no white band or hard horizontal cut between hero and cards (`004-book-brand-canvas`).
3. **Given** the call to action, **When** the visitor activates it, **Then** they are taken to the registration wizard.
4. **Given** pricing or licensing information, **When** it is shown, **Then** it matches the ratified Foundly Pass model and no unapproved price is displayed.
5. **Given** the product page hero, **When** the visitor types their email ("Tu email") and activates "Empezar gratis", **Then** they are taken to the registration wizard.
6. **Given** the product page, **When** it renders, **Then** it shows the conversion sections inspired by Setmore: the booking-page spotlight with a live preview; a centered "3 pasos para el éxito" process where each of the three columns pairs a plain title + description (no number circle, wrapping card or redundant badge) with a white/neutral UI preview card directly below — custom business URL (`foundlylabs.lat/tu-negocio`), branded profile with logo/name/rating/badges, and share channels (WhatsApp, Instagram, Web); a benefits grid with enriched lavender icon tiles (Recordatorios, Pagos por adelantado, Sin no-shows, Integraciones); a responsive sector grid of four video-backed cards (Barberías y Peluquerías, Salud y Bienestar / Masajes, Deportes y Entrenamiento, Consultoría y Servicios) that auto-play muted demo clips behind a readable dark overlay and link into the filtered directory; and the two pricing plans (Gratis `$0` / Pro `$5`).

---

### Edge Cases

- A public URL (slug) is already taken, is a reserved word (e.g. `admin`, `onboarding`, `api`, `www`), or contains invalid characters; the wizard must suggest alternatives and block progress until a valid one is chosen.
- The email used in step 1 is already associated with an account.
- The password does not meet the minimum strength policy.
- The wizard is abandoned midway or the connection drops; entered data must not be lost and the owner must be able to resume.
- Two different businesses share the same commercial name; they must still get distinct public URLs.
- A business changes its public URL after launch; the previous URL must not silently serve another business.
- A client opens the public page of a suspended or unlicensed business; the page must show an unavailable state and expose no data.
- A client tries to book a slot that was taken between viewing and confirming; the booking must be rejected and alternatives offered.
- A client books across the business's booking horizon or below any minimum lead time; the slot must not be offered.
- The owner registers while offline (local-first); the account and business creation must not be lost once connectivity returns.

## Requirements _(mandatory)_

### Route Structure

The module MUST expose four distinct surfaces, mapped onto the ecosystem's single-domain multi-zone deployment:

| Surface               | Public path (through the gateway) | Purpose                                                                          |
| --------------------- | --------------------------------- | -------------------------------------------------------------------------------- |
| Product page          | `/book`                           | Informative page about Foundly Book, its capabilities and the register CTA       |
| Onboarding wizard     | `/book/onboarding`                | Step-by-step creation of a business and its owner account                        |
| Private dashboard     | `/book/admin/*`                   | Authenticated workspace (agenda, services, availability) inside the Drawer shell |
| Public booking portal | `/book/[tenantSlug]`              | Client-facing page where final clients book appointments                         |

All four surfaces MUST render over the module's continuous brand canvas (`004-book-brand-canvas`): the root layout applies the shared lavender-to-white gradient, and no surface wrapper (product page, wizard, admin shell, portal) MAY paint an opaque full-screen background that hides it.

### Functional Requirements

**Routing & surfaces**

- **FR-001**: The module MUST provide a public product page that describes Foundly Book's capabilities and presents a call to action to register a business. The page MUST render over the module's continuous brand canvas (`004-book-brand-canvas`), without a white band or a hard horizontal cut between its hero and the content below.
- **FR-021**: The product page hero MUST offer a fast email capture ("Tu email") with a primary "Empezar gratis" action that is always clickable (the form MUST NOT block submit with native `required` validation). On submit: without a valid email the action MUST redirect to the registration entry point `/register`; with a valid email it MUST redirect to `/register?email=<url-encoded email>`.
- **FR-022**: The product page MUST present the conversion sections: a booking-page sales block (spotlight with preview), a centered "3 pasos para el éxito" process laid out as three responsive columns (1 on mobile, 3 on desktop) where each column shows only the plain title + description (no number circle, wrapping card or redundant step badge) above a white/neutral UI preview card with subtle border and soft shadow (custom business URL, branded profile with rating and badges, and share channels for WhatsApp/Instagram/Web), a benefits grid with enriched neutral/lavender icon tiles (Recordatorios, Pagos por adelantado, Sin no-shows, Integraciones), a responsive sector grid (1/2/4 columns) of four video-backed cards with the required `consulting.mp4`, `barber_shop.mp4`, `training.mp4` and `massage.mp4` clips served from `/videos/*`, auto-playing muted/looping/inline behind a subtle dark overlay with white titles, and a two-plan pricing table (Gratis `$0` / Pro `$5`), all composed from `@foundly/ui` tokens and the landing canon.
- **FR-002**: The product page's call to action MUST lead to the onboarding wizard.
- **FR-003**: The module MUST provide an onboarding wizard that creates a business and its owner account in three ordered steps.
- **FR-023**: The onboarding entry point MUST render a professional, balanced split layout inside a full-height viewport (vertically centered content) reusing the shared public chrome — `PublicHeader` (auth variant) and `PublicFooter` from `apps/book/src/shared/components/` (no ad-hoc header/footer per view, per `code-rules.md` §4.3); a single elevated form card containing the visual stepper for "Tu cuenta · Tu negocio · Tu primer servicio" above the step title, with visible focus rings; and a clean, upright white/neutral preview card (standard rounded corners, thin border, soft shadow) that updates in real time with the business name, slug and category typed in step 2. The preview MUST NOT use a tilted phone/tablet frame. The internal `/register` alias MUST redirect to `/onboarding` and forward any `email` query parameter.
- **FR-004**: The module MUST provide a private dashboard reachable only through the `/book/admin/*` surface, rendered inside the existing application shell (brand, navigation and user profile).
- **FR-005**: The module MUST provide a public booking portal addressed by the business's public URL (slug), reachable without signing in.
- **FR-006**: The router MUST reserve certain slugs (e.g. `admin`, `onboarding`, `api`, `www`, `app`) so that no business can claim a path that collides with a system surface.

**Onboarding — step 1 (account)**

- **FR-007**: Step 1 MUST collect the owner's full name, email and password, and MUST validate email format and a minimum password strength before allowing progress.
- **FR-024**: The onboarding wizard MUST read the `email` query parameter from `/onboarding` (forwarded by `/register`), decode it and pre-populate the step-1 email field automatically, without overwriting an email already captured in a local-first draft.
- **FR-025**: The step-1 password field MUST provide a visibility toggle (Eye/EyeOff) inside the input that switches the input type between `password` and `text` without submitting the wizard.

**Onboarding — step 2 (business)**

- **FR-008**: Step 2 MUST collect the commercial name, the desired public URL (slug) and a category, and MUST validate that the slug is well-formed, available and not reserved.
- **FR-009**: The system MUST derive a suggested slug from the commercial name while allowing the owner to edit it.

**Onboarding — step 3 (initial configuration)**

- **FR-010**: Step 3 MUST collect a default appointment duration and a general business-hours schedule, and MUST validate them (positive duration; hours with an end after the start).

**Provisioning & flow**

- **FR-011**: Completing the wizard MUST create exactly one business and one owner account bound to it, and MUST provision the business's initial configuration (default duration, working hours, currency and timezone defaults).
- **FR-012**: After successful creation, the owner MUST be taken to the private dashboard of the new business.
- **FR-013**: The wizard MUST preserve entered data across step navigation, page reloads and connectivity loss (local-first), and MUST prevent duplicate submissions.
- **FR-014**: The system MUST prevent creating two businesses with the same public URL, and MUST keep the mapping from public URL to business unique and stable.

**Tenant scope & access**

- **FR-015**: Every private dashboard screen MUST operate strictly within the authenticated owner's business, with no cross-business data displayed.
- **FR-016**: Access to private surfaces without a valid session MUST be denied and redirected to the registration/sign-in entry point.
- **FR-017**: The public portal MUST resolve the business by its public URL and MUST expose only active/licensed businesses; unknown, suspended or unlicensed businesses MUST show an unavailable state with no data exposed.
- **FR-018**: The public portal MUST offer only slots that respect the business's hours, availability, duration and existing appointments, and MUST create bookings with an "online" origin.

**Governance & data approach**

- **FR-019**: The feature MUST respect `specs/business-model.md` (Foundly Book module definition §2.3 and the Foundly Pass licensing/SSO rules §3) and MUST NOT display unratified pricing.
- **FR-020**: Consistent with the ecosystem's local-first principle and the deferred persistence decision, the feature MUST model and hold its data as typed in-memory/mock state behind a single seam, without introducing any storage technology.

### Key Entities _(include if feature involves data)_

- **Tenant (Negocio)**: A registered business that owns an agenda. Key attributes: internal identifier; commercial name; public URL slug; category; status (draft, active, suspended); default appointment duration; general business hours schedule; default currency and timezone; owner reference; created-at.
- **User**: An account able to sign in and administer a business. Key attributes: internal identifier; full name; email (unique); credential; role (owner/administrator, professional); business reference; status; created-at.
- **Business hours schedule**: The tenant's general opening hours, expressed as one interval per weekday (start/end) plus closed days; used to seed availability on provisioning.
- **Public URL (slug)**: The unique, human-readable identifier that addresses a tenant's portal; constrained by format, uniqueness and the reserved-word list.

**Relationships**: A User owns/manages exactly one Tenant in this version (a Tenant has one owner, with room for additional staff roles later); a Tenant is the root of the module's existing data (services, rates, resources, availability rules, time blocks and appointments), which are all scoped to it; the public portal resolves a Tenant from its slug and creates Appointments with an "online" origin.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: A new owner can go from the product page to a provisioned private dashboard in under 5 minutes.
- **SC-002**: At least 90% of owners who start the wizard complete it on the first attempt without abandoning.
- **SC-003**: 100% of created businesses have a unique, valid, non-reserved public URL.
- **SC-004**: 100% of public portals for active businesses expose bookable availability, and 0% of unknown, suspended or unlicensed businesses expose any data.
- **SC-005**: A newly provisioned workspace reflects the wizard's default duration and business hours with 0 manual setup steps.
- **SC-006**: 0% of onboarding data is lost on step navigation, page reload or connectivity drop (local-first draft).
- **SC-007**: 0 critical accessibility violations across the four surfaces; every registration, sign-in, booking and dashboard flow is fully keyboard-operable.
- **SC-008**: 0 cross-business data exposures in private dashboard screens across repeated access attempts.

## Assumptions

- **Governance**: Governed by `specs/business-model.md` (maximum authority) — specifically the Foundly Book module definition (§2.3) and the Foundly Pass licensing/SSO rules (§3); plus `constitution.md`, `specs/architecture.md`, `specs/system-design.md` and `code-rules.md`. This spec MUST be created under the `book` domain per `constitution.md` §2.
- **Deployment mapping**: The shared domain maps the public `/book/*` prefix onto `apps/book` internal routes (multi-zone, per `specs/architecture.md` §2); the paths above are the public URLs seen by users.
- **Relationship to the admin panel**: This feature builds on the existing private admin panel (`001-book-admin-panel`); the private dashboard reuses its shell (Drawer navigation, brand and user profile) and its agenda/services/availability screens, now tenant-scoped.
- **Identity**: Foundly Pass is the ecosystem's centralized identity provider. For this version, the onboarding captures the owner's credentials/identity into the local-first mock state and the concrete `Tenant` and `User` TypeScript interfaces follow the same plain-interface + in-memory-store approach as the existing book domain; no authentication or storage technology is adopted yet.
- **Persistence**: No storage technology is defined or implied (deferred per `specs/architecture.md`); drafts and created entities live in typed in-memory/mock state behind a single seam.
- **Public booking**: Final clients do not need a Foundly account to book in this version (guest booking); the portal is read-and-book only and exposes no private business data.
- **Ownership model**: One owner account per business in v1; multiple staff/professional roles are a later concern.
- **Defaults**: New businesses default to the ecosystem's reference currency (`EUR`) and a single business timezone (consistent with the existing book domain), and default to guest-visible, online bookings enabled.
- **Localization**: All surfaces are delivered in Spanish, matching the rest of the ecosystem.
- **Category**: The category is chosen from a predefined list with the possibility of a free-form value in this version.
- **Reserved slugs**: A fixed reserved list (e.g. `admin`, `onboarding`, `api`, `www`, `app`) is maintained to prevent collisions with system surfaces.
- **Visual cohesion**: All four surfaces share the module's continuous brand canvas (spec `004-book-brand-canvas`); the onboarding already delivers the split-layout identity and the shared canvas now reaches the product page, the admin shell and the public portal.
- **Pricing copy**: The product page pricing table (Gratis `$0` / Pro `$5`) is **illustrative mock copy** for the landing design; real prices remain subject to `specs/business-model.md` ratification (FR-019) and no unapproved price is treated as binding.
