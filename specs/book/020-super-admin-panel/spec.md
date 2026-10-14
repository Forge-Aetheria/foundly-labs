# Feature Specification: Foundly Book — Super Admin Console (Global Dashboard & Business Management)

**Feature Branch**: `020-super-admin-panel`

**Created**: 2026-10-14

**Status**: Draft

**Input**: User description: "@apps/book — UI del Panel Super Admin (book/020). La API del Super Admin (api/019) ya está implementada y expuesta en el esquema GraphQL. Construir la consola visual en apps/book: (1) ruta protegida `/admin/super` (o `/super-admin`) restringida a Super Admin con redirección o estado de acceso denegado; (2) dashboard de métricas globales con tarjetas de resumen (Total Negocios, Negocios Activos, Total Usuarios) y gráfico/desglose de distribución de planes FREE vs PRO; (3) gestión de negocios con listado/tabla con búsqueda y paginación, detalle por negocio (nombre, plan, estado de suscripción, fecha de vencimiento) y modal de edición/override que use `overrideTenantSubscription`; (4) seguir los tokens y componentes de `@foundly/ui` y separar la capa de datos mediante `actions.ts` / `hooks.ts`."

_This spec is governed by `constitution.md` v5.2.0, `specs/business-model.md` and `specs/architecture.md`. It lives in the `book` domain because the affected application is `apps/book`; it extends the admin shell of `specs/book/001-book-admin-panel` and `specs/book/009-admin-auth`, and consumes the (already implemented) platform surface of `specs/api/019-super-admin-panel` (`platformMetrics`, `managedBusinesses`, `overrideTenantSubscription`)._

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Reach a Super Admin-only console (Priority: P1)

As the platform owner, I want a protected console route that only I can access, so platform-wide operations are never exposed to business users.

**Why this priority**: The console is cross-tenant and privileged; access control is the foundation of the whole phase.

**Independent Test**: Open the console route as the platform owner and confirm it renders; open it as a normal business owner or an unauthenticated visitor and confirm access is denied (redirect/denied state) with no platform data shown.

**Acceptance Scenarios**:

1. **Given** the platform owner, **When** they open the console route, **Then** the console renders.
2. **Given** a normal authenticated business owner, **When** they open the console route, **Then** access is denied with a clear message and no platform data is shown.
3. **Given** an unauthenticated visitor, **When** they open the console route, **Then** they are sent to sign-in.
4. **Given** the console route, **When** it is not the platform owner, **Then** the navigation does not advertise or link to it for business users.

---

### User Story 2 - Read the platform dashboard (Priority: P1)

As the platform owner, I want a dashboard with key indicators, so I can grasp platform scale and monetization at a glance.

**Why this priority**: The dashboard is the visible deliverable of the console.

**Independent Test**: Open the console and confirm indicator cards show total businesses, active businesses, total users, and the conversion to the PRO plan, with clear handling when a metric is unavailable.

**Acceptance Scenarios**:

1. **Given** the console, **When** it loads, **Then** indicator cards show at least: total businesses, active businesses, total users and the PRO conversion.
2. **Given** the plan distribution, **When** the dashboard is shown, **Then** the FREE vs PRO split is visible.
3. **Given** the user metric is unavailable from the platform, **When** the dashboard is shown, **Then** that indicator shows an "unavailable" state without breaking the rest of the dashboard.
4. **Given** the metrics request fails, **When** the dashboard is shown, **Then** a friendly error state with a retry is shown.

---

### User Story 3 - Manage all businesses (Priority: P1)

As the platform owner, I want a table of every registered business with its current subscription state, so I can find and act on any business.

**Why this priority**: The table is the management surface that makes the console useful.

**Independent Test**: Open the console and confirm the table lists all businesses with their name, plan, status and expiry; confirm it handles an empty list and a long list (loading/pagination) cleanly.

**Acceptance Scenarios**:

1. **Given** the console, **When** the business table loads, **Then** it lists every registered business with its name, plan, status and expiry.
2. **Given** many businesses, **When** the table is shown, **Then** it stays usable (bounded/paginated) and the current subscription state is legible.
3. **Given** there are no businesses, **When** the table loads, **Then** a clean empty state is shown.
4. **Given** the table fails to load, **When** it is shown, **Then** a friendly error state with a retry is shown.

---

### User Story 4 - Force a business subscription from the console (Priority: P1)

As the platform owner, I want to change a business's plan and expiry from the console, so I can grant or revoke Pro access manually.

**Why this priority**: It is the action that makes the console a management tool, not just a report.

**Independent Test**: From a business row, open the override control, set it to Pro with a future expiry and confirm the row shows the new state; set it to Free and confirm the change; confirm an invalid input is blocked.

**Acceptance Scenarios**:

1. **Given** a business row, **When** the platform owner opens the override control, **Then** they can choose a plan (FREE/PRO), a status and an expiry date.
2. **Given** the override control, **When** the owner confirms a change, **Then** the business's row reflects the new plan/status/expiry and the change is persisted.
3. **Given** the override control, **When** the owner clears the expiry, **Then** the business is left with no expiry.
4. **Given** invalid input (e.g. expiry in the past combined with Pro, or a missing selection), **When** the owner confirms, **Then** the change is blocked with clear guidance and nothing changes.
5. **Given** a successful override, **When** the table refreshes, **Then** the business's subscription state is up to date without a manual reload.

---

### User Story 5 - See clear denial when not authorized (Priority: P2)

