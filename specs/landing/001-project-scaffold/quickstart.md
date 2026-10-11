# Quickstart & Validation Guide: Project Scaffold

**Feature**: `001-project-scaffold` | **Date**: 2026-10-05

This guide defines how to run and validate the scaffold end-to-end once implemented. It references
the design contracts instead of duplicating them.

## Prerequisites

- Node.js ≥ 20 (verified with v24.11.1)
- npm (verified with 11.6.2)
- A clean checkout of this repository

## Setup

```bash
npm install
```

Expected: dependencies install with no errors and a lockfile is produced.

## Run locally

```bash
npm run dev
```

Expected: the dev server starts and `http://localhost:4321` renders the home page with the
Lavender-to-White background and Clean Light UI styling.

## Validate the foundation

### 1. Production build is clean (SC-002)

```bash
npm run build
```

Expected: static output is generated with **zero errors and zero warnings**.

### 2. Type checking passes (Principle IV, FR-009)

```bash
npm run check      # astro check
```

Expected: no type errors; `@/*` imports resolve.

### 3. Lint passes (Workflow Quality Gate)

```bash
npm run lint
```

Expected: no ESLint errors.

### 4. Design tokens are the only color source (SC-003)

- Confirm each token in [contracts/design-tokens.contract.md](./contracts/design-tokens.contract.md)
  exists in `src/styles/tokens.css`.
- Search `src/**` for literal brand hex values (e.g. `#6C5CE7`, `#FFFFFF`): expect no
  matches in component files.

Expected: all brand colors resolve through named tokens.

### 5. SEO metadata is present (SC-004)

- Open a page built on `BaseLayout` and inspect the HTML `<head>`.
- Verify: `lang="es"`, `<title>`, `meta[name=description]`, `link[rel=canonical]`,
  `og:title`/`og:description`/`og:image`, `twitter:card`, and a favicon link.

Expected: all tags present and populated; a page-level `title` overrides the default.

### 6. Folder structure and routing

- Confirm the directory tree exists as specified in
  [plan.md](./plan.md#source-code-repository-root).
- Visit `/`, `/privacy`, and `/terms`; each MUST return a rendered page.

Expected: all three routes render without errors.

### 7. Content collections tolerate empty state (Edge case)

- Run `npm run build` with zero entries in `src/content/pricing|faqs|features`.

Expected: build succeeds.

### 8. Performance targets (SC-005)

- Run Lighthouse (desktop and mobile) against the built home page.

Expected: 100/100 Desktop and ≥ 98 Mobile for Performance, Accessibility, and SEO.

## Contract validation matrix

| Contract                                                           | Validated by |
| ------------------------------------------------------------------ | ------------ |
| [design-tokens](./contracts/design-tokens.contract.md)             | Steps 4      |
| [site-config & BaseLayout](./contracts/site-config.contract.md)    | Steps 5, 6   |
| [content-collections](./contracts/content-collections.contract.md) | Steps 2, 7   |
| [data-model](./data-model.md)                                      | Steps 2, 7   |
