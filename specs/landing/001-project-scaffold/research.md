# Phase 0 Research: Project Scaffold & Design System Foundation

**Feature**: `001-project-scaffold` | **Date**: 2026-10-05

This document records the decisions taken to remove all `NEEDS CLARIFICATION` items from the
plan's Technical Context. Each entry states the decision, the rationale, and the alternatives
considered.

## R1. Tailwind CSS v4 integration in Astro 5

- **Decision**: Use Tailwind CSS v4 through the `@tailwindcss/vite` Vite plugin registered in
  `astro.config.mjs`, and import the framework with `@import "tailwindcss";` from
  `src/styles/global.css`.
- **Rationale**: This is the current official setup for Tailwind v4 in Astro. It requires no
  PostCSS configuration and works with Astro's Vite pipeline.
- **Alternatives considered**: `@astrojs/tailwind` (rejected — officially deprecated; Tailwind v4
  is now provided by the Vite plugin) and manual PostCSS (rejected — unnecessary complexity for a
  static site).

## R2. Design token source of truth

- **Decision**: Declare the Clean Light UI palette as CSS-first tokens with Tailwind v4's `@theme`
  directive in `src/styles/tokens.css`. Provide `tailwind.config.mjs` as a thin, optional JS config
  loaded via `@config` for editor/tooling compatibility (content globs and future plugins).
- **Rationale**: v4's canonical configuration is CSS-first, which keeps tokens usable as CSS
  custom properties and generates matching utilities (e.g. `bg-accent-primary`, `text-primary`) as
  required by `code-rules.md`. The JS config preserves the file referenced by the code rules.
- **Alternatives considered**: JS-only theme in `tailwind.config.mjs` (rejected — v4 treats this as
  legacy compatibility, not the primary path) and raw CSS variables without Tailwind mapping
  (rejected — would not produce the utility classes the code rules require).
- **Token mapping**:

  | Token                         | Value                      | Utility example        |
  | ----------------------------- | -------------------------- | ---------------------- |
  | `--color-accent-primary`      | `#6C5CE7`                  | `bg-accent-primary`    |
  | `--color-accent-primary-glow` | `rgba(108, 92, 231, 0.35)` | `shadow-accent`        |
  | `--color-accent-positive`     | `#10B981`                  | `text-accent-positive` |
  | `--color-accent-gold`         | `#F59E0B`                  | `text-accent-gold`     |
  | `--color-app-body`            | `#FAFAFC` / `#F4F3F8`      | `bg-app-body`          |
  | `--color-card-light`          | `#FFFFFF`                  | `bg-card-light`        |
  | `--color-badge-pill`          | `#F0EEF9`                  | `bg-badge-pill`        |
  | `--color-border-subtle`       | `#E6E4F0`                  | `border-border-subtle` |
  | `--color-gradient-from`       | `#C8B6FF`                  | gradient start         |
  | `--color-gradient-to`         | `#D8B4FE`                  | gradient end           |
  | `--color-primary`             | `#1E1B2E`                  | `text-primary`         |
  | `--color-secondary`           | `#6B7280`                  | `text-secondary`       |
  | `--color-muted`               | `#9CA3AF`                  | `text-muted`           |

## R3. Font strategy (self-hosted + preload)

- **Decision**: Self-host fonts locally as npm packages (`@fontsource-variable/*`) imported from
  `BaseLayout.astro` or `global.css`, and emit explicit preload links for the fonts used above the
  fold.
- **Rationale**: Fontsource assets are bundled and served from the site origin (self-hosted), and
  explicit preload links remove FOIT/CLS. It relies on the stable Astro 5 import pipeline rather
  than the experimental Fonts API (`experimental.fonts`, added in Astro 5.7) or the stable Fonts
  API that only landed in Astro 6.
- **Alternatives considered**: Astro `experimental.fonts` (rejected — optional experimental flag
  adds risk for a foundation task), remote Google Fonts (rejected — third-party request, privacy
  and performance cost), and raw `@font-face` with local files (kept as a fallback if a font has no
  Fontsource package).

## R4. Content collections and schema validation

- **Decision**: Define collections (`pricing`, `faqs`, `features`) in `src/content.config.ts` using
  the Astro 5 Content Layer `glob()` loader and Zod schemas with explicit TypeScript types.
- **Rationale**: Satisfies the strict-typing principle and `code-rules.md` (content validated with
  `astro:content` + `zod`). Collections may start empty; the site must still build.
- **Alternatives considered**: Plain typed constants in `src/shared/data/` only (rejected — the spec
  requires schema-validated collections) and a legacy `src/content/config.ts` (rejected — the
  Content Layer config in `src/content.config.ts` is the Astro 5 default).

## R5. Strict TypeScript and path aliases

- **Decision**: `tsconfig.json` extends `astro/tsconfigs/strict`, sets `compilerOptions.paths` with
  `"@/*": ["./src/*"]` and `"baseUrl": "."`, and keeps `strict`/`noImplicitAny` enabled. Vite
  `resolve.alias` mirrors `@` → `./src` so runtime imports match the type resolution.
- **Rationale**: Directly satisfies Principle IV and requirement FR-009, and keeps imports stable
  when files move.
- **Alternatives considered**: Relative imports only (rejected — brittle and verbose) and a custom
  tsconfig without the Astro strict preset (rejected — would need to re-declare strict flags).

## R6. SEO metadata in the base layout

- **Decision**: `BaseLayout.astro` accepts optional `title`, `description`, `image`, and
  `canonical` props that fall back to `siteConfig` defaults, and renders charset, viewport, title,
  description, canonical, Open Graph (`og:*`), Twitter card (`summary_large_image`), and favicon.
  `<html lang="es">` is fixed.
- **Rationale**: Satisfies FR-006/FR-008 with per-page overrides while keeping defaults centralized
  in `src/shared/data/siteConfig.ts`.
- **Alternatives considered**: A separate `Head.astro` component (deferred — can be extracted
  later) and third-party SEO integrations (rejected — unnecessary for a small static site).

## R7. Astro output mode

- **Decision**: Keep Astro's default `output: 'static'` and do not add an adapter.
- **Rationale**: FR-002 requires static output with no server runtime; the constitution enforces a
  server-first/zero-JS default.
- **Alternatives considered**: SSR/`hybrid` with a Node adapter (rejected — out of scope; no
  dynamic server behavior is needed).

## Open items

None. All Technical Context unknowns are resolved.
