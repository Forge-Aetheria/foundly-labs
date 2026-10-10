# Contract: Portal UI (provider landing — nav, two columns and sections)

**Feature**: `specs/book/003-public-portal-minisite/` | **Date**: 2026-10-09 | **Amended**: 2026-10-10

Fixes the visual structure and accessibility contract of the public provider landing. It is a UI
contract for `apps/book`; all primitives come from `@foundly/ui` (C1, FR-018) plus the landing-canonic
overrides in `apps/book/src/app/components/landingCanon.ts`.

## Internal navigation (FR-005)

- Glass bar (`--book-glass` + blur + subtle bottom border) that scrolls with the page, with anchor pills:
  `Servicios`, `Equipo`, `Acerca de`, `Galería`, `Reseñas`, `Dirección`.
- Pills are `MuiLink`/`Typography`-based anchors styled like the landing `SECONDARY_BUTTON_SX`;
  scrolling is smooth (`html { scroll-behavior: smooth }`) with `scroll-margin-top` per section.
- Scrollable horizontally on small viewports (no overflow). It is NOT pinned so it never collides with
  the sticky sidebar.

## Two-column layout (FR-021/FR-022)

- Desktop: `<Stack direction="row">` with **`alignItems: flex-start`** so the sticky card tracks the full
  height of the main column; main column (flex-grow) + right column fixed at `340px`.
- The right column wrapper MUST use `position: sticky; top: 1.5rem` (Tailwind `sticky top-6`) on desktop
  so the provider card follows the whole vertical scroll of the left column (services, policies, team,
  reviews).
- Mobile: the sidebar renders first as a **compact header card** (order swap via breakpoints).

| Column | Sections / content                                                                                     |
| ------ | ------------------------------------------------------------------------------------------------------ |
| Main   | Gallery banner (cover + photo strip), Políticas card, Servicios (grouped by category), Equipo, Acerca de, Galería (grid), Reseñas (summary + cards), Dirección y horarios. |
| Sidebar (sticky) | Avatar/logo + name + category, rating stars + numeric, pill **Reservar** (`#6C5CE7`), hours `<details>` disclosure ("Abierto · Cierra a las HH:mm"), address + phone + social links. |

## Cards and tokens

- All cards use the landing-canonic **glass surface** (`GLASS_CARD_SX`: `--book-glass-card` at 60% white +
  backdrop blur over `border.subtle`/`shadow.card`, 16px radius).
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