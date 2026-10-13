# Feature Specification: Foundly Book — Front-to-Back API Integration & Admin Catalog Sync

**Feature Branch**: `008-api-integration-catalog-sync`

**Created**: 2026-10-12

**Status**: Draft

**Input**: User description: "Front-to-Back API Integration & Admin Catalog Sync (Foundly Ecosystem). Address the architectural gaps identified in `apps/book` and connect the Next.js frontend to the NestJS GraphQL API (`apps/api`). This specification establishes the environment configuration, CORS policies, GraphQL client transport, and migrates the Admin Catalog/Tenancy modules from in-memory mocks (`store.ts`) to live GraphQL operations. Scope: (1) API readiness & cross-origin configuration; (2) typed GraphQL client transport injecting the active Supabase JWT; (3) authentication & session seam replacing the hardcoded current session and mapping `tenant_id` claims to admin guards; (4) persistence seam replacement for Admin Catalog & Tenancy with graceful fallback for unmigrated domains (gallery, reviews, policies); (5) SDD compliance and quality gates (`build`, `typecheck`, `test`) with zero regressions."

_This spec is governed by `constitution.md` v5.0.1, `specs/business-model.md` (Foundly Book, §2.3) and `specs/architecture.md`. It lives in the `book` domain because the primary affected application is `apps/book`; standalone backend behavioural changes belong to `specs/api/`._

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Keep the catalog and the public booking page in sync (Priority: P1)

As a business owner, I want the services and team members I manage in the admin panel to be saved durably and shown exactly the same on my public booking page, so that my customers always see what I actually offer.

**Why this priority**: Today the panel works against a demo copy that is reset on every lifecycle and is not shared with the booking page as a durable source of truth. Making the panel read and write the shared backend data source is the core value of this feature and the prerequisite for everything else.

**Independent Test**: Log in as the business owner, change a service (name/price/duration) and a team member (role/active state), save, reload the panel and open the public booking page — both show the updated values, and they survive the reload.

**Acceptance Scenarios**:

1. **Given** an authenticated business owner, **When** they edit a service in the admin panel and save, **Then** the change persists after a full reload.
2. **Given** a saved service or team-member change, **When** the public booking page is opened, **Then** it shows the updated value from the same source (no stale copy).
3. **Given** a team member deactivated in the panel, **When** the public booking page loads, **Then** that professional no longer appears as bookable.
4. **Given** a change made on another session or device, **When** the owner views the panel, **Then** the panel reflects the latest saved state.

---

### User Story 2 - Bound access: only the owner enters and only their data is shown (Priority: P1)

As a business owner, I want the admin area to recognise me automatically after I sign in and to show exactly my business's data, so that no one else can view or modify my catalog.

**Why this priority**: Moving the catalog to a shared backend only makes sense if access is properly guarded; without scoping, the integration would expose one business's data to others.

**Independent Test**: Try to open an admin URL without a session (redirect expected); then sign in and confirm that only your own business's services and team members are loaded, even when the URL is manually changed.

**Acceptance Scenarios**:

1. **Given** no active session, **When** an admin URL is opened, **Then** the user is sent to the registration/onboarding entry point.
2. **Given** a session bound to business A, **When** catalog data is requested, **Then** only business A's rows are returned.
3. **Given** an attempt to reach another business's data, **When** the request is issued, **Then** it is rejected and no data is exposed.
4. **Given** an expired or invalid session, **When** any admin action is attempted, **Then** access is denied and the user is asked to sign in again.

---

### User Story 3 - Clear and safe behaviour when the connection fails (Priority: P2)

As a business owner, I want the panel to behave predictably when the data connection is temporarily unavailable, so that I never mistake a failure for a successful save and my work on sections not yet connected is not disrupted.

**Why this priority**: Once operations depend on a shared backend, an outage must not silently swallow data or break surfaces that still work locally.

**Independent Test**: Simulate an unreachable backend, attempt to save a catalog change (clear error expected), then open the gallery/reviews/policies sections and confirm they still work.

**Acceptance Scenarios**:

1. **Given** the backend is unreachable, **When** the owner tries to save a catalog change, **Then** a clear error is shown and no change is reported as saved.
2. **Given** the backend is unreachable, **When** the owner uses the not-yet-connected sections (gallery, reviews, policies), **Then** those sections keep working with local data.
3. **Given** the backend recovers, **When** the owner retries the save, **Then** the operation completes normally.

---

### User Story 4 - A connectable environment in both development and production (Priority: P3)

As a developer, I want the connection configuration between the book frontend and the shared backend to be defined and documented, so that any new environment can be provisioned and verified quickly without guesswork.

**Why this priority**: The remaining stories depend on a reachable backend; documenting the environment and allowing the frontend's origins to talk to the backend removes the main blocker to running the feature anywhere.

**Independent Test**: On a fresh local environment, follow the documented steps, start both applications and run the connection verification — the integration is confirmed working in under ten minutes; repeat the check against the production origins.

**Acceptance Scenarios**:

