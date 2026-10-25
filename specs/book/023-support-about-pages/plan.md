# Implementation Plan: Book Support and About Pages

**Branch**: `023-support-about-pages` | **Date**: 2026-10-25 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/book/023-support-about-pages/spec.md`

## Summary

Replace the two remaining Book admin placeholders with static informational views: Support (intro, FAQ, contact channels) and About (Foundly branding, panel version, product description, legal/institutional links). Both live inside the existing AdminShell.

## Technical Context

**Language/Version**: TypeScript 5.9 strict, React 19, Next.js 15 App Router.

**Primary Dependencies**: `@foundly/ui` (`Card`, `Stack`, `Typography`, `Button`), MUI primitives/icons, `next/image`.

**Storage**: None.

**Testing**: Vitest + Testing Library; content/link helper tests if applicable.

**Target Platform**: Web (responsive admin).

**Project Type**: Next.js SaaS admin inside the pnpm/Turborepo monorepo.

**Performance Goals**: Static pages render instantly; no client data fetching.

**Constraints**: Thin routes, module views, reuse design system, accessible external links.

**Scale/Scope**: Two static admin pages; no API.

## Constitution Check

| Gate | Status | Evidence |
| ---- | ------ | -------- |
| SDD and governance | PASS | Spec and references present. |
| Book domain spec location | PASS | `specs/book/023-support-about-pages/`. |
| Server-first / client boundary | PASS | Static content; interactive FAQ only if needed. |
| Design system | PASS | `@foundly/ui` + MUI tokens. |
| Thin routes | PASS | `/admin/soporte` and `/admin/acerca` render module views. |
| Verification | PASS | Typecheck, lint, tests and build planned. |

## Project Structure

```text
specs/book/023-support-about-pages/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/support-about-ui.contract.md
├── checklists/requirements.md
└── tasks.md

apps/book/src/
├── app/admin/soporte/page.tsx
├── app/admin/acerca/page.tsx
└── modules/
    ├── support/
    │   ├── SupportView.tsx
    │   └── support-content.ts
    └── about/
        ├── AboutView.tsx
        └── about-content.ts
```

## Risks and Mitigations

| Risk | Mitigation |
| ---- | ---------- |
| External link errors | Use anchors/Next Link with safe external URLs. |
| Version drift | Central constant with fallback. |
| Long content breaking layout | Responsive Stack/Card and scrollable page. |
| Duplicating mobile content | Keep Book-specific copy/content; reuse public URLs. |

## Complexity Tracking

No violations.
