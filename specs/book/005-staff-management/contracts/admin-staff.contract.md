# Contract: Admin Staff View (Equipo y Especialistas)

**Feature**: `specs/book/005-staff-management/` | **Date**: 2026-10-10

Documents the `/admin/staff` surface after the 005-staff-management refinement. All primitives come
from `@foundly/ui` and colors from theme tokens (`primary.main` #6C5CE7, glass surfaces). Mutations
write to the same store seam read by `getPublicBusiness`, so the public `/[tenantSlug]` team reflects
every change (FR-006/FR-007).

## Roster (grid of cards)

| Area     | Contract                                                                                                                                                                        |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Header   | Title `Equipo y Especialistas` + subtitle + right-aligned pill primary **"+ Añadir Profesional"**.                                                                              |
| Cards    | Responsive grid of glassmorphism cards (`GLASS_CARD_SX`). Each shows: round avatar (photo or initials), name + role ("Ana Profesional · Peluquera Senior"), service badges (pill, neutral), status badge (`Activo` positive / `Inactivo` neutral). |
| Actions  | Per card: pill **"Editar"** (secondary), **"Desactivar"/"Activar"** (secondary), **"Eliminar"** (destructive → `AlertDialog`).                                                  |
| Empty    | "No hay profesionales en el equipo." when the roster is empty.                                                                                                                  |

## Create / Edit modal

| Area          | Contract                                                                                                                                                          |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Title         | `Añadir profesional` / `Editar · <nombre>`.                                                                                                                        |
| Fields        | `Nombre` (required) · `Cargo / Título profesional` (required) · `Biografía corta` (multiline, max 250, UTF-8) · `Foto (URL)` with live `<img>` preview · `Servicios` checkboxes from the tenant catalog · `Estado` `Switch` (Activo). |
| Validation    | Empty name or role → inline error, save blocked (schema `VALIDATION_ERROR`). Zero services → warning (amber `warning.main`) but save allowed.                       |
| Actions       | Pill primary **"Guardar profesional"** + pill secondary **"Cancelar"**.                                                                                             |
| Sync          | On save, local list updates from the action result and the store seam record updates (specialists on the public portal).                                            |

## Data & mutations

- Feature module: `apps/book/src/features/storefront/` (`schemas.ts`, `actions.ts`, `components/StaffManager.tsx`).
- `createStaff`/`updateStaff` accept `serviceIds?: string[]`, validated against the tenant's own catalog (same `tenantId`).
- Public read: `getPublicBusiness` → `specialists[].services` = resolved service names; inactive/removed resources are excluded.
- Authorize admin via the Foundly Pass session seam; return the typed `ActionResult`.

## Guarantees

- Views use `@foundly/ui` only; raw `<img>` previews use the MUI `Box` primitive (same convention as the portal `ProviderSections`).
- `vitest-axe` clean; all controls keyboard-reachable.
- Component and action tests assert required-field errors, zero-services warning and admin → public reflection.