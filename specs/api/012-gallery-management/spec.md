# Feature Specification: Foundly API — Gallery Management

**Feature Branch**: `012-gallery-management`

**Created**: 2026-10-13

**Status**: Draft

**Input**: User description: "Documentar la adición del modelo de Prisma para la galería (GalleryItem asociado a Tenant), los tipos GraphQL y las queries/mutaciones correspondientes (`gallery`, `addGalleryItem`, `removeGalleryItem`), con aislamiento por tenant y autenticación ES256/RS256."

_This spec is governed by `constitution.md` v5.2.0, `specs/business-model.md` and `specs/architecture.md`. It lives in the `api` domain because the affected application is `apps/api`. It is the backend counterpart of `specs/book/013-gallery-integration` and depends on the identity layer of `specs/api/008-supabase-jwt-auth` (algorithm support: `specs/api/011-jwt-algorithm-support`)._

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Read a business gallery (Priority: P1)

As a visitor or the business owner, I want to read the photos of a business, so that the gallery can be shown on the public page and in the admin panel.

**Why this priority**: Reading is the foundation; without it there is no gallery to display anywhere.

**Independent Test**: Query a business's gallery by its public slug and confirm its photos are returned; query an empty business and confirm an empty list (no error).

**Acceptance Scenarios**:

1. **Given** a business with photos, **When** its gallery is queried, **Then** the photos are returned in a stable order.
2. **Given** a business with no photos, **When** its gallery is queried, **Then** an empty list is returned (not an error).
3. **Given** an unknown business reference, **When** its gallery is queried, **Then** an empty list is returned.

---

### User Story 2 - Add a photo to my gallery (Priority: P1)

As an authenticated business owner, I want to add a photo (URL + optional title/description/category) to my business, so that my public gallery grows.

**Why this priority**: Populating the gallery is the core write operation.

**Independent Test**: With a valid credential, add a photo and confirm it appears in the business gallery; confirm an anonymous attempt is rejected; confirm another business cannot see it.

**Acceptance Scenarios**:

1. **Given** an authenticated, tenant-bound owner, **When** a valid photo is added, **Then** the photo is persisted for that owner's business and returned.
2. **Given** an anonymous request, **When** a photo is added, **Then** it is rejected with the stable authentication error and nothing is persisted.
3. **Given** a photo whose URL already exists in the same business, **When** it is added again, **Then** it is rejected with a conflict error and the gallery is unchanged.
4. **Given** an invalid or empty URL, **When** a photo is added, **Then** it is rejected with a validation error and nothing is persisted.
5. **Given** a token bound to another business, **When** the gallery is read, **Then** only that business's photos are visible (no cross-tenant leakage).

---

### User Story 3 - Remove a photo from my gallery (Priority: P2)

As an authenticated business owner, I want to remove a photo from my business, so that the gallery stays curated.

**Independent Test**: Remove an owned photo and confirm it disappears; attempt to remove a photo of another business by id and confirm it is not found and the record is intact.

**Acceptance Scenarios**:

1. **Given** an authenticated owner, **When** they remove one of their photos, **Then** it is deleted and the operation reports success.
2. **Given** a photo belonging to another business, **When** it is removed by id, **Then** the operation fails with not-found and the record is intact.
3. **Given** an anonymous request, **When** a photo is removed, **Then** it is rejected with the stable authentication error.

---

### Edge Cases

- Duplicate URL within the same business: rejected; the same URL in another business is allowed.
- Empty gallery: reads return an empty list; add/remove remain usable.
- Malformed URL (not absolute http/https): rejected.
- Category outside the known set: rejected (or normalized to none), never persisted as free garbage.
- Very long title/description: rejected above the accepted bound.
- Concurrent adds: each photo gets a stable identity; no corruption.
- Cross-tenant by-id access: not-found (no existence oracle), record untouched.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: The system MUST persist gallery photos associated with a business (tenant), each with a stable identity, an image URL, optional title, optional description, optional category and a display order.
- **FR-002**: The system MUST expose a read operation that returns a business's photos in a stable display order, scoped by the business reference (public, no credential required).
- **FR-003**: The system MUST expose an add operation that requires a valid identity and persists the photo for the identity's own business.
- **FR-004**: The system MUST expose a remove operation that requires a valid identity and removes only a photo owned by the identity's business.
- **FR-005**: Write operations MUST derive the owning business from the authenticated identity and MUST NOT accept a client-supplied business identifier.
- **FR-006**: An add attempt with an empty or non-absolute image URL MUST be rejected with a validation error and MUST NOT persist.
- **FR-007**: An add attempt with a URL already present in the same business MUST be rejected with a conflict error and MUST NOT persist.
- **FR-008**: Operations on a photo owned by another business MUST fail as not-found and MUST NOT modify or reveal it.
- **FR-009**: Anonymous write attempts MUST be rejected with the stable authentication error and MUST NOT persist.
- **FR-010**: The new surface MUST NOT change existing public queries or break existing modules.
- **FR-011**: Automated tests MUST cover: read (list/empty/unknown), add (valid, anonymous, duplicate, invalid input), remove (valid, foreign, anonymous) and cross-tenant isolation.
- **FR-012**: All API gates (`build`, `typecheck`, `test`, lint) MUST pass with no regressions under strict TypeScript.

### Key Entities

- **Gallery photo**: one image belonging to a business; image URL, optional title, optional description, optional category, display order, creation timestamp, stable identity. Related to a business (tenant).
- **Business (tenant)**: owns a collection of gallery photos; identified for public reads by its slug.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: A visitor reads a business's gallery (including the empty case) successfully, with photos in a stable order.
- **SC-002**: 100% of anonymous or cross-business write attempts are rejected with the stable error codes and persist nothing.
- **SC-003**: 100% of invalid-URL or duplicate-URL adds are rejected with validation/conflict and persist nothing.
- **SC-004**: Removing a photo of another business never deletes or mutates it (always not-found).
- **SC-005**: All API gates pass with zero regressions.

## Assumptions

- **The persistence model already exists**: the schema/migration already define a gallery-photo table related to `Tenant` (with `url`, `title`, `description`, `category`, `sortOrder`, `createdAt`). This feature exposes it; a new table is not created (avoiding duplication). The requested `GalleryItem` maps to this entity (GraphQL type `GalleryItem`; display order = existing `sortOrder`). No `updatedAt` is added because photos are add/remove-only.
- **Reads are public; writes are authenticated**: the gallery is public content shown on the business's page, so reads require no credential (consistent with the existing public reads); only writes require identity and are tenant-scoped from the token.
- **Reuse of the 006 model semantics**: categories are the closed set Local · Trabajos · Equipo plus "none"; photos are URL-based (no upload).
- **Respect for the governance hierarchy**: follows `specs/business-model.md` (the public business page is part of the Foundly Book value proposition) and the authority order of `constitution.md`.
