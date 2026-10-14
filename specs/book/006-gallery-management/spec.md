# Feature Specification: Foundly Book — Gallery Management

**Feature Branch**: `006-gallery-management`

**Created**: 2026-10-10

**Status**: Draft

**Input**: User description: "Directrices para el módulo de Galería (/admin/gallery). Visión General y Objetivo: Permitir al administrador del negocio gestionar el catálogo visual y portafolio de fotos que se muestra en la sección 'Galería' de su perfil público (/book/[tenantSlug]). Vista Admin (/admin/gallery): grid de imágenes con tarjetas glassmorphism; modal de nueva imagen con URL, título/descripción corta (opcional) y categoría/tag (ej. Local, Trabajos, Equipo); acciones por foto: previsualización en modal/lightbox y eliminación con confirmación. Sincronización: reactividad y persistencia en el estado mock local para que las fotos añadidas o eliminadas se reflejen inmediatamente en el bloque #galeria del portal público. Calidad: flujo TDD con tests unitarios e integrados pasando al 100%."

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Curate the public gallery (Priority: P1)

As an administrator, I want to see all the photos of my business in a visual grid and add a new photo with its details so that the number of photos on my public page grows and stays up to date.

**Why this priority**: Showing the gallery is the core value; without viewing and adding photos there is nothing to manage.

**Independent Test**: Open `/admin/gallery`, see the existing photos as a grid, click "add photo", provide a valid URL and optional title/category, save, and confirm the new photo appears and is immediately visible in the `#galeria` block on the public business page.

**Acceptance Scenarios**:

1. **Given** the gallery view, **When** it renders, **Then** the header offers an "add photo" entry point and the current photos render as visual cards with their details (title, category, preview).
2. **Given** the add-photo form, **When** I enter a valid photo URL with an optional title and category and confirm, **Then** a new card appears and the public gallery shows the photo.
3. **Given** the add-photo form, **When** I try to save with an invalid or empty URL, **Then** the save is blocked with an inline error.
4. **Given** the add-photo form, **When** I omit title and category (both optional), **Then** the photo is still saved without errors.

---

### User Story 2 - Preview and remove photos (Priority: P2)

As an administrator, I want to preview a photo in a lightbox and remove unwanted photos with confirmation so that the portfolio stays curated.

**Why this priority**: Curating (removing) and verifying (previewing) are the natural second increment once the gallery can be populated.

**Independent Test**: Open a photo in the lightbox preview, close it, then remove a photo through the confirmation dialog and verify it disappears from both the admin grid and the public gallery.

**Acceptance Scenarios**:

1. **Given** a photo card, **When** I trigger the preview, **Then** a lightbox shows the photo at a comfortable viewing size and can be dismissed.
2. **Given** a photo card, **When** I choose to remove it, **Then** a confirmation dialog is shown before anything is deleted.
3. **Given** a confirmed removal, **When** the removal completes, **Then** the card disappears and the photo is gone from the public `#galeria` block immediately.

---

### User Story 3 - Consistent, accessible administration experience (Priority: P3)

As an operator, I want the gallery screens to reuse the shared visual system and be keyboard-accessible like the rest of the panel.

**Why this priority**: Consistency and accessibility are ecosystem requirements that refine, not enable, the core flows.

**Independent Test**: Traverse the gallery grid, the add form and the lightbox with the keyboard and confirm the screens use the shared design system with no ad-hoc styling.

**Acceptance Scenarios**:

1. **Given** any gallery screen, **When** it renders, **Then** it uses the shared design system components and tokens with no ad-hoc brand styling.
2. **Given** the gallery screens, **When** navigated by keyboard, **Then** all controls are reachable, focus is visible and automated accessibility checks report zero critical violations.

---

### Edge Cases

- A photo URL is malformed or unreachable: the form rejects invalid URL formats with an inline message.
- The same URL is added twice: the system prevents exact duplicates.
- The gallery is empty: the admin view shows a friendly empty state and the public block shows a "no photos yet" state.
- Optional fields are left blank (no title, no category): the photo is still valid and renders without them.
- An image fails to load in preview: an accessible fallback is displayed instead of a broken image.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: `/admin/gallery` MUST present a header with an "add photo" entry point and a grid of the business's current photos rendered as visual cards.
- **FR-002**: Each photo card MUST show the image, an optional short title/description, an optional category tag, a preview action and a remove action.
- **FR-003**: The add-photo form MUST collect a photo URL (required, validated as a URL), a short title/description (optional) and a category/tag (optional, from the set Local · Trabajos · Equipo, with a "sin categoría" option).
- **FR-004**: Saving with an empty or invalid URL MUST be blocked with an inline error; omitting title and category MUST still allow saving.
- **FR-005**: Each photo MUST support a lightbox preview that can be dismissed, and removal MUST require an explicit confirmation.
- **FR-006**: Adding, previewing or removing photos MUST NOT block on external services; a photo MAY be supplied either by pasting a URL or (since feature `021-tenant-media-uploads`) by uploading a file from the device. The stored value remains a URL string.
- **FR-007**: Any photo added or removed in the admin MUST be reflected immediately in the `#galeria` block of the tenant's public page through the shared mock/local state.
- **FR-008**: Duplicate photo URLs MUST be rejected; the gallery MUST remain consistent (each photo identified individually).
- **FR-009**: The screens MUST use the shared design system (glassmorphism cards, pills) and tokens; automated accessibility checks MUST pass with zero critical violations.

### Key Entities _(include if feature involves data)_

- **GalleryPhoto**: A photo in the business's visual catalog. Attributes: image URL, short title/description (optional), category/tag (optional: Local, Trabajos, Equipo), a stable identity. Part of the gallery owned by the business (Tenant).
- **Tenant (business)**: owns the gallery collection exposed on the public landing `#galeria`.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: An administrator can add a photo from the gallery view in under 1 minute.
- **SC-002**: 100% of attempts to save an invalid or empty URL are blocked with inline errors.
- **SC-003**: 100% of admin gallery mutations are reflected in the public `#galeria` block immediately (same state seam).
- **SC-004**: The gallery screens pass automated accessibility checks with zero critical violations and use the shared design system exclusively.

## Assumptions

- Governed by `constitution.md` v5.0.1 and `specs/business-model.md` (Foundly Book module).
- Photos are URL-based by default; since feature `021-tenant-media-uploads` a photo can also be uploaded from the device through the shared media control, and the stored value remains a URL string.
- Categories are limited to the trio Local · Trabajos · Equipo plus "sin categoría"; the set could become configurable later.
- Each photo gets a stable identity so duplicates are tracked and removals are precise; the title/description and category enrich the public cards.
- Data stays in the in-memory mock store seam; persistence technology remains undefined until `specs/architecture.md` ratifies storage.
- Reuses the existing storefront feature module already used by the staff and profile admin sections.
