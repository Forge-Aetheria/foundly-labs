# Phase 0 Research: Technical SEO & Metadata

**Feature**: `005-technical-seo` | **Date**: 2026-10-05

This document records the decisions taken to remove all `NEEDS CLARIFICATION` items from the plan's
Technical Context.

## R1. Reusable SEO component API and injection

- **Decision**: Create `src/shared/components/SEO.astro` with typed props `title?`, `description?`,
  `image?`, `canonicalURL?`. `BaseLayout` imports it and renders `<SEO ... />` inside `<head>`,
  passing the page's props through. All current inline meta tags move into the component.
- **Rationale**: Single source of truth for head metadata and structured data; pages keep passing
  the same `title`/`description`/`image`/`canonical` inputs they already use.
- **Alternatives considered**: Keeping tags inline in `BaseLayout` (rejected — the spec asks for a
  reusable component and it would keep growing) and a third-party SEO integration (rejected — the
  needs are small and must stay zero-JS).

## R2. Where defaults live

- **Decision**: Extend `SiteConfig` with the official `defaultTitle`
  ("Foundly Labs | Ecosistema Software Local-First & Comercio Ágil"), the official `description`,
  `defaultImage`, and `parentOrganization` (`{ name: 'FORGE Labs', url: 'https://www.forgelab.lat' }`).
  The `SEO` component reads these as fallbacks.
- **Rationale**: Defaults are brand data, so they belong with the other site constants; the official
  title/description supersede the shorter scaffold values.
- **Alternatives considered**: Hardcoding defaults in `SEO.astro` (rejected — harder to reuse and
  change) and leaving the old title (rejected — the spec mandates the new official title).

## R3. Default social/OG image

- **Decision**: Use the official branding asset (`src/assets/branding-logo-fl.png`) as the default
  social image, referenced by its built URL, with per-page override via the `image` prop.
- **Rationale**: Satisfies FR-007 with the official brand asset already in the repo, avoiding a new
  binary; pages can still override with a dedicated image.
- **Alternatives considered**: A dedicated `public/og-image.jpg` (deferred — no such asset exists and
  authoring one is out of scope) and the favicon (rejected — too small/low-fidelity for previews).
- **Follow-up (non-blocking)**: preview platforms prefer ~1200×630; the logo is wide (≈1472×407).
  A dedicated OG image can be added later without code changes by overriding `defaultImage`.

## R4. Sitemap generation

- **Decision**: Add the official `@astrojs/sitemap@^3` integration in `astro.config.mjs`; the `site`
  value (`https://foundlylabs.com`) is already set. This emits `sitemap-index.xml` (+ shards) into
  the build output.
- **Rationale**: The first-party integration is the supported, build-time way to generate a sitemap
  for Astro 5 with zero runtime cost, and it produces the `sitemap-index.xml` the spec references.
- **Alternatives considered**: Hand-writing a sitemap (rejected — must be maintained manually and
  risks drift) and a third-party generator (rejected — unnecessary dependency).

## R5. robots.txt

- **Decision**: Create `public/robots.txt` with `User-agent: *`, `Allow: /`, and
  `Sitemap: https://foundlylabs.com/sitemap-index.xml`.
- **Rationale**: Satisfies FR-011; a static file copied to the build root is the standard approach
  and needs no runtime.
- **Alternatives considered**: Generating it via an endpoint (rejected — overkill for a static file).

## R6. Structured data (JSON-LD) emission

- **Decision**: Emit two JSON-LD blocks from the `SEO` component using
  `<script type="application/ld+json" is:inline set:html={JSON.stringify(data)} />`: an
  `Organization` (name, url, logo, `parentOrganization` = FORGE Labs) and an `ItemList` of
  `SoftwareApplication` entries derived from `src/shared/data/apps.ts`.
- **Rationale**: `is:inline` prevents Astro from bundling/processing the tag (so no client JS and no
  module semantics); `JSON.stringify` guarantees valid escaping.
- **Alternatives considered**: Using a global `<script>` (rejected — Astro would process it as
  module JS), and a structured-data package (rejected — trivial to build by hand, keeps zero deps).

## R7. Canonical URL resolution

- **Decision**: Compute the canonical URL in `BaseLayout`/`SEO` as an absolute URL from `Astro.site`
  (or `siteConfig.url`) plus `Astro.url.pathname`, unless an explicit `canonicalURL` is passed.
  Trailing slashes follow Astro's generated route (`/privacy/`).
- **Rationale**: Satisfies FR-004 with self-referencing canonical URLs for every page.
- **Alternatives considered**: Relying on the browser URL (rejected — not present at build time) and
  omitting canonicals (rejected — duplicate-content risk).

## R8. Escaping and no-JS verification

- **Decision**: Use Astro's attribute interpolation for meta tags (auto-escaped) and
  `JSON.stringify` for JSON-LD; verify the build contains no executable `<script>` for the SEO
  feature.
- **Rationale**: Satisfies FR-013 and the edge case about special characters.
- **Alternatives considered**: Manual string concatenation (rejected — escaping bugs).

## Open items

None. All Technical Context unknowns are resolved.
