# Implementation Plan: Production Footer

**Branch**: `006-production-footer` | **Date**: 2026-10-05 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/landing/006-production-footer/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command; its definition describes the execution workflow.

## Summary

Add a clean, token-based, zero-JS site footer (`src/shared/components/Footer.astro`) rendered by
`BaseLayout` on every page. It shows the Foundly Labs logo, a short brand line, a prominent FORGE
Labs attribution, three link columns (Ecosystem, Philosophy & Resources, Contact/Social), and a
copyright bar. Link content lives in a typed `src/shared/data/footer.ts` per the code rules.

## Technical Context

**Language/Version**: TypeScript 5.x (strict), Astro 5.x

**Primary Dependencies**: None new. Reuses Tailwind v4 + design tokens, Astro `<Image />`, existing
`siteConfig` and `apps` data.

**Storage**: N/A (static content)

**Testing**: `astro check` + ESLint + `astro build`; manual responsive/keyboard checks.

**Target Platform**: Static hosting / CDN; modern evergreen browsers.

**Project Type**: Single static Astro project.

**Performance Goals**: Zero added client JS; footer is static HTML/CSS only; retain Lighthouse
targets.

**Constraints**: Tokens-only colors (no literal brand hex); no content declared inside the section
component (use `src/shared/data/`); external links must be safe (`target="_blank"` +
`rel="noopener noreferrer"`) with accessible labels.

**Scale/Scope**: One new section component, one new data file, small type additions, and one layout
edit; applies to the 3 public routes.

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| Principle                           | Gate                                                                                                                         | Pre-Research | Post-Design |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | ------------ | ----------- |
| I. Rule of Law                      | Follows `code-rules.md`: content in `src/shared/data/`, component in `src/modules/<modulo>/components/`, token-based styling | PASS         | PASS        |
| II. Spec-Driven Development         | `specs/landing/006-production-footer/spec.md` precedes this plan                                                             | PASS         | PASS        |
| III. Server-First & Zero-JS Default | Static markup only; no `client:*`; hover/focus via CSS                                                                       | PASS         | PASS        |
| IV. Strict Typing                   | `FooterColumn`/`FooterLink` typed; no `any`                                                                                  | PASS         | PASS        |
| V. Performance & Core Web Vitals    | No added JS; local logo through `<Image />`                                                                                  | PASS         | PASS        |
| VI. Clean Light UI Design System    | Uses `bg-surface-elevated`, `border-border-subtle`, text tokens; no magic colors                                             | PASS         | PASS        |

**Result**: No violations. Complexity Tracking is not required.

## Project Structure

### Documentation (this feature)

```text
specs/landing/006-production-footer/
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
src/
└── shared/
    ├── components/
    │   ├── Footer.astro      # Semantic footer: brand, columns, copyright bar   (new)
    │   └── BaseLayout.astro  # Render <Footer /> after the page slot             (updated)
    ├── data/
    │   └── footer.ts         # Typed footer columns/links                        (new)
    └── types/
        └── index.ts          # FooterColumn + FooterLink types                   (updated)
```

**Structure Decision**: Keep the footer as a section component (matching `Navbar.astro`) and
externalize its link content into `src/shared/data/footer.ts`, satisfying the code rule that forbids
declaring content lists inside section components. The footer derives the ecosystem links from the
existing `apps` data and the social links from `siteConfig`.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No violations; this section is intentionally empty.
