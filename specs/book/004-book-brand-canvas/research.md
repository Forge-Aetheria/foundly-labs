# Research: Foundly Book — Brand Canvas & Visual Coherence

**Feature**: `004-book-brand-canvas` | **Date**: 2026-10-10 | **Spec**: [spec.md](./spec.md)

Phase 0 output (revised): problem context, options considered and the decisions that produced the
implemented canvas, plus the accepted "canonical direction" that syncs `apps/book` to the Astro landing.

## Problem context

The landing (`apps/landing`) applies a continuous lavender-to-white gradient at the body level
(`src/styles/global.css` → `linear-gradient(180deg, var(--color-gradient-from) 0%, var(--color-card-light) 60%)`
over `--color-app-body`), with the gradient stops declared as a **local** extension in
`src/styles/tokens.css` (`--color-gradient-from: #C8B6FF`, `--color-gradient-to: #D8B4FE`).

`apps/book` did not mirror that identity:

| Surface                     | Defect before the fix                                                                                        |
| --------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Product page (`/`)          | `ProductLanding` painted an opaque `background.paper` header bar + a hero gradient that died into white with a `borderBottom` → hard cut between hero and cards (FR-003). |
| Onboarding (`/onboarding`)  | Rendered on the plain `background.default` canvas; no continuous gradient behind the split layout.          |
| Admin (`/admin/*`)          | `AdminShell` painted an opaque `background.default` full-screen layer → the onboarding identity did not reach `/admin` (US4/FR-005). |
| Public portal (`/[tenantSlug]`) | Rendered on the plain canvas; no shared gradient.                                                          |

Not only was there no root-level canvas, but the first attempt introduced a **softer** book-only gradient
(`#E3DAFC → #EFEAFE → #F7F5FF`) that did not match the landing's `#C8B6FF → #D8B4FE` identity.

## Options considered

1. **Per-view explicit gradients** (patch the status quo)
   - Pros: no shared structure.
   - Cons: duplicates the same values on every surface; still risks seams and drift; rejected.
2. **Root body/wrapper canvas + transparent app wrappers** (chosen)
   - Pros: a single source of truth at the root layout; every route inherits it; only glass and panels
     (white sidebar, cards) remain opaque; matches the landing pattern.
3. **Add gradient tokens to the shared `packages/ui`**
   - Rejected per `constitution.md` §6.I: app-specific gradient extensions live in the app's local
     tokens, exactly like the landing's own `--color-gradient-*`.
4. **Canonical direction (chosen — Option 1)**: the Astro landing is the design canon, so `apps/book`
   replicates its values **exactly** instead of inventing a softer book gradient — `#C8B6FF → #D8B4FE`,
   header glass at 70%, card glass at 60%, and the landing's exact pill/button style.

## Decisions

- **D0 — Canon**: `apps/landing` is the design reference; `apps/book` mirrors its exact tokens and
  compositions. The softer `#E3DAFC/#EFEAFE/#F7F5FF` book gradient is dropped.
- **D1**: Add `apps/book/src/app/globals.css` exposing `--book-gradient-from: #c8b6ff`,
  `--book-gradient-to: #d8b4fe`, `--book-glass` (70% white) and `--book-glass-card` (60% white), plus a
  `.book-app-canvas` class composing `linear-gradient(180deg, from 0%, card-light 60%)` over the shared
  `--bg-app-body` surface — mirroring `apps/landing/src/styles/global.css`.
- **D2**: Apply `className="book-app-canvas"` on `<body>` in `apps/book/src/app/layout.tsx` so the four
  surfaces inherit the canvas from the root.
- **D3**: `packages/ui` `Card` and `Button` accept an optional `sx` prop (additive, non-breaking) so the
  landing view can apply glassmorphism and exact pill/button styles without changing workspace defaults.
- **D4**: Product page (`apps/book/src/app/components/ProductLanding.tsx`): remove the opaque wrapper
  background; header becomes glass at 70% (`--book-glass` + blur(12px) + subtle border); hero without
  background/border; hero pill and category pills use `badgePill` + `primary.main`; primary buttons use
  `primary.main` + `shadow.card` + 90% hover; secondary buttons use `--book-glass-card` + blur + subtle
  border + `badgePill` hover; showcase/benefits cards use `--book-glass-card` + blur (FR-006/FR-008).
- **D5**: Admin shell (`apps/book/src/app/admin/components/AdminShell.tsx`): remove the opaque
  `background.default` full-screen layer so the root canvas shows behind the white sidebar (US4).
- **D6**: Cover the full viewport with `background-attachment: fixed`; where unsupported (mobile iOS
  scrolls the attachment), the `--bg-app-body` fallback keeps the identity within token values.

## Impact

- **Files changed**:
  - `packages/ui/src/components/Card/Card.tsx` + test — additive `sx` prop.
  - `packages/ui/src/components/Button/Button.tsx` + test — additive `sx` prop.
  - `apps/book/src/app/globals.css` — gradient + glass tokens synced to the landing.
  - `apps/book/src/app/layout.tsx` — `className="book-app-canvas"` on `<body>`.
  - `apps/book/src/app/components/ProductLanding.tsx` — exact landing replica (header, pills, buttons, glass cards).
  - `apps/book/src/app/admin/components/AdminShell.tsx` — no opaque full-screen background.
- **No shared value change**: `@foundly/ui` token values and `specs/system-design.md` untouched; only
  additive `sx` props on `Card`/`Button`.
- **No data/route change**: no entity, store, action or route was modified.
- **Verification performed**: `npm run test -w @foundly/book` (92/92), `npm run test -w @foundly/ui`
  (26/26), `npm run build -w @foundly/book`, typecheck + lint for both workspaces — all green.