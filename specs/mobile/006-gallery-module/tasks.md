---

description: "Task list for Mobile Gallery Module"
---

# Tasks: Mobile Gallery Module

**Input**: Design documents from `/specs/mobile/006-gallery-module/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/`, `quickstart.md`

**Tests**: Included because the plan/quickstart define pure helper tests for URL validation, categories and normalization.

**Organization**: Tasks are grouped by user story so each story remains independently testable.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Parallelizable (different files, no incomplete dependency)
- **[Story]**: `US1`, `US2`, `US3`
- Every task includes an exact file path

## Path Conventions

- Mobile app root: `apps/mobile/`
- Routes: `apps/mobile/app/(drawer)/`
- Module code: `apps/mobile/src/modules/gallery/`
- Shared code: `apps/mobile/src/shared/`

---

## Phase 1: Setup

**Purpose**: Confirm contracts and create the GraphQL document.

- [X] T001 Confirm `gallery`, `addGalleryItem` and `removeGalleryItem` exist in `apps/mobile/codegen.schema.gql`.
- [X] T002 Confirm the `GalleryPhoto` fields in `packages/database/prisma/schema.prisma`.
- [X] T003 Create `apps/mobile/src/modules/gallery/gallery.graphql` with the gallery query, add mutation and remove mutation.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared models, helpers and data layer for all gallery stories.

- [X] T004 [P] Create gallery category constants/labels (`local`, `trabajos`, `equipo`) in `apps/mobile/src/modules/gallery/categories.ts`.
- [X] T005 [P] Create `apps/mobile/src/modules/gallery/gallery-form.ts` with URL validation, optional-field normalization and draft mapping.
- [X] T006 Create `apps/mobile/src/modules/gallery/services.ts` using generated documents for fetch, add and remove.
- [X] T007 Create `apps/mobile/src/modules/gallery/hooks.ts` with `useGallery`, `useAddGalleryItem` and `useRemoveGalleryItem`, invalidating `['gallery', tenantId]`.
- [X] T008 [P] Add helper tests in `apps/mobile/src/modules/gallery/__tests__/gallery-form.test.ts`.

**Checkpoint**: Data layer and helpers ready.

---

## Phase 3: User Story 1 — Consultar la galería (Priority: P1) 🎯 MVP

**Goal**: Replace the placeholder with a real tenant gallery.

**Independent Test**: Open Galería with and without photos; confirm loading, empty, error, refresh and photo rendering.

### Implementation for User Story 1

- [X] T009 [P] [US1] Create `apps/mobile/src/modules/gallery/components/GalleryPhotoCard.tsx` with image, optional metadata, broken-image fallback and delete action prop.
- [X] T010 [US1] Create `apps/mobile/src/modules/gallery/GalleryView.tsx` with initial loading, empty state, error/retry, pull-to-refresh, refresh overlay and add button.
- [X] T011 [US1] Replace the placeholder in `apps/mobile/app/(drawer)/galeria.tsx` with `GalleryView`.
- [X] T012 [US1] Ensure the gallery query uses the authenticated `tenantId` and renders only tenant photos.

**Checkpoint**: Gallery listing, loading, empty and error states work independently. MVP complete.

---

## Phase 4: User Story 2 — Añadir una foto (Priority: P2)

**Goal**: Add photos via upload or URL with optional metadata.

**Independent Test**: Add a photo by upload and by URL; confirm validation and persistence.

### Implementation for User Story 2

- [X] T013 [P] [US2] Create `apps/mobile/src/modules/gallery/components/GalleryPhotoFormModal.tsx` with safe-area-aware layout and close action.
- [X] T014 [US2] Add image upload using `pickAndUploadTenantImage(tenantId, 'gallery')` and a manual URL field.
- [X] T015 [US2] Add title, description and category selection using `categories.ts`.
- [X] T016 [US2] Wire `useAddGalleryItem`, URL validation, pending state, error feedback and query invalidation.
- [X] T017 [US2] Reset the form on close and remount it per open session to avoid stale drafts.

**Checkpoint**: A user can add a photo and see it in the gallery.

---

