# Feature Specification: Foundly Book — Admin Authentication, Session Protection & Account Security

**Feature Branch**: `009-admin-auth`

**Created**: 2026-10-12

**Status**: Draft

**Input**: User description: "Comprehensive Admin Authentication, Slug Linkage & Password Management (Foundly Ecosystem). Expand the authentication and administration capabilities within `apps/book`. This feature implements the full login/logout flows, route protection for administrative sections, a quick-access clickable public slug link in the admin management dashboard, and a user password change/update mechanism. (1) Login & Logout Flows: build/refine the login view, integrating with the identity provider; implement session teardown that clears authentication state and safely redirects to the login route. (2) Route Protection & Middleware: protect all `/admin/*` routes, redirecting unauthenticated users to `/login`; prevent authenticated users from visiting public auth pages when a valid session exists. (3) Provider Slug Quick Link: display a prominent, clickable preview link to the provider's public booking page (using their unique slug) inside the admin management layout/header. (4) Password Management: provide a security/settings section allowing providers to update their account password. (5) SDD compliance and quality gates with zero regressions across `apps/book`."

_This spec is governed by `constitution.md` v5.1.0, `specs/business-model.md` (Foundly Book, §2.3) and `specs/architecture.md`. It lives in the `book` domain because the primary affected application is `apps/book`._

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Sign in and stay signed in (Priority: P1)

As a business owner, I want to sign in with my email and password and have my session persist, so that I can reliably reach my admin panel.

**Why this priority**: Today only registration exists; an existing owner has no way back into the panel. A working sign-in is the prerequisite for every other admin capability.

**Independent Test**: From a signed-out state, open `/login`, submit valid credentials, and confirm the admin panel loads; reload the page and confirm the session persists.

**Acceptance Scenarios**:

1. **Given** a signed-out visitor, **When** they open `/login` and submit valid credentials, **Then** they reach the admin panel.
2. **Given** invalid credentials, **When** they are submitted, **Then** a clear error is shown and no session is created.
3. **Given** a signed-in owner, **When** they reload or navigate within the admin area, **Then** they remain signed in without re-entering credentials.
4. **Given** a valid account not yet bound to a business, **When** they sign in, **Then** they are routed to the registration/onboarding entry point instead of the admin panel.

---

### User Story 2 - Protected admin and guarded auth pages (Priority: P1)

As the platform, I want admin routes to require a valid session and auth pages to be hidden from signed-in users, so that private business data is never exposed and navigation is never confusing.

**Why this priority**: This is the security boundary. The panel must genuinely deny access instead of relying on a demo fallback session.

**Independent Test**: Open any `/admin/*` URL while signed out (expect redirect to `/login`); sign in and open `/login` (expect redirect into the admin area); attempt an admin action without a session (expect denial).

**Acceptance Scenarios**:

1. **Given** no valid session, **When** any `/admin/*` URL is opened, **Then** the user is redirected to `/login`.
2. **Given** a valid session, **When** `/login` is opened, **Then** the user is redirected into the admin panel.
3. **Given** an expired or invalid session, **When** an admin action is attempted, **Then** access is denied and the user is asked to sign in again.
4. **Given** the panel is open and the session ends, **When** the user continues, **Then** already-rendered content is not broken and the next protected action redirects to `/login`.

---

### User Story 3 - Sign out safely (Priority: P2)

As a business owner, I want to sign out, so that nobody else can use my session on a shared device.

**Why this priority**: Session teardown completes the access lifecycle and protects shared devices; it refines, but does not enable, the core flows.

**Independent Test**: From the admin area, trigger sign-out and confirm the redirect to `/login`; then confirm that admin URLs are no longer accessible.

**Acceptance Scenarios**:

1. **Given** a signed-in owner, **When** they sign out, **Then** the session is cleared and they are redirected to `/login`.
2. **Given** a signed-out user, **When** they open an admin URL, **Then** they are redirected to `/login`.
3. **Given** a completed sign-out, **When** the browser Back button is used, **Then** protected content is not served from the ended session.

---

### User Story 4 - Quick access to the public booking page (Priority: P2)

As a business owner, I want a prominent link to my public booking page in the admin area, so that I can preview and share exactly what my customers see.

**Why this priority**: It removes guesswork from the panel-to-public relationship and reinforces the slug as the owner's public identity; it is valuable but independent of authentication.

**Independent Test**: In the admin area, confirm a clickable link labelled with the owner's public URL; clicking it opens the public booking page for the owner's slug.

**Acceptance Scenarios**:

1. **Given** a signed-in owner, **When** the admin layout renders, **Then** a prominent, clickable link to the owner's public booking page is shown.
2. **Given** the public link, **When** it is activated, **Then** it opens the correct public booking page for the owner's unique slug.
3. **Given** the owner changes their public slug, **When** the admin area reloads, **Then** the link reflects the new slug.

---

### User Story 5 - Change password (Priority: P3)

As a business owner, I want to update my account password from a security/settings section, so that I can keep my account secure.

**Why this priority**: Account security is important but does not block the primary access flows; it is the last increment of value.

**Independent Test**: In the admin security section, change the password (current + new + confirmation), then sign out and sign in again with the new password.

**Acceptance Scenarios**:

1. **Given** a signed-in owner, **When** they provide the current password and a valid, confirmed new password, **Then** the password is updated and a success confirmation is shown.
2. **Given** an incorrect current password, **When** the change is submitted, **Then** it is rejected with a clear error and the password is unchanged.
3. **Given** a weak or mismatched new password, **When** the change is submitted, **Then** inline validation blocks the change.
4. **Given** a successful password change, **When** the owner signs out and signs in again, **Then** the new password authenticates and the previous one does not.

