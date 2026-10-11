# Feature Specification: Foundly Book — Business Profile

**Feature Branch**: `007-business-profile`

**Created**: 2026-10-10

**Status**: Draft

**Input**: User description: "Permitir al administrador configurar y actualizar la información general de su comercio que se visualiza en el header y en las secciones públicas ('Acerca de', 'Dirección y Horarios' y la tarjeta Sticky lateral de /book/[tenantSlug]). Vista Admin (/admin/profile o /admin/settings): Datos Principales de Identidad (nombre del comercio, categoría/rubro, slug/URL pública, logo/isotipo y foto de portada/banner con vista previa); Información de Contacto y Redes (teléfono de contacto/WhatsApp, enlace de Instagram, dirección física); Información del Comercio y Políticas (acerca de/descripción, políticas de reserva y cancelación, horario de atención resumen visual sincronizado con disponibilidad). Sincronización: la información guardada actualiza en tiempo real el header, la tarjeta Sticky, el bloque Acerca de, el bloque Dirección y el footer en /book/[tenantSlug]."

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Configure the business identity (Priority: P1)

As an administrator, I want to set my business name, category, public URL (slug) and logo/banner images so that the header and sticky card of my public page identify the store correctly.

**Why this priority**: Identity is what users see first in the header and the sticky card; without it there is no storefront.

**Independent Test**: Open `/admin/profile`, change the business name, category and the logo/cover URLs (with preview), save, and confirm the public page header and sticky card (Estudio Ana) show the new identity immediately.

**Acceptance Scenarios**:

1. **Given** the business-profile view, **When** it renders, **Then** fields for name, category, public URL, logo and cover are available with the current values.
2. **Given** a logo or cover URL, **When** it is entered, **Then** a preview is shown before saving.
3. **Given** a saved update, **When** the public page is opened, **Then** the header and the sticky card reflect the new name/logo/category.
4. **Given** an invalid or duplicate public URL, **When** I save, **Then** the save is blocked with an inline error.

---

### User Story 2 - Manage contact, socials and address (Priority: P2)

As an administrator, I want to keep my contact phone/WhatsApp, Instagram link and physical address up to date so that customers can reach the business.

**Why this priority**: Contact information completes the sticky card and the direction section that customers rely on.

**Independent Test**: Edit the phone/WhatsApp, Instagram and address, save, and confirm the public sticky card and the "Dirección" section reflect the change.

**Acceptance Scenarios**:

1. **Given** the contact fields, **When** I update phone/WhatsApp, Instagram or address and save, **Then** the values persist and are shown in the public sticky card and the "Dirección" section.
2. **Given** a malformed URL (Instagram/WhatsApp), **When** I save, **Then** an inline error is shown and the invalid value is not saved.

---

### User Story 3 - Describe the business and its policies (Priority: P3)

As an administrator, I want to write the "About" text and the reservation/cancellation policies and see the opening hours as a summary, so that customers have all the information they need.

**Why this priority**: Once identity and contact are set, descriptive text and policies complete the public profile.

**Independent Test**: Write the About description and one policy, save, and confirm the public "Acerca de" section and the policies card show the new text; the hours summary reflects the availability configuration.

**Acceptance Scenarios**:

1. **Given** the description and policies fields, **When** I update them and save, **Then** the public "Acerca de" section and the policies card show the new content.
2. **Given** the hours section, **When** the view renders, **Then** a visual summary of the weekly opening hours is shown, sourced from the availability configuration.
3. **Given** a saved update, **When** the storefront is reloaded, **Then** all public sections (header, sticky card, About, Directions and footer) keep the saved values (persistent across sessions via the shared state).

---

### Edge Cases

- The public URL (slug) conflicts with another business or uses a reserved/invalid format: saving is blocked with a clear error.
- Logo, cover, Instagram or WhatsApp URLs are malformed: per-field inline errors; invalid values are not persisted.
- The address, phone or policies are left empty: the corresponding public blocks gracefully hide or show placeholders.
- Hours are changed in the availability section after the profile is saved: the profile summary always reflects the latest availability configuration.
- The business is renamed: the header, sticky card, titles of public sections and the side navigation update consistently.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: `/admin/profile` MUST allow editing the business identity: name, category/vertical, public URL (slug) and logo/cover image URLs, each with current-value display and preview for images.
- **FR-002**: The public URL MUST be validated for format and uniqueness; an invalid or duplicate slug MUST block saving with an inline error.
- **FR-003**: The view MUST allow editing contact and networks: phone/WhatsApp, Instagram URL and physical address.
- **FR-004**: The view MUST allow editing the "About" description and the reservation/cancellation policies (one or more entries).
- **FR-005**: The view MUST show a visual summary of the weekly opening hours that reflects the availability configuration (editing hours stays in the availability section).
- **FR-006**: Saving MUST persist the profile through the shared mock/local state and MUST reflect the changes immediately in the public header, sticky card, "Acerca de", "Dirección y horarios" and footer of `/book/[tenantSlug]`.
- **FR-007**: Optional fields (phone, Instagram, address, policies) MUST handle empty values gracefully without breaking any public section.
- **FR-008**: All mutations MUST authorize the admin session, validate inputs (URLs, slug) and return the typed result; the screens MUST use the shared design system components and tokens.

### Key Entities _(include if feature involves data)_

- **Tenant (business)**: identity (name, category, public URL, logo, cover), contact (phone/WhatsApp, Instagram, address), description ("About") and weekly opening hours.
- **PortalPolicy**: a reservation/cancellation policy shown on the public policies card (title + body); the business has zero or more.
- **BusinessHours**: the weekly opening schedule, sourced from the availability configuration and shown as a visual summary.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: An administrator can update identity, contact and description in under 2 minutes and see it reflected on the public page immediately.
- **SC-002**: 100% of invalid or duplicate public URLs and malformed links are blocked with inline errors.
- **SC-003**: 100% of saved profile changes are reflected in the public header, sticky card, About, Directions and footer (same shared state).
- **SC-004**: The profile editor passes automated accessibility checks with zero critical violations and uses the shared design system exclusively.

## Assumptions

- Governed by `constitution.md` v5.0.1 and `specs/business-model.md` (Foundly Book module).
- Images (logo/cover) are URL-based; upload is out of scope for this version.
- WhatsApp is represented by the contact phone; the social field may also accept a `wa.me` link.
- The opening-hours summary is read-only in this view and sources from the availability configuration (edit remains in the availability section).
- Policies are free-text entries (title + body) managed in this view; the public policies card renders them.
- Data stays in the in-memory mock store seam; persistence technology remains undefined until `specs/architecture.md` ratifies storage.
- Reuses the existing storefront feature module (profile, staff, gallery admin sections).