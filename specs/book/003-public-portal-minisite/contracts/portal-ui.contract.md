# Contract: Portal UI (hero, tabs and cards)

**Feature**: `specs/book/003-public-portal-minisite/` | **Date**: 2026-10-09

Fixes the visual structure and accessibility contract of the public mini-site. It is a UI contract for `apps/book`; all primitives come from `@foundly/ui` (C1, FR-018).

## Brand hero (FR-001…FR-004)

- Decorative cover banner using `primary.light` (lavender) as a full-width band.
- Identity row: avatar/logo (fallback: initials circle built from `Stack`+`Typography`), commercial name, category badge and status badges.
- "Sobre nosotros" biography, only when `bio` is present.
- Contact row: address, phone and social links (Instagram/WhatsApp as https anchors), rendered only for configured values.

## Tabs (FR-005…FR-008)

- Tab controller: pill `Button` elements with WAI-ARIA tab semantics (`role="tablist"`, `aria-selected`, `aria-controls`, arrow-key navigation — research R3).
- `Servicios` is the default tab.

| Tab                 | Content                                                                                                  |
| ------------------- | -------------------------------------------------------------------------------------------------------- |
| Servicios (default) | `ServiceCard` list: name, description (if any), duration ("N min"), price (current rate), pill "Reservar" |
| Equipo / Especialistas | Specialists (active resources) with initials avatar + name + role; empty state when none              |
| Información & Políticas | Weekly `businessHours` per weekday + `PortalPolicy` list (fallback copy when empty)                   |

## Cards and tokens

- `ServiceCard` uses `@foundly/ui` `Card` with the **landing-canonic glass surface** (`GLASS_CARD_SX`:
  translucent `--book-glass-card` + backdrop blur over `border.subtle`/`shadow.card`, 16px radius), bold
  headings, `text.secondary` body and a pill primary button (`PRIMARY_BUTTON_SX`).
- Tab pills follow the landing `Badge`/`Button` style: active tab = `primary.main`, inactive = translucent
  glass (`SECONDARY_BUTTON_SX`), all `rounded-full`.
- The canon helpers live in `apps/book/src/app/components/landingCanon.ts` and are shared with the product
  page (`/`) and the booking checkout (`004-book-brand-canvas`).
- Colors come only from theme tokens (`primary.main` #6C5CE7, `background.default` #FAF8FF, zinc
  text/borders) or the book-local glass variables (`--book-glass-card`).

## Guarantees (FR-019/FR-020, SC-005/SC-007)

- Keyboard-operable tabs and buttons with visible focus; automated a11y checks report zero critical violations.
- Mobile: single column layout, `flexWrap` rows, no horizontal overflow.