# Phase 0 Research: Branding Integration & Apps Grid

**Feature**: `002-branding-apps-grid` | **Date**: 2026-10-05

This document records the decisions taken to remove all `NEEDS CLARIFICATION` items from the
plan's Technical Context.

## R1. Navbar implementation (static vs hydrated island)

- **Decision**: Implement the navigation as a static `src/shared/components/Navbar.astro`
  component and remove the unused sample island `src/modules/<modulo>/islands/Nav.tsx`. The mobile menu
  uses a CSS-only disclosure (a `<details>`/`<summary>` toggle plus an always-visible desktop list).
- **Rationale**: Satisfies Constitution Principle III (server-first, zero-JS default). Navigation
  is above the fold and must work with JavaScript disabled (spec edge case).
- **Alternatives considered**: Hydrating the existing `Nav.tsx` React island with `client:visible`
  or `client:media` (rejected — adds client JS to every page for a menu that CSS can handle) and
  `client:load` (forbidden by the constitution except for the Hero).

## R2. Official document title

- **Decision**: Add the official title to `siteConfig` (`defaultTitle = "Foundly Labs | Local-First
Software Ecosystem"`). `BaseLayout` renders it verbatim when no page title is provided, and
  composes `${pageTitle} · ${defaultTitle}` when a page supplies its own title.
- **Rationale**: FR-002 requires the official title by default, and SC-001 expects it on 100% of
  pages; composing keeps the brand string present everywhere while preserving page context.
- **Alternatives considered**: Reusing `siteConfig.name` for the title (rejected — the official
  title is richer than the short name) and per-page-only titles (rejected — would drop the official
  title on inner pages).

## R3. Brand image handling and OG image

- **Decision**: Move the full logo into `src/assets/branding-logo-fl.png` and render it with
  Astro's `<Image />` from `astro:assets` in the navbar; use the resolved asset URL as the default
  Open Graph image. Keep the isotipo favicon as the static `public/favicon.svg` (plus
  `src/assets/icon-fl.png` as the isotipo source).
- **Rationale**: `code-rules.md` mandates `<Image />` for images (optimization and sizing),
  while the favicon must remain a stable root URL. `src/assets` is the required home for
  `<Image />` sources.
- **Alternatives considered**: Keeping the logo in `public/` with a plain `<img>` (rejected — code
  rules require `<Image />`) and using the favicon as the OG image (rejected — the full logo is the
  brand-consistent social preview).
- **Follow-up**: the logo's pixel dimensions are unknown; if it is not close to 1200×630, a
  dedicated social-preview image may be needed later. This is not blocking.

## R4. Anchor link strategy across routes

- **Decision**: Navigation links use root-relative anchors (`/#apps`, `/#manifesto`); Hero CTA
  buttons use plain hashes (`#apps`, `#manifesto`) because they render on the home page.
- **Rationale**: `/#apps` resolves correctly from any route (for example, from `/privacy`), while
  the plain hash is sufficient and avoids a full navigation from the home page.
- **Alternatives considered**: Plain hashes everywhere (rejected — broken from non-home routes) and
  JavaScript smooth-scroll handlers (rejected — unnecessary JS; CSS `scroll-behavior`/native anchor
  jumps suffice).

## R5. Clean Light UI card styling with tokens

- **Decision**: Style application cards with `bg-card-light/60 backdrop-blur-md border
border-border-subtle rounded-2xl shadow-card` plus spacing, using the existing tokens from
  `src/styles/tokens.css`.
- **Rationale**: Matches the requested translucent card look while keeping every color sourced from
  the design tokens (Principle VI, code rules). Tailwind v4 supports the `/60` opacity modifier on
  custom `--color-*` theme tokens.
- **Alternatives considered**: Literal `bg-white/60` (rejected — `#FFFFFF` is the `card-light`
  token, so the token should be used) and a custom CSS class (rejected — utility classes are the
  project convention).

## R6. Typed application data

- **Decision**: Define an `Application` interface (with a `category`/`status`/`target`) in
  `src/shared/types/index.ts` and the four entries in `src/shared/data/apps.ts`, typed as `Application[]`.
- **Rationale**: FR-010 requires a typed reusable structure; `src/shared/data/` is the code-rules location
  for static content, and Zod is unnecessary because this is a fixed, code-owned list.
- **Alternatives considered**: A content collection with Zod (rejected — overkill for four
  code-owned records and would complicate the anchor-rendered grid) and inline arrays in the
  component (rejected — code rules forbid content declared inside section components).

## R7. Favicon verification

- **Decision**: Treat the existing `public/favicon.svg` as the isotipo favicon and keep the
  `<link rel="icon" type="image/svg+xml">` reference in `BaseLayout`. Verify at implementation time
  that it renders the F isotipo; if it does not, replace it using `src/assets/icon-fl.png` as the
  source.
- **Rationale**: FR-001 requires the isotipo as the favicon; the asset is already present.
- **Alternatives considered**: Generating a new SVG favicon (deferred unless the current one is
  incorrect).

## Open items

None. All Technical Context unknowns are resolved.
