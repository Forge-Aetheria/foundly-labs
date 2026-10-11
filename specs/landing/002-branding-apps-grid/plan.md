# Implementation Plan: Branding Integration & Apps Grid

**Branch**: `002-branding-apps-grid` | **Date**: 2026-10-05 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/landing/002-branding-apps-grid/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command; its definition describes the execution workflow.

## Summary

Integrate the Foundly Labs brand and expose the product ecosystem on the landing page: the isotipo
as favicon, the official document title and Open Graph tags, a full-logo navbar with
"Ecosistema"/"Local-First" links, a responsive Clean Light UI grid of the four ecosystem projects
(Foundly, Foundly POS, LRC-Maker, Mixbit), and two Hero calls to action. The implementation stays
static-first and zero-JS for navigation (CSS-only disclosure) and reuses the existing design tokens.

## Technical Context

**Language/Version**: TypeScript 5.x (strict), ES2022; Astro 5.x; React available for future islands

**Primary Dependencies**: `astro@^5`, `@tailwindcss/vite`, `tailwindcss@^4` (existing scaffold).
No new runtime dependencies are required.

**Storage**: N/A (static site; application entries are static typed data in `src/shared/data/apps.ts`)

**Testing**: `astro check` (types) + ESLint + `astro build` smoke; manual responsive and keyboard
checks. No unit test framework in scope.

**Target Platform**: Static hosting / CDN; modern evergreen browsers

**Project Type**: Single project — static website

**Performance Goals**: No new client JS added (navbar and grid are static); maintain Lighthouse
100/100 Desktop and ≥98 Mobile for Performance, Accessibility, SEO (constitution, Principle V)

**Constraints**: Tokens-only colors (no literal brand hex); strict typing with no `any`; brand
images served locally from `public/`; anchors resolve across routes as `/#apps` and `/#manifesto`

**Scale/Scope**: 1 updated layout, 1 updated page, 1 new navbar + 2 new sections + 1 new data file

- 2 new UI primitives

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| Principle                           | Gate                                                                                                                                   | Pre-Research | Post-Design |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | ------------ | ----------- |
| I. Rule of Law                      | Uses existing tokens and follows `code-rules.md` conventions (`shared/components/ui/`, `modules/<modulo>/components/`, `shared/data/`) | PASS         | PASS        |
| II. Spec-Driven Development         | `specs/landing/002-branding-apps-grid/spec.md` precedes this plan                                                                      | PASS         | PASS        |
| III. Server-First & Zero-JS Default | Navbar and grid are static; mobile nav uses CSS-only disclosure; no `client:*` added                                                   | PASS         | PASS        |
| IV. Strict Typing                   | `Application` type + `apps.ts` data; no `any`; existing `@/*` alias                                                                    | PASS         | PASS        |
| V. Performance & Core Web Vitals    | No new client JS; local brand images; no layout-shift regressions                                                                      | PASS         | PASS        |
| VI. Clean Light UI Design System    | Cards use `bg-card-light/60`, `backdrop-blur-md`, `border-border-subtle`, `rounded-2xl`, `shadow-card`                                 | PASS         | PASS        |

**Result**: No violations. Complexity Tracking is not required.

## Project Structure

### Documentation (this feature)

```text
specs/landing/002-branding-apps-grid/
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
├── favicon.svg           # Isotipo (verify it matches the brand isotipo)
└── branding-logo-fl.png  # Full logo used by the navbar and as default OG image

src/
├── pages/
│   └── index.astro             # renders modules/home/HomeView.astro (updated)
├── modules/
│   └── home/
│       ├── HomeView.astro      # composes Hero + AppsGrid + Manifesto (new)
│       └── components/
│           ├── Hero.astro          # add centered CTA buttons (updated)
│           ├── AppsGrid.astro      # id="apps", responsive grid of AppCards (new)
│           └── Manifesto.astro     # id="manifesto", local-first rationale (new)
└── shared/
    ├── components/
    │   ├── Navbar.astro        # static navbar; replaces the old islands/Nav.tsx (new)
    │   ├── BaseLayout.astro    # official title, OG tags, favicon, navbar (updated)
    │   └── ui/
    │       ├── AppCard.astro       # Clean Light UI application card (new)
    │       ├── Badge.astro         # existing
    │       └── Button.astro        # primary/secondary CTA primitive (new)
    ├── data/
    │   ├── apps.ts                 # typed application entries (new)
    │   └── navigation.ts           # Ecosistema/#apps + Local-First/#manifesto (updated)
    └── types/
        └── index.ts                # add Application type (updated)
```

**Structure Decision**: Reuse the scaffold's folder contract from `code-rules.md`. Navigation is a
static `.astro` section (not a hydrated island) to preserve the zero-JS default; application data
is typed content in `src/shared/data/` and rendered by an `AppsGrid` section composed of `AppCard`
primitives. `BaseLayout` gains the official default title, brand OG tags, and the shared navbar.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No violations; this section is intentionally empty.
