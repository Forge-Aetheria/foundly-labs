---
description: 'Task list for Production Copy & Branded Assets for the Apps Dataset'
---

# Tasks: Production Copy & Branded Assets for the Apps Dataset

**Input**: Design documents from `/specs/landing/003-real-apps-data/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/, quickstart.md

**Tests**: No automated test framework is in scope for this feature. Validation is performed with the project quality gates (`npm run check`, `npm run lint`, `npm run build`) and the manual scenarios in `quickstart.md`. No test tasks are generated.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- Single static-site project: `src/`, `public/` at repository root.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm the working environment and existing assets before editing.

- [x] T001 Confirm the working branch/feature directory is `003-real-apps-data` and dependencies are installed (`node_modules/` present); verify existing asset folders `public/foundly-finance/`, `public/foundly-pos/` and `public/foundly-maker/` each contain `branding-logo.png` and `icon.png`.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Extend the data contract that every user story depends on.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T002 Extend the `Application` interface in `src/shared/types/index.ts` with explicit, non-optional fields `headline: string`, `subheadline: string`, `keyFeature: string`, `logo: string`, `icon: string` (keep existing `id`, `name`, `category`, `status`, `target`, `description`). Per contract `contracts/apps-data.contract.md`.

**Checkpoint**: The type contract exposes every field used by the four stories.

---

## Phase 3: User Story 1 - Canonical production copy for the ecosystem (Priority: P1) 🎯 MVP

**Goal**: The canonical dataset and the ecosystem cards present the final production headline, subheadline, "what it solves" description and key feature for all four products.

**Independent Test**: Inspect `src/shared/data/apps.ts` and the rendered ecosystem section; each of the four cards shows its production headline, subheadline, description and key feature matching spec FR-002–FR-005 exactly.

### Implementation for User Story 1

- [x] T003 [US1] Set the Foundly record copy (`headline`, `subheadline`, `description`, `keyFeature`) in `src/shared/data/apps.ts` per spec FR-002.
- [x] T004 [US1] Set the Foundly POS record copy in `src/shared/data/apps.ts` per spec FR-003.
- [x] T005 [US1] Set the Mixbit record copy in `src/shared/data/apps.ts` per spec FR-004.
- [x] T006 [US1] Rename the LRC-Maker record to `name: "Foundly Maker"` (id `foundly-maker`) and set its copy in `src/shared/data/apps.ts` per spec FR-005 and research R6.
- [x] T007 [US1] Update `src/shared/components/ui/AppCard.astro` to render `headline`, `subheadline`, `description` and `keyFeature` from the canonical `app` prop (no hard-coded copy), keeping name as an `h3` and the category badge.

**Checkpoint**: User Story 1 is fully functional and testable independently (copy renders from the dataset).

---

## Phase 4: User Story 2 - Strictly typed, canonical dataset (Priority: P2)

**Goal**: Every product record satisfies the strict, explicit contract so no field is missing or untyped and the dataset stays the single source of truth.

**Independent Test**: All entries in `src/shared/data/apps.ts` provide every declared field with no `any`/implicit casts, and `npm run check` reports 0 errors and 0 warnings.

### Implementation for User Story 2

- [x] T008 [US2] Audit `src/shared/data/apps.ts` to ensure all four records declare every `Application` field (non-empty) and contain no `any` or implicit `as` casts.
- [x] T009 [US2] Run `npm run check` (`astro check`) and resolve all type errors/warnings to 0.

**Checkpoint**: The typed dataset compiles cleanly and enforces field completeness.

---

## Phase 5: User Story 3 - Branded logo/icon per application card (Priority: P3)

**Goal**: Each product exposes `logo`/`icon` paths and the card header renders the product image with a controlled footprint, transparent-friendly surface and accessible alt text.

**Independent Test**: Each of the four cards renders its own image (icon, falling back to logo) with alt text "Logo de {name}"; the built page references all four product asset paths and no wrong/missing folders.

### Implementation for User Story 3

- [x] T010 [P] [US3] Add the missing Mixbit assets `public/mixbit/branding-logo.png` and `public/mixbit/icon.png` (research R2; required before build).
- [x] T011 [US3] Add `logo` and `icon` public paths to each of the four records in `src/shared/data/apps.ts` using the exact FR-011 values.
- [x] T012 [US3] In `src/shared/components/ui/AppCard.astro`, render the product image in the card header using `src={app.icon || app.logo}`, a fixed footprint (`h-10 w-auto object-contain` or `h-12 w-12 object-contain`) with explicit `width`/`height`, a light token-aligned surface for transparency, and `alt={\`Logo de ${app.name}\`}` (FR-012–FR-015).

**Checkpoint**: All four cards display their own branded image with accessible alt text and no layout shift.

---

## Phase 6: User Story 4 - Card layout stays within Clean Light UI (Priority: P4)

**Goal**: The enriched copy and images render without overflow, clipping or overlap across the responsive grid.

**Independent Test**: Rendering the ecosystem grid from ≈320 px to ≥1280 px shows 1/2/4 columns with no clipped or overlapping content and no image-induced layout shift.

### Implementation for User Story 4

- [x] T013 [US4] Harden `src/shared/components/ui/AppCard.astro` layout so long headline/subheadline/description/keyFeature wrap cleanly (no clipping/overlap) while preserving Clean Light UI tokens (`bg-card-light/*`, `border-border-subtle`, `rounded-2xl`, `shadow-card`).
- [x] T014 [US4] Verify the responsive grid in `src/modules/home/components/AppsGrid.astro` (`grid-cols-1 md:grid-cols-2 lg:grid-cols-4`) keeps cards readable at narrow and wide viewports.

**Checkpoint**: The full ecosystem grid is visually stable and within the Clean Light UI at all breakpoints.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final gates and end-to-end validation across all stories.

- [x] T015 [P] Run `npm run lint` (eslint) and resolve all problems to 0.
- [x] T016 Run `npm run build` and verify `dist/index.html` references all four product asset paths (`/foundly-finance/`, `/foundly-pos/`, `/foundly-maker/`, `/mixbit/`) and that the matching files exist under `dist/`.
- [x] T017 Run the `quickstart.md` validation scenarios A–D (assets resolve, copy verbatim, no overflow/shift, accessibility + zero-JS) and confirm all pass.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately.
- **Foundational (Phase 2)**: Depends on Setup. BLOCKS all user stories (the type contract is required to compile any record edits).
- **User Stories (Phase 3–6)**: All depend on Phase 2. US1 must complete before US3/US4 touch the same `AppCard.astro` rendering; US3's asset fields depend on US1 records existing.
- **Polish (Phase 7)**: Depends on all stories being complete.

### User Story Dependencies

- **US1 (P1)**: After Foundational. No dependency on other stories.
- **US2 (P2)**: After Foundational; audits the data produced by US1 (practically after US1).
- **US3 (P3)**: After Foundational; depends on US1 records and edits the same `AppCard.astro` as US1/US4.
- **US4 (P4)**: After US1 and US3 (same component) to avoid file conflicts.

### Within Each User Story

- Data records before their card rendering.
- US3 assets (T010) can be prepared in parallel with copy work, but T011 depends on records existing.

### Parallel Opportunities

- T010 (adding Mixbit asset files) can run in parallel with any `src/` work since it touches `public/` only.
- T015 (lint) can run anytime after implementation and in parallel with manual review.

---

## Parallel Example: User Story 3

```bash
# Prepare assets in parallel with code work (different files, no dependency):
Task: "Add public/mixbit/branding-logo.png and public/mixbit/icon.png"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup.
2. Complete Phase 2: Foundational (type contract) — blocks everything.
3. Complete Phase 3: User Story 1 (production copy in dataset + card).
4. **STOP and VALIDATE**: Confirm the four cards render the production copy.
5. Deploy/demo if ready.

### Incremental Delivery

1. Setup + Foundational → contract ready.
2. US1 → copy renders → validate (MVP).
3. US2 → strict dataset verified.
4. US3 → branded images render.
5. US4 → layout hardened across breakpoints.
6. Polish → lint/build/quickstart gates.

---

## Notes

- `[P]` tasks = different files, no dependencies.
- `[Story]` label maps each task to its user story for traceability.
- No automated tests are included (not requested); validation is via `quickstart.md` and the project gates.
- Commit after each logical group.
- Avoid editing `src/shared/components/ui/AppCard.astro` from US1, US3 and US4 simultaneously — keep those edits sequential.
