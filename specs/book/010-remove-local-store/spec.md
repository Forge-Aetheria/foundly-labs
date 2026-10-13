# Feature Specification: Foundly Book — Remove Local Store & Go Server/DB-Only

**Feature Branch**: `010-remove-local-store`

**Created**: 2026-10-12

**Status**: Draft

**Input**: User description: "Eliminar el store local por completo (`store.ts`): se acabó el almacenamiento híbrido y los fallbacks silenciosos. Conectar todo lo existente a la API/DB: todo lo que ya tenga soporte en la API y en Prisma se conecta de inmediato (servicios, equipo, disponibilidad, citas, tenants, auth). Vaciar lo que no tenga backend: las vistas o secciones del frontend cuyas contrapartes aún no existan en la base de datos se quedan vacías o muestran un estado limpio, sin inventar mocks locales ni caer en estados falsos. No sobrecomplicar la migración."

_This spec is governed by `constitution.md` v5.1.0, `specs/business-model.md` (Foundly Book, §2.3) and `specs/architecture.md`. It lives in the `book` domain because the primary affected application is `apps/book`._

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Single source of truth: the server (Priority: P1)

As an operator, I want every business record to live in the backend database, so that the panel and the public page always show the same real data and nothing is silently faked in memory.

**Why this priority**: The in-memory store is the root cause of inconsistent/hybrid behaviour (data lost on reload, silent fallbacks, wrong guards). Removing it is the foundation for everything else.

**Independent Test**: With the store deleted, open the admin panel and the public page; confirm data comes from the backend, and that stopping the backend produces a visible error instead of fake data.

**Acceptance Scenarios**:

1. **Given** the local store is removed, **When** the admin panel or the public page loads, **Then** all persisted data is read from the backend database.
2. **Given** the backend is unreachable, **When** a read or write is attempted, **Then** a clear error is shown and no invented/placeholder data is displayed as if real.
3. **Given** an operation succeeds, **When** the page is reloaded (or opened on another device), **Then** the change is still there.

---

### User Story 2 - Admin catalog, availability and agenda are server-backed (Priority: P1)

As a business owner, I want my services, team, availability and appointments to be read and written on the server, so my panel reflects the real business and changes persist.

**Why this priority**: These are the core daily operations; the backend already supports them.

**Independent Test**: Create/edit a service, a team member, an availability rule and an appointment; reload and confirm each persists and is reflected on the public page where applicable.

**Acceptance Scenarios**:

1. **Given** the admin catalog, **When** I create or edit a service, **Then** it is written to the backend and survives a reload.
2. **Given** the team section, **When** I create, edit or deactivate a professional, **Then** the change is written to the backend.
3. **Given** the availability section, **When** I change the schedule, **Then** it is written to the backend.
4. **Given** the agenda, **When** I create or update an appointment, **Then** it is written to the backend.
5. **Given** any of these writes fails, **When** it fails, **Then** the failure is visible and the UI does not report success.

---

### User Story 3 - Authentication and session are server-only (Priority: P1)

As a platform owner, I want authentication to rely solely on the identity provider, so there is no fake local session and access is always real.

**Why this priority**: A local session seam is a security hole and a source of the login/guard bugs already seen.

**Independent Test**: Sign in and sign out; confirm access is granted only with a real provider session, and that no local session/seed can authenticate.

**Acceptance Scenarios**:

1. **Given** no provider session, **When** any private URL is opened, **Then** access is denied and the user is sent to sign in.
2. **Given** a valid provider session, **When** the user navigates, **Then** access is granted scoped to their business.
3. **Given** the local session seam and seeded accounts are removed, **When** the app runs, **Then** no local mechanism can authenticate a request.

---

### User Story 4 - Public booking page reads from the server (Priority: P2)

As a customer, I want the public booking page to show the real business, services and availability from the backend, so what I book is real.

**Independent Test**: Open a business's public page; confirm identity/services/availability come from the backend and booking creates a real appointment.

**Acceptance Scenarios**:

