# Feature Specification: Foundly Book — Admin UX Hardening (Toasts, Loading, Moderation, Image Rules, Orphan Actions)

**Feature Branch**: `016-admin-ux-hardening`

**Created**: 2026-10-13

**Status**: Draft

**Input**: User description: "Auditoría funcional y de UX en vivo: (1) sistema global de toasts con colores semánticos; (2) estados de carga y prevención de doble envío en modales/formularios (galería, profesional, reseñas) con cierre automático y revalidación; (3) moderación de reseñas en el panel admin (aprobar/filtrar/eliminar); (4) restricciones de medidas para imágenes de perfil (icono cuadrado, portada banner); (5) activar los botones huérfanos de 'Nueva cita' (agenda) y 'Crear servicio' (servicios)."

_This spec is governed by `constitution.md` v5.2.0, `specs/business-model.md` (Foundly Book, §2.3) and `specs/architecture.md`. It lives in the `book` domain. It complements `specs/book/012-centralized-api-errors` (error surfacing), `specs/book/013-gallery-integration`, `specs/book/014-profile-policies-reviews` and `specs/book/015-availability-time-blocks`. The moderation backend is `specs/api/015-review-moderation`._

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Consistent floating notifications (Priority: P1)

As a user of the panel (and public portal), I want a consistent floating notification system with semantic colors, so that I always get clear, non-blocking feedback for successes, validation issues, information and errors.

**Why this priority**: It is the cross-cutting foundation that every other interaction relies on for feedback.

**Independent Test**: Trigger a successful save, a validation error, an informational event and an API/connection failure and confirm a green, yellow, blue and red toast respectively; the toast is dismissible and auto-hides.

**Acceptance Scenarios**:

1. **Given** a successful create/update/save, **When** it completes, **Then** a **green** toast is shown.
2. **Given** a form with input/validation errors, **When** the user submits, **Then** a **yellow** toast (or inline feedback) is shown.
3. **Given** an informational system message, **When** it occurs, **Then** a **blue** toast is shown.
4. **Given** an API/connection/structure failure, **When** it occurs, **Then** a **red** toast is shown (complementing the `ApiErrorDialog`).
5. **Given** any toast, **When** it appears, **Then** it is dismissible, accessible and disappears automatically after a short time.

---

### User Story 2 - Loading state and double-submit prevention (Priority: P1)

As a user, I want every create/edit form to show a loading state and block repeated submissions, so that I never create duplicates or get stuck in an infinite submit.

**Why this priority**: Double submissions corrupt data (duplicate services, staff, reviews) and are a critical MVP blocker.

**Independent Test**: In each modal/form, click submit repeatedly; confirm the button disables on the first click, shows a pending state, and on success the modal closes and the list refreshes.

**Acceptance Scenarios**:

1. **Given** the gallery add modal, **When** I submit, **Then** the submit button is disabled and shows a pending state until the server responds; on success the modal closes and the gallery refreshes.
2. **Given** the add-professional modal, **When** I submit, **Then** the same loading/close/refresh behavior applies.
3. **Given** the public review form, **When** I submit, **Then** it shows a submitting indicator and, on success, the review list and rating update without a manual page reload.
4. **Given** any of the above, **When** a submission is in flight, **Then** repeated clicks do not send additional requests.

---

### User Story 3 - Moderate reviews from the panel (Priority: P1)

As a business owner, I want to see the reviews left for my business in the panel and approve, reject or delete them, so inappropriate content never appears publicly.

**Independent Test**: Open the moderation section, see the reviews (pending highlighted), approve one and confirm it appears on the public page; reject or delete another and confirm it does not.

**Acceptance Scenarios**:

1. **Given** the moderation section, **When** it loads, **Then** it lists the business's reviews (any state), with pending ones clearly flagged.
2. **Given** a review, **When** I approve it, **Then** its state becomes approved and it appears on the public page.
3. **Given** a review, **When** I reject or delete it, **Then** it is no longer public.
4. **Given** a state filter, **When** I apply it, **Then** the list shows only that state.
5. **Given** the section, **When** the server is unreachable or the session expired, **Then** the failure is surfaced cleanly (toast/dialog), with no false success.

---

### User Story 4 - Image dimension rules for the profile (Priority: P2)

As a business owner, I want clear, enforced size/aspect rules for my logo/avatar and cover images, so my public page looks clean and elegant.

**Independent Test**: Provide a logo/avatar and a cover that violate the rules and confirm the save is blocked with a clear message; provide compliant ones and confirm they are previewed and saved.

**Acceptance Scenarios**:

1. **Given** the profile editor, **When** it renders, **Then** the recommended dimensions/aspect are shown for avatar (square) and cover (banner).
2. **Given** an image that does not meet the avatar square/aspect rule (or the cover banner aspect, or the maximum size), **When** I try to save, **Then** it is blocked with an inline error and not persisted.
3. **Given** a compliant image, **When** it is provided (link or file), **Then** it is previewed and saved.

---

### User Story 5 - Enable the orphan actions (agenda + services) (Priority: P1)

As a business owner, I want the "Nueva cita" and "Crear servicio" buttons to actually work, so I can create appointments and services from my panel and see them reflected publicly.

