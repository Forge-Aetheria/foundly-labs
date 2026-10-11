# Quickstart & Validation Guide: Foundly Book — Public Portal Mini-Site

**Feature**: `003-public-portal-minisite` | **Date**: 2026-10-09

How to run and validate the mini-site end-to-end. References the contracts instead of duplicating them.

## Prerequisites

- Node.js ≥ 20 and npm (workspace root installed with `npm install`)
- Repository root: `foundly-labs`
- Locally the portal runs at the internal path `/<slug>`; the public URL is `/book/<slug>` via the multi-zone gateway.

## Setup

```bash
npm install
```

Expected: workspace dependencies install with no errors.

## Data preparation

The store seam seeds the demo tenant (`estudio-ana`) with a portal profile, two specialists and two policies. No database or CMS is required — persistence is still undefined.

## Run locally

```bash
npm run dev -w @foundly/book
```

Expected: `http://localhost:3001/estudio-ana` renders the mini-site (hero, tabs, booking flow); a random slug renders the unavailable state.

## Validate

### 1. Portal profile contract (FR-001…FR-004, FR-016)

```bash
npm run test -w @foundly/book -- public-booking
```

Expected: `getPublicBusiness` returns the full profile for the active tenant and `unavailable` (zero data) for unknown/draft/suspended; services expose the current rate; specialists are active resources.

### 2. Booking flow contract (FR-009…FR-015)

```bash
npm run test -w @foundly/book -- public-booking
```

Expected: 4-step flow walks specialist → slots → client data → confirmation; a `CONFLICT` keeps the entered data; the appointment is created with `origin: 'online'`.

### 3. UI & accessibility (FR-018…FR-020, SC-005/SC-007)

```bash
npm run lint && npm run test -w @foundly/book
```

Expected: the hero, tabs and booking modal compose `@foundly/ui` primitives with theme tokens; zero critical a11y violations; no horizontal overflow on mobile.

### 4. Build

```bash
npm run build -w @foundly/book
```

Expected: builds with zero errors.

## Manual acceptance scenarios

1. Open `/estudio-ana`: cover, avatar/logo, name, category, badges, bio and contact (address, phone, Instagram, WhatsApp) render.
2. Servicios tab (default): each service card shows description, duration, price and a pill "Reservar".
3. Open Equipo: two specialists with initials avatars and roles.
4. Open Información & Políticas: weekly hours per weekday and the booking/cancellation policies.
5. Book a service: choose specialist → pick a date/slot → enter data (invalid email/phone block with inline errors) → confirm the summary → a `pending` "online" appointment appears in `/admin/agenda`.
6. Force a conflict (book the same slot twice) and confirm the flow keeps the client data and offers remaining slots.
7. On mobile: tabs and the modal have no horizontal overflow; keyboard navigation works end-to-end.

## End-to-end acceptance

1. `npm run test -w @foundly/book` → all green.
2. `npm run lint` → clean.
3. `npm run build -w @foundly/book` → builds with zero errors.
4. The manual scenarios above all pass.

This proves SC-001–SC-007 end to end.
