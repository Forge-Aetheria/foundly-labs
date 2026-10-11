# Quickstart & Validation Guide: Technical SEO & Metadata

**Feature**: `005-technical-seo` | **Date**: 2026-10-05

How to build and validate this feature once implemented. It references the contracts instead of
duplicating implementation detail.

## Prerequisites

- Node.js ≥ 20 and npm
- Dependencies installed (`npm install`)

## Build

```bash
npm run build
```

Expected output: static pages plus `dist/sitemap-index.xml` and `dist/robots.txt`.

## Validation scenarios

### 1. Sitemap (FR-010, SC-002)

- Confirm `dist/sitemap-index.xml` exists and references the route shard(s).
- Confirm the shard lists `/`, `/privacy/`, and `/terms/` as absolute URLs.

### 2. robots.txt (FR-011, SC-003)

- Confirm `dist/robots.txt` contains `User-agent: *`, `Allow: /`, and
  `Sitemap: https://foundlylabs.com/sitemap-index.xml`.
- Serve `dist/` (`npm run preview`) and request `/robots.txt`; expect 200.

### 3. Canonical and core metadata (FR-002, FR-003, FR-004, SC-001)

- For each built page, confirm exactly one `<title>`, one `<meta name="description">`, and one
  `<link rel="canonical">` with an absolute, self-referencing URL.
- Confirm the home page uses the official default title/description; confirm inner pages include the
  brand and their own title.

### 4. Open Graph & Twitter (FR-005, FR-006, FR-007, SC-005)

- Confirm `og:site_name=Foundly Labs`, `og:type=website`, `og:title`, `og:description`, `og:url`,
  `og:image`.
- Confirm `twitter:card=summary_large_image`, `twitter:title`, `twitter:description`,
  `twitter:image`.
- Confirm the default image is the official brand asset and is an absolute URL.

### 5. Structured data (FR-008, FR-009, SC-004)

- Parse the `<script type="application/ld+json">` blocks in a built page.
- Confirm the Organization block names Foundly Labs and lists **FORGE Labs**
  (`https://www.forgelab.lat`) as `parentOrganization`.
- Confirm the SoftwareApplication list has one entry per application in `src/shared/data/apps.ts`.
- Run a Schema.org/Rich Results validator on the built HTML; expect zero errors.

### 6. Defaults and overrides (FR-014, SC-007)

- Render a page with no SEO inputs; confirm defaults are applied.
- Pass a page-level `title`/`description`/`image`; confirm they override the defaults.

### 7. Zero executable JavaScript (FR-013, SC-006)

- Confirm the SEO feature adds no executable `<script>` (JSON-LD is data, marked `is:inline`).

## Automated gates

```bash
npm run check   # astro check: 0 errors / 0 warnings
npm run lint    # ESLint: 0 problems
npm run build   # static build with sitemap + robots
```

## Contract validation matrix

| Contract                                                   | Validated by         |
| ---------------------------------------------------------- | -------------------- |
| [seo-component](./contracts/seo-component.contract.md)     | Scenarios 3, 4, 6, 7 |
| [structured-data](./contracts/structured-data.contract.md) | Scenario 5           |
| [sitemap-robots](./contracts/sitemap-robots.contract.md)   | Scenarios 1, 2       |
| [data-model](./data-model.md)                              | Scenarios 3, 5       |
