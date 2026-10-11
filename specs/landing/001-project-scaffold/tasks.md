---
description: 'Task list for Project Scaffold & Design System Foundation'
---

# Tasks: Project Scaffold & Design System Foundation

**Input**: Design documents from `/specs/landing/001-project-scaffold/`

**Prerequisites**: [plan.md](./plan.md) (required), [spec.md](./spec.md) (required for user stories), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/)

**Tests**: Not requested in the feature specification. No test tasks are generated; validation is
build-, type-, and lint-based per [quickstart.md](./quickstart.md).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing
of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- Single static Astro project at the repository root: `src/`, `public/`, and root config files.
- Paths below follow [plan.md](./plan.md#source-code-repository-root).

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Initialize project manifest with scripts (`dev`, `build`, `preview`, `check`, `lint`, `format`) and dependencies (`astro@^5`, `@astrojs/react`, `react`, `react-dom`, `tailwindcss@^4`, `@tailwindcss/vite`, `zod`) in `package.json`
- [x] T002 [P] Configure Astro (React integration, `@tailwindcss/vite` plugin, `site` URL) in `astro.config.mjs`
- [x] T003 [P] Configure strict TypeScript (`astro/tsconfigs/strict`) with `baseUrl` and `"@/*": ["./src/*"]` in `tsconfig.json`
- [x] T004 [P] Configure ESLint and Prettier in `eslint.config.js` and `.prettierrc`
- [x] T005 [P] Update `.gitignore` to exclude `node_modules/`, `dist/`, and `.astro/`
- [x] T006 Create the source and public folder structure (`src/assets/`, `src/shared/components/ui/`, `src/modules/<modulo>/components/`, `src/modules/<modulo>/islands/`, `src/content/`, `src/shared/data/`, `src/shared/components/`, `src/pages/`, `src/styles/`, `src/shared/types/`, `src/shared/utils/`, `public/fonts/`) with `.gitkeep` placeholders
- [x] T007 [P] Add the default favicon at `public/favicon.svg`
- [x] T008 Install dependencies with `npm install` and verify the baseline `npm run check` (astro check) exits cleanly

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T009 Create the Tailwind entry stylesheet `src/styles/global.css` with `@import "tailwindcss";` and a `@config "../../tailwind.config.mjs";` reference
- [x] T010 [P] Create the Tailwind v4 compatibility config in `tailwind.config.mjs` (content globs for `./src/**/*.{astro,html,ts,tsx}` and an empty plugin list)
- [x] T011 [P] Define shared TypeScript types (`SiteConfig`, `SocialLink`, `NavItem`) in `src/shared/types/index.ts` per [data-model.md](./data-model.md)
- [x] T012 [P] Create static navigation constants in `src/shared/data/navigation.ts`
- [x] T013 Define content collections and Zod schemas (`pricing`, `faqs`, `features`) in `src/content.config.ts` per [contracts/content-collections.contract.md](./contracts/content-collections.contract.md)
- [x] T014 [P] Create integer-cent currency formatters in `src/shared/utils/formatters.ts`
- [x] T015 [P] Create the analytics helper stub in `src/shared/utils/analytics.ts`
- [x] T016 Create the minimal `BaseLayout` shell (imports `src/styles/global.css`, `<html lang="es">`, `<head>` with charset/viewport, `<body>` with `<slot />`) in `src/shared/components/BaseLayout.astro`

**Checkpoint**: Foundation ready — user story implementation can now begin

---

## Phase 3: User Story 1 - Ready-to-run project foundation (Priority: P1) 🎯 MVP

**Goal**: The project installs, runs, and builds to static output cleanly, and files placed in any
agreed folder are resolved without extra configuration.

**Independent Test**: Run `npm run dev` and confirm a page renders without errors; run
`npm run build` and confirm static output with zero errors/warnings; add a file in each agreed
folder and confirm it is resolved.

### Implementation for User Story 1

- [x] T017 [US1] Create the home page `src/pages/index.astro` using `src/shared/components/BaseLayout.astro`
- [x] T018 [P] [US1] Create the placeholder page `src/pages/privacy.astro`
- [x] T019 [P] [US1] Create the placeholder page `src/pages/terms.astro`
- [x] T020 [P] [US1] Create a representative static UI primitive `src/shared/components/ui/Badge.astro`
- [x] T021 [US1] Create a representative server section `src/modules/home/components/Hero.astro` (no client JS)
- [x] T022 [P] [US1] Create a representative interactive island `src/modules/<modulo>/islands/Nav.tsx` (React, no hydration directive yet)
- [x] T023 [US1] Verify `npm run dev` renders `/`, `/privacy`, and `/terms`, and `npm run build` produces static output with zero errors and zero warnings

**Checkpoint**: User Story 1 fully functional and independently testable

---

## Phase 4: User Story 2 - Consistent, brand-aligned design tokens (Priority: P2)

**Goal**: The full Clean Light UI palette is exposed as named tokens and consumed by components
with no hardcoded brand colors.

**Independent Test**: Reference each token from a sample component and confirm it resolves to the
specified value; scan components and confirm zero literal brand hex values.

### Implementation for User Story 2

- [x] T024 [US2] Declare the Clean Light UI palette with Tailwind v4 `@theme` in `src/styles/tokens.css` per [contracts/design-tokens.contract.md](./contracts/design-tokens.contract.md)
- [x] T025 [US2] Import the token layer from `src/styles/global.css` (`@import "./tokens.css";`)
- [x] T026 [P] [US2] Refactor `src/shared/components/ui/Badge.astro` and `src/modules/home/components/Hero.astro` to use token utilities only (remove any literal brand hex values)
- [x] T027 [US2] Verify each token resolves (sample markup) and confirm no inline brand colors remain in `src/**`

**Checkpoint**: User Story 2 fully functional and independently testable

---

## Phase 5: User Story 3 - SEO-ready, shareable base layout (Priority: P3)

**Goal**: Every page renders through a base layout with default metadata, per-page overrides, and
preloaded self-hosted fonts.

**Independent Test**: Render a page through the base layout and inspect the HTML for language,
title, description, canonical, Open Graph, Twitter card, and favicon; pass page-level props and
confirm they override defaults.

### Implementation for User Story 3

- [x] T028 [US3] Create the central site configuration (`name: "Foundly Labs"`, `description`, `url`, `social`) in `src/shared/data/siteConfig.ts` per [contracts/site-config.contract.md](./contracts/site-config.contract.md)
- [x] T029 [US3] Extend `src/shared/components/BaseLayout.astro` with typed `Props` (`title`, `description`, `image`, `canonical`) and SEO metadata (canonical, Open Graph, Twitter card, favicon), falling back to `src/shared/data/siteConfig.ts`
- [x] T030 [P] [US3] Add a self-hosted `@fontsource-variable/*` font imported by the layout and emit preload links for above-the-fold fonts
- [x] T031 [US3] Wire per-page `title`/`description` props in `src/pages/index.astro`, `src/pages/privacy.astro`, and `src/pages/terms.astro`
- [x] T032 [US3] Verify built HTML contains `lang="es"`, title, description, canonical, Open Graph, Twitter card, favicon, and font preload links, and that page-level values override defaults

**Checkpoint**: All user stories independently functional

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T033 [P] Document setup, run, and validation steps in `README.md` (link the quickstart)
- [x] T034 Run the [quickstart.md](./quickstart.md) validation end-to-end (build, `astro check`, lint, and Lighthouse desktop/mobile)
- [x] T035 [P] Add an ESLint `no-restricted-syntax` rule to flag literal brand hex values in `src/**` in `eslint.config.js`
- [x] T036 Verify constitution and `code-rules.md` compliance (SDD traceability, static-first/zero-JS, strict typing, tokens-only colors)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational completion
  - Can proceed in parallel (if staffed) or sequentially in priority order (P1 → P2 → P3)
- **Polish (Phase 6)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: After Foundational — no dependencies on other stories
- **User Story 2 (P2)**: After Foundational — refactors US1 sample components but is independently testable
- **User Story 3 (P3)**: After Foundational — enhances the Foundational `BaseLayout` shell and US1 pages, independently testable

### Within Each User Story

- Shared types/data before consuming components
- Components before pages that compose them
- Implementation before verification

### Parallel Opportunities

- Setup: T002, T003, T004, T005, T007 in parallel
- Foundational: T010, T011, T012, T014, T015 in parallel
- US1: T018, T019, T020, T022 in parallel
- US2: T026 alone; T024/T025 sequential (same file as T024's import)
- US3: T030 in parallel with T028→T029

---

## Parallel Example: User Story 1

```bash
# Launch the independent US1 files together:
Task: "Create src/pages/privacy.astro"
Task: "Create src/pages/terms.astro"
Task: "Create src/shared/components/ui/Badge.astro"
Task: "Create src/modules/<modulo>/islands/Nav.tsx"
```

## Parallel Example: Foundational

```bash
# Launch independent foundational files together:
Task: "Create tailwind.config.mjs"
Task: "Define shared types in src/shared/types/index.ts"
Task: "Create src/shared/data/navigation.ts"
Task: "Create src/shared/utils/formatters.ts"
Task: "Create src/shared/utils/analytics.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: confirm dev + clean build
5. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → foundation ready
2. US1 → ready-to-run static site (MVP)
3. US2 → brand tokens applied
4. US3 → SEO metadata + fonts
5. Each story adds value without breaking previous stories

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps a task to a specific user story for traceability
- Tests are not requested; validation is via `npm run check`, `npm run build`, lint, and Lighthouse
- Commit after each task or logical group (use `feat(scope)` per the constitution)
- Stop at any checkpoint to validate a story independently
- Avoid: vague tasks, same-file conflicts, cross-story dependencies that break independence
