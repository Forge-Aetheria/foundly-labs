# Implementation Plan: Foundly Book — Brand Canvas & Visual Coherence

**Branch**: `004-book-brand-canvas` | **Date**: 2026-10-10 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/book/004-book-brand-canvas/spec.md`

**Note**: Produced after the change was executed; documents the implemented approach and design artifacts for the `book` domain feature.

## Summary

Give `apps/book` one continuous lavender/violet brand canvas, aligned with the global landing, applied at
the **root layout** so all four surfaces (product page `/`, onboarding `/onboarding`, admin `/admin/*` and
public portal `/[tenantSlug]`) share it. **`apps/landing` (Astro) is the design canon**: the book canvas
replicates its exact gradient (`#C8B6FF → #D8B4FE` → white), header glass at 70%, card glassmorphism at
60% and the landing's exact pill/button style. The canvas is a book-local extension of the Clean Light UI
tokens (`constitution.md` §6.I): `--book-gradient-*` plus `--book-glass`/`--book-glass-card` and a
`.book-app-canvas` class composed from the shared `--bg-app-body` surface.

To replicate glass surfaces without changing workspace defaults, `@foundly/ui` `Card` and `Button` gain an
additive, non-breaking `sx` prop; the product page uses it to mirror the landing. The product page loses
its opaque white header and its hard hero→cards cut; the admin shell stops painting an opaque full-screen
background so the onboarding identity finally reaches `/admin`. Cards on the product page are translucent
(glass), while the workspace keeps its solid white surfaces for data/forms.

## Technical Context

**Language/Version**: TypeScript (strict), React 19, Next.js App Router (current stable)

**Primary Dependencies**: `@foundly/ui` (workspace, MUI v6) — tokens (`tokens.css`, `palette.surface.glass`, `--bg-app-body`); no new dependency.

**Storage**: None — presentation-layer change only; the in-memory store seam is untouched.

**Testing**: Vitest + React Testing Library for the existing suite; the canvas is verified via the module build and visual/manual acceptance in `quickstart.md`.

**Target Platform**: Web (server-rendered Next.js module served as the `/book` multi-zone)

**Project Type**: web application module (`apps/book`), styling/refactor

**Performance Goals**: No JS cost — the canvas is pure CSS on `<body>`; `background-attachment: fixed` paints once and does not affect layout.

**Constraints**:

- No brand hex literals in components (ESLint guard); all colors come from `@foundly/ui` tokens or the book-local CSS extension.
- The gradient and glass tokens are a book-local extension; the **values** of `@foundly/ui` tokens and `specs/system-design.md` are NOT modified (only the additive `sx` prop on `Card`/`Button`).
- No route, data, or behaviour change; 100% of existing tests must keep passing.

**Scale/Scope**: One shared canvas across 4 surfaces; 2 shared primitives extended additively (`Card`, `Button`); 2 components modified, 1 new CSS file, 1 layout edit.

## Constitution Check

_GATE: Must pass before implementation. Re-checked after implementation._

Authority hierarchy (Principle 1): `specs/business-model.md` > `constitution.md` > `specs/architecture.md` > `code-rules.md` > specs de dominio.

| Gate                                                                                                    | Source                              | Status |
| ------------------------------------------------------------------------------------------------------- | ----------------------------------- | ------ |
| I. Rule of Law — spec references `specs/business-model.md` (Book §2.3); monorepo boundaries respected   | constitution §1                     | PASS   |
| II. Spec-Driven Development — `spec.md` documents the executed feature                                  | constitution §5.I                   | PASS   |
| III. Server-First & Zero-JS — canvas is pure CSS; no client JS added                                    | constitution §5.II                  | PASS   |
| IV. Strict Typing — no new TS surface; no `any` introduced                                              | constitution §5.IV                  | PASS   |
| V. Performance & Core Web Vitals — CSS-only background, no layout shift, no new JS bundles              | constitution §5.III                 | PASS   |
| VI. Clean Light UI — colors map to tokens; local extension per §6.I; cards keep shared surfaces/shadows | constitution §6, `code-rules.md` §4 | PASS   |
| Specs-by-domain — feature lives in `specs/book/004-book-brand-canvas/`                                  | constitution §2                     | PASS   |
| Packages rules — `@foundly/ui` unchanged; no shared data package                                        | constitution §3.II                  | PASS   |
| Workflow gates — ESLint + type check + build + tests green                                              | constitution §8                     | PASS   |

**Constraints introduced by gates**:

- **C1**: Components keep zero brand hex literals; the gradient lives only in the book-local CSS file.
- **C2**: No shared token/component is modified; `system-design.md` stays as-is.
- **C3**: Opaque full-screen wrappers are removed (product page, admin shell) so the root canvas shows through.

## Project Structure

### Documentation (this feature)

```text
specs/book/004-book-brand-canvas/
├── spec.md              # Feature specification
├── research.md          # Problem context + decisions (Phase 0)
├── plan.md              # This file (/speckit.plan command output)
├── quickstart.md        # Validation guide (Phase 1 output)
├── contracts/           # Phase 1 output
│   └── brand-canvas.contract.md
├── tasks.md             # Phase 2 output (executed, marked complete)
└── checklists/
    └── requirements.md  # Spec quality checklist
```

### Source Code (repository root)

```text
packages/ui/
└── src/components/
    ├── Card/Card.tsx                           # additive sx prop (glassmorphism override)
    ├── Button/Button.tsx                       # additive sx prop (landing pill/glass buttons)
    ├── Card/Card.test.tsx                      # sx forwarding test
    └── Button/Button.test.tsx                  # sx forwarding test

apps/book/
├── src/
│   ├── app/
│   │   ├── globals.css                         # NEW: --book-gradient-* + --book-glass(-card) + .book-app-canvas
│   │   ├── layout.tsx                          # imports ./globals.css; <body className="book-app-canvas">
│   │   ├── components/ProductLanding.tsx       # landing replica: glass header/pills/buttons/cards, no hard cut
│   │   └── admin/components/AdminShell.tsx     # full-screen opaque background removed
```

**Structure Decision**: The canvas belongs at the root layout (single source of truth, SRP). Individual
wrappers stop painting opaque backgrounds; the only opaque surfaces that remain are intentional panels
(the white sidebar, workspace cards) so they pop over the lavender canvas (SC-002/SC-004). The Astro
landing is the design canon and its values/compositions are mirrored 1:1 in the book-local tokens.

## Complexity Tracking

> No constitution violations to justify.

| Violation | Why Needed | Simpler Alternative Rejected Because |
| --------- | ---------- | ------------------------------------ |
| —         | —          | —                                    |
