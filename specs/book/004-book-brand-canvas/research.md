# Research: Foundly Book — Brand Canvas & Visual Coherence

**Feature**: `004-book-brand-canvas` | **Date**: 2026-10-10 | **Spec**: [spec.md](./spec.md)

Phase 0 output: problem context, options considered and the decisions that produced the implemented canvas.

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

There was **no root-level canvas**: each view decided its own background, so the module could never be
visually coherent with the landing.

## Options considered

1. **Per-view explicit gradients** (patch the status quo)
   - Pros: no shared structure.
   - Cons: duplicates the same values on every surface; still risks seams and drift; rejected.
2. **Root body/wrapper canvas + transparent app wrappers** (chosen)
   - Pros: a single source of truth at the root layout; every route inherits it; only glass and panels
     (white sidebar, cards) remain opaque; matches the landing pattern.
   - Cons: must remove the opaque wrapper backgrounds added in earlier features (small, controlled diffs).
3. **Add gradient tokens to the shared `packages/ui`**
   - Rejected per `constitution.md` §6.I: "Las extensiones propias de una app (p. ej. el degradado
     superior de la landing) NO se declaran aquí; viven en los tokens locales de esa app." The book
     gradient is a book-local extension, exactly like the landing's.

## Decisions

- **D1**: Add `apps/book/src/app/globals.css` exposing `--book-gradient-from/mid/to`
  (`#e3dafc` / `#efeafe` / `#f7f5ff`) and a `.book-app-canvas` class that composes
  `linear-gradient(180deg, from → mid → to → var(--bg-app-body))` over the shared `--bg-app-body`
  surface, with `min-height: 100vh`, full width, `no-repeat` and `background-attachment: fixed`.
- **D2**: Apply `className="book-app-canvas"` on `<body>` in `apps/book/src/app/layout.tsx` so the
  four surfaces inherit the canvas from the root.
- **D3**: Product page (`apps/book/src/app/components/ProductLanding.tsx`): remove the opaque wrapper
  background, make the sticky header a glass surface (`surface.glass` + backdrop blur, mirrors the
  landing's `Navbar`), and drop the hero's own background + `borderBottom` so the canvas flows into the
  cards (FR-003).
- **D4**: Admin shell (`apps/book/src/app/admin/components/AdminShell.tsx`): remove the opaque
  `background.default` full-screen layer so the root canvas shows behind the white sidebar and routed
  screens (US4).
- **D5**: Cover the full viewport with `background-attachment: fixed`; where unsupported (mobile iOS
  scrolls the attachment), the `--bg-app-body` fallback keeps the identity within token values.

## Impact

- **Files changed**: `apps/book/src/app/globals.css` (new), `apps/book/src/app/layout.tsx`,
  `apps/book/src/app/components/ProductLanding.tsx`, `apps/book/src/app/admin/components/AdminShell.tsx`.
- **No shared change**: `@foundly/ui` tokens/components untouched (cards already use `cardLight` +
  `border.subtle` + `shadow.card`); `system-design.md` untouched.
- **No data/route change**: no entity, store, action or route was modified.
- **Verification performed**: `npm run test -w @foundly/book` (92/92), `npm run build -w @foundly/book`,
  `npm run typecheck -w @foundly/book`, `npm run lint -w @foundly/book` — all green.