---

### Edge Cases

- A session expires or becomes invalid during an admin action: the action is denied and the user is redirected to sign in, without breaking already-rendered content.
- An account signs in but is not yet bound to a business: the user is routed to onboarding rather than the admin panel.
- An already-authenticated user opens `/login`: they are redirected into the admin panel.
- The session ends in one tab: protected content is no longer served from that ended session in other tabs.
- Password change with a wrong current password: rejected, password unchanged, no partial update.
- The owner has no public slug yet: the public link is hidden or shown in a non-actionable state instead of pointing to a broken page.
- The identity provider is temporarily unavailable during sign-in or password change: a clear, non-revealing error is shown and no partial session or password change occurs.
- A user without the owner/admin role attempts to reach the admin area: access is denied.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: The system MUST provide a sign-in screen where an existing account authenticates with email and password.
- **FR-002**: Invalid credentials MUST be rejected with a clear, non-revealing error and MUST NOT create a session.
- **FR-003**: A successful sign-in MUST establish a session that persists across page reloads and navigations until sign-out or expiry.
- **FR-004**: Every `/admin/*` route MUST require a valid, business-bound session; unauthenticated access MUST redirect to `/login` and an authenticated-but-unbound account MUST be routed to the registration/onboarding entry point.
- **FR-005**: The sign-in screen MUST be inaccessible to already-authenticated users, redirecting them into the admin panel.
- **FR-006**: The system MUST provide a sign-out action that ends the session and redirects the user to `/login`.
- **FR-007**: The admin area MUST show a prominent, clickable link to the owner's public booking page, built from the owner's unique public slug.
- **FR-008**: The public link MUST reflect the owner's current slug and MUST open the corresponding public booking page.
- **FR-009**: The admin area MUST provide a security/settings section where an owner can change their account password.
- **FR-010**: A password change MUST require the current password plus a new password and its confirmation; a mismatched confirmation or a password that violates the account password policy MUST be blocked with inline validation.
- **FR-011**: An incorrect current password MUST be rejected and MUST leave the stored password unchanged.
- **FR-012**: After a successful password change, the new password MUST authenticate and the previous password MUST no longer authenticate.
- **FR-013**: Expired or invalid sessions MUST cause protected actions to be denied and MUST redirect the user to sign in again, without breaking already-rendered content.
- **FR-014**: Every sign-in, sign-out, public-link and password-change surface MUST use the shared design-system components and tokens, with no ad-hoc brand styling or magic colors.
- **FR-015**: Authentication secrets MUST NOT be exposed to the browser, and all admin data MUST remain scoped to the authenticated owner's business.
- **FR-016**: The sign-in password field MUST provide a visibility toggle (Eye/EyeOff) inside the input that switches the input type between `password` and `text` without submitting the form.

### Key Entities _(include if feature involves data)_

- **Owner account (identity)**: An account able to sign in and administer a business. Key attributes: unique email, password credential, display name, role (owner/administrator), business binding, status.
- **Session**: The authenticated state derived from the owner account; it carries the business binding used to scope admin data and ends on sign-out or expiry.
- **Business (Tenant)**: The commercial entity that owns the catalog and the public profile; it exposes a unique public slug used to build the public booking URL.
- **Public booking page**: The customer-facing page resolved from the business's unique slug.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: An existing owner can sign in and reach the admin panel in under 30 seconds.
- **SC-002**: 100% of attempts to open `/admin/*` without a valid, business-bound session are redirected, with zero exposure of admin data.
- **SC-003**: 100% of invalid-credential attempts are rejected and create no session.
- **SC-004**: A signed-in session survives reloads in 100% of cases until sign-out or expiry.
- **SC-005**: 100% of successful password changes authenticate with the new password and reject the previous one.
- **SC-006**: 100% of incorrect current-password attempts are rejected without changing the password.
- **SC-007**: The public-page link resolves to the owner's correct slug in 100% of cases, and is non-broken when no slug exists.
- **SC-008**: Zero critical accessibility violations on the sign-in, sign-out and password-change surfaces, which are fully keyboard-operable.
- **SC-009**: 100% of the existing build, type-check and test gates pass across `apps/book` with zero regressions.

## Assumptions

- Governed by `constitution.md` v5.1.0, `specs/business-model.md` (Foundly Book module, §2.3) and `specs/architecture.md`; placed in the `book` domain because the primary affected application is `apps/book`.
- The ecosystem's centralized identity (the Foundly Pass seam already used during onboarding) authenticates the owner; this feature reuses that identity rather than introducing a new one.
- Onboarding remains the registration entry point. This feature splits the "registration/sign-in entry point" of the existing requirements into: new accounts → onboarding, existing accounts → `/login`.
- The public booking page is path-based using the owner's unique slug (consistent with the current public route `/book/[tenantSlug]`); subdomain-based access is out of scope for this feature.
- The account password policy matches the existing registration rules (minimum length, containing letters and numbers).
- Login is for business owners/administrators; self-service login for staff/professionals is out of scope.
- The existing session refresh and admin guard are reused and tightened so that a missing session truly blocks access; the current in-memory demo-session fallback MUST NOT authenticate a user who has not signed in.
- The security/settings section lives inside the existing admin navigation; its exact placement follows the current admin information architecture.
- No new backend business surfaces are required; deployment/DNS and identity-provider configuration are operational concerns handled during implementation.
- Credentials and connection secrets are never stored in the repository and are configured per environment.