1. **Given** a published business, **When** its public page loads, **Then** identity, services and availability are read from the backend.
2. **Given** a booking is completed, **When** it is confirmed, **Then** a real appointment is created on the server.
3. **Given** an unknown or unavailable business, **When** the page is opened, **Then** a clean not-found/unavailable state is shown.

---

### User Story 5 - Sections without backend show a clean empty state (Priority: P2)

As a business owner, I want sections that are not yet backed by the database to show a clean empty state, so I am never shown invented content.

**Why this priority**: Avoids fake data and false confidence while those backends don't exist.

**Independent Test**: Open the gallery, policies and reviews surfaces; confirm they render an explicit empty/unavailable state and never mock data.

**Acceptance Scenarios**:

1. **Given** the gallery section, **When** it opens, **Then** it shows a clean empty/unavailable state (no mocked photos).
2. **Given** the policies and reviews surfaces, **When** they open, **Then** they show a clean empty/unavailable state.
3. **Given** any of these sections, **When** a user attempts to add data that has no backend, **Then** the action is not silently faked.

---

### Edge Cases

- The backend is unreachable during a read: a clear error/empty state is shown; no cached or invented data is presented as real.
- The backend is unreachable during a write: the operation fails visibly; nothing is reported as saved.
- The signed-in account is not bound to a business: the user is routed to registration, not shown empty/fake panel data.
- An empty catalog, empty team or no availability: explicit empty states, fully usable UI.
- A business with no public slug: the public link is hidden/non-actionable.
- Two sessions edit the same record: predictable outcome (last write wins), no corruption.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: The in-memory local store MUST be removed; no runtime data source may live in memory.
- **FR-002**: All persisted reads and writes MUST go through the backend database; failures MUST surface as visible errors and MUST NOT be masked by fallbacks.
- **FR-003**: Services and team members (professionals) MUST be read and written on the server.
- **FR-004**: Availability rules and appointments MUST be read and written on the server.
- **FR-005**: Business/tenancy data MUST resolve from the server, scoped from the authenticated session (never the URL).
- **FR-006**: Authentication and session MUST rely solely on the identity provider; the local session seam and seeded accounts MUST be removed.
- **FR-007**: Sections whose data has no backend counterpart (business gallery, policies, reviews) MUST render a clean empty/unavailable state and MUST NOT use local mocks.
- **FR-008**: The public booking page MUST read business, services and availability from the server and MUST create real appointments on the server.
- **FR-009**: Client components MUST NOT read or write persisted data directly; all mutations MUST be server-side.
- **FR-010**: Missing configuration or backend errors MUST be observable by the user (a clear message), never silent.

### Key Entities _(include if feature involves data)_

- **Business (Tenant)**: the commercial entity; identity/profile resolved from the server by its unique public slug.
- **Service**: a bookable offering owned by a business; read/written on the server.
- **Team member (Specialist/Professional)**: a bookable resource owned by a business; read/written on the server.
- **Availability**: the schedule that determines bookable slots; read/written on the server.
- **Appointment**: a booked slot; created/updated on the server.
- **Owner session**: the authenticated identity bound to a business; the only source of tenant scoping.
- **Not-yet-backed content**: gallery, policies and reviews, which have no backend counterpart in this feature and render empty.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: 100% of persisted admin operations hit the backend database; zero in-memory reads.
- **SC-002**: The local store module is fully removed; zero references remain.
- **SC-003**: 0 silent fallbacks: every failure is shown as an error or a clean empty state.
- **SC-004**: 100% of not-yet-backed sections render a clean empty/unavailable state with no invented data.
- **SC-005**: 100% of the existing build, type-check and test gates pass with zero regressions.

## Assumptions

- The backend already supports services, team, availability, appointments, tenancy and auth; no new backend surfaces are added in this feature.
- Sections without a backend counterpart (gallery, policies, reviews) intentionally render empty for now; they will get their own features later.
- Data scoping always comes from the authenticated session.
- The public booking page keeps its current read/booking behaviour, but its data now comes only from the server.
- Failure visibility (clear errors, no silent fallback) is preferred over availability; the app may be less "forgiving" but is always truthful.
