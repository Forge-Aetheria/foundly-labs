# Feature Specification: Foundly Book — Centralized API Error Handling & Session Expiry

**Feature Branch**: `012-centralized-api-errors`

**Created**: 2026-10-13

**Status**: Implemented (retro-documented)

**Input**: User description: "El panel muestra el texto crudo `Unauthenticated` en rojo dentro de las vistas. Hay que sacar esos mensajes crudos de los componentes: un mapeador central en el cliente HTTP que clasifique los errores. `UNAUTHENTICATED` debe disparar un manejador global (limpiar la sesión y redirigir a `/login` o mostrar un modal de sesión caducada) en lugar de pintar texto roto. Los errores de validación/estado se manejan limpios en cada componente. Al iniciar sesión (o en el guard del panel) verificar que la API acepta el token, para que el fallo se vea en `/login` y no repartido por las vistas. Si `getAccessToken()` viniera `null`, tratarlo como problema de sesión y redirigir, no enviar la petición sin autorización."

_This spec is governed by `constitution.md` v5.2.0, `specs/business-model.md` (Foundly Book, §2.3) and `specs/architecture.md`. It lives in the `book` domain because the primary affected application is `apps/book`. It complements `specs/book/010-remove-local-store` (server-only data) and `specs/book/009-admin-auth` (access lifecycle)._

## User Scenarios & Testing _(mandatory)_

### User Story 1 - A rejected session never shows broken text (Priority: P1)

As a business owner, when my session is no longer accepted by the backend, I want to be sent back to sign in with a clear notice, instead of seeing a raw technical error painted inside the panel.

**Why this priority**: A session that the backend rejects while the panel still looks "logged in" is the exact failure observed; leaving the raw text in the view is confusing and hides the real cause.

**Independent Test**: Force a protected read/write to be rejected with an authentication error and confirm the app clears the session, redirects to `/login`, and shows a clear session-expired notice — with no raw error text left in the section.

**Acceptance Scenarios**:

1. **Given** a signed-in owner whose backend session is rejected, **When** an admin section loads or a write runs, **Then** the session is cleared and the owner is redirected to `/login`.
2. **Given** the redirect, **When** `/login` renders, **Then** a clear "session expired" notice is shown.
3. **Given** any admin section, **When** an authentication error occurs, **Then** no raw technical message is rendered inside the section.

---

### User Story 2 - Non-session failures are shown cleanly (Priority: P1)

As a business owner, when a request fails for a non-session reason (connection, missing resource), I want a clean, dismissible alert — not broken inline copy.

**Why this priority**: The same rendering problem affects every error surfaced at load time, not only authentication.

**Independent Test**: Force a connection/not-found failure on a section load and confirm a clean modal alert is shown instead of raw inline text.

**Acceptance Scenarios**:

1. **Given** a connection failure on a section load, **When** the section renders, **Then** a clean, dismissible alert is shown.
2. **Given** a validation error in a form, **When** it fails, **Then** the feedback appears inline on the relevant fields.
3. **Given** any surfaced message, **Then** it is user-facing copy (Spanish), never the provider's raw text.

---

### User Story 3 - Login confirms the backend accepts the session (Priority: P1)

As a business owner, I want sign-in to fail visibly if the backend will not accept my session, so I do not enter a panel where everything then breaks.

**Why this priority**: The original defect was indistinguishable at login: authentication succeeded while every subsequent request failed.

**Independent Test**: Attempt sign-in while the backend rejects the freshly issued token and confirm the sign-in is refused with a clear message on the sign-in screen and no session is left behind.

**Acceptance Scenarios**:

1. **Given** correct credentials but a backend that rejects the token, **When** I sign in, **Then** the sign-in fails on `/login` with a clear message and no usable session is left.
2. **Given** the backend is unreachable, **When** I sign in, **Then** the sign-in fails with a clear message.
3. **Given** correct credentials and a backend that accepts the token, **When** I sign in, **Then** I enter the panel.