**Independent Test**: Create an appointment from the agenda and confirm it appears in the agenda; create a service and confirm it appears in the admin catalog and is offered on the public page.

**Acceptance Scenarios**:

1. **Given** the agenda, **When** I create a manual appointment (client, service, specialist, date/time) and save, **Then** it is persisted and appears in the agenda; invalid/incomplete inputs are blocked inline.
2. **Given** the services view, **When** I create a service (name, duration, price, optional category) and save, **Then** it is persisted, appears in the catalog and is available for public booking.
3. **Given** either action, **When** it succeeds, **Then** a success toast is shown and the list refreshes; while submitting, the button is disabled.

---

### Edge Cases

- Rapid repeated clicks on a submit button: only one request is sent.
- Success followed by a list that fails to refresh: the success is still reported; the refresh failure is surfaced separately.
- Moderation of a review already in the target state: succeeds without error.
- No reviews / no pending reviews: a clean empty state.
- Image with unknown dimensions (e.g. remote file that cannot be measured): the aspect-based rules degrade gracefully with clear guidance.
- A validation error in a modal: inline feedback + yellow toast; the modal stays open.
- Backend/connection error: red toast and/or `ApiErrorDialog`; no false success.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: The frontend MUST provide a reusable floating notification (toast) system, available across the app, supporting at least four semantic kinds: success (green), validation/warning (yellow), info (blue) and error (red).
- **FR-002**: Toasts MUST be dismissible, accessible (announced to assistive tech) and auto-dismiss after a short delay; error toasts MAY persist longer and complement the existing `ApiErrorDialog`.
- **FR-003**: Every modal/form that creates or edits data (gallery, professional, review, and any other) MUST disable its submit control while a request is in flight and MUST prevent additional submissions from repeated clicks.
- **FR-004**: On a successful submission, the modal MUST close automatically and the affected list/section MUST refresh (revalidate) without a manual page reload.
- **FR-005**: The public review form MUST show a submitting indicator and, on success, update the reviews list and rating in place (or via revalidation) without a manual reload.
- **FR-006**: The panel MUST expose a review-moderation surface listing the business's reviews (any state), with pending ones flagged, supporting approve, reject and delete, and filtering by state.
- **FR-007**: Moderation actions MUST reflect immediately in the public page (approved visible; rejected/deleted not).
- **FR-008**: The profile editor MUST document and enforce dimension/aspect rules for the logo/avatar (square) and the cover (banner), for both link and file inputs, blocking non-compliant images with an inline error.
- **FR-009**: The agenda MUST allow creating a manual appointment end-to-end (with loading/validation/refetch and a success toast).
- **FR-010**: The services view MUST allow creating a service end-to-end (with loading/validation/refetch and a success toast), and the new service MUST be usable for public booking.
- **FR-011**: Feedback for validation MUST remain inline on the fields (yellow toast is complementary, never a replacement).
- **FR-012**: Data access MUST keep the canonical module structure (`actions.ts`/`hooks.ts`); the UI MUST NOT call the transport or Server Actions directly; API errors MUST keep centralized handling (toasts/dialog), with no raw provider text.
- **FR-013**: All book gates (`build`, `typecheck`, `test`, lint) MUST pass with no regressions under strict TypeScript.

### Key Entities

- **Toast notification**: a transient message with a semantic kind (success/warning/info/error), text, and dismissal behavior.
- **Moderation review view**: the admin representation of a review with its state (`pending`/`approved`/`rejected`) and the actions available.
- **Manual appointment**: a staff-created booking (client, service, specialist, date/time).
- **Service (catalog item)**: a bookable offering created from the panel.
- **Profile image**: a logo/avatar (square) or cover (banner) with dimension/aspect rules.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: 100% of create/edit modals block repeated submissions while a request is in flight (no duplicate records).
- **SC-002**: 100% of successful creates/closes refresh the affected list without a manual reload, within the same interaction.
- **SC-003**: 100% of successes, validation failures, informational events and API failures are surfaced with the correct semantic color.
- **SC-004**: An owner can moderate a review (approve/reject/delete) and see the public page reflect it immediately.
- **SC-005**: 100% of non-compliant profile images are blocked with a clear message; compliant ones are previewed and saved.
- **SC-006**: The "Nueva cita" and "Crear servicio" actions complete end-to-end (persisted + reflected).
- **SC-007**: Book gates pass with zero regressions; the module structure and centralized error handling are preserved.

## Assumptions

- **Toast system lives in `apps/book`** (shared components), reusing `@foundly/ui` tokens; no new third-party dependency is required.
- **Moderation publication** follows `specs/api/015-review-moderation`: new reviews are pending until approved; the panel's moderation surface is the only place to approve/reject/delete.
- **Image rules (defaults)**: avatar/logo recommended square (e.g. 512×512, max ~2 MB, aspect ~1:1); cover recommended banner (~3:1, e.g. 1200×400). Files are accepted as URLs or uploads; dimensions are validated when measurable, otherwise the aspect rules are shown as guidance (documented). Exact numbers are finalized in the plan.
- **Agenda/service creation reuse existing API mutations** (`createAppointment`, `createMyService`); no new backend surface is expected for them.
- **Respect for the governance hierarchy**: follows `specs/business-model.md` (a polished, trustworthy product experience) and the authority order of `constitution.md`.
