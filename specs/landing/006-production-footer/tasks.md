---
description: 'Task list for Production Footer'
---

# Tasks: Production Footer

**Input**: Design documents from `/specs/landing/006-production-footer/`

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

- Single static Astro project at the repository root: `src/`, root config files.
- Paths below follow [plan.md](./plan.md#source-code-repository-root).

---

## Phase 1: Setup (Shared Data)

**Purpose**: Typed footer content shared by the component

- [x] T001 [P] Add `FooterLink` and `FooterColumn` types to `src/shared/types/index.ts`
- [x] T002 Create `src/shared/data/footer.ts` with the three typed columns (Ecosystem derived from `src/shared/data/apps.ts`, Philosophy & Resources, Contact & Social from `src/shared/data/siteConfig.ts`)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The footer shell and its site-wide integration

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T003 Create `src/shared/components/Footer.astro` with the semantic `<footer>`, token-based light surface (`bg-surface-elevated/60 border-t border-border-subtle`), a responsive grid container (`grid-cols-1 md:grid-cols-2 lg:grid-cols-4`), and an empty bottom-bar wrapper
- [x] T004 Render `<Footer />` after the page `<slot />` in `src/shared/components/BaseLayout.astro`

**Checkpoint**: Foundation ready — user story implementation can now begin

---

## Phase 3: User Story 1 - Brand attribution on every page (Priority: P1) 🎯 MVP

**Goal**: Every page ends with the Foundly Labs brand and a clear FORGE Labs credit.

**Independent Test**: Open any page and confirm the footer shows the logo, the short brand copy, and
the FORGE Labs credit link opening safely with a subtle hover state.

### Implementation for User Story 1

- [x] T005 [US1] Add the branding column to `src/shared/components/Footer.astro`: the `<Image />` logo (with brand-name fallback), the short brand copy, and the FORGE Labs attribution sentence linking to `https://www.forgelab.lat` with `target="_blank"` and `rel="noopener noreferrer"`
- [x] T006 [US1] Verify the footer renders on `/`, `/privacy`, and `/terms`, that the brand copy and FORGE Labs link are present, and that the link opens in a new tab with a subtle hover state

**Checkpoint**: User Story 1 fully functional and independently testable

---

## Phase 4: User Story 2 - Secondary navigation (Priority: P2)

**Goal**: The footer links to the four applications and to philosophy/resource/contact destinations.

**Independent Test**: From any page, use footer links to reach the applications section and the
manifesto; confirm all four apps and the resource/social links render and resolve.

### Implementation for User Story 2

- [x] T007 [US2] Render the Ecosystem, Philosophy & Resources, and Contact & Social columns from `src/shared/data/footer.ts` in `src/shared/components/Footer.astro`, applying `target="_blank"` + `rel="noopener noreferrer"` to external links and descriptive `aria-label`s to social links
- [x] T008 [US2] Verify the four applications (Foundly Mobile, Foundly POS, LRC-Maker, Mixbit) and the philosophy/resource/social links render and resolve correctly

**Checkpoint**: User Stories 1 and 2 both work independently

---

## Phase 5: User Story 3 - Legal bar and accessible links (Priority: P3)

**Goal**: The bottom bar shows the copyright, and every footer link is safe and accessible.

**Independent Test**: Inspect the bottom bar for the copyright line; tab through the footer and
confirm every link is focusable with a visible focus state and external links are safe.

### Implementation for User Story 3

- [x] T009 [US3] Add the bottom bar content to `src/shared/components/Footer.astro`: top divider plus the line "© 2026 Foundly Labs. Todos los derechos reservados. Powered by FORGE Labs."
- [x] T010 [US3] Verify keyboard focus reaches every footer link with a visible focus indicator, icon/social links have accessible labels, and external links use `rel="noopener noreferrer"`

**Checkpoint**: All user stories independently functional

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final validation across the feature

- [x] T011 Run `npm run check`, `npm run lint`, and `npm run build`; confirm 0 errors/problems and that `dist/index.html` contains a `<footer>` and the `https://www.forgelab.lat` link
- [x] T012 [P] Verify the responsive layout (single column at 320px, up to four columns on desktop) with no horizontal overflow, and confirm the footer adds no executable JavaScript

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational completion
  - US1 → US2 → US3 in priority order (all extend the shared `Footer.astro`)
- **Polish (Phase 6)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: After Foundational — adds the branding column
- **User Story 2 (P2)**: After Foundational — adds the link columns (uses `footer.ts` from Setup)
- **User Story 3 (P3)**: After Foundational — adds the copyright bar and verifies accessibility

### Within Each User Story

- Data/types before components
- Implementation before verification

### Parallel Opportunities

- Setup: T001 alone (T002 depends on it)
- Polish: T012 can run alongside T011

---

## Parallel Example: Polish

```bash
Task: "Run check/lint/build and confirm the footer + forgelab.lat link in dist"
Task: "Verify responsive layout and zero-JS"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: footer on every page with brand + FORGE Labs credit
5. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → footer shell mounted in the layout
2. US1 → branding + attribution (MVP)
3. US2 → ecosystem/resources/social links
4. US3 → copyright bar + accessibility
5. Each story adds value without breaking previous stories

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps a task to a specific user story for traceability
- Tests are not requested; validation is via `npm run check`, `npm run lint`, `npm run build`, and manual checks
- Commit after each task or logical group (use `feat(scope)` per the constitution)
- Footer link content lives in `src/shared/data/footer.ts` (code-rules §5); the component only renders it
- Avoid: vague tasks, same-file conflicts, cross-story dependencies that break independence
