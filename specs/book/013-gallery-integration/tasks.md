---
description: "Task list for Foundly Book — Gallery Integration (Admin + Public Portal)"
---

# Tasks: Foundly Book — Gallery Integration (Admin + Public Portal)

**Input**: Design documents from `/specs/book/013-gallery-integration/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/gallery-ui.contract.md, quickstart.md

**Tests**: Included — the constitution (§3.I gates) and FR-011 require the module to be covered by automated tests.

**Depends on**: `specs/api/012-gallery-management` (the GraphQL gallery surface must exist before codegen/consumption).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: US1 (admin) · US2 (public) · US3 (session-safe/modular)
- Every task includes an exact file path.

## Path Conventions

- Frontend: `apps/book/src/…`; the codegen snapshot lives at `apps/book/codegen.schema.gql`.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Make the API gallery surface available to codegen.

- [x] T001 Sync the versioned SDL snapshot from the API before generating types — `apps/book/codegen.schema.gql` (depends on API `012` T019)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The gallery module data layer (operations, generated types, schemas, actions, hooks) shared by all stories.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T002 [P] Create the module GraphQL operations (`Gallery($tenantId: ID, $tenantSlug: String)`, `AddGalleryItem($input: AddGalleryItemInput!)`, `RemoveGalleryItem($id: ID!)`) selecting `id url title description category order` in `apps/book/src/modules/gallery/gallery.graphql`
- [x] T003 Run `npm run codegen -w @foundly/book` to regenerate `GalleryDocument`/`AddGalleryItemDocument`/`RemoveGalleryItemDocument` in `apps/book/src/shared/api/generated.ts` (depends on T001, T002)
- [x] T004 [P] Create zod input schemas — `addGalleryItemSchema` (`url`: trimmed, valid absolute URL, ≤ 2000; `title`: trimmed, ≤ 200, optional/nullish; `description`: trimmed, ≤ 2000, optional/nullish; `category`: `enum(GALLERY_CATEGORIES)`, optional/nullish) and `removeGalleryItemSchema` (`id`: min 1) in `apps/book/src/modules/gallery/utils/schemas.ts`
- [x] T005 [P] Implement `listGallery(tenantId)` (via `apiRequestAdmin(GalleryDocument, { tenantId, tenantSlug: null })`), `addGalleryItem(input)` and `removeGalleryItem(input)` Server Actions (validate → call API → map to `GalleryPhoto`/`{ id }`) in `apps/book/src/modules/gallery/actions.ts`
- [x] T006 [P] Create client hooks `useFetchGallery`, `useAddGalleryItem`, `useRemoveGalleryItem` wrapping the actions in `apps/book/src/modules/gallery/hooks.ts`

**Checkpoint**: Data layer ready — stories can begin.

---

## Phase 3: User Story 1 - Manage the real gallery from the panel (Priority: P1) 🎯 MVP

**Goal**: `/admin/gallery` shows the business's real photos and lets the owner add/remove them.

**Independent Test**: Open `/admin/gallery`; with photos present they render as cards; add a valid photo → it appears and persists; remove it → it disappears; empty tenant → friendly empty state.

### Tests for User Story 1 ⚠️

- [x] T007 [P] [US1] Unit test the schemas/actions mapping (list maps categories, drops unknown; invalid add → `VALIDATION_ERROR` without API call; add/remove happy path) in `apps/book/src/modules/gallery/tests/actions.test.ts`
- [x] T008 [P] [US1] RTL test `GalleryManager` (renders real cards, add flow, URL validation block, delete confirmation, empty state) with hooks mocked in `apps/book/src/modules/gallery/tests/GalleryManager.test.tsx`

### Implementation for User Story 1

- [x] T009 [US1] Implement the server view (resolve tenant via `getAdminTenantId()`, call `listGallery(tenantId)`, pass `photos`/`error`) in `apps/book/src/modules/gallery/GalleryView.tsx`
- [x] T010 [US1] Implement `GalleryManager` (glass card grid with title/description/category badge; `+ Añadir imagen` modal using `addGalleryItemSchema`-aligned fields; `Ver` lightbox; `Quitar foto` confirmation; friendly empty state; accessible image fallback via `onError`) consuming only `hooks.ts`, plus `ApiErrorDialog` for transient/conflict failures — `apps/book/src/modules/gallery/components/GalleryManager.tsx`

**Checkpoint**: User Story 1 works with real data (MVP).

---

## Phase 4: User Story 2 - The public mini-site shows the real gallery (Priority: P1)

**Goal**: The public `#galeria` block on `/book/<slug>` renders the real backend photos.

**Independent Test**: Open `/book/<slug>` with photos → the `#galeria` section shows them (with category label); with none → clean "no photos yet"; a photo added in the admin appears after reload.

