# Implementation Plan: Hero Watermark Animation

**Branch**: `004-hero-watermark-animation` | **Date**: 2026-10-05 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/landing/004-hero-watermark-animation/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command; its definition describes the execution workflow.

## Summary

Add a large, faint, slowly rotating Foundly Labs "F" isotipo as a decorative background layer behind
the Hero heading. The layer is pure CSS (keyframes + transform/opacity), adds no client-side
JavaScript, respects `prefers-reduced-motion`, is isolated from pointer/keyboard input, and is
clipped by the Hero container so it never causes horizontal overflow. Existing Hero content sits
above it unchanged.

## Technical Context

**Language/Version**: TypeScript 5.x (strict), Astro 5.x

**Primary Dependencies**: None new. Reuses `tailwindcss@^4` and the existing brand SVG. No runtime
libraries.

**Storage**: N/A (purely presentational)

**Testing**: `astro check` (types) + ESLint + `astro build` smoke; manual checks for reduced motion,
responsive overflow, and animation smoothness.

**Target Platform**: Static web; modern evergreen browsers.

**Project Type**: Single static Astro project.

**Performance Goals**: Zero added client JS; animation restricted to compositor-friendly properties
(`transform`, `opacity`); retain Lighthouse 100/100 Desktop and ≥98 Mobile for
Performance/Accessibility/SEO.

**Constraints**: Pure CSS animation (no JS); `prefers-reduced-motion` must pause motion;
`pointer-events: none` + excluded from a11y tree; Hero container `overflow-hidden`; colors via
tokens (the SVG carries its own brand gradient).

**Scale/Scope**: One updated component (`src/modules/home/components/Hero.astro`) plus one new SVG
asset; no data entities.

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| Principle                           | Gate                                                                                       | Pre-Research | Post-Design |
| ----------------------------------- | ------------------------------------------------------------------------------------------ | ------------ | ----------- |
| I. Rule of Law                      | Follows existing component conventions; text uses tokens and heading contrast is preserved | PASS         | PASS        |
| II. Spec-Driven Development         | `specs/landing/004-hero-watermark-animation/spec.md` precedes this plan                    | PASS         | PASS        |
| III. Server-First & Zero-JS Default | Watermark is static markup + CSS keyframes; no `client:*`, no scripts                      | PASS         | PASS        |
| IV. Strict Typing                   | No new types; Hero props already typed; no `any`                                           | PASS         | PASS        |
| V. Performance & Core Web Vitals    | Transform/opacity-only animation; reduced-motion honored; one blurred element only         | PASS         | PASS        |
| VI. Clean Light UI Design System    | Very low-opacity brand isotipo; heading/subtitle keep token colors and contrast            | PASS         | PASS        |

**Result**: No violations. Complexity Tracking is not required.

## Project Structure

### Documentation (this feature)

```text
specs/landing/004-hero-watermark-animation/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
├── checklists/
│   └── requirements.md  # Created by /speckit.specify
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

There is no `data-model.md`: this feature has no data entities (it is purely presentational).

### Source Code (repository root)

```text
src/
├── assets/
│   └── icon-fl.png             # Official "F" isotipo raster used by the watermark (moved from public/)
└── modules/<modulo>/components/
    └── Hero.astro              # Add watermark layer + scoped CSS keyframes (updated)
```

**Structure Decision**: Keep the change local to the Hero section. The isotipo is added under
`src/assets/` so it can be imported and rendered consistently with the project's image rules, while
the motion lives in a scoped component `<style>` block. No shared/global CSS changes are needed.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No violations; this section is intentionally empty.
