# Quickstart & Validation Guide: Foundly Book Admin Panel

**Feature**: `001-book-admin-panel` | **Date**: 2026-10-08

How to run and validate the admin panel end-to-end once implemented. It references the design contracts instead of duplicating them.

## Prerequisites

- Node.js ≥ 20 and npm (workspace root installed with `npm install`)
- Repository root: `foundly-labs`
- A Foundly Pass session available in the environment (or a documented dev stub) for authenticated flows

## Setup

```bash
npm install
```

Expected: workspace dependencies install with no errors, including `@foundly/ui`.

## Data preparation

The panel runs on an **in-memory store seeded with mock data** (`apps/book/src/server/store.ts`). There is no database to create or migrate — no persistence technology is defined for this version.

## Run locally

```bash
npm run dev -w @foundly/book
```

Expected: the admin panel starts and the agenda, services and availability routes render.

## Validate

### 1. Availability engine (SC-004)

```bash
npm run test -w @foundly/book -- availability
```

Expected: all cases from `contracts/availability.contract.md` pass, including break/block overlap, buffer back-to-back booking, lead time, horizon, midnight-spanning appointment and DST day.

### 2. No double-booking (SC-003)

```bash
npm run test -w @foundly/book -- appointments
```

Expected: creating or rescheduling onto an occupied slot returns `CONFLICT`; no two overlapping active appointments for a resource are ever persisted in the store.

### 3. Catalog and price snapshots (SC-005)

```bash
npm run test -w @foundly/book -- services
```

Expected: new appointments use the current rate; changing a service price leaves already-booked appointments' `applied*` values unchanged.

### 4. Lifecycle and audit (FR-003, FR-005)

```bash
npm run test -w @foundly/book -- lifecycle
```

Expected: only transitions in the data-model §7 table are accepted; cancel requires a reason; audit entries are written.

### 5. UI consistency and accessibility (SC-006, SC-007)

```bash
npm run lint && npm run test -w @foundly/book
```

Expected: views are built exclusively from `@foundly/ui` components; every screen is keyboard-operable; automated a11y checks report zero critical violations.

## Manual acceptance scenarios

1. Open the agenda and confirm seeded appointments and their statuses render.
2. Create an appointment picking a service and a valid slot; confirm it appears and enters `pending`.
3. Reschedule it; confirm the original slot frees up.
4. Cancel it with a reason; confirm the audit entry exists.
5. Deactivate a service that has a future appointment; confirm the appointment is unchanged.
6. Add a block over an existing appointment; confirm the conflict is surfaced and requires resolution.
7. Open `/admin/services`: confirm the quick search filters by name, the tariff renders as a badge, and "Editar"/"Eliminar" show explicit "próximamente" feedback.
8. Open `/admin/agenda`: confirm the day ("Hoy") and status chips filter the table, "Detalles" opens the read-only modal, and "+ Nueva cita" opens the mock creation modal.
7. Confirm every screen renders inside the sidebar shell with the Foundly Book logo, the module navigation (active section highlighted) and the user profile (avatar + name) at the bottom.
8. Resize to a small viewport; confirm the sidebar collapses into a temporary drawer opened from the menu button and dismissible by keyboard.

## End-to-end acceptance

1. `npm run test -w @foundly/book` → all green.
2. `npm run lint` → clean.
3. `npm run build -w @foundly/book` → builds with zero errors.
4. The manual scenarios above all pass.

This proves SC-001–SC-007 end to end.
