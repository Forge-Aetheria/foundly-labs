# Contract: Admin Payments & Schedules (redesign)

**Feature**: `specs/book/022-admin-payments-schedules-refactor/` | **Date**: 2026-10-14

Documents the redesigned `/admin/configuracion` (payments) and `/admin/availability` (schedules) surfaces after 022. All primitives come from `@foundly/ui` and colors from theme tokens; data access goes through each module's `hooks.ts`.

## Payment methods (`/admin/configuracion`)

| Area | Contract |
| ---- | -------- |
| Header | Title "Métodos de pago" + right-aligned primary **"+ Nuevo Método de Pago"** (disabled when all five types are configured). |
| Cards | One card per configured method: **title** (fallback to the type label), type label, structured-data summary (or "Sin datos configurados"), an **Activo/Inactivo** badge, and **Editar** / **Desactivar·Activar** / **Eliminar** actions. |
| Create/edit modal | Title "Nuevo Método de Pago" / "Editar método de pago"; **type selector** (Chip row: Pago Móvil · Binance Pay · Zelle · Transferencia · Efectivo; only unconfigured types when creating, locked when editing) + **Título** + the type-specific fields + **Instrucciones (opcional)** + active `Switch`; "Guardar método" / "Cancelar". |
| Type fields | `pago_movil`: Titular, Cédula/RIF, Teléfono, Banco. `binance`: Pay ID, Titular. `zelle`: Email, Titular. `transfer`: Cuenta, Titular. `cash`: Titular. |
| Delete | Destructive `AlertDialog` ("Sí, eliminar"); confirm calls `useDeletePaymentMethod({ id })`. |
| Persistence | `useUpsertPaymentMethod({ type, title, details, instructions, active })`; `details` is a `PaymentMethodDetails` object serialized to a JSON string by `actions.ts`. Toggling preserves the structured data. |

## Schedules (`/admin/availability`)

| Area | Contract |
| ---- | -------- |
| Weekly | One **card row per weekday** (Lunes–Domingo; Monday-first) with uniform padding, subtle border, rounded corners and neutral surface. The `Switch` sits on the left/start of the row, followed by **compact token-styled time inputs** (subtle border, rounded, base surface, primary focus ring) for Inicio/Fin; a closed day shows a neutral **"Cerrado"** badge instead of inputs. Primary **"Guardar horario semanal"** persists open/closed + times. |
| Blocks | The new-block form lives in its **own card** (`surface.cardLight`, subtle border, 16px radius, generous padding). Block type is a grouped neutral **pill selector** ("Rango de horas" / "Días completos", `role="group"`). Fields use a **label above** (subtle typography) with **compact token-styled inputs** — Fecha, Hora de inicio/fin (range mode) — and a full-width **Motivo (opcional)** row. The primary **"Bloquear"** button sits at the bottom-left. |
| Full day | Sent as `00:00–23:59`; the list shows a "Día completo" badge. |
| List | Each existing block renders as a clean card row (subtle border, 16px radius, `surface.cardLight`) with date + range + reason and a **Desbloquear** action with confirmation. |
| Validation | Range end not after start, or missing date → inline error, nothing persisted. |

## Tokens & accessibility

- Cards use `@foundly/ui` `Card` with token colors and rounded corners; status uses `Badge`; block mode uses `Chip`.
- Both surfaces are keyboard-operable and pass `vitest-axe` with zero critical violations.
- The UI never calls the transport or Server Actions directly (constitution §5.VI).

## Backend contract (delegated to `specs/api/016-advance-payments`)

- `enum PaymentMethodType { pago_movil binance zelle transfer cash }`.
- `PaymentMethodObject` / `UpsertPaymentMethodInput` expose `title` (was `label`); `details` is a JSON string.
- Prisma column stays `label`, mapped to `title`; the enum requires a migration.
