# Feature Specification: Foundly Book — Profile, Policies & Reviews (Admin + Public Portal)

**Feature Branch**: `014-profile-policies-reviews`

**Created**: 2026-10-13

**Status**: Draft

**Input**: User description: "Habilitar la edición real en el panel de administración (`/admin/profile`) y alimentar correctamente la vista pública del mini-sitio (`/book/<slug>`): crear los documentos GraphQL necesarios, regenerar los tipos con codegen, estructurar las acciones y hooks dentro del módulo de perfil, y conectar tanto el editor de administración como las secciones del mini-sitio público (reseñas, políticas y dirección)."

_This spec is governed by `constitution.md` v5.2.0, `specs/business-model.md` (Foundly Book, §2.3) and `specs/architecture.md`. It lives in the `book` domain. It supersedes the "read-only / no backend" state of `specs/book/007-business-profile` and `010-remove-local-store` for these sections. Its backend counterpart is `specs/api/013-profile-policies-reviews`. The gallery section is already integrated (`specs/book/013-gallery-integration`) and is out of scope here._

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Edit and persist the business profile (Priority: P1)

As a business owner, I want `/admin/profile` to let me edit my identity, contact/social details, "About" text and reservation/cancellation policies and save them for real, so my public page is accurate.

**Why this priority**: The section is read-only today (no update path), so the owner cannot change anything; enabling real editing is the core value.

**Independent Test**: Open `/admin/profile`, change the name, category, address, phone, Instagram, WhatsApp, bio and a policy; save; reload and confirm the values persist, and confirm the public page reflects them.

**Acceptance Scenarios**:

1. **Given** the profile editor, **When** it loads, **Then** it shows the current values read from the backend (editable fields), not a read-only view.
2. **Given** valid edits, **When** I save, **Then** the changes persist on the backend and are still there after a reload.
3. **Given** an invalid Instagram/WhatsApp/logo/cover URL, **When** I save, **Then** the save is blocked with inline errors and nothing is persisted.
4. **Given** an invalid or duplicate public URL (slug), **When** I save, **Then** it is blocked with an inline error and the previous slug is preserved.
5. **Given** a save succeeds, **When** the public page is opened, **Then** the updated header, sticky card, "Acerca de", "Dirección y horarios" and footer reflect the changes.
6. **Given** the backend is unreachable or the session expired, **When** I save or load, **Then** the failure is surfaced cleanly (no raw text, no false success).

---

### User Story 2 - Manage reservation/cancellation policies (Priority: P2)

As a business owner, I want to add, edit and remove reservation/cancellation policies (title + body), so customers know the rules.

**Independent Test**: Add a policy, save, confirm it persists and appears in the public policies card; remove it and confirm it disappears.

**Acceptance Scenarios**:

1. **Given** the policies section, **When** I add or edit a policy (title + body) and save, **Then** it persists and appears in the public policies card.
2. **Given** a policy, **When** I remove it and save, **Then** it disappears from the admin and the public page.
3. **Given** no policies, **When** the editor renders, **Then** it shows a clean empty state and allows adding one.

---

### User Story 3 - Public mini-site shows profile, contact, policies and reviews (Priority: P1)

As a visitor, I want the business's public page to show the real "About", contact/address, policies and customer reviews with the rating — and to leave my own review — so I can decide confidently and share my experience.

**Independent Test**: Open `/book/<slug>` and confirm the "Acerca de", "Dirección y horarios", policies and reviews sections show the real backend content (or clean empty states); submit a review and confirm it appears with an updated rating; a change saved in the admin is reflected.

**Acceptance Scenarios**:

1. **Given** a business with a description, contact/address and policies, **When** its public page loads, **Then** the corresponding sections render the real content.
2. **Given** a business with reviews, **When** the reviews section renders, **Then** it shows the reviews and the aggregate rating from the backend.
3. **Given** a business with no reviews or no policies, **When** the page loads, **Then** the sections show clean empty states (never mocked content).
4. **Given** the public reviews section, **When** a visitor submits a valid review (author, rating, comment), **Then** it is stored and appears in the list with an updated rating.
5. **Given** an updated profile saved in the admin, **When** the public page is reloaded, **Then** the changes are visible.

---

### User Story 4 - Modular, session-safe data layer (Priority: P2)

As a maintainer, I want the profile module to follow the canonical data layer and the session-aware transport, so it is consistent with the rest of the app.

