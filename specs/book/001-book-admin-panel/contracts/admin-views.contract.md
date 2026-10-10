# Contract: Admin View UX (Services catalog & Appointments agenda)

**Feature**: `specs/book/001-book-admin-panel/` | **Date**: 2026-10-10

Documents the current UI surfaces of the two admin views that received the Phase-9 refinements. It is a UI contract for `apps/appointment` and service management within `apps/book`; all primitives come from `@foundly/ui` and colors from the theme tokens (FR-017, FR-021, FR-022).

> The storefront views (Equipo, Galería, Perfil) are contracted separately in
> `contracts/storefront.contract.md` (Phase 10).

## ServiceCatalog (`/admin/services`)

| Area           | Contract                                                                                                                          |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Header         | Title `Servicios y tarifas` + right-aligned pill primary **"+ Crear servicio"** (`primary.main` #6C5CE7).                          |
| Quick search   | `TextField` over the table filtering rows by service name (case-insensitive); empty state reflects the query.                     |
| Columns        | **Servicio** (name + description caption) · **Duración** ("N min") · **Tarifa** (`Badge` pill, es-ES currency) · **Estado** (`Activo`/`Inactivo` badge) · **Acciones** (right, "Editar" secondary / "Eliminar" destructive). |
| Row actions    | "Editar" opens a `Modal`; "Eliminar" opens a destructive `AlertDialog`. While service mutations are pending (T024–T026), both surface explicit "próximamente" feedback. |
| Density        | `DataTable dense` for vertical space.                                                                                            |

## Agenda (`/admin/agenda`)

| Area           | Contract                                                                                                                          |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Header         | Title `Agenda de citas` + right-aligned pill primary **"+ Nueva cita"**.                                                          |
| Day filter     | Chips `Hoy` + 6 upcoming days; rows filtered by the appointment's date.                                                           |
| Status filter  | Chips `Todas` / `Pendientes` / `Confirmadas` / `Completadas` / `Canceladas`.                                                       |
| Columns        | **Hora** · **Cliente** (name + contact caption) · **Servicio** (name + duration) · **Profesional** · **Estado** (semantic badge) · **Acciones** (right, "Detalles"). |
| Status badges  | `pending` → warning (ámbar) · `confirmed` → positive (emerald) · `checked-in`/`completed` → info (azul/lavanda) · `cancelled`/`no-show` → neutral (zinc). |
| Modals (mock)  | "+ Nueva cita" opens a `Modal` (cliente, email, teléfono, servicio, fecha, hora) that inserts a local `pending` row; "Detalles" opens a read-only `Modal`. |
| Density        | `DataTable dense`.                                                                                                               |

## Guarantees

- Both views use only `@foundly/ui` components and theme tokens (no hex literals, no MUI-direct imports).
- Interactive elements are pill buttons with visible focus; `vitest-axe` runs clean.
- Date-dependent UI renders only after mount (hydration-safe, no SSR/client mismatch).
- Row data for the agenda is resolved per appointment (service name, professional name, client contact) by the page (`apps/book/src/app/admin/agenda/page.tsx`).