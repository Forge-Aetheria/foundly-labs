# Quickstart: Foundly Book — Admin Payments & Schedules Redesign

**Feature**: `specs/book/022-admin-payments-schedules-refactor/` | **Date**: 2026-10-14

## Onboarding

1. `npm install` at the repository root.
2. **Backend migration (required)**: rename/add the `PaymentMethodType` enum values (`mobile_payment → pago_movil`, `bank_transfer → transfer`, add `zelle`, `cash`) and migrate existing rows/appointments; regenerate the Prisma client. The API column stays `label` (mapped to the GraphQL `title`).
3. Regenerate book types: `npm.cmd run codegen -w @foundly/book`.
4. Gates: `npm.cmd run typecheck -w @foundly/book`, `npm.cmd run lint -w @foundly/book`, `npm.cmd run test -w @foundly/book`, `npm.cmd run build -w @foundly/book`; API tests: `npm.cmd run test -w @foundly/api`.

> Without the enum migration the API build fails against the stale generated Prisma client; the book suite stays green because it uses codegen'd SDL types.

## Manual walkthrough — Métodos de pago

1. Open `http://localhost:3001/admin/configuracion`; with no methods it shows the empty state and "+ Nuevo Método de Pago".
2. Click it, choose **Pago Móvil**, fill Título/Banco/Titular, save → a card appears with the data summary and an **Activo** badge.
3. Add **Binance Pay** (Pay ID) and **Efectivo**; on a card use **Editar**, **Desactivar** (badge flips, data preserved) and **Eliminar** (confirm) — each persists after a reload.
4. Confirm the public advance step only offers active methods and shows the structured summary.

## Manual walkthrough — Horarios y disponibilidad

1. Open `http://localhost:3001/admin/availability`; toggle weekdays and set start/end times, then **Guardar horario semanal** → reload and confirm it persists.
2. In the blocks card choose **Rango de horas**, pick a date + start/end → **Bloquear**; the row appears with the range.
3. Switch to **Días completos**, pick a date → **Bloquear**; the row shows the "Día completo" badge.
4. **Desbloquear** with confirmation; open the public booking and confirm the blocked intervals are excluded.

## Validation matrix (contract `contracts/admin-payments-schedules.contract.md`)

| Scenario | Expected |
| -------- | -------- |
| Create a method of each type | Card with title/type/summary/badge |
| Type-specific fields | Pago Móvil shows Cédula/Teléfono/Banco; Binance shows Pay ID; Zelle Email; Transfer Cuenta |
| Blank optional fields | Saved; card shows "Sin datos configurados" for no data |
| Toggle active | Badge flips; structured data kept |
| Delete with confirmation | Removed from the list/public step |
| Save weekly schedule | Open/closed days + times persist |
| Range block end ≤ start | Inline error, nothing persisted |
| Full-day block | Blocks 00:00–23:59; "Día completo" badge |

## Test commands

| Command | Scope |
| ------- | ----- |
| `npm.cmd run test -w @foundly/book` | Book Vitest + RTL + vitest-axe |
| `npm.cmd run test -w @foundly/api` | API unit + e2e |
| `npm.cmd run build -w @foundly/book` | Production build |
