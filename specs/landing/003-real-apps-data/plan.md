# Implementation Plan: Production Copy & Branded Assets for the Apps Dataset

**Branch**: `003-real-apps-data` | **Date**: 2026-10-06 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/landing/003-real-apps-data/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command; its definition describes the execution workflow.

## Summary

Enrich the canonical, strictly typed applications dataset (`src/shared/data/apps.ts`) with the final
production copy for the four Foundly Labs products — headline, subheadline, "what it solves"
description, and key feature — plus per-product `logo` and `icon` asset paths served from `public/`.
Update `AppCard.astro` so each ecosystem card renders its product image in the card header with a
controlled footprint, transparent-friendly background, and accessible alt text, while keeping the
grid within the Clean Light UI. The whole feature remains static-first and zero-JS.

## Technical Context

**Language/Version**: TypeScript 5.x (strict), ES2022; Astro 5.x

**Primary Dependencies**: `astro@^5`, `tailwindcss@^4` via `@tailwindcss/vite` (existing scaffold).
No new runtime or build dependencies are required.

**Storage**: N/A — static site; product entries remain typed static data in `src/shared/data/apps.ts`;
product images are static files under `public/<product>/`.

**Testing**: `astro check` (types) + ESLint (`eslint .`) + `astro build` smoke; manual responsive
and accessibility checks. No unit test framework is in scope.

**Target Platform**: Static hosting / CDN; modern evergreen browsers.

**Project Type**: Single project — static website.

**Performance Goals**: No new client JavaScript added (cards are static `.astro`); no new render
blocking resources; product images must not cause layout shift. Maintain Lighthouse 100/100
Desktop and ≥98 Mobile for Performance, Accessibility and SEO (constitution, Principle V).

**Constraints**:

- Strict typing: extend the `Application` contract with explicit fields; no `any`, no implicit `as`.
- Tokens-only colors; no literal brand hex in markup (constitution, Principle VI).
- Product asset paths are fixed by the spec: `/<product>/branding-logo.png` and `/<product>/icon.png`.
- Rendering is server/build-time HTML; images are plain markup, keyboard/AT operational without JS.
- Images are referenced from `public/` by URL, so they are rendered with a plain `<img>` element
  (see research.md decision R1 for the deviation from `code-rules.md` §6).

**Scale/Scope**: 1 type extension, 1 data file, 1 card component; 4 products; 8 image references.

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| Principle                           | Gate                                                                                                            | Pre-Research | Post-Design |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------------- | ------------ | ----------- |
| I. Rule of Law                      | Follows `code-rules.md` naming/locations (`ui/`, `data/`, `types/`); deviation on `<img>` is documented in R1   | PASS         | PASS        |
| II. Spec-Driven Development         | `specs/landing/003-real-apps-data/spec.md` precedes this plan                                                   | PASS         | PASS        |
| III. Server-First & Zero-JS Default | Cards and images are static HTML; no `client:*` added                                                           | PASS         | PASS        |
| IV. Strict Typing                   | `Application` extended with explicit fields; no `any`                                                           | PASS         | PASS        |
| V. Performance & Core Web Vitals    | Controlled image footprint to avoid CLS; no new client JS                                                       | PASS         | PASS        |
| VI. Clean Light UI Design System    | Cards keep `bg-card-light/*`, `border-border-subtle`, `rounded-2xl`, `shadow-card`; image bg composited cleanly | PASS         | PASS        |

**Result**: No violations. Complexity Tracking is not required.

## Project Structure

### Documentation (this feature)

```text
specs/landing/003-real-apps-data/
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
public/
├── foundly-finance/
│   ├── branding-logo.png      # exists
│   └── icon.png               # exists
├── foundly-pos/
│   ├── branding-logo.png      # exists
│   └── icon.png               # exists
├── foundly-maker/
│   ├── branding-logo.png      # exists
│   └── icon.png               # exists
└── mixbit/                    # MISSING — must be added as part of this feature
    ├── branding-logo.png
    └── icon.png

src/
└── shared/
    ├── components/
    │   └── ui/
    │       └── AppCard.astro       # updated: header image + enriched copy layout
    ├── data/
    │   └── apps.ts                 # updated: production copy + logo/icon paths
    └── types/
        └── index.ts                # updated: Application gains headline/subheadline/keyFeature/logo/icon
```

**Structure Decision**: Reuse the existing single-project layout and `code-rules.md` conventions.
The `Application` contract lives in `src/shared/types/index.ts`; canonical values live in `src/shared/data/apps.ts`;
presentation stays in `src/shared/components/ui/AppCard.astro` (imported by `src/modules/home/components/AppsGrid.astro`).
No new components or islands are introduced. The only new files are the `public/mixbit/` assets
whose source must be supplied (see research.md R2).

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation                             | Why Needed                                                                                                                                          | Simpler Alternative Rejected Because                                                                                                        |
| ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `code-rules.md` §6 prefers `<Image/>` | Product assets are fixed public URLs mandated by the spec (`/<product>/...`), which `astro:assets` cannot consume without moving files under `src/` | Moving assets to `src/assets` would violate the spec's mandated public paths and add a build-time import indirection for no measurable gain |
