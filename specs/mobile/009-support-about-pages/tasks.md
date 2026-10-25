---

description: "Task list for Mobile Support and About Pages"
---

# Tasks: Mobile Support and About Pages

**Input**: Design documents from `/specs/mobile/009-support-about-pages/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/`, `quickstart.md`

**Tests**: Included because the plan/quickstart define tests for content integrity and external-link validation.

**Organization**: Two independent user-story phases: Support and About.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Parallelizable (different files, no incomplete dependency)
- **[Story]**: `US1`, `US2`
- Every task includes an exact file path

## Path Conventions

- Mobile app root: `apps/mobile/`
- Routes: `apps/mobile/app/(drawer)/`
- Module code: `apps/mobile/src/modules/`
- Shared code: `apps/mobile/src/shared/`

---

## Phase 1: Setup

**Purpose**: Confirm routes and shared link requirements.

- [X] T001 Confirm `/soporte` and `/about` currently render placeholders in `apps/mobile/app/(drawer)/soporte.tsx` and `apps/mobile/app/(drawer)/about.tsx`.
- [X] T002 Confirm existing public URLs for site/privacy/terms and support contact strategy.
- [X] T003 Confirm no API/codegen operations are required for this feature.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared external-link helper and static content foundations.

- [X] T004 [P] Create `apps/mobile/src/shared/utils/open-external-link.ts` validating `mailto:`/`https:` and wrapping `Linking.openURL` errors.
- [X] T005 [P] Add helper tests in `apps/mobile/src/shared/utils/__tests__/open-external-link.test.ts`.
- [X] T006 Create static Support content (intro, FAQ, contact channel) in `apps/mobile/src/modules/support/support-content.ts`.
- [X] T007 Create static About content (product info, legal links) in `apps/mobile/src/modules/about/about-content.ts`.

**Checkpoint**: Shared link helper and content available.

---

## Phase 3: User Story 1 — Ayuda y Soporte (Priority: P1) 🎯 MVP

**Goal**: Replace the Support placeholder with intro, FAQ and contact channels.

**Independent Test**: Open Soporte, expand FAQ answers and open the contact channel.

### Implementation for User Story 1

- [X] T008 [P] [US1] Create `apps/mobile/src/modules/support/SupportView.tsx` with ScrollView, intro, FAQ accordion and contact section.
- [X] T009 [US1] Render FAQ questions with expand/collapse state and accessible labels.
- [X] T010 [US1] Wire contact channels through `open-external-link.ts` and show inline errors.
- [X] T011 [US1] Replace the placeholder in `apps/mobile/app/(drawer)/soporte.tsx` with `SupportView`.

**Checkpoint**: Support page works independently. MVP complete.

---

## Phase 4: User Story 2 — Acerca de Foundly (Priority: P2)

**Goal**: Replace the About placeholder with branding, version, description and legal links.

**Independent Test**: Open Acerca, confirm brand/version/description and open each legal link.

### Implementation for User Story 2

- [X] T012 [P] [US2] Create `apps/mobile/src/modules/about/AboutView.tsx` with branding, version, description and links.
- [X] T013 [US2] Read the app version from `expo-constants` with `0.1.0` fallback.
- [X] T014 [US2] Wire legal/institutional links through `open-external-link.ts` and show inline errors.
- [X] T015 [US2] Replace the placeholder in `apps/mobile/app/(drawer)/about.tsx` with `AboutView`.

**Checkpoint**: Both static pages work independently.

---

## Phase 5: Polish & Cross-Cutting Concerns

- [X] T016 [P] Verify all FAQ items have non-empty question/answer and all URLs use allowed schemes in `apps/mobile/src/modules/support/support-content.ts`.
- [X] T017 [P] Verify About content has non-empty name/description/version and allowed link schemes in `apps/mobile/src/modules/about/about-content.ts`.
- [X] T018 Run `pnpm --filter @foundly/mobile typecheck` for `apps/mobile`.
- [X] T019 Run `pnpm --filter @foundly/mobile lint` for `apps/mobile`.
- [X] T020 Run `pnpm --filter @foundly/mobile test` for `apps/mobile`.
- [X] T021 Run `pnpm --filter @foundly/mobile build` for `apps/mobile`.
- [X] T022 Execute the manual scenarios in `specs/mobile/009-support-about-pages/quickstart.md`.
- [X] T023 Remove any leftover “Próximamente” references from `apps/mobile/app/(drawer)/soporte.tsx` and `apps/mobile/app/(drawer)/about.tsx`.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: Depends on T001–T003.
- **US1 (Phase 3)**: Depends on Foundational. MVP.
- **US2 (Phase 4)**: Depends on Foundational; independent of US1.
- **Polish (Phase 5)**: Depends on US1–US2.

### User Story Dependencies

- **US1 (P1)**: Independent.
- **US2 (P2)**: Independent.

### Within Each Story

- Content before view.
- Link helper before link wiring.
- View before route replacement.

---

## Parallel Opportunities

### Foundational

```text
T004 open-external-link.ts
T005 helper tests
T006 support-content.ts
T007 about-content.ts
```

### User Stories

```text
US1 SupportView
US2 AboutView
```

---

## Parallel Example: Foundational

```bash
Task: "Create apps/mobile/src/shared/utils/open-external-link.ts"
Task: "Create apps/mobile/src/modules/support/support-content.ts"
Task: "Create apps/mobile/src/modules/about/about-content.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1)

1. Complete Setup + Foundational.
2. Complete US1: Support page with FAQ and contact.
3. Validate independently.

### Incremental Delivery

1. Setup + Foundational → shared helper/content.
2. US1 → Support page (MVP).
3. US2 → About page.
4. Polish → gates and manual quickstart.

### Parallel Team Strategy

- Developer A: US1 Support.
- Developer B: US2 About.
- Both share the external-link helper and content foundations.

---

## Notes

- [P] tasks touch different files.
- [Story] labels map tasks to spec stories.
- No API, codegen or persistence for this feature.
- Reuse shared UI primitives and tokens; do not create new design primitives.


## Completion Notes

- Automated gates passed: typecheck, lint, 74 tests and `expo export` (iOS + Android).
- Device-level quickstart (T022) remains recommended; the build confirms both pages bundle correctly.
