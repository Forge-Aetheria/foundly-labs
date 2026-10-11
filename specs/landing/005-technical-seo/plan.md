# Implementation Plan: Technical SEO & Metadata

**Branch**: `005-technical-seo` | **Date**: 2026-10-05 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/landing/005-technical-seo/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command; its definition describes the execution workflow.

## Summary

Centralize all page metadata in a reusable `src/shared/components/SEO.astro` (title, description,
image, canonical) injected by `BaseLayout`, add Schema.org JSON-LD (Organization with parent
organization FORGE Labs, plus the ecosystem's SoftwareApplication entries), generate a sitemap via
`@astrojs/sitemap`, and serve a `robots.txt` that allows crawling and advertises the sitemap. All of
it stays zero-JS and static.

## Technical Context

**Language/Version**: TypeScript 5.x (strict), Astro 5.x

**Primary Dependencies**: `@astrojs/sitemap` (new, build-time integration). No runtime libraries and
no client-side JS added.

**Storage**: N/A (static, build-time generation)

**Testing**: `astro check` + ESLint + `astro build`; manual schema validation and preview checks.

**Target Platform**: Static hosting / CDN; modern evergreen browsers and crawlers.

**Project Type**: Single static Astro project.

**Performance Goals**: Zero executable client JS; JSON-LD emitted inline as data; retain Lighthouse
SEO 100.

**Constraints**: Canonical origin `https://foundlylabs.com`; `robots.txt` must advertise
`sitemap-index.xml`; JSON-LD must be valid Schema.org; page values override defaults.

**Scale/Scope**: One new SEO component, one new robots file, config + site-config updates, covering
the 3 public routes.

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| Principle                           | Gate                                                                                                    | Pre-Research | Post-Design |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------- | ------------ | ----------- |
| I. Rule of Law                      | Follows `code-rules.md`: `SEO.astro` lives in the canonical `src/shared/components/` (constitution §7). | PASS         | PASS        |
| II. Spec-Driven Development         | `specs/landing/005-technical-seo/spec.md` precedes this plan                                            | PASS         | PASS        |
| III. Server-First & Zero-JS Default | SEO tags + JSON-LD are static data; `is:inline` prevents script processing; no `client:*`               | PASS         | PASS        |
| IV. Strict Typing                   | `SEOProps` and the extended `SiteConfig` are typed; no `any`                                            | PASS         | PASS        |
| V. Performance & Core Web Vitals    | Build-time sitemap/robots; no runtime JS; inline metadata only                                          | PASS         | PASS        |
| VI. Clean Light UI Design System    | No UI/color surface affected                                                                            | PASS         | PASS        |

**Result**: No structural deviations — `SEO.astro` lives in the canonical `src/shared/components/`
per the app structure in `constitution.md` §7.

## Project Structure

### Documentation (this feature)

```text
specs/landing/005-technical-seo/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
├── checklists/
│   └── requirements.md  # Created by /speckit.specify
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
astro.config.mjs              # add @astrojs/sitemap integration (site already set)  (updated)
package.json                  # add @astrojs/sitemap dependency                          (updated)
public/
└── robots.txt                # allow all agents + advertise sitemap-index.xml          (new)

src/
└── shared/
    ├── components/
    │   ├── SEO.astro           # reusable head metadata + JSON-LD component               (new)
    │   └── BaseLayout.astro    # inject <SEO /> (remove inline meta)                      (updated)
    ├── data/
    │   └── siteConfig.ts       # official defaults + parentOrganization + default OG image (updated)
    └── types/
        └── index.ts            # SEOProps + extended SiteConfig                            (updated)
```

**Structure Decision**: Keep the metadata concern isolated in a dedicated `src/shared/components/`
component injected once by `BaseLayout`, so all pages inherit consistent tags and structured data.
Structured data is derived from existing data (`siteConfig`, `apps.ts`) rather than duplicated.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed                                                                           | Simpler Alternative Rejected Because |
| --------- | ------------------------------------------------------------------------------------ | ------------------------------------ |
| _None._   | SEO/head metadata lives in the canonical `src/shared/components/` (constitution §7). | —                                    |
