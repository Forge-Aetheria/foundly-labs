# Contract: Brand Canvas & Visual Coherence (Foundly Book)

**Feature**: `specs/book/004-book-brand-canvas/` | **Date**: 2026-10-10

UI contract for `apps/book` that fixes the module's continuous lavender/violet canvas, aligned with the
global landing. It is a presentation-layer contract (no data, no routes).

## Canvas tokens (book-local extension)

Defined in `apps/book/src/app/globals.css` under `:root`. These are a **book-local extension** of the
shared Clean Light UI palette (`constitution.md` §6.I) and MUST NOT be promoted to `@foundly/ui`.

| CSS variable           | Value      | Derived from / purpose                          |
| ---------------------- | ---------- | ----------------------------------------------- |
| `--book-gradient-from` | `#e3dafc`  | Gradient start (soft lavender, matches example) |
| `--book-gradient-mid`  | `#efeafe`  | Gradient middle stop                            |
| `--book-gradient-to`   | `#f7f5ff`  | Gradient end (near the shared `--bg-app-body`)  |

## Canvas class (`.book-app-canvas`)

Applied on `<body>` by the root layout (`apps/book/src/app/layout.tsx`). Obligations:

- MUST set `min-height: 100vh` and `width: 100%` so the background covers the full viewport (FR-001).
- MUST set `background-color: var(--bg-app-body)` as fallback surface.
- MUST compose the gradient as
  `linear-gradient(180deg, var(--book-gradient-from) 0%, var(--book-gradient-mid) 46%, var(--book-gradient-to) 78%, var(--bg-app-body) 100%)`.
- MUST use `background-repeat: no-repeat` and `background-attachment: fixed` so the gradient spans the
  viewport on scroll; browsers that ignore `fixed` degrade to the token fallback (Edge Cases).

## Component obligations

- **Root layout** (`apps/book/src/app/layout.tsx`) MUST import `./globals.css` and set
  `className="book-app-canvas"` on `<body>` so every route inherits the canvas (FR-001).
- **Product page** (`apps/book/src/app/components/ProductLanding.tsx`):
  - MUST NOT paint an opaque wrapper/full-screen background (FR-005).
  - The sticky header MUST use the shared `surface.glass` token (translucent + `backdrop-filter: blur`)
    so the canvas stays visible behind it (FR-004).
  - The hero MUST NOT declare its own opaque background or a full-width `borderBottom` divider against
    the showcase section (FR-003).
- **Admin shell** (`apps/book/src/app/admin/components/AdminShell.tsx`):
  - MUST NOT paint an opaque full-screen background; `background.default` was removed so the root canvas
    shows through (FR-005 / US4). The white sidebar and drawer remain intentional panels.
- **Cards** (all surfaces): MUST keep the shared white `cardLight` surface, the `border.subtle` border
  and the lavender-tinted `shadow.card` from `@foundly/ui` so they stand out on the canvas (FR-006).

## Token/color discipline

- Zero brand hex literals in component source; all colors come from `@foundly/ui` tokens or the
  book-local CSS variables above (FR-007, ESLint guard).
- The shared token layer (`packages/ui`) and `specs/system-design.md` MUST remain unchanged.

## Verification

- `npm run test -w @foundly/book` → all tests green (92/92).
- `npm run build -w @foundly/book` → builds with zero errors.
- `npm run typecheck -w @foundly/book` and `npm run lint -w @foundly/book` → clean.
- Manual visual checks on `/`, `/onboarding`, `/admin/*` and `/[tenantSlug]`: same continuous canvas,
  no white band or hard hero→cards cut, canvas covers the viewport (SC-001/SC-002).