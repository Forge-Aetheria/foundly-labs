---
description: "Task list for the Foundly Book gallery management feature"
---

# Tasks: Foundly Book — Gallery Management (Galería)

**Input**: Design documents from `/specs/book/006-gallery-management/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: INCLUDED — the spec explicitly requires the TDD flow with unit + integrated tests at 100% in `@foundly/book` and `@foundly/ui` (spec §Calidad; quickstart validation matrix).

**Organization**: Tasks are grouped by user story (US1–US3) to enable independent implementation and testing.

**Persistence**: Not defined. Panel uses the in-memory store seam; no storage technology may be introduced until ratified in `specs/architecture.md`.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1–US3)
- Include exact file paths in descriptions

## Path Conventions

Single location: `apps/book/` (+ `packages/ui/` suite verification).

---

## Phase 1: Setup

**Purpose**: Confirm the existing workspace/test harness; no new scaffolding is needed (monorepo already wired).

- [x] T001 Verify workspace wiring and test harness for `apps/book` and `packages/ui` (root `npm install`; existing `apps/book/vitest.config.ts`, `packages/ui/vitest.config.ts`, root `eslint.config.js`/`.prettierrc` unchanged).

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The `GalleryPhoto` model, its seeds, public read shape and the photo schema — everything the user stories depend on.

- [x] T002 [P] Add `GalleryCategory = 'local' | 'trabajos' | 'equipo'` and the `GalleryPhoto { id; url; title?; description?; category? }` entity in `apps/book/src/domain/tenancy/types.ts` (pure types, per `data-model.md`).
- [x] T003 [P] Migrate `Tenant.gallery` seeds from `string[]` to `GalleryPhoto[]` (with inferred categories) for `estudio-ana` and `rona-piercing` in `apps/book/src/server/store.ts`.
- [x] T004 [P] Add `PublicGalleryPhoto` in `apps/book/src/features/public-booking/types.ts` and map `Tenant.gallery` → public photos (title + display category label) in `apps/book/src/features/public-booking/queries.ts`.
- [x] T005 [P] Add `galleryPhotoSchema` (url required `z.url()`, title ≤120, description ≤250, category enum optional) in `apps/book/src/features/storefront/schemas.ts`.

**Checkpoint**: model + schema ready; no feature behavior yet.

---

## Phase 3: User Story 1 - Curate the public gallery (Priority: P1) 🎯 MVP

**Goal**: Show the gallery as a visual card grid and add new photos (URL + optional title/category) that appear immediately in the public `#galeria`.

**Independent Test**: In `GalleryManager.test.tsx` + `actions.test.ts`, seed the store, add a photo via the modal, and assert the new card renders and `getPublicBusiness('estudio-ana').gallery` reflects it.

### Tests for User Story 1 (TDD — write FIRST, confirm they fail before implementation) ⚠️

- [x] T006 [P] [US1] Action tests for `addGalleryPhoto` in `apps/book/src/features/storefront/actions.test.ts`: valid URL adds a `GalleryPhoto`, empty/invalid URL → `VALIDATION_ERROR`, duplicate URL → `CONFLICT`, optional title/description/category accepted, public `gallery` reflects the new photo.
- [x] T007 [P] [US1] Component tests in `apps/book/src/features/storefront/components/GalleryManager.test.tsx`: grid renders photo cards with title + category badge; add-modal blocks invalid/empty URL with inline error; successful add refreshes the grid (count +1) and the public gallery.

### Implementation for User Story 1

- [x] T008 [P] [US1] Implement `addGalleryPhoto` in `apps/book/src/features/storefront/actions.ts` (generate `id`, validate schema, reject duplicates with `CONFLICT`, return the tenant gallery).
- [x] T009 [US1] Update `listGallery` to return `GalleryPhoto[]` in `apps/book/src/features/storefront/queries.ts`.
- [x] T010 [US1] Rewrite the gallery grid + add modal in `apps/book/src/features/storefront/components/GalleryManager.tsx`: glassmorphism cards (image, title, category `Badge`), add modal with URL `TextField` (error helperText), title/description fields, category via selectable `Chip` row, pill actions.
- [x] T011 [US1] Update public `ProviderSections#GallerySection` in `apps/book/src/features/public-booking/components/provider/ProviderSections.tsx` to render title + category badges and an empty state.

**Checkpoint**: US1 fully functional and independently testable (MVP).

---

## Phase 4: User Story 2 - Preview and remove photos (Priority: P2)

**Goal**: Lightbox preview and confirmed removal, keeping the admin grid and the public `#galeria` in sync.

