# Feature Specification: Foundly API — Review Moderation

**Feature Branch**: `015-review-moderation`

**Created**: 2026-10-13

**Status**: Draft

**Input**: User description: "El negocio necesita visualizar las reseñas dejadas por los usuarios en su panel de administración e implementar la capacidad de aprobar, filtrar o eliminar reseñas para evitar contenido basura o malintencionado. Ajustar el backend si la mutación de reseñas (moderación) lo requiere."

_This spec is governed by `constitution.md` v5.2.0, `specs/business-model.md` and `specs/architecture.md`. It lives in the `api` domain because the affected application is `apps/api`. It extends the reviews surface of `specs/api/013-profile-policies-reviews` and is the backend counterpart of the moderation part of `specs/book/016-admin-ux-hardening`._

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Approve or reject a submitted review (Priority: P1)

As an authenticated business owner, I want to approve or reject a review left for my business, so that only appropriate reviews are published.

**Why this priority**: Moderation is the core need; without it any submitted content is public.

**Independent Test**: With a valid credential, take a pending review and approve it (then it is public) or reject it (then it is not); an anonymous attempt is rejected; another business cannot moderate it.

**Acceptance Scenarios**:

1. **Given** a business with a pending review, **When** the owner approves it, **Then** its state becomes approved and it appears in the public reviews.
2. **Given** a pending or approved review, **When** the owner rejects it, **Then** its state becomes rejected and it no longer appears in the public reviews.
3. **Given** an anonymous request, **When** a moderation action is attempted, **Then** it is rejected with the stable authentication error and nothing changes.
4. **Given** a review belonging to another business, **When** it is moderated by id, **Then** it fails as not-found and the record is intact.

---

### User Story 2 - See the reviews awaiting moderation (Priority: P1)

As an authenticated business owner, I want to see all reviews of my business (especially those pending), so that I know what to moderate.

**Independent Test**: Query the business's reviews as the owner and confirm all states are returned (including pending), optionally filtered by state; an anonymous request is rejected.

**Acceptance Scenarios**:

1. **Given** a business with reviews in several states, **When** the owner reads them, **Then** all of them are returned (with their state).
2. **Given** a state filter, **When** the owner reads them, **Then** only reviews in that state are returned.
3. **Given** an anonymous request, **When** the admin read runs, **Then** it is rejected with the stable authentication error.

---

### User Story 3 - Delete an inappropriate review (Priority: P2)

As an authenticated business owner, I want to delete a review entirely, so that abusive content is removed for good.

**Independent Test**: Delete an owned review and confirm it is gone from both the admin list and the public list; a foreign id → not-found; anonymous → rejected.

**Acceptance Scenarios**:

1. **Given** an owned review, **When** the owner deletes it, **Then** it is removed everywhere.
2. **Given** a foreign id, **When** it is deleted, **Then** it fails as not-found and the record is intact.
3. **Given** an anonymous request, **When** a delete runs, **Then** it is rejected with the stable authentication error.

---

### Edge Cases

- The public reviews list now shows only approved reviews; the aggregate rating is computed over approved reviews only. A business with only pending/rejected reviews shows empty + no rating.
- Public review submission still works and creates a **pending** review.
- Moderation of a missing/foreign id → not-found (no existence oracle).
- Re-approving an already-approved review, or rejecting an already-rejected one, is a no-op success (idempotent).
- Empty list for a business with no reviews (any state) — not an error.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: The review entity MUST carry a moderation state with the values `pending`, `approved`, `rejected`; new submissions MUST default to `pending`.
- **FR-002**: The public reviews read MUST return only `approved` reviews, and the aggregate rating MUST be computed over `approved` reviews only; with none, it MUST return an empty list and a null/zero aggregate (never an error).
- **FR-003**: The API MUST expose an **authenticated**, tenant-scoped read that returns all of the caller's business reviews (any state), optionally filtered by state.
- **FR-004**: The API MUST expose an authenticated, tenant-scoped operation to set a review's state to `approved` or `rejected`, idempotent for the target state.
- **FR-005**: The API MUST expose an authenticated, tenant-scoped operation to delete a review.
- **FR-006**: Write operations MUST derive the owning business from the authenticated identity and MUST NOT accept a client-supplied business identifier as the authority.
- **FR-007**: Anonymous/non-tenant-bound moderation writes MUST be rejected with the stable authentication error and MUST NOT change anything.
- **FR-008**: Operations on a review owned by another business MUST fail as not-found and MUST NOT modify or reveal it.
- **FR-009**: The existing public review submission (feature `013`) MUST keep working and now create a `pending` review.
- **FR-010**: Automated tests MUST cover: moderation (approve/reject, idempotent), admin read (all states + filter), delete (owned/foreign/anonymous), public read (only approved + aggregate) and cross-tenant isolation.
- **FR-011**: All API gates (`build`, `typecheck`, `test`, lint) MUST pass with no regressions under strict TypeScript.

### Key Entities

- **Review**: a customer rating/comment belonging to a business, now with a **moderation state** (`pending` | `approved` | `rejected`) plus author, rating, comment and creation date.
- **Business (tenant)**: moderates its own reviews; public reads expose only approved ones.
- **Aggregate rating**: average and count computed over **approved** reviews.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: 100% of pending reviews are hidden from the public list until approved; approving/rejecting updates the public list and aggregate immediately on the next read.
- **SC-002**: 100% of anonymous or cross-business moderation attempts are rejected with the stable errors and change nothing.
- **SC-003**: The admin read returns every state (and correctly filters by state).
- **SC-004**: Public submission keeps creating reviews (now pending) without regressions.
- **SC-005**: All API gates pass with zero regressions.

## Assumptions

- **Moderation-first publication**: reviews are created `pending` and are public only once `approved` (matching the requested "aprobar/filtrar/eliminar" workflow). This intentionally changes the current behavior where submitted reviews were public immediately.
- **New persistence field + migration**: the review entity gains a moderation state, requiring a migration; existing rows (if any) are backfilled as `approved` to preserve any already-published content.
- **Respect for the governance hierarchy**: follows `specs/business-model.md` (a trustworthy public reputation underpins the Foundly Book value proposition) and the authority order of `constitution.md`.
