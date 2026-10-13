# Feature Specification: Foundly Book — Gallery Integration (Admin + Public Portal)

**Feature Branch**: `013-gallery-integration`

**Created**: 2026-10-13

**Status**: Draft

**Input**: User description: "Crear el módulo frontend de galería: documentos `.graphql`, generación de tipos vía codegen, `actions.ts` y `hooks.ts` (Server-First, `apiRequestAdmin`), y conectar las vistas de administración (`/admin/gallery`) y el mini-sitio público (`/book/<slug>`, actualizando `getPublicBusinessRemote` para traer las imágenes reales en lugar de un array vacío). Reemplazar el estado vacío explícito por datos reales."

_This spec is governed by `constitution.md` v5.2.0, `specs/business-model.md` (Foundly Book, §2.3) and `specs/architecture.md`. It lives in the `book` domain. It supersedes the "no backend → empty state" decision of `specs/book/010-remove-local-store` for the gallery, and builds on the original UI spec `specs/book/006-gallery-management`. Its backend counterpart is `specs/api/012-gallery-management`._

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Manage the real gallery from the panel (Priority: P1)

As a business owner, I want `/admin/gallery` to show my real photos from the server and let me add and remove them, so that managing my portfolio is truthful and persistent.

**Why this priority**: The gallery section currently shows a hard empty state because it had no backend; showing and managing real photos is the core value.

**Independent Test**: Open `/admin/gallery`, see the business's real photos; add a new photo (URL + optional title/description/category); reload and confirm it persists; remove it and confirm it disappears after a reload.

**Acceptance Scenarios**:

1. **Given** the admin gallery, **When** it loads, **Then** it shows the business's photos read from the server, or a clean empty state when there are none.
2. **Given** the add-photo form, **When** I submit a valid URL with optional fields, **Then** the photo is persisted and appears in the grid.
3. **Given** the add-photo form, **When** I submit an empty/invalid URL, **Then** the save is blocked with an inline error.
4. **Given** a photo, **When** I confirm removal, **Then** it is removed on the server and disappears from the grid.
5. **Given** the server cannot be reached, **When** the gallery loads or a write runs, **Then** the failure is surfaced cleanly (no raw text, no false success).

---

### User Story 2 - The public mini-site shows the real gallery (Priority: P1)

As a visitor, I want the business's public page `#galeria` to show the real photos, so what I see matches the business's portfolio.

**Why this priority**: The public gallery is the visible outcome for customers; an empty placeholder undermines the feature.

**Independent Test**: Open `/book/<slug>` for a business with photos and confirm the `#galeria` block renders them; for a business without photos, confirm a clean "no photos yet" state.

**Acceptance Scenarios**:

1. **Given** a business with photos, **When** its public page loads, **Then** the gallery block shows the real photos in the business's order.
2. **Given** a business with no photos, **When** its public page loads, **Then** the gallery block shows a clean empty state.
3. **Given** a photo added in the admin, **When** the public page is reloaded, **Then** the new photo appears.

---

### User Story 3 - A session-safe, modular implementation (Priority: P2)

As a maintainer, I want the gallery module to follow the canonical module structure and the session-aware transport, so it is consistent with the rest of the panel.

**Independent Test**: Confirm the module has `gallery.graphql`, `actions.ts` and `hooks.ts`, that the UI never calls the transport directly, and that an expired session on the gallery routes to the global sign-in flow.

**Acceptance Scenarios**:

1. **Given** the gallery module, **When** inspected, **Then** data access lives in `actions.ts` (server) and interactive mutations are exposed via `hooks.ts` (`useFetchGallery`, `useAddGalleryItem`, `useRemoveGalleryItem`).
2. **Given** an expired session while managing the gallery, **When** a read/write runs, **Then** it routes through the global session-expiry handling (no raw error text).
3. **Given** the module, **When** the gate checks run, **Then** typecheck, lint, tests and build pass.

---

### Edge Cases

- Empty gallery: admin shows a clean empty state; the public block shows "no photos yet".
- Invalid URL: blocked inline before saving.
- Duplicate URL: surfaced as a clear conflict message; the grid is unchanged.
- Photo image fails to load: an accessible fallback is shown instead of a broken image.
- Optional title/description/category omitted: the photo saves and renders without them.
- Server error on load/add/remove: surfaced cleanly; no invented data and no false "saved" state.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: The gallery module MUST read and write gallery photos through the backend; no local/mock data.
- **FR-002**: `/admin/gallery` MUST render the business's real photos as cards, with a clean empty state when there are none, replacing the previous hard empty state.
- **FR-003**: The add-photo form MUST collect a photo URL (required, validated) and optional title/description/category; saving MUST persist on the server and reflect the result.
- **FR-004**: Removing a photo MUST require confirmation and MUST delete it on the server.
- **FR-005**: Failures on load/add/remove MUST be surfaced cleanly (localized messages; no raw provider text, no false success).
- **FR-006**: The public mini-site `#galeria` block MUST render the business's real photos (read by public slug/reference), or a clean empty state.
- **FR-007**: Data access MUST live in the module's `actions.ts` (server) and interactive mutations MUST be exposed through `hooks.ts` with the standard naming (`useFetchGallery`, `useAddGalleryItem`, `useRemoveGalleryItem`); the UI MUST NOT call the transport or server actions directly.
- **FR-008**: Gallery data access MUST reuse the session-aware transport so session expiry is handled globally.
- **FR-009**: GraphQL operations and types MUST be produced by the project's codegen (no hand-written API DTOs).
- **FR-010**: The screens MUST use the shared design system and pass automated accessibility checks with zero critical violations.
- **FR-011**: All book gates (`build`, `typecheck`, `test`, lint) MUST pass with no regressions under strict TypeScript.

### Key Entities

- **Gallery photo (admin + public view)**: a photo of the business — image URL, optional title/description, optional category, identity, order.
- **Public business profile**: the aggregated public read (`getPublicBusinessRemote`) that now includes the real gallery instead of an empty list.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: 100% of the admin gallery content comes from the backend; the previous hard empty state is gone when photos exist.
- **SC-002**: An owner can add a photo and see it persisted (visible after reload) in under 1 minute.
- **SC-003**: 100% of invalid/duplicate adds are blocked with a clear message and persist nothing.
- **SC-004**: The public `#galeria` block reflects the backend photos (and shows a clean empty state when there are none).
- **SC-005**: Book gates pass with zero regressions; the module follows the `actions.ts`/`hooks.ts` structure.

## Assumptions

- **Backend dependency**: relies on the gallery surface delivered by `specs/api/012-gallery-management` (public read + authenticated add/remove, tenant-scoped).
- **Categories** remain the closed set Local · Trabajos · Equipo plus "none"; photos are URL-based (no upload), consistent with `006`.
- **Tenant scoping** for admin reads comes from the session (never the URL); the public read uses the business's public reference.
- **Respect for the governance hierarchy**: follows `specs/business-model.md` (the business's public page and portfolio are part of the Foundly Book value proposition) and the authority order of `constitution.md`.