### Tests for User Story 2 ⚠️

- [x] T011 [P] [US2] Extend the public-booking query test to cover the real gallery mapping (by slug → `PublicGalleryPhoto[]` with category label; gallery fetch failure → `[]` without breaking the page) in `apps/book/src/modules/public-booking/tests/queries.test.ts`

### Implementation for User Story 2

- [x] T012 [US2] Extend `getPublicBusinessRemote(slug)` to also call the public `GalleryDocument` by slug, map each item to `PublicGalleryPhoto` (map `local|trabajos|equipo` → display label; drop unknown; `null`→`undefined`), and populate `PublicBusinessProfile.gallery` (gallery failure is non-fatal → `[]`) in `apps/book/src/modules/public-booking/actions.ts`

**Checkpoint**: User Stories 1 and 2 both work.

---

## Phase 5: User Story 3 - A session-safe, modular implementation (Priority: P2)

**Goal**: The gallery follows the canonical module structure and routes session failures through the global handler.

**Independent Test**: The module has `gallery.graphql`/`actions.ts`/`hooks.ts`; the UI never imports the transport or Server Actions; an expired session on a gallery read/write routes to the global sign-in flow (no raw text).

### Tests for User Story 3 ⚠️

- [x] T013 [P] [US3] Test that gallery actions route `UNAUTHENTICATED` through the session-aware transport (session handled globally) and never return raw provider text in `apps/book/src/modules/gallery/tests/actions.test.ts`

### Implementation for User Story 3

- [x] T014 [US3] Verify/enforce that all gallery data access uses `apiRequestAdmin` (no raw `apiRequest`/token handling) and that no gallery view renders raw inline error copy (transient → `ApiErrorDialog`, validation → inline fields) across `apps/book/src/modules/gallery/actions.ts`, `apps/book/src/modules/gallery/hooks.ts`, `apps/book/src/modules/gallery/components/GalleryManager.tsx`

**Checkpoint**: All user stories are independently functional and session-safe.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Documentation and gate validation.

- [x] T015 Update `apps/book/README.md` to reflect that the gallery is now backend-backed (admin + `#galeria`) and reference `specs/book/013-gallery-integration`
- [x] T016 Run and pass book gates: `npm run test -w @foundly/book`, `npm run typecheck -w @foundly/book`, `npm run lint -w @foundly/book`, `npm run build -w @foundly/book` — `apps/book/package.json`
- [x] T017 Execute the `quickstart.md` scenarios (admin add/persist/remove; public reflect; session safety) and confirm the expected outcomes

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: depends on the API feature `012` producing the SDL.
- **Foundational (Phase 2)**: after Setup — BLOCKS all user stories.
- **User Stories (Phase 3+)**: after Foundational. US1 and US2 can proceed in parallel (different files); US3 validates the shared data layer.
- **Polish (Phase 6)**: after the desired stories.

### User Story Dependencies

- **US1 (P1)**: after Foundational — no dependency on US2/US3.
- **US2 (P1)**: after Foundational — independent (public path reuses the generated `GalleryDocument`).
- **US3 (P2)**: after Foundational — validates actions/UI built in Foundational + US1.

### Within Each User Story

- Tests written and failing before implementation.
- `actions.ts`/`hooks.ts` (Foundational) before the view components.
- Story complete before moving to the next priority.

### Parallel Opportunities

- T002, T004, T005, T006 (Foundational) are `[P]` (different files).
- Test tasks are `[P]` (different files): T007/T008, T011, T013.

---

## Parallel Example: Foundational

```bash
# Launch the Foundational data-layer files together (different files):
Task: "Create gallery.graphql operations in apps/book/src/modules/gallery/gallery.graphql"
Task: "Create zod schemas in apps/book/src/modules/gallery/utils/schemas.ts"
Task: "Implement actions.ts in apps/book/src/modules/gallery/actions.ts"
Task: "Create hooks.ts in apps/book/src/modules/gallery/hooks.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1 Setup (snapshot sync) → Phase 2 Foundational (operations/codegen/data layer).
2. Phase 3 (US1) → validate `/admin/gallery` with real data.
3. Then US2 (public) and US3 (session-safety).

### Incremental Delivery

1. Setup + Foundational → data layer ready.
2. US1 → the owner manages the real gallery.
3. US2 → the mini-site reflects it.
4. US3 → session safety verified.
5. Phase 6 → docs updated + gates green.

---

## Notes

- `[P]` = different files, no dependencies.
- `[Story]` maps each task to a user story for traceability.
- Constraint values quoted from `data-model.md` (URL absolute; title ≤ 200; description ≤ 2000; category ∈ {local, trabajos, equipo}).
- Depends on the API feature `specs/api/012-gallery-management` for the GraphQL surface and the SDL snapshot.
