# Contract: Brand Canvas & Visual Coherence (Foundly Book)

**Feature**: `specs/book/004-book-brand-canvas/` | **Date**: 2026-10-10

UI contract for `apps/book` that fixes the module's continuous lavender/violet canvas, **replicating the
Astro landing (`apps/landing`) exactly — the design canon**. It is a presentation-layer contract
(no data, no routes).

## Canvas tokens (book-local extension)

Defined in `apps/book/src/app/globals.css` under `:root`. These are a **book-local extension** of the
shared Clean Light UI palette (`constitution.md` §6.I) that mirrors `apps/landing/src/styles/tokens.css`
and MUST NOT be promoted to `@foundly/ui`.

| CSS variable           | Value                     | Purpose / mirror                                        |
| ---------------------- | ------------------------- | ------------------------------------------------------- |
| `--book-gradient-from` | `#c8b6ff`                 | Gradient start — mirror of `--color-gradient-from`      |
| `--book-gradient-to`   | `#d8b4fe`                 | Gradient end token — mirror of `--color-gradient-to`    |
| `--book-glass`         | `rgba(255, 255, 255, 0.7)` | Sticky header glass — mirror of `bg-card-light/70`      |
| `--book-glass-card`    | `rgba(255, 255, 255, 0.6)` | Card glassmorphism — mirror of `bg-card-light/60`       |

## Canvas class (`.book-app-canvas`)

Applied on `<body>` by the root layout (`apps/book/src/app/layout.tsx`). Obligations:

- MUST set `min-height: 100vh` and `width: 100%` so the background covers the full viewport (FR-001).
- MUST set `background-color: var(--bg-app-body)` as fallback surface.
- MUST compose the gradient exactly like `apps/landing/src/styles/global.css`:
  `linear-gradient(180deg, var(--book-gradient-from) 0%, var(--bg-card-light) 60%)`.
- MUST use `background-repeat: no-repeat` and `background-attachment: fixed` so the gradient spans the
  viewport on scroll; browsers that ignore `fixed` degrade to the token fallback (Edge Cases).

## Component obligations

- **Root layout** (`apps/book/src/app/layout.tsx`) MUST import `./globals.css` and set
  `className="book-app-canvas"` on `<body>` so every route inherits the canvas (FR-001).
- **Product page** (`apps/book/src/app/components/ProductLanding.tsx`):
  - MUST NOT paint an opaque wrapper/full-screen background (FR-005).
  - The sticky header MUST use the book-local glass token `--book-glass` (70% white) with
    `backdrop-filter: blur(12px)` and a subtle `border.subtle` at 60% alpha, mirroring the landing
    navbar (FR-004).
  - The hero MUST NOT declare its own opaque background or a full-width `borderBottom` divider against
    the showcase section (FR-003).
  - The hero pill and category pills MUST use the `surface.badgePill` background with `primary.main`
    text, like the landing's `Badge` (FR-008).
  - Primary buttons MUST use `primary.main` with the lavender `shadow.card` and a hover at 90% of the
    accent; secondary buttons MUST be translucent (`--book-glass-card`), blurred, with a subtle border
    and a `badgePill` hover (FR-008).
- **Cards on the product page** (showcase, benefits): MUST use the book-local `--book-glass-card` (60%
  white) with `backdrop-filter: blur(8px)` over the shared border/radius/shadow — mirroring the
  landing's `AppCard` (FR-006). The shared `@foundly/ui` `Card` forwards `sx` to enable this.
- **Admin shell** (`apps/book/src/app/admin/components/AdminShell.tsx`):
  - MUST NOT paint an opaque full-screen background; `background.default` was removed so the root canvas
    shows through (FR-005 / US4). The white sidebar and drawer remain intentional panels.

## Shared primitives (`packages/ui`)

Additive, non-breaking API additions that enable the landing replication without changing workspace defaults:

- **`Card`**: accepts an optional `sx?: SxProps<Theme>` merged after the base surface.
- **`Button`**: accepts an optional `sx?: SxProps<Theme>` forwarded to the MUI button.
- **`Modal`**: accepts an optional `glass?: boolean` that renders the dialog paper as the translucent
  `surface.glass` (`rgba(255,255,255,0.85)`) with backdrop blur — used by the public booking checkout.

## Token/color discipline

- Zero brand hex literals in component source; all colors come from `@foundly/ui` tokens or the
  book-local CSS variables above (FR-007, ESLint guard).
- The shared token layer (`packages/ui`) values and `specs/system-design.md` MUST remain unchanged;
  only the additive `sx` props were added to `Card`/`Button`.

## Verification

- `npm run test -w @foundly/book` → all tests green (92/92).
- `npm run test -w @foundly/ui` → all tests green (26/26).
- `npm run build -w @foundly/book` → builds with zero errors.
- `npm run typecheck` and `npm run lint` for `@foundly/ui` and `@foundly/book` → clean.
- Manual visual checks on `/`, `/onboarding`, `/admin/*` and `/[tenantSlug]`: same continuous canvas
  starting `#C8B6FF`, glass header at 70%, glass cards at 60%, exact landing pills/buttons, no white
  band or hard hero→cards cut (SC-001/SC-002).