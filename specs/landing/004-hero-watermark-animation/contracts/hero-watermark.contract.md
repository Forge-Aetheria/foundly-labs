# Contract: Hero Watermark Layer

**Feature**: `004-hero-watermark-animation` | **Type**: Section UI contract

## Hero (`src/modules/home/components/Hero.astro`) — extended

```ts
interface Props {
  title: string;
  description: string;
  badge?: string;
}
```

The existing props and their usage MUST NOT change.

## Watermark layer

**DOM obligations**

- The Hero root (`<section>`) MUST be a positioning context that clips overflow
  (`relative overflow-hidden`).
- A decorative watermark container MUST exist as the first child, absolutely positioned and centered
  behind the content, e.g. classes `pointer-events-none absolute left-1/2 top-1/2 z-0`.
- The watermark container MUST carry `aria-hidden="true"` and MUST NOT be focusable.
- The watermark MUST render the official `F` isotipo raster (`src/assets/icon-fl.png`) as a large
  image with an empty `alt` (e.g. `<Image src={iconFl} alt="" />`), preserving the real brand curves
  (the `F` contours, internal cuts, and the separate network node). A jagged traced outline is not
  acceptable.
- The existing Hero content (badge, heading, subtitle, CTAs) MUST be wrapped in an element with
  `relative z-10` so it renders above the watermark.

**Style obligations**

- The watermark image MUST be sized large enough (`w-[40rem] max-w-none`) to span the central area
  behind the text.
- The watermark MUST use `opacity-25` with `mix-blend-multiply` so the raster's white background
  fuses into the lavender surface, plus a fractional `blur-[0.5px]` to smooth resampling artifacts.
- The watermark MUST be centered on both axes; centering is owned by the animation's `transform`
  (no conflicting Tailwind translate utilities).
- A scoped `@keyframes y-tilt-spin` MUST animate `transform` with a shared
  `translate(-50%, -50%) perspective(1000px)` base and a lateral `rotateY` (±25°) plus a subtle
  counter `rotateX` (±5°).
- The animation MUST be `12s ease-in-out infinite`.
- Only compositor-friendly properties (`transform`, `opacity`) MAY be animated.

**Accessibility obligations**

- A `@media (prefers-reduced-motion: reduce)` rule MUST disable the animation and keep the element
  centered and static.
- The watermark MUST remain decorative and excluded from the accessibility tree.

**Performance obligations**

- The feature MUST NOT add any client-side JavaScript or hydration directive.

## Verification

- Built Hero HTML contains the decorative container with `aria-hidden="true"` before the content.
- The Hero `<style>` (compiled CSS) contains `y-tilt-spin` and the reduced-motion rule.
- No `client:*` directives and no `<script>` are introduced by the feature.
- At 320px width the page shows no horizontal scroll caused by the watermark.
