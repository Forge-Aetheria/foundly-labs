# Feature Specification: Foundly Book — Tenant Media Uploads & Cover Fallback

**Feature Branch**: `021-tenant-media-uploads`

**Created**: 2026-10-14

**Status**: Draft

**Input**: User description: "@apps/book — Aprobado: Ejecución de Feature book/021-tenant-media-uploads y Fallback de Portada. Implementar subida directa de archivos (imágenes) en el panel de administración (perfil logo/cover, equipo avatar, galería) mediante una utilidad y un componente reutilizable, manteniendo el input de URL como alternativa. Añadir un fallback visual de portada en el perfil público cuando coverUrl es nulo (primera imagen de la galería o patrón/gradiente corporativo). Enmendar los specs 005 y 006."

_This spec is governed by `constitution.md` v5.2.0, `specs/business-model.md` (Foundly Book, §2.3) and `specs/architecture.md`. It lives in the `book` domain. It supersedes the "upload out of scope" premise of `specs/book/005-staff-management`, `specs/book/006-gallery-management` and `specs/book/007-business-profile`, and the "URL-only" notes in `specs/book/013-gallery-integration`, `specs/book/014-profile-policies-reviews` and `specs/book/016-admin-ux-hardening` for the media fields only. The backend contract is unchanged (`specs/api/*`): images remain URL strings on the existing fields._

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Upload an image directly from the admin panel (Priority: P1)

As a business administrator, I want to pick or drag an image file for my logo, cover, team avatar or gallery photo directly from my device — instead of pasting a URL — so that publishing my brand imagery is fast and does not depend on external hosting.

**Why this priority**: This is the core value: today every image field requires a URL that the operator must source and host elsewhere. Direct upload removes the biggest friction in populating the identity, team and gallery surfaces.

**Independent Test**: Open `/admin/gallery`, add a photo choosing a valid JPG/PNG/WEBP under 5 MB, and confirm the uploaded image appears in the grid and on the public page; repeat on `/admin/profile` (logo and cover) and `/admin/staff` (avatar) and confirm each is persisted and rendered.

**Acceptance Scenarios**:

1. **Given** an empty image field in the admin, **When** I select a valid image file (JPG, PNG or WEBP, ≤ 5 MB), **Then** the file is uploaded, a preview is shown immediately and the resulting image URL is saved with the record.
2. **Given** an image field in the admin, **When** I drop a valid image file onto the field, **Then** the same upload flow runs as with the file selector.
3. **Given** a selected file whose format is not JPG/PNG/WEBP or whose size exceeds 5 MB, **When** I attempt to upload it, **Then** the upload is blocked with an inline error and no request is sent.
4. **Given** a file that fails to upload (network or storage unavailable), **When** the upload finishes, **Then** a friendly error is shown, the previously saved value is preserved and I can retry.

---

### User Story 2 - Always-visible hero banner on the public profile (Priority: P1)

As a visitor, I want the business profile page to always show a hero banner so that the page looks complete and on-brand even when the business has not set a cover image.

**Why this priority**: The public profile (`/[tenantSlug]`) currently renders nothing where the cover would be, which reads as a broken/empty page. A guaranteed hero is an immediate visual-quality fix independent of the upload work.

**Independent Test**: Open a business profile whose cover is empty but which has gallery photos and confirm a hero banner shows the first gallery photo; open a profile with neither cover nor gallery and confirm an on-brand gradient/pattern banner with the business name is shown instead of an empty space.

**Acceptance Scenarios**:

1. **Given** a business with a saved cover, **When** its public profile renders, **Then** the hero banner shows the saved cover (unchanged behaviour).
2. **Given** a business with no cover but at least one gallery photo, **When** its public profile renders, **Then** the hero banner shows the first gallery photo.
3. **Given** a business with neither cover nor gallery photos, **When** its public profile renders, **Then** an on-brand gradient/pattern banner including the business name is shown, and no empty/blank hero area remains.

---

### User Story 3 - Keep the URL input as a manual alternative (Priority: P2)

As an administrator, I want to keep pasting an image URL for any media field so that I can reuse images hosted elsewhere when I prefer not to upload them.

**Why this priority**: Some operators already have hosted assets (social CDN, existing site). Preserving the URL path avoids a regression and keeps migrations safe, but it is secondary to the new upload capability.

**Independent Test**: On any media field, paste a valid `https://` image URL instead of uploading, save, and confirm the pasted image is previewed and persisted exactly as before.

**Acceptance Scenarios**:

1. **Given** any media field, **When** I paste a valid image URL, **Then** a preview is shown and the URL is saved on the record.
2. **Given** a media field with an uploaded image, **When** I replace the value by pasting a different URL, **Then** the new URL is saved and shown.
3. **Given** a media field, **When** I clear the value, **Then** the field is saved as empty and the public surface falls back to its default (logo placeholder / cover fallback / no photo).

---

### User Story 4 - Consistent, accessible media controls (Priority: P3)

As an operator, I want every media field to use the same control and to be usable by keyboard and screen reader, consistent with the rest of the panel.

**Why this priority**: Consistency and accessibility are ecosystem requirements that refine, not enable, the core flows.

