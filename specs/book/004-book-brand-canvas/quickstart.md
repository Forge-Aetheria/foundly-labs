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
npm run build -w @foundly/book
npm run typecheck -w @foundly/book
npm run lint -w @foundly/book
```

Expected: all tests green (92/92), the build compiles every route with zero errors, typecheck and lint
are clean. The shared layer must have no diff (`@foundly/ui`, `specs/system-design.md`).

### 2. Token/color discipline (FR-007, SC-004)

```bash
npm run lint
```

Expected: ESLint reports zero literal brand hex values in components; colors come only from
`@foundly/ui` tokens or the book-local CSS variables in `apps/book/src/app/globals.css`.

## Manual acceptance scenarios

1. Open `/` — the header is translucent (glass) over a continuous lavender gradient; the hero flows into
   the showcase cards with **no white band and no hard horizontal divider** (FR-003, SC-002).
2. Open `/onboarding` — the split layout sits on the same canvas as the product page.
3. Open `/admin/*` — the content area shows the same canvas behind the white sidebar and cards; nothing
   paints an opaque full-screen background (US4, FR-005).
4. Open `/<slug>` of an active business — the portal renders over the same canvas.
5. Scroll a tall page — no seam or band where the gradient ends; the canvas covers the whole viewport
   while the `--bg-app-body` fallback keeps the identity below.
6. With a small viewport — no horizontal overflow and the canvas still covers the viewport.

## End-to-end acceptance

1. `npm run test -w @foundly/book` → all green.
2. `npm run build -w @foundly/book` → zero errors.
3. `npm run typecheck -w @foundly/book` and `npm run lint -w @foundly/book` → clean.
4. The manual scenarios above all pass.

This proves SC-001–SC-004 end to end.