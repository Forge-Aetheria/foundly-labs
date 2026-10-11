---
description: 'Task list for Branding Integration & Apps Grid'
---

# Tasks: Branding Integration & Apps Grid

**Input**: Design documents from `/specs/landing/002-branding-apps-grid/`

**Prerequisites**: [plan.md](./plan.md) (required), [spec.md](./spec.md) (required for user stories), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/)

**Tests**: Not requested in the feature specification. No test tasks are generated; validation is
build-, type-, lint-, and manual-check based per [quickstart.md](./quickstart.md).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing
of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- Single static Astro project at the repository root: `public/`, `src/`, root config files.
- Paths below follow [plan.md](./plan.md#source-code-repository-root).

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prepare the brand assets used across the feature

- [x] T001 Move the full logo from `public/branding-logo-fl.png` to `src/assets/branding-logo-fl.png` and confirm it can be imported (remove the `public/` copy)
- [x] T002 [P] Verify `public/favicon.svg` renders the F isotipo; if not, regenerate it from `src/assets/icon-fl.png`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared types and configuration required by the user stories

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T003 [P] Add the `Application` interface and a `defaultTitle` field on `SiteConfig` in `src/shared/types/index.ts`
- [x] T004 [P] Set `defaultTitle` to `"Foundly Labs | Local-First Software Ecosystem"` in `src/shared/data/siteConfig.ts`

**Checkpoint**: Foundation ready — user story implementation can now begin

---

## Phase 3: User Story 1 - Brand identity and navigation (Priority: P1) 🎯 MVP

**Goal**: The site presents the isotipo favicon, the official title and Open Graph tags, a full-logo
navbar, and working "Ecosistema"/"Local-First" links that reach the section anchors.

**Independent Test**: Load any page and confirm the favicon and official title; inspect the navbar
logo; click both nav links and confirm they reach the `#apps` and `#manifesto` sections.

### Implementation for User Story 1

- [x] T005 [US1] Update `src/shared/data/navigation.ts` to the entries Inicio (`/`), Ecosistema (`/#apps`), and Local-First (`/#manifesto`)
- [x] T006 [US1] Create `src/shared/components/Navbar.astro` with the full logo via `<Image />` (alt "Foundly Labs"), a CSS-only mobile disclosure, and links sourced from `src/shared/data/navigation.ts`
- [x] T007 [US1] Update `src/shared/components/BaseLayout.astro` to use `siteConfig.defaultTitle` as the default title (compose `${title} · ${siteConfig.defaultTitle}` when a page title is given), set the brand Open Graph tags with the logo asset as default `og:image`, and mount `<Navbar />`
- [x] T008 [US1] Remove the unused sample island `src/modules/<modulo>/islands/Nav.tsx`
- [x] T009 [US1] Create the anchor section shells `src/modules/home/components/AppsGrid.astro` (`id="apps"`) and `src/modules/home/components/Manifesto.astro` (`id="manifesto"`), and compose them into `src/pages/index.astro`
- [x] T010 [US1] Verify the favicon, official title, Open Graph tags, navbar logo, and that both nav links reach `#apps`/`#manifesto` (including with JavaScript disabled)

**Checkpoint**: User Story 1 fully functional and independently testable

---

## Phase 4: User Story 2 - Discover the ecosystem applications (Priority: P2)

**Goal**: The applications section shows four Clean Light UI cards with the specified data in a
responsive grid.

**Independent Test**: Render the home page and confirm four cards with the exact content, in one
column on small screens, two columns from the medium breakpoint, and four from the large breakpoint.

### Implementation for User Story 2

- [x] T011 [P] [US2] Create `src/shared/data/apps.ts` with the four typed `Application` records (Foundly, Foundly POS, LRC-Maker, Mixbit) per [data-model.md](./data-model.md)
- [x] T012 [P] [US2] Create `src/shared/components/ui/AppCard.astro` rendering `name`, `category`, `status`, `target`, and `description` with `bg-card-light/60 backdrop-blur-md border border-border-subtle rounded-2xl shadow-card`
- [x] T013 [US2] Render the four `AppCard`s inside `src/modules/home/components/AppsGrid.astro` using `grid-cols-1 md:grid-cols-2 lg:grid-cols-4`, with the `id="apps"` anchor and a section heading preserved
- [x] T014 [US2] Verify four cards render with the exact category, status, target, and description values, and that the grid is 1 column on small screens, 2 at `md`, and 4 at `lg`

**Checkpoint**: User Stories 1 and 2 both work independently

---

## Phase 5: User Story 3 - Hero calls to action (Priority: P3)

**Goal**: The Hero keeps its tagline/subtitle and adds two centered CTAs to the apps and manifesto
sections.

**Independent Test**: From the home Hero, confirm the two buttons are centered and each navigates
to its anchor.

### Implementation for User Story 3

- [x] T015 [P] [US3] Create `src/shared/components/ui/Button.astro` (anchor-based `primary`/`secondary` variants using design tokens)
- [x] T016 [US3] Add two centered CTA buttons to `src/modules/home/components/Hero.astro`: "Explorar Ecosistema" (primary → `#apps`) and "¿Por qué Local-First?" (secondary → `#manifesto`), keeping the tagline and subtitle
- [x] T017 [US3] Verify the tagline/subtitle are unchanged, both CTAs reach their anchors, and keyboard focus is visible

**Checkpoint**: All user stories independently functional

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T018 [P] Update `README.md` to mention the navbar, applications grid, and section anchors
- [x] T019 Run the [quickstart.md](./quickstart.md) automated gates (`npm run check`, `npm run lint`, `npm run build`) and confirm 0 errors/warnings
- [x] T020 [P] Confirm no literal brand hex values exist in `src/**` and complete the quickstart accessibility/no-JS checks
- [x] T021 Run Lighthouse against the built site and confirm the Performance, Accessibility, and SEO targets

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational completion
  - US1 → US2 → US3 in priority order (the anchors created in US1 are the targets used by US2 and US3)
- **Polish (Phase 6)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: After Foundational — no dependencies; creates the `#apps`/`#manifesto` anchors
- **User Story 2 (P2)**: After US1 — fills the `#apps` shell created in T009 (its content is independent)
- **User Story 3 (P3)**: After US1 — links to the `#manifesto`/`#apps` anchors created in T009

### Within Each User Story

- Data/types before components
- Components before the section that composes them
- Implementation before verification

### Parallel Opportunities

- Setup: T002 alone (T001 is sequential)
- Foundational: T003, T004 in parallel
- US2: T011, T012 in parallel
- US3: T015 alone (T016 depends on it)
- Polish: T018, T020 in parallel

---

## Parallel Example: User Story 2

```bash
# Launch independent US2 files together:
Task: "Create src/shared/data/apps.ts with the four typed Application records"
Task: "Create src/shared/components/ui/AppCard.astro"
```

## Parallel Example: Foundational

```bash
Task: "Add Application interface and defaultTitle in src/shared/types/index.ts"
Task: "Set defaultTitle in src/shared/data/siteConfig.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: favicon, title, OG, navbar, and both nav anchors
5. Deploy/demo if ready (the apps section is an empty shell at this point)

### Incremental Delivery

1. Setup + Foundational → assets and types ready
2. US1 → brand identity + navigation (MVP)
3. US2 → applications grid filled
4. US3 → Hero CTAs
5. Each story adds value without breaking previous stories

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps a task to a specific user story for traceability
- Tests are not requested; validation is via `npm run check`, `npm run lint`, `npm run build`, and manual checks
- Commit after each task or logical group (use `feat(scope)` per the constitution)
- The `#apps`/`#manifesto` shells created in US1 are filled/used by US2 and US3
- Revision: US2 was updated from three placeholders (POS/Finance/Core) to the four real projects
  (Foundly, Foundly POS, LRC-Maker, Mixbit) with a `1/2/4` responsive grid
- Avoid: vague tasks, same-file conflicts, cross-story dependencies that break independence