As a non-admin user, I want a clear, non-broken response when I reach a platform-only surface, so I understand I lack access instead of seeing errors or leaked data.

**Why this priority**: It protects the privileged surface and prevents confusing failures.

**Independent Test**: As a normal business owner, open the console route and confirm a clear "no access" experience with a path back, and no platform data leaked.

**Acceptance Scenarios**:

1. **Given** a normal business owner, **When** they reach the console route, **Then** a clear "no access" state is shown with a way back to their workspace.
2. **Given** a denied access, **When** the state is shown, **Then** no platform metrics, business lists or override controls are rendered.
3. **Given** an unauthenticated visitor, **When** they reach the console route, **Then** they are redirected to sign-in.

---

### Edge Cases

- **Unavailable user metric**: the dashboard shows the user indicator as unavailable while the rest of the metrics render.
- **Empty platform**: zero businesses/users shows zeroed indicators and a clean empty table (not an error).
- **Long business list**: the table is bounded/paginated and remains responsive.
- **Invalid override**: missing plan/status or a conflicting combination (e.g. Pro with a past expiry) is blocked inline with clear guidance.
- **Stale table**: after an override, the table reflects the new state without a manual reload.
- **Direct URL access**: a non-admin typing the console URL is denied the same way as through navigation.
- **Session expiry**: an expired session sends the user to sign-in on an admin action.
- **Override failure**: a failed override keeps the previous row state and surfaces a clear error.
- **Responsive layout**: the dashboard and table remain usable on small screens.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: The application MUST expose a **protected console route** (default `/super-admin`) available only to the **platform owner** role.
- **FR-002**: An authenticated **business owner without the platform role** MUST be denied access to the console with a clear "no access" state and **no platform data rendered**.
- **FR-003**: An **unauthenticated** visitor MUST be redirected to sign-in.
- **FR-004**: The console MUST show a **dashboard** with indicator cards including: total businesses, **active businesses**, **total users**, and the **conversion to the PRO plan**.
- **FR-005**: The console MUST show the **subscription plan distribution** (FREE vs PRO).
- **FR-006**: When a platform metric is unavailable (e.g. user counts), the dashboard MUST show an "unavailable" indicator without failing the rest of the dashboard.
- **FR-007**: The console MUST show a **management table** listing **all** businesses with, at least, their name, current **plan**, **status** and **expiry**.
- **FR-008**: The table MUST be bounded/paginated and MUST handle empty, loading and error states.
- **FR-009**: The console MUST provide an **override control** (modal/dialog) per business to change the **plan** (FREE ↔ PRO), the **status** and the **expiry date**.
- **FR-010**: A confirmed override MUST persist and the row MUST reflect the new subscription state without a manual reload.
- **FR-011**: Invalid override input (missing selection, or a conflicting state such as Pro with a past expiry) MUST be blocked with clear inline guidance and MUST change nothing.
- **FR-012**: All console data access MUST follow the module data-layer convention (`actions.ts` / `hooks.ts` / `<module>.graphql` with codegen-only types); the UI MUST NOT call the API or data hooks directly.
- **FR-013**: The console MUST be responsive and accessible (keyboard-operable controls, labelled inputs, meaningful table semantics, adequate contrast via existing tokens).
- **FR-014**: Automated tests MUST cover: the route's authorization (allowed for the platform owner, denied for a business owner, redirect for anonymous); the dashboard indicators (including the unavailable metric); the business table (rows, empty, error); and the override control (valid change, invalid blocked, refresh).
- **FR-015**: All book gates (`build`, `typecheck`, `test`, lint) MUST pass with no regressions under strict TypeScript.

### Key Entities _(include if feature involves data)_

- **Platform metrics**: the global indicators rendered on the dashboard (businesses total/active, users total/active, plan distribution, PRO conversion).
- **Managed business row**: a business shown in the table with its name, plan, status and expiry.
- **Subscription override**: the change to a business's plan/status/expiry performed from the console.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: 100% of non-platform-owner attempts to open the console are denied with a clear state and zero platform data rendered.
- **SC-002**: The platform owner can read the key indicators (total businesses, active businesses, total users, PRO conversion) in a single view.
- **SC-003**: The platform owner can find any business and change its plan/status/expiry in a small number of interactions, with the table reflecting the result immediately.
- **SC-004**: 100% of invalid overrides are blocked with clear guidance and change nothing.
- **SC-005**: 0 broken states: empty, loading, error, denied and unavailable-metric are all handled with clear UI.
- **SC-006**: All book gates pass with zero regressions.

## Assumptions

- **Companion backend feature**: the platform authorization, the global metrics query and the subscription override are the `api` counterpart `specs/api/019-super-admin-panel`; this spec defines the user-facing behavior only.
- **Platform role is not self-serviceable**: the console is visible only to identities carrying the global platform role; a business account cannot grant itself access.
- **Route name**: the console lives at `/super-admin` (the request offered `/admin/super` or `/super-admin`). It is placed outside the `/admin` workspace because that workspace requires a tenant-bound session and a platform admin is not necessarily bound to a business.
- **Reuses the existing admin shell**: the console uses the existing workspace shell/design system rather than a new visual language.
- **No self-service billing**: overrides are manual administrative actions; payment/renewal flows are out of scope.
- **Respect for the governance hierarchy**: follows `specs/business-model.md` (platform operation of the Foundly ecosystem) and the authority order of `constitution.md`.
