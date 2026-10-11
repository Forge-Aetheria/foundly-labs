# Implementation Plan: Project Scaffold & Design System Foundation

**Branch**: `001-project-scaffold` | **Date**: 2026-10-05 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/landing/001-project-scaffold/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command; its definition describes the execution workflow.

## Summary

Bootstrap the Foundly Labs landing page as a static-first Astro 5 project with strict
TypeScript, Tailwind CSS v4 design tokens (Clean Light UI), React islands, the agreed `src/`
structure, an SEO-ready `BaseLayout.astro`, and a central `siteConfig`. The scaffold delivers a
buildable, zero-error foundation where brand tokens are the single source of truth and no server
runtime is required.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode), ES2022; Node.js ≥ 20 (dev verified: v24.11.1);
Astro 5.x

**Primary Dependencies**: `astro@^5`, `@astrojs/react`, `react` + `react-dom`, `tailwindcss@^4`,
`@tailwindcss/vite`, `zod` (via `astro:content`), self-hosted `@fontsource-variable/*` fonts

**Storage**: N/A (static site; content collections are build-time, file-based)

**Testing**: `astro check` (type checking) + ESLint + production build smoke test. No unit test
framework is introduced by this scaffold.

**Target Platform**: Static hosting / CDN; modern evergreen browsers

**Project Type**: Single project — static website

**Performance Goals**: Lighthouse 100/100 Desktop and ≥ 98 Mobile for Performance, Accessibility,
and SEO; zero client JS for static components (constitution, Principle V)

**Constraints**: Static output only; all colors via named tokens (no inline brand hex values);
`strict: true` with no `any`; React confined to `src/modules/<modulo>/islands/`

**Scale/Scope**: Landing site with ~3 routes (`index`, `privacy`, `terms`), one shared layout, a
token layer, content-collection schemas (pricing/faqs/features), and central site configuration

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| Principle                           | Gate                                                                                                                 | Pre-Research | Post-Design |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------------- | ------------ | ----------- |
| I. Rule of Law                      | Plan respects `constitution.md` and the mandated `code-rules.md` conventions                                         | PASS         | PASS        |
| II. Spec-Driven Development         | `specs/landing/001-project-scaffold/spec.md` precedes this plan and drives it                                        | PASS         | PASS        |
| III. Server-First & Zero-JS Default | Static HTML by default; React isolated under `src/modules/<modulo>/islands/`; no hydration directive in the scaffold | PASS         | PASS        |
| IV. Strict Typing                   | `strict: true` + `noImplicitAny: true`; `@/*` alias; Zod-validated content; no `any`                                 | PASS         | PASS        |
| V. Performance & Core Web Vitals    | Self-hosted, preloaded fonts; static output; Lighthouse 100/≥98 targets; no WebGL/canvas in scope                    | PASS         | PASS        |
| VI. Clean Light UI Design System    | Full palette exposed as named tokens; zero hardcoded brand colors                                                    | PASS         | PASS        |

**Result**: No violations. Complexity Tracking is not required.

## Project Structure

### Documentation (this feature)

```text
specs/landing/001-project-scaffold/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
/
├── astro.config.mjs          # Astro config: react integration, @tailwindcss/vite, site URL
├── tailwind.config.mjs       # v4 JS config loaded via @config (content globs, plugin hooks)
├── tsconfig.json             # extends astro/tsconfigs/strict; @/* alias
├── package.json              # scripts: dev, build, preview, check, lint, format
├── public/
│   ├── fonts/                # Self-hosted font files (or @fontsource assets)
│   └── favicon.svg           # Default favicon referenced by BaseLayout
└── src/
    ├── content.config.ts     # Collection definitions (glob loader) + Zod schemas
    ├── pages/                # Thin routes: each renders a <Modulo>View
    │   ├── index.astro
    │   ├── privacy.astro
    │   └── terms.astro
    ├── modules/              # Domain modules
    │   └── <modulo>/
    │       ├── <Modulo>View.astro
    │       ├── components/   # Landing sections (.astro)
    │       └── islands/      # Interactive, hydratable islands (.tsx)
    ├── shared/               # Reusable within the app
    │   ├── components/       # Chrome + layout
    │   │   ├── BaseLayout.astro  # <html lang="es">, SEO meta, font preload, background wrapper
    │   │   └── ui/           # Static UI primitives (.astro): Button, Card, Badge
    │   ├── data/
    │   │   ├── siteConfig.ts # name, description, url, social links
    │   │   └── navigation.ts # Static navigation constants
    │   ├── types/
    │   │   └── index.ts      # Shared TypeScript types
    │   └── utils/
    │       ├── formatters.ts # Currency/cent formatting helpers
    │       └── analytics.ts  # Analytics integration helpers
    ├── content/              # Collection entry files (pricing, faqs, features)
    ├── styles/
    │   ├── global.css        # @import "tailwindcss"; @config; imports tokens.css
    │   └── tokens.css        # @theme Clean Light UI tokens
    └── assets/               # Local logos, branding, images
```

**Structure Decision**: A single static Astro project rooted at the repository root. The layout
follows the app structure defined in `constitution.md` §7 and `code-rules.md` (thin `pages/`,
domain `modules/<modulo>/` with `components/` and `islands/`, and shared `shared/` code), keeps
metadata in `src/shared/data/`, and defines Zod-validated collections in
`src/content.config.ts`. No `backend/` or `frontend/` split is needed because there is no server
runtime.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No violations; this section is intentionally empty.
