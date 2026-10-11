# Contract: Application Card (`src/shared/components/ui/AppCard.astro`)

**Feature**: `003-real-apps-data` | **Type**: Component UI contract

## Props

```ts
interface Props {
  app: Application;
}
```

## Obligations

### Header image

- MUST render the product image with `src={app.icon || app.logo}` (FR-012).
- MUST constrain the footprint with a fixed height and contained aspect plus explicit
  `width`/`height` attributes so it causes no layout shift (FR-013).
- MUST sit on a light, token-aligned surface so transparent art composites without an opaque box
  or halo (FR-014).
- MUST carry `alt` text identifying the product, e.g. `alt={\`Logo de ${app.name}\`}` (FR-015).

### Copy

- MUST render, from the canonical dataset only (no hard-coded copy): `name`, `category`, `status`,
  `target`, `headline`, `subheadline`, `description`, and `keyFeature` (FR-007).
- Longer copy MUST wrap without clipping or overlapping adjacent cards in single- and multi-column
  layouts (FR-008).

### Clean Light UI

- MUST use existing tokens: `bg-card-light/*` (with `backdrop-blur-md`), `border border-border-subtle`,
  `rounded-2xl`, `shadow-card`, `text-primary`, `text-secondary` (constitution VI).
- MUST NOT introduce literal brand hex values.
- MUST contain no client-side JavaScript and no `client:*` directive (constitution III).

### Accessibility

- Product name MUST remain an `h3` heading and each image MUST have meaningful `alt` text.

## Verification

- Rendered cards show all four products' copy and images; images do not trigger layout shift.
- With JavaScript disabled, all copy and images render (SC-004).
- Keyboard/screen-reader inspection confirms image alt text and heading semantics (SC-006).
