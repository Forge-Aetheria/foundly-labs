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
| Weekly | One row per weekday (Lunes–Domingo) with a `Switch` toggle and, when open, **Inicio**/**Fin** `type="time"` inputs; primary **"Guardar horario semanal"** persists open/closed + times. |
| Blocks | Dedicated card: a **"Rango de horas" / "Días completos"** selector + **Fecha** (+ **Hora de inicio/fin** only in range mode) + **Motivo (opcional)** + **Bloquear**. |
| Full day | Sent as `00:00–23:59`; the list shows a "Día completo" badge. |
| List | Each block shows date + range + reason and a **Desbloquear** action with confirmation. |
| Validation | Range end not after start, or missing date → inline error, nothing persisted. |

## Tokens & accessibility

- Cards use `@foundly/ui` `Card` with token colors and rounded corners; status uses `Badge`; block mode uses `Chip`.
- Both surfaces are keyboard-operable and pass `vitest-axe` with zero critical violations.
- The UI never calls the transport or Server Actions directly (constitution §5.VI).

## Backend contract (delegated to `specs/api/016-advance-payments`)

- `enum PaymentMethodType { pago_movil binance zelle transfer cash }`.
- `PaymentMethodObject` / `UpsertPaymentMethodInput` expose `title` (was `label`); `details` is a JSON string.
- Prisma column stays `label`, mapped to `title`; the enum requires a migration.