1. **Given** a fresh development environment, **When** the documented setup steps are followed, **Then** the frontend successfully reaches the backend (verified by a health/connection check).
2. **Given** the production deployment, **When** the app is accessed from its public origins, **Then** authenticated catalog operations work end to end.
3. **Given** the required environment values, **When** they are missing or wrong, **Then** the failure is reported with a clear message pointing to the missing configuration.

---

### Edge Cases

- The backend is temporarily unreachable during a save: the user receives a clear error and no data is silently lost or misreported.
- The session expires while the panel is open: subsequent actions are denied and the user is asked to sign in again, without blocking already-rendered content.
- The owner manually modifies the public URL of another business: every request is still scoped to the authenticated account and the foreign data is never served.
- A business has no services or team members yet: the panel shows a friendly empty state and remains fully usable.
- A duplicate service name or an invalid public URL is submitted: saving is blocked with a clear, inline message.
- Two sessions edit the same item at the same time: the operation completes predictably (last write wins) without corrupting either view.
- A slow connection: loading and error states are shown so the user never thinks the panel is frozen.
- Sections not yet migrated (gallery, reviews, policies) keep their current local behaviour during the whole migration, with no visible regression.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: The admin catalog — services and team members — MUST be read from and written to the shared backend data source, so changes persist across reloads, sessions and devices.
- **FR-002**: Every saved catalog change MUST be reflected on the public booking page, sourced from the same backend data (no duplicate or stale copy).
- **FR-003**: The admin area MUST require an authenticated, business-bound session; unauthenticated access MUST redirect to the registration/onboarding entry point.
- **FR-004**: All catalog reads and writes MUST be scoped to the business of the authenticated account; the scope MUST come from the identity, never from the URL or other client-provided input.
- **FR-005**: Every authenticated interaction with the backend MUST carry the owner's verified identity, and requests without a valid identity MUST be rejected with a clear, consistent error.
- **FR-006**: When the backend is unreachable, the system MUST communicate the failure clearly and MUST NOT report unsaved work as saved.
- **FR-007**: Sections not yet connected to the backend (business gallery, reviews, policies) MUST continue to work with their existing local state, with zero visible regression.
- **FR-008**: The backend MUST accept requests coming from the frontend's approved origins in both development and production (cross-origin access policy).
- **FR-009**: The environment configuration required to connect the frontend to the backend MUST be documented so a new environment can be provisioned following the documented steps.
- **FR-010**: All existing build, type-check and test gates MUST pass with zero failures across both applications after this feature.

### Key Entities _(include if feature involves data)_

- **Business (Tenant)**: the commercial entity that owns the catalog and the public profile; every catalog entity belongs to exactly one business.
- **Service**: a bookable offering of the business (name, price, duration, category, active) — the "services" catalog item managed in the panel and shown on the booking page.
- **Team member / professional (Specialist)**: a bookable staff resource of the business (name, role, active, assigned services) — the "team" catalog item.
- **Owner identity & session**: the authenticated account bound to the business; it is the single source of tenant scoping for all admin operations.
- **Backend data source**: the authoritative store that replaces the local demo copy for the migrated entities and becomes the single source of truth shared by the panel and the public booking page.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: 100% of catalog edits (services and team members) made in the admin panel persist after a full reload and are visible on the public booking page.
- **SC-002**: 100% of attempts to open admin data without a valid session, or from another business, are blocked — zero cross-tenant data exposure.
- **SC-003**: In 100% of simulated backend-outage cases, the panel shows a clear error and no owner work is lost or misreported.
- **SC-004**: A new developer environment can connect the frontend to the backend in under 10 minutes following the documented steps.
- **SC-005**: 100% of the existing build, type-check and test gates pass in both applications with zero regressions.
- **SC-006**: The not-yet-connected sections (gallery, reviews, policies) keep working with no visible regression in 100% of their interaction tests.

## Assumptions

- This spec is governed by `constitution.md` v5.0.1, `specs/business-model.md` (Foundly Book module, §2.3, §3.x licensing) and `specs/architecture.md`. It is placed in the `book` domain because the primary affected application is `apps/book`; standalone backend behavioural changes will follow the `specs/api/` process.
- The ecosystem's centralized identity (as established by the existing API identity contract) authenticates the owner, and the owner is bound to a business through their account metadata.
- The shared backend already exposes the data operations for the catalog and tenancy; this feature wires the book frontend to those operations. No new backend business surfaces (queries/mutations for gallery, reviews or policies) are in scope.
- Migration scope for this feature: only the **Admin Catalog** (services and team members) and **Tenancy** (business/owner binding and admin guard) move to live backend data; business gallery, reviews and policies remain on local state.
- A cross-origin access policy will permit the frontend's development and production origins; the exact allowance list is a configuration decision for planning.
- Credentials and connection secrets are never stored in the repository; they are configured per environment (local development and platform deployment).
- The public booking page keeps its current read behaviour, but its data now comes from the same backend source used by the panel for migrated entities.
- Deployment of the backend to a permanent production URL, DNS and any platform-level settings are operational concerns documented here but executed as part of the deployment tasks.
- Performance expectations follow standard web-app behaviour (interactions complete in the order of seconds with clear loading/error states); no sub-second SLA is defined.