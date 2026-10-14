# Feature Specification: Foundly Book — Staff Management (Equipo y Especialistas)

**Feature Branch**: `005-staff-management`

**Created**: 2026-10-10

**Status**: Draft

**Input**: User description: "Módulo que permite al administrador del comercio gestionar los miembros de su equipo (profesionales, estilistas, especialistas), incluyendo sus perfiles públicos, fotos, especialidades y los servicios que prestan. Pantalla `/admin/staff`: header 'Equipo y Especialistas' + botón pill primario '+ Añadir Profesional', grid de tarjetas glassmorphism con avatar, nombre + cargo, badges de servicios, estado Activo/Inactivo y acciones por tarjeta; modal de creación/edición con nombre (requerido), cargo (requerido), biografía corta (≤250), URL de foto con preview, servicios prestados (multi-select) y estado (switch); sincronización con la vista pública; validaciones y gate de calidad."

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Manage the team roster (Priority: P1)

As an administrator, I want to see the members of my team as a visual grid and add a new professional so that the team starts appearing on my public booking page.

**Why this priority**: The team is the core of `/admin/staff`; without viewing and adding members no other team management flows provide value.

**Independent Test**: Open `/admin/staff`, see the member grid with status badges, click "+ Añadir Profesional", fill the required fields, save, and confirm the new card appears and is reflected by `getPublicBusiness(slug).specialists`.

**Acceptance Scenarios**:

1. **Given** the staff view, **When** it renders, **Then** a header "Equipo y Especialistas" with a primary pill "+ Añadir Profesional" is shown and the members render as glassmorphism cards (avatar, name + role, service badges, status badge, actions).
2. **Given** the add modal, **When** I provide a name, role, biography, avatar URL and assigned services and save, **Then** a new member card appears and the public portal reflects the new specialist.
3. **Given** the add modal, **When** I try to save without a name or without a role, **Then** the save is blocked and inline errors are shown.
4. **Given** the add modal, **When** no service is assigned, **Then** a warning is shown while still allowing the member to be saved.

---

### User Story 2 - Edit, deactivate and remove members (Priority: P2)

As an administrator, I want to edit a professional's profile, deactivate or remove them so that the public team always reflects the current staff.

**Why this priority**: Once the team exists, keeping it accurate is the next increment of value.

**Independent Test**: Edit a member's role/services, toggle their active state, and remove one; confirm the public specialists list updates accordingly on each change.

**Acceptance Scenarios**:

1. **Given** a member card, **When** I click "Editar", change role or services and save, **Then** the card and the public profile reflect the change.
2. **Given** a member card, **When** I toggle the status to Inactivo, **Then** the badge updates and the member no longer appears in the public team section.
3. **Given** a member card, **When** I confirm "Eliminar", **Then** the card is removed and the member disappears from the public roster.

---

### User Story 3 - Consistent, accessible administration experience (Priority: P3)

As an operator, I want every screen in the staff module to reuse the shared design system and be keyboard-accessible like the rest of the panel.

**Why this priority**: Consistency and accessibility are ecosystem requirements that refine, not enable, the core flows.

**Independent Test**: Traverse the staff grid and the add/edit modal with the keyboard and confirm only `@foundly/ui` components and tokens are used.

**Acceptance Scenarios**:

1. **Given** the staff view, **When** it renders, **Then** it uses `@foundly/ui` primitives and theme tokens with no ad-hoc brand styling.
2. **Given** the staff modal, **When** navigated by keyboard, **Then** all fields and actions are reachable and `vitest-axe` reports zero violations.

---

### Edge Cases

- A professional is saved with no services assigned: warning is shown, but the member is still creatable (services are optional).
- A professional is deactivated while they have future appointments or assigned services: their appointments remain intact (FR-014) and they stop appearing in the public team.
- Duplicate avatar URLs or empty fields: the coincidence is validated at schema level.
- A removed professional: any cross-reference (appointments, future assignments) must not break the agenda.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: `/admin/staff` MUST render a header "Equipo y Especialistas" with a pill primary "+ Añadir Profesional" (`#6C5CE7`).
- **FR-002**: The roster MUST render as a grid of glassmorphism cards, each showing a round avatar (or initials fallback), full name and role, badges of assigned services, a status badge (`Activo`/`Inactivo`) and per-card actions (Editar, Desactivar/Activar, Eliminar).
- **FR-003**: The create/edit modal MUST collect: nombre completo (required), cargo/título profesional (required), biografía corta (max 250 chars), URL de foto/avatar with preview, servicios prestados (multi-select from the tenant catalog) and estado (switch Activo/Inactivo).
- **FR-004**: Saving without a name or without a role MUST be blocked with inline validation errors.
- **FR-005**: Saving with no assigned services MUST show a warning without blocking the save.
- **FR-006**: Adding or updating a member MUST update the local/global state immediately and MUST be written to the same data seam read by `getPublicBusiness`, so the public portal (`/book/[tenantSlug]`) reflects the change.
- **FR-007**: Deactivating or removing a member MUST keep existing appointments intact and MUST drop the member from the public team section.
- **FR-008**: All mutations MUST authorize the admin session, validate with Zod and return the typed `ActionResult`.
- **FR-009**: The views MUST use `@foundly/ui` components and tokens only; the public landing and admin roster MUST share the service-assignment data.

### Key Entities _(include if feature involves data)_

- **Resource (Profesional/Recurso)**: A bookable professional. New attribute `serviceIds?: string[]` references the tenant's catalog services that the professional performs; existing attributes name, role, avatar, bio, active remain.
- **Service (Servicio)**: A bookable offering from the tenant catalog; used both as the source for the multi-select and for the public service badges.
- **Tenant**: owns the roster (resources) and the catalog (services); the public portal resolves `specialists` from the tenant's active resources.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: An administrator can add a professional from an empty roster in under 1 minute.
- **SC-002**: 100% of saves without a name or role are blocked with inline errors.
- **SC-003**: 100% of roster mutations are reflected in `getPublicBusiness(slug).specialists` within the same data seam.
- **SC-004**: The staff grid and modal pass `vitest-axe` with zero critical violations and use `@foundly/ui` exclusively.

## Assumptions

- Governed by `constitution.md` v5.0.1 and `specs/business-model.md` (Foundly Book module).
- Data stays in the in-memory store seam (`apps/book/src/shared/infra/store.ts`); persistence is undefined until `specs/architecture.md` ratifies storage.
- Service assignment is expressed as `serviceIds` on `Resource`; a member can provide zero or more services (warning only when zero).
- File upload is now in scope (feature `specs/book/021-tenant-media-uploads`): the professional avatar can be uploaded from the device through the shared media control, and pasting a URL remains a supported alternative.
- Reuses the existing storefront feature module (`apps/book/src/modules/{staff,gallery,profile}/`) for actions, queries and the `StaffManager` view.
