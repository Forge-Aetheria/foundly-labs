# Contract: Portal UI (provider landing — nav, two columns and sections)

**Feature**: `specs/book/003-public-portal-minisite/` | **Date**: 2026-10-09 | **Amended**: 2026-10-14

Fixes the visual structure and accessibility contract of the public provider landing. It is a UI
contract for `apps/book`; all primitives come from `@foundly/ui` (C1, FR-018) plus the landing-canonic
overrides in `apps/book/src/shared/utils/landingCanon.ts`.

## Internal navigation (FR-005)

- Sticky glass bar (`--book-glass` + blur + subtle bottom border) with three aligned zones:
  - **Left — business brand**: compact avatar/logo (or initials) + the **current business name**.
  - **Centre — section nav**: plain-text anchors (`Servicios`, `Equipo`, `Acerca de`, `Galería`, `Reseñas`,
    `Ubicación`) in a clean horizontal bar (no floating pills). The active item is highlighted with a thin
    `primary.main` `border-bottom` indicator, tracked as the page scrolls.
  - **Right — contact**: the business phone (`tel:`) and WhatsApp links, aligned to the right.
- Links are `MuiLink`/`Typography` anchors; activation scrolls smoothly to the anchored section
  (`scrollIntoView({ behavior: 'smooth' })`) and each section keeps its `scroll-margin-top`.
- Scrollable horizontally on small viewports (no overflow). It is NOT pinned so it never collides with
  the sticky sidebar.

## Two-column layout (FR-021/FR-022)

- Desktop: `<Stack direction="row">` with **`alignItems: flex-start`** so the sticky card tracks the full
  height of the main column; main column (flex-grow) + right column fixed at `340px`.
- The right column wrapper MUST use `position: sticky; top: 5.5rem` (Tailwind `sticky top-22`) on desktop
  so the provider card follows the whole vertical scroll of the left column (services, policies, team,
  reviews).
- **Overlap**: the right column MUST apply a **negative top margin on desktop** (`mt: { md: -10 }`, ≈ −80px)
  so the solid info card rises over the lower edge of the hero banner, creating a floating layer. The
  card MUST use a solid surface (`surface.cardLight`) with a soft elevated shadow (`theme.shadows[8]`)
  and no translucent backdrop, so the photo behind stays decorative and metadata stays legible.
- Mobile: the sidebar renders first as a **compact header card** (order swap via breakpoints) and the
  negative margin is **disabled** (`mt: { xs: 0 }`) so the card stacks below the banner without covering
  any button or text (FR-022).

> A **contained, rounded hero banner** (business cover, `width: 100%` inside the page `Container`,
> ≈16px radius, capped height ≈320–360px, `object-fit: cover`) renders **below the header and above the
> two-column layout**; it is not part of the main column. With no cover it falls back to the first
> gallery photo or a branded gradient (feature `021`).

| Column           | Sections / content                                                                                                                                                                   |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Main             | Políticas card, Servicios (grouped by category), Equipo, Acerca de, Galería (grid), Reseñas (summary + cards), Ubicación y horarios.                                                  |
| Sidebar (sticky) | Avatar/logo + name + category, rating stars + numeric, pill **Reservar** (`#6C5CE7`), hours `<details>` disclosure ("Abierto · Cierra a las HH:mm"), address + phone + social links. |

## Cards and tokens

- All cards use the landing-canonic **glass surface** (`GLASS_CARD_SX`: `--book-glass-card` at 60% white +
  backdrop blur over `border.subtle`/`shadow.card`, 16px radius), **except the sidebar info card**, which
  is intentionally a **solid, elevated surface** (`surface.cardLight` + `theme.shadows[8]`) so it reads
  as a layer floating over the hero photo (FR-021).
- The sidebar Reservar and every service Reservar are accent pills (`PRIMARY_BUTTON_SX`, `#6C5CE7`).
- `RatingStars` renders a five-star row with the `primary.main` accent and `border.lavender` empty stars.
- The guided booking checkout keeps its own contract (`booking-flow.contract.md`) inside the
  `@foundly/ui` `Modal` (`glass` surface).
- Colors come only from theme tokens (`primary.main` #6C5CE7, `background.default` #FAF8FF, zinc
  text/borders) or the book-local glass variables (`--book-glass-card`).

## Guarantees (FR-019/FR-020, SC-005/SC-007)

- Keyboard-operable nav links and buttons with visible focus; automated a11y checks report zero critical
  violations (heading order included).
- Mobile: single column, the sidebar becomes a compact header card, `flexWrap` rows, no horizontal
  overflow.