**Independent Test**: Traverse each media field by keyboard (focus the file selector, the URL input and the preview), confirm focus is visible, labels are announced and automated accessibility checks report zero critical violations, and confirm the fields share one component with no ad-hoc styling.

**Acceptance Scenarios**:

1. **Given** any media field, **When** it renders, **Then** it uses the shared design system components and tokens with no ad-hoc brand styling.
2. **Given** any media field, **When** navigated by keyboard, **Then** the file selector, URL input and any action are reachable and labelled, and automated accessibility checks pass with zero critical violations.

---

### Edge Cases

- Unsupported file type (e.g. GIF, PDF, SVG): the field rejects it inline; no upload is attempted.
- File larger than 5 MB: rejected inline; no upload is attempted.
- Upload fails because storage is not configured or the network drops: a friendly, non-technical error is shown, the previous value is kept intact and the operator can retry.
- A pasted URL is malformed (not `http(s)`): blocked inline with guidance.
- The same image is uploaded twice: each upload produces an independent stored asset (no dedupe requirement) and both remain valid.
- The business has no cover AND no gallery photos: the public profile shows the branded fallback banner (never an empty hero).
- The gallery is empty and the fallback comes from a gallery photo that later gets removed: the public hero recomputes from the current gallery on next render.
- An image fails to load in a preview or on the public page: an accessible fallback is shown instead of a broken image.
- Non-square image uploaded for the square avatar field: the field stores it and renders it fitted (`object-fit: cover`); aspect guidance remains advisory.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: The admin media fields for profile logo, profile cover, staff avatar and gallery photo MUST allow selecting a local image file (file picker and drag & drop) and MUST upload it to tenant-scoped storage.
- **FR-002**: The upload MUST accept only JPG, PNG and WEBP files up to 5 MB, and MUST reject other formats or larger files with an inline error before any request is sent.
- **FR-003**: The media control MUST show an immediate preview of the current image (from the uploaded URL or a pasted URL).
- **FR-004**: Each media field MUST retain a URL text input as a manual alternative; a pasted URL MUST be persisted and treated identically to an uploaded one (the stored value is always a URL string).
- **FR-005**: The public business profile MUST always render a hero banner: the saved cover when present; otherwise the first gallery photo; otherwise an on-brand gradient/pattern banner that includes the business name.
- **FR-006**: An upload failure MUST NOT discard the operator's existing value; the system MUST show a friendly error and allow retry.
- **FR-007**: Uploaded assets MUST be stored under a namespace that identifies the owning tenant so that only that tenant can write its media, and MUST be publicly readable so the public profile and catalog can display them.
- **FR-008**: The feature MUST NOT change the backend/API contract: media continues to be transported and stored as URL strings on the existing fields (no new API fields, no Prisma changes).
- **FR-009**: Every media field MUST use the shared design system (one reusable control) and MUST pass automated accessibility checks with zero critical violations.
- **FR-010**: The feature MUST update the premise of the affected specs (`005`, `006`, `007`) so that image upload is no longer described as out of scope, without duplicating normative rules.

### Key Entities _(include if feature involves data)_

- **MediaAsset**: An uploaded image file owned by a tenant. Attributes: public URL, owning tenant, media kind (logo / cover / avatar / gallery), content type, byte size. Persisted indirectly: only its public URL is referenced by the business records.
- **Tenant (business)**: Owns its media assets and reuses the stored URLs on its logo, cover, staff avatars and gallery photos.
- **GalleryPhoto**: Existing entity (006/013); its image URL may now come from an upload as well as a pasted URL, and it is the source for the hero fallback when no cover is set.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: An administrator can publish a business image through upload in under 30 seconds per image, without leaving the admin panel.
- **SC-002**: 100% of unsupported-format or oversized upload attempts are blocked before any request is sent, with an inline error.
- **SC-003**: 100% of business profiles render a visible hero banner (cover, gallery fallback or branded fallback) — zero profiles show an empty hero area.
- **SC-004**: 0 regressions: the URL-paste path keeps working for all four media fields (characterized by passing existing/added tests).
- **SC-005**: The media fields and the public hero pass automated accessibility checks with zero critical violations and use the shared design system exclusively.

## Assumptions

- Governed by `constitution.md` v5.2.0 and `specs/business-model.md` (Foundly Book module). References its governance in line with `specs/book/014-profile-policies-reviews`.
- The tenant-scoped storage bucket(s) and their access policies are provisioned in Supabase as an operational/delivery step (documented in this feature's quickstart); the application only consumes them.
- Images are uploaded one at a time; there is no multi-file batch upload, cropping, rotation or in-browser editing in this version.
- Maximum size is 5 MB and accepted formats are PNG/JPG/WEBP, consistent with the existing payment-proof upload (`017`).
- The stored value remains a URL string; the backend and database schema are unchanged (FR-008).
- Aspect/size guidance from `016` remains advisory; an uploaded non-conforming image is stored and rendered fitted rather than rejected.
- The cover fallback resolves on the server/client render from the already-available public gallery data; no extra public API field is introduced.
- This spec amends `005`, `006` and `007` (and cross-references `013`, `014`, `016`) to remove the "upload out of scope / URL-only" premise for media fields only.