## Phase 5: User Story 3 — Eliminar una foto (Priority: P3)

**Goal**: Remove photos safely with confirmation.

**Independent Test**: Delete a photo, confirm the dialog and verify it disappears; simulate failure and verify it remains.

### Implementation for User Story 3

- [X] T018 [US3] Wire `GalleryPhotoCard` delete action to `Alert` confirmation in `apps/mobile/src/modules/gallery/GalleryView.tsx`.
- [X] T019 [US3] Call `useRemoveGalleryItem`, show pending state, handle errors and invalidate the gallery query.
- [X] T020 [US3] Disable destructive/edit interactions while a deletion is pending.

**Checkpoint**: Create and delete flows work independently and together.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [X] T021 [P] Verify optional metadata empty strings map to `null` and categories match the closed set in `apps/mobile/src/modules/gallery/gallery-form.ts`.
- [X] T022 [P] Verify broken image URLs show a fallback without breaking the grid in `apps/mobile/src/modules/gallery/components/GalleryPhotoCard.tsx`.
- [X] T023 Run `pnpm --filter @foundly/mobile typecheck` for `apps/mobile`.
- [X] T024 Run `pnpm --filter @foundly/mobile lint` for `apps/mobile`.
- [X] T025 Run `pnpm --filter @foundly/mobile test` for `apps/mobile`.
- [X] T026 Run `pnpm --filter @foundly/mobile build` for `apps/mobile`.
- [X] T027 Execute the manual scenarios in `specs/mobile/006-gallery-module/quickstart.md`.
- [X] T028 Remove any leftover “Próximamente” reference from `apps/mobile/app/(drawer)/galeria.tsx`.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: Depends on T001–T003.
- **US1 (Phase 3)**: Depends on Foundational. MVP.
- **US2 (Phase 4)**: Depends on Foundational; integrates into `GalleryView`.
- **US3 (Phase 5)**: Depends on US1 card/view.
- **Polish (Phase 6)**: Depends on US1–US3.

### User Story Dependencies

- **US1 (P1)**: Independent. Delivers gallery listing.
- **US2 (P2)**: Needs the view container from US1.
- **US3 (P3)**: Needs the photo card from US1.

### Within Each Story

- Helpers/services before hooks.
- Hooks before view wiring.
- Validation before mutation wiring.
- Checkpoint validation before moving to the next story.

---

## Parallel Opportunities

### Foundational

```text
T004 categories.ts
T005 gallery-form.ts
T008 helper tests
```

### User Story 1

```text
T009 GalleryPhotoCard
T010 GalleryView
```

### User Story 2

```text
T013 form modal
T014 upload + URL
T015 metadata fields
```

---

## Parallel Example: Foundational

```bash
Task: "Create apps/mobile/src/modules/gallery/categories.ts"
Task: "Create apps/mobile/src/modules/gallery/gallery-form.ts"
Task: "Add apps/mobile/src/modules/gallery/__tests__/gallery-form.test.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1)

1. Complete Setup + Foundational.
2. Complete US1: gallery list with loading/empty/error/refresh.
3. Validate independently; this removes the placeholder and delivers read-only gallery parity.

### Incremental Delivery

1. Setup + Foundational → data layer ready.
2. US1 → read-only gallery (MVP).
3. US2 → add photos via upload/URL.
4. US3 → delete photos with confirmation.
5. Polish → gates and manual quickstart.

### Parallel Team Strategy

1. One developer completes Setup + Foundational.
2. After Foundation:
   - Developer A: US1 view/list.
   - Developer B: US2 form/add flow.
   - Developer C: US3 delete flow.
3. Converge in `GalleryView` and run polish.

---

## Notes

- [P] tasks touch different files.
- [Story] labels map tasks to spec stories.
- Tests are included because the plan and quickstart define helper tests.
- Do not implement edit or reorder; they are explicitly out of scope.
- Keep colors from `@/shared/theme/tokens` and reuse shared components.


## Completion Notes

- Automated gates passed: typecheck, lint, 64 tests and `expo export` (iOS + Android).
- Device-level quickstart (T027) remains recommended; the build confirms the module bundles correctly.
