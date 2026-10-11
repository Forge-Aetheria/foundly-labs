---
description: 'Task list for Hero Watermark Animation'
---

# Tasks: Hero Watermark Animation

**Input**: Design documents from `/specs/landing/004-hero-watermark-animation/`

**Prerequisites**: [plan.md](./plan.md) (required), [spec.md](./spec.md) (required for user stories), [research.md](./research.md), [contracts/](./contracts/)

**Tests**: Not requested in the feature specification. No test tasks are generated; validation is
build-, type-, lint-, and manual-check based per [quickstart.md](./quickstart.md).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing
of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- Single static Astro project at the repository root: `src/`, root config files.
- Paths below follow [plan.md](./plan.md#source-code-repository-root).

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Provide the vector asset used by the watermark

- [x] T001 Use the official isotipo raster `src/assets/icon-fl.png` (moved from `public/`) as the watermark asset

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Prepare the Hero so a decorative layer can be positioned and clipped

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T002 In `src/modules/home/components/Hero.astro`, add `relative overflow-hidden` to the Hero `<section>` and wrap the existing content (badge, heading, subtitle, CTAs) in a `relative z-10` container

**Checkpoint**: Foundation ready — user story implementation can now begin

---

## Phase 3: User Story 1 - Subtle brand watermark behind the Hero (Priority: P1) 🎯 MVP

**Goal**: A large, faint, blurred isotipo sits centered behind the Hero heading without harming
readability or capturing interaction.

**Independent Test**: Load the home page; confirm the faint isotipo is centered behind the heading,
the heading/subtitle stay legible, and hovering/clicking/tabbing never hits the watermark.

### Implementation for User Story 1

- [x] T003 [US1] Add the decorative watermark container as the first child of the Hero `<section>` in `src/modules/home/components/Hero.astro`: `pointer-events-none absolute left-1/2 top-1/2 z-0` with `aria-hidden="true"`, rendering the official isotipo `src/assets/icon-fl.png` via `<Image src={iconFl} alt="" />` (`w-[40rem] max-w-none opacity-25 mix-blend-multiply blur-[0.5px]`)
- [x] T004 [US1] Verify the watermark renders behind the heading, the heading/subtitle remain legible, and the layer is not focusable and captures no pointer input

**Checkpoint**: User Story 1 fully functional and independently testable

---

## Phase 4: User Story 2 - Elegant continuous motion (Priority: P2)

**Goal**: The watermark sways side to side in 3D continuously and slowly, with no added JavaScript.

**Independent Test**: Watch the Hero and confirm a smooth 3D side-to-side sway with a full cycle of
about 12 seconds; confirm no client JS was added.

### Implementation for User Story 2

- [x] T005 [US2] Add a scoped `<style>` block in `src/modules/home/components/Hero.astro` defining `@keyframes y-tilt-spin` (`translate(-50%, -50%) perspective(1000px)` + lateral `rotateY` ±25° + counter `rotateX` ±5°) and apply `animation: y-tilt-spin 12s ease-in-out infinite` to the watermark container
- [x] T006 [US2] Verify the 3D side-to-side sway is smooth, a full cycle is about 12s, and no client-side JavaScript or `client:*` directive was introduced

**Checkpoint**: User Stories 1 and 2 both work independently

---

## Phase 5: User Story 3 - Accessible and performant motion (Priority: P3)

**Goal**: The motion respects reduced-motion preferences and never causes layout/overflow issues.

**Independent Test**: Enable reduced motion and confirm the watermark stops; resize to 320px and
confirm no horizontal scroll; confirm the layer is excluded from the accessibility tree.

### Implementation for User Story 3

- [x] T007 [US3] Add a `@media (prefers-reduced-motion: reduce)` rule in the Hero scoped `<style>` of `src/modules/home/components/Hero.astro` that disables the animation and keeps the watermark centered and static
- [x] T008 [US3] Verify reduced motion pauses the watermark, there is no horizontal overflow from 320px up, and the decorative layer is hidden from assistive technologies

**Checkpoint**: All user stories independently functional

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final validation across the feature

- [x] T009 Run `npm run check`, `npm run lint`, and `npm run build` and confirm 0 errors/problems and that no `<script>` was added to the Hero output
- [x] T010 [P] Spot-check heading contrast/legibility over the watermark and confirm Lighthouse Performance/Accessibility/SEO remain at target

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational completion
  - US1 → US2 → US3 in priority order (motion builds on the watermark; reduced-motion builds on the animation)
- **Polish (Phase 6)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: After Foundational — no dependencies on other stories
- **User Story 2 (P2)**: After US1 — adds motion to the watermark layer
- **User Story 3 (P3)**: After US2 — adds reduced-motion handling for the animation

### Within Each User Story

- Markup before the verification task
- Style before its verification task

### Parallel Opportunities

- Polish: T010 can run alongside T009

---

## Parallel Example: Polish

```bash
Task: "Run check/lint/build gates"
Task: "Spot-check contrast and Lighthouse targets"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (asset)
2. Complete Phase 2: Foundational (positioning context)
3. Complete Phase 3: User Story 1 (static watermark)
4. **STOP and VALIDATE**: faint, legible, non-interactive watermark
5. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → Hero ready for the layer
2. US1 → static watermark (MVP)
3. US2 → slow motion
4. US3 → reduced-motion + responsive/a11y hardening
5. Each story adds value without breaking previous stories

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps a task to a specific user story for traceability
- Tests are not requested; validation is via `npm run check`, `npm run lint`, `npm run build`, and manual checks
- Commit after each task or logical group (use `feat(scope)` per the constitution)
- The whole feature touches a single component plus one asset, so the stories are naturally sequential
- Avoid: vague tasks, same-file conflicts, cross-story dependencies that break independence