---

### User Story 4 - A missing bearer token is a session problem (Priority: P2)

As a maintainer, I want a missing token to be treated as a session problem (redirect) rather than sending an unauthenticated request that returns a raw error.

**Independent Test**: Simulate a null token and confirm the session-expiry handling runs instead of a request without authorization.

**Acceptance Scenarios**:

1. **Given** a signed-in context with no retrievable token, **When** a protected read runs, **Then** it routes through the session-expiry handling.

---

### Edge Cases

- Session error inside a parallel multi-read page: handled globally; no partial raw text.
- Repeated session errors: the app does not loop between the panel and `/login`.
- Validation/conflict messages remain in the form, never as a full-screen alert.
- Public (guest) booking errors keep their own precise, non-session messages.
- Success paths are unchanged (no error UI shown).

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: The transport layer MUST classify every API error by how the UI must present it: session, transient or inline.
- **FR-002**: API failures MUST surface user-facing copy and MUST NOT expose the provider's raw text.
- **FR-003**: An authentication failure from the backend MUST trigger a global handler that clears the local session and redirects to `/login`.
- **FR-004**: The `/login` screen MUST explain that the session expired when arriving from the global handler.
- **FR-005**: Transient failures (connection, missing resource) MUST be shown in a clean, dismissible alert, not as inline raw text.
- **FR-006**: Validation failures MUST be shown inline on the relevant fields.
- **FR-007**: Sign-in MUST verify that the backend accepts the freshly issued token; on rejection or unreachable backend it MUST fail with a clear message on `/login` and leave no usable session.
- **FR-008**: A missing bearer token MUST be treated as a session problem (redirect), never sent as an unauthenticated request.
- **FR-009**: Session/transient/inline handling MUST apply across the admin data surfaces (services, team, agenda, availability, profile).
- **FR-010**: All authorized data access MUST go through the session-aware transport; public/guest flows remain unaffected by the session handler.
- **FR-011**: The GraphQL transport and the session/auth reads MUST apply a **bounded request timeout** so an unreachable or unresponsive API or identity provider fails fast (mapped to a transient error / no session) instead of hanging a server render, Server Action or middleware until the platform kills the request (Vercel: 300 s).
- **FR-012**: All book gates (`build`, `typecheck`, `test`, lint) MUST pass with no regressions under strict TypeScript.

### Key Entities

- **Error surface**: the presentation bucket of an error code — session (global), transient (alert), inline (form field).
- **Session-aware request**: a protected data call that injects the bearer token and routes session failures to the global handler.
- **Session-expiry handler**: the global path that clears the session and returns the owner to sign in with a notice.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: 0 occurrences of a raw technical (provider-language) error message rendered inside any admin section.
- **SC-002**: 100% of backend authentication failures clear the session and redirect to `/login` with a notice.
- **SC-003**: 100% of transient section-load failures render a clean, dismissible alert.
- **SC-004**: A backend that rejects the session blocks sign-in and surfaces the failure on `/login`.
- **SC-005**: Book gates pass with zero regressions.
- **SC-006**: 0 server renders/actions/middleware invocations hang indefinitely on an unreachable API or identity provider; every outbound call is bounded and degrades to a typed failure.

## Assumptions

- **Authentication provider = Supabase Auth** (live-only, per `009`/`010`); the backend verifies the same bearer token (see `specs/api/011-jwt-algorithm-support`).
- **Backend is source of truth** (per `010`): sign-in may legitimately fail when the backend is unreachable; truthful failure is preferred over a "logging-in-only" illusion.
- **Guest/public flows are separate**: the public booking page is not an authenticated session and is out of scope for the session handler.
- **Respect for the governance hierarchy**: follows `specs/business-model.md` (the owner's access to the Foundly Book value proposition must be truthful and unobstructed) and the authority order of `constitution.md`.