**Independent Test**: Component + action tests open the lightbox and remove a photo through the confirmation dialog, asserting the card and `getPublicBusiness(...).gallery` no longer contain it.

### Tests for User Story 2 (TDD — write FIRST) ⚠️

- [x] T012 [P] [US2] Action tests for `removeGalleryPhoto` in `apps/book/src/features/storefront/actions.test.ts`: removes by `id`, unknown id → `NOT_FOUND`, public `gallery` reflects the removal.
- [x] T013 [P] [US2] Component tests in `apps/book/src/features/storefront/components/GalleryManager.test.tsx`: lightbox opens/dismisses; "Quitar foto" requires the `AlertDialog` confirmation and then removes the card + public entry.

### Implementation for User Story 2

- [x] T014 [US2] Implement `removeGalleryPhoto` in `apps/book/src/features/storefront/actions.ts` (remove by `id`, `NOT_FOUND` if absent, return the tenant gallery).
- [x] T015 [US2] Add the lightbox preview (`@foundly/ui` `Modal`) and per-card actions "Ver" / "Quitar foto" with the destructive `AlertDialog` in `apps/book/src/features/storefront/components/GalleryManager.tsx`.

**Checkpoint**: US1 AND US2 work independently.

---

## Phase 5: User Story 3 - Consistent, accessible administration experience (Priority: P3)

**Goal**: The gallery screens reuse the shared design system, pass accessibility checks and are documented.

**Independent Test**: `vitest-axe` over the grid/layout, form modal and lightbox; reviews report zero critical violations; handle and controls reachable by keyboard.

### Implementation for User Story 3

- [x] T016 [US3] Confirm the gallery screens compose `@foundly/ui` only and pass `vitest-axe` (SC-004) in `GalleryManager.test.tsx` and `actions.test.ts`.
- [x] T017 [US3] Document the surface in `contracts/admin-gallery.contract.md`, this `tasks.md`, and cross-reference from `apps/book/README.md`.
- [x] T018 [US3] Run the `quickstart.md` validation matrix: `npm run test -w @foundly/book`, `npm run test -w @foundly/ui`, `npm run build -w @foundly/book`.

**Checkpoint**: all user stories independently functional.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Repo-wide consistency on top of the feature.

- [x] T019 [P] Lint the change set (`npm run lint`) and run `npm run typecheck -w @foundly/book`; fix any report before commit.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: after Setup — BLOCKS all user stories.
- **US1 (P1)**: after Foundational — MVP.
- **US2 (P2)**: after Foundational — may integrate with US1 but independently testable.
- **US3 (P3)**: after Foundational — refines/validates the finished views.
- **Polish (Phase 6)**: after all desired user stories.

### Within Each User Story

- Tests are written FIRST and must FAIL before the implementation task lands (TDD per spec §Calidad).
- Models → actions → components → integration.
- Story complete before moving to the next priority.

### Parallel Opportunities

- All foundational tasks marked [P] (T002–T005) touch different files and run in parallel.
- Test tasks marked [P] (T006, T007, T012, T013) are independent of the implementation tasks they describe (they are written first).
- `addGalleryPhoto` (T008) is [P] vs public `GallerySection` (T011); `removeGalleryPhoto` (T014) can start as soon as T005 lands.

---

## Parallel Example: User Story 1

```text
# Write the failing tests first (TDD):
Task: "Action tests addGalleryPhoto in storefront/actions.test.ts"   (T006)
Task: "Component tests GalleryManager.test.tsx"                       (T007)

# Then implement (after tests fail):
Task: "addGalleryPhoto in storefront/actions.ts"                      (T008)
Task: "listGallery → GalleryPhoto[] in storefront/queries.ts"         (T009)
Task: "GalleryManager grid + add modal"                               (T010)
Task: "Public GallerySection title/category + empty state"            (T011)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 + Phase 2 (foundation).
2. Write T006/T007 tests (they fail), implement T008–T011.
3. **STOP and VALIDATE**: `npm run test -w @foundly/book` green → demo adding photos with public sync.

### Incremental Delivery

1. Foundation → US1 (add/curate) → validate → demo (MVP).
2. US2 (preview/remove) → validate → demo.
3. US3 (consistency/a11y/docs) → gates → commit-ready.

---

## Notes

- [P] tasks = different files, no incomplete dependencies.
- Domain logic (`apps/book/src/domain`) stays free of React/Next/MUI/storage imports (C2).
- All views use `@foundly/ui` exclusively (C1); raw `<img>` media use the MUI `Box` primitive (same convention as `ProviderSections`).
- Persistence not defined (C3): only the store seam may be swapped.
- Commit after each task or logical group.