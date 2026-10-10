# Quickstart & Validation Guide: Foundly Book — Brand Canvas & Visual Coherence

**Feature**: `004-book-brand-canvas` | **Date**: 2026-10-10

How to run and validate the shared lavender canvas once implemented. References the design contract
instead of duplicating it.

## Prerequisites

- Node.js ≥ 20 and npm (workspace root installed with `npm install`)
- Repository root: `foundly-labs`
- `apps/book` runs locally on its own port; multi-zone `/book` prefix not needed locally
  (internal paths `/`, `/onboarding`, `/admin/*`, `/<slug>`).

## Setup

```bash
npm install
```

Expected: workspace dependencies install with no errors, including `@foundly/ui`.

## Run locally

```bash
npm run dev -w @foundly/book
```

Expected: every surface renders over the same continuous lavender canvas (the root layout imports
`globals.css`; `<body>` carries `book-app-canvas`).

## Validate

### 1. Automated suite (SC-003)

```bash
npm run test -w @foundly/book
npm run test -w @foundly/ui
npm run build -w @foundly/book
npm run typecheck -w @foundly/ui && npm run typecheck -w @foundly/book
npm run lint -w @foundly/ui && npm run lint -w @foundly/book
```

Expected: book tests green (92/92), ui tests green (28/28), the build compiles every route with zero
errors, typecheck and lint are clean in both workspaces. Shared token **values** must have no diff
(`@foundly/ui`, `specs/system-design.md`); only the additive `sx`/`glass` props on
`Card`/`Button`/`Modal` are new.

### 2. Token/color discipline (FR-007, SC-004)

```bash
npm run lint -w @foundly/ui && npm run lint -w @foundly/book
```

Expected: ESLint reports zero literal brand hex values in components; colors come only from
`@foundly/ui` tokens or the book-local CSS variables in `apps/book/src/app/globals.css`
(`--book-gradient-from: #c8b6ff`, `--book-gradient-to: #d8b4fe`, `--book-glass`, `--book-glass-card`).

## Manual acceptance scenarios

1. Open `/` — the header is glass at 70% (`--book-glass` + blur) over a continuous lavender gradient that
   starts `#C8B6FF`; the hero flows into the content with **no white band and no hard horizontal divider**
   (FR-003, SC-002). The hero email capture ("Tu email" + "Empezar gratis"), the booking-page spotlight,
   the "3 pasos", the icon benefits grid and the two pricing plans all use the canonical glass cards and
   `#6C5CE7` pill buttons.
2. Compare `/` against the Astro landing (foundlylabs.lat) — same lavender start, same fade to white, same
   pill/badge style (`badgePill` background + accent text), same primary/secondary pill buttons
   (transparent secondary, blurred), same translucent glass cards (60% + blur) (SC-002).
3. Open `/onboarding` — the split layout sits on the same canvas as the product page.
4. Open `/admin/*` — the content area shows the same canvas behind the white sidebar and the (solid) cards;
   nothing paints an opaque full-screen background (US4, FR-005).
5. Open `/<slug>` of an active business (e.g. `/rona-piercing`) — the provider landing renders over the
   same canvas as a two-column layout: internal nav, glass sections (servicios, equipo, acerca, galería,
   reseñas, dirección) and the sticky sidebar with brand, rating and the pill Reservar CTA.
6. Activate "Reservar" from a service card or the sidebar — the guided checkout opens in a **glass modal**;
   the day pills (e.g. "lun 12"), time-slot grid, contact form and confirmation summary all use the
   landing's pill/glass style (`#6C5CE7`, translucent surfaces).
7. Scroll a tall page — no seam or band where the gradient ends; the canvas covers the whole viewport
   while the `--bg-app-body` fallback keeps the identity below.
8. With a small viewport — no horizontal overflow and the canvas still covers the viewport.

## End-to-end acceptance

1. `npm run test -w @foundly/book` → all green.
2. `npm run build -w @foundly/book` → zero errors.
3. `npm run typecheck -w @foundly/book` and `npm run lint -w @foundly/book` → clean.
4. The manual scenarios above all pass.

This proves SC-001–SC-004 end to end.