**Independent Test**: Confirm the module has `actions.ts` and `hooks.ts`, that the UI never calls the transport or Server Actions directly, and that an expired session on profile load/save routes to the global sign-in flow.

**Acceptance Scenarios**:

1. **Given** the profile module, **When** inspected, **Then** data access lives in `actions.ts` (server reads + update Server Action) and interactive updates go through `hooks.ts`.
2. **Given** GraphQL operations, **When** codegen runs, **Then** the client uses only generated documents/types (no hand-written API DTOs).
3. **Given** an expired session, **When** a profile read/write runs, **Then** it routes through the global session-expiry handling (no raw error text).

---

### Edge Cases

- Optional fields empty (phone, Instagram, WhatsApp, descripción, policies): the public sections hide/placeholder gracefully.
- Invalid or duplicate public URL: blocked inline; the previous value is preserved.
- Image URLs malformed: inline error before saving.
- No reviews: the reviews section shows a clean empty state and no invented rating.
- Server error on load/save/review submit: surfaced cleanly; never a false success.
- Long values (bio/policy body): bounded with a clear inline error.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: `/admin/profile` MUST allow editing the business identity (name, category, public URL/slug, logo/cover preview), contact/social (address, phone, Instagram, WhatsApp), the "About" description and the reservation/cancellation policies, using the current backend values.
- **FR-002**: Saving MUST persist the changes on the backend and reflect them in `/book/<slug>` (header, sticky card, "Acerca de", "Dirección y horarios", footer).
- **FR-003**: Inputs MUST be validated (URLs for Instagram/WhatsApp/logo/cover; slug format and uniqueness; bounded text lengths) with inline errors; invalid values MUST NOT persist.
- **FR-004**: Policies MUST be managed as a list of entries (title + body), supporting zero, one or many, with the public policies card rendering them.
- **FR-005**: The public reviews section MUST render the real reviews and the aggregate rating and MUST allow a visitor to submit a review (author, rating 1–5, non-empty bounded comment) with validation; with no reviews it MUST show a clean empty state and no invented rating.
- **FR-006**: Data access MUST live in the module's `actions.ts` (server reads + update Server Action) and interactive updates MUST be exposed through `hooks.ts`; the UI MUST NOT call the transport or Server Actions directly.
- **FR-007**: Data access MUST reuse the session-aware transport so session expiry is handled globally (no raw provider text in views).
- **FR-008**: GraphQL operations and types MUST be produced by codegen (no hand-written API DTOs); the versioned schema snapshot MUST stay in sync.
- **FR-009**: The screens MUST use the shared design system and pass automated accessibility checks with zero critical violations.
- **FR-010**: All book gates (`build`, `typecheck`, `test`, lint) MUST pass with no regressions under strict TypeScript.

### Key Entities

- **Tenant (business)**: identity (name, category, public URL, logo, cover), contact/social (address, phone, Instagram, WhatsApp) and the "About" description.
- **PortalPolicy**: a reservation/cancellation entry (title + body); the business has zero or more.
- **Review**: a customer rating and comment shown on the public reviews section, with the aggregate rating.
- **BusinessHours**: the weekly opening schedule shown as a read-only summary (editing stays in the availability section).

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: An owner can update identity, contact, "About" and policies in under 2 minutes and see it reflected on the public page after a reload.
- **SC-002**: 100% of invalid URLs/slugs and out-of-bound text are blocked with inline errors and persist nothing.
- **SC-003**: 100% of the public sections (About, contact/address, policies, reviews+rating) show real backend content or clean empty states (no mocked content).
- **SC-004**: The reviews section shows the backend aggregate rating consistently with the stored reviews.
- **SC-005**: Book gates pass with zero regressions; the module follows the `actions.ts`/`hooks.ts` structure and passes accessibility checks.

## Assumptions

- **Backend dependency**: relies on the profile-update and reviews surface delivered by `specs/api/013-profile-policies-reviews` (reviews are **publicly submittable** by any visitor, no account).
- **Gallery is already integrated** (`013-gallery-integration`); it is not part of this feature even though it is mentioned alongside the public sections.
- **Images are URL-based** (no upload); the opening-hours summary is read-only and sourced from the availability configuration.
- **Tenant scoping** for admin reads/writes comes from the session (never the URL).
- **Respect for the governance hierarchy**: follows `specs/business-model.md` and the authority order of `constitution.md`.
