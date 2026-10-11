# Phase 0 Research: Hero Watermark Animation

**Feature**: `004-hero-watermark-animation` | **Date**: 2026-10-05

This document records the decisions taken to remove all `NEEDS CLARIFICATION` items from the plan's
Technical Context.

## R1. Asset source for the watermark

- **Decision**: Use the **official brand raster** `src/assets/icon-fl.png` (moved from `public/`),
  rendered with Astro's `<Image />` (optimized to WebP, decorative `alt=""`) and styled with CSS
  filters: `w-[40rem] max-w-none opacity-25 mix-blend-multiply blur-[0.5px]`.
- **Rationale**: The raster is the clean, professional artwork and preserves the real curves of the
  `F`, its internal cuts, and the separate network node(s). Re-vectorizing it with `potrace` produced
  jagged/irregular edges that did not match the brand finish, so a filtered raster avoids tracing
  artifacts. Using `<Image />` also keeps performance healthy (≈727 kB PNG → ≈16 kB WebP).
- **Alternatives considered**: The `potrace`-traced SVG (rejected — jagged/dented outline),
  the fused `favicon.svg` (rejected — loses node/internal detail), a plain `<img>` pointing at
  `public/icon-fl.png` (rejected — ships the 727 kB unoptimized raster and bypasses the project's
  image convention), and inlining the SVG paths into the component (rejected — bloats markup).

## R2. Where the animation lives

- **Decision**: Define the keyframes in a scoped `<style>` block inside
  `src/modules/home/components/Hero.astro`, named `y-tilt-spin`.
- **Rationale**: The motion is specific to the Hero; a scoped style avoids polluting global CSS and
  guarantees no JavaScript. Astro compiles this to plain CSS at build time.
- **Alternatives considered**: Global keyframes in `src/styles/global.css` (rejected — unnecessary
  shared surface for a single component) and a JS/animation library (rejected — violates Zero-JS).

## R3. Motion shape, duration, and easing

- **Decision**: Animate `transform` with a 3D side-to-side sway: a shared
  `translate(-50%, -50%) perspective(1000px)` base plus `rotateY` between -25° and 25° and a subtle
  counter `rotateX` between 5° and -5°, over 12 seconds with `ease-in-out`, `infinite`.
- **Rationale**: A lateral Y-axis tilt reads as an elegant, organic oscillation rather than a flat
  2D spin, and 12s is slow enough to be non-distracting while remaining noticeable (spec
  FR-007/SC-002). Animating only `transform` keeps the work on the compositor. No Tailwind translate
  utilities are used on the element, because the keyframes already own the `transform` (avoiding
  conflicts between utility classes and keyframes).
- **Alternatives considered**: A continuous 2D `rotate(360deg)` (rejected — reads as a flat spin and
  looked wrong), `linear` easing (rejected — `ease-in-out` gives a more organic turn at the
  extremes), and animating `box-shadow`/`filter` (rejected — expensive and not compositor-friendly).

## R4. Reduced motion

- **Decision**: Add a `@media (prefers-reduced-motion: reduce)` block that disables the animation and
  pins the element to its centered position.
- **Rationale**: Satisfies spec FR-009/SC-004 and accessibility best practice; the watermark remains
  visible but static.
- **Alternatives considered**: Hiding the watermark entirely under reduced motion (rejected — the
  brand layer has value without motion) and ignoring the preference (rejected — accessibility gate).

## R5. Opacity, blending, blur, and stacking

- **Decision**: Render a single filtered copy of the official isotipo sized `w-[40rem] max-w-none`
  with `opacity-25 mix-blend-multiply blur-[0.5px]`. Give the wrapper `z-0` and `pointer-events-none`,
  and wrap the existing Hero content in a `relative z-10` element.
- **Rationale**: Meets FR-003/FR-004/FR-005. `mix-blend-multiply` makes the raster's white background
  fuse into the lavender header/body while darkening the purple mark into a soft watermark; the
  fractional blur removes any resampling artifacts at scale. Blur is static (not animated).
- **Alternatives considered**: Two stacked glow/line-art layers (rejected — superseded by the simpler
  filtered raster approach), a plain low-opacity image without blending (rejected — the PNG's white
  box would show over lavender), and a higher opacity (`opacity-50`) rejected for obstructing the
  heading.

## R6. Clipping and responsive behavior

- **Decision**: Make the Hero `<section>` a positioning context with `relative overflow-hidden`, and
  size the watermark relative to the container (large but bounded).
- **Rationale**: Satisfies FR-010/SC-005; prevents the oversized rotating element from creating
  horizontal scroll on small screens.
- **Alternatives considered**: `overflow-hidden` on `body`/global (rejected — too broad and can hide
  legitimate content) and no clipping (rejected — causes overflow).

## R7. Accessibility semantics

- **Decision**: Mark the watermark container `aria-hidden="true"` and `pointer-events-none`; render
  the image with an empty `alt`.
- **Rationale**: Satisfies FR-005/FR-011/SC-006; the element is purely decorative and must never be a
  tab stop or a screen-reader node.
- **Alternatives considered**: A descriptive `alt` (rejected — would add noise for a decorative
  layer).

## Open items

None. All Technical Context unknowns are resolved.
