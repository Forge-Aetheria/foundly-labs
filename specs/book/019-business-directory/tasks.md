---

description: "Task list for Foundly Book — Public Business Directory & Discovery"
---

# Tasks: Foundly Book — Public Business Directory & Discovery

**Input**: Design documents from `/specs/book/019-business-directory/`

**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/, quickstart.md

**Tests**: Included — the spec explicitly requires automated coverage (FR-012/SC-007). Tests live under `apps/book/src/modules/directory/tests/` (constitution §10; book already complies).

**Organization**: Tasks are grouped by user story. The module data-layer (constitution §5.VI) is built in Foundational; each story then adds a testable slice of the directory.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: US1–US4, mapped to the spec's user stories
- Exact file paths are included in every task

## Path Conventions

- Route (thin): `apps/book/src/app/directorio/`
- Module: `apps/book/src/modules/directory/`
- Shared: `apps/book/src/shared/`
- Codegen snapshot: `apps/book/codegen.schema.gql`

> **Shared-file note**: `components/BusinessCard.tsx` is created in US1, enriched in US3 and finalized (link semantics) in US4; `DirectoryView.tsx` is created in US1 and extended in US2. Those edits are **sequential** across the story phases.

> **External dependency**: this feature consumes the public `searchBusinesses` query from `specs/api/018-business-directory`. That API companion must exist and its SDL synced into `apps/book/codegen.schema.gql` before codegen/tests run (T003).

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Baseline and module scaffold.

- [X] T001 Establish a green baseline: run `npm run typecheck -w @foundly/book`, `npm run test -w @foundly/book`, `npm run lint -w @foundly/book` and record the results (no code changes).
- [X] T002 [P] Create the module directory `apps/book/src/modules/directory/` (with `components/`, `utils/`, `tests/`) per the plan.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The public read + search data-layer every story depends on (constitution §5.VI).

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T003 Ensure `apps/book/codegen.schema.gql` exposes the public `searchBusinesses(query: String, limit: Int, offset: Int): [BusinessSummary!]!` query and the `BusinessSummary`/`BusinessSchedule` types (sync from `apps/api/src/schema.gql` after `specs/api/018-business-directory` is implemented).
- [X] T004 Create `apps/book/src/modules/directory/directory.graphql` with the `SearchBusinesses` document selecting `tenantId slug name category description address phone logo cover schedule { weekday startTime endTime }`.
- [X] T005 [P] Create `apps/book/src/modules/directory/utils/types.ts` with the view-model types: `DirectoryBusiness { tenantId; slug; name; category; description: string | null; address: string | null; logo: string | null; cover: string | null; hours: DirectoryHoursRange[] }`, `DirectoryHoursRange { weekday: number; startTime: string; endTime: string }`, `DirectorySearchParams { q: string }`, `DirectoryState = 'loading' | 'ready' | 'empty' | 'noResults' | 'error'`.
- [X] T006 Create `apps/book/src/modules/directory/actions.ts` (`'use server'`) implementing `getDirectoryBusinesses(q: string): Promise<ActionResult<DirectoryBusiness[]>>`: calls `SearchBusinesses` via `apiRequest` (public, no token), maps each row to `DirectoryBusiness` (null-safe), and returns the failure unchanged on error.
- [X] T007 Create `apps/book/src/modules/directory/hooks.ts` (`'use client'`) with `useDirectorySearch(): (term: string) => void` exposing the debounced URL update helper used by the search island (naming per §5.VI: `use<Acción><Entidad>`).
- [X] T008 Run `npm run codegen -w @foundly/book` to generate `apps/book/src/shared/api/generated.ts` with the `SearchBusinesses` document/types (depends on T003, T004).

**Checkpoint**: The directory data-layer (document, types, server read, search hook) is ready.

---

## Phase 3: User Story 1 - Browse the public directory (Priority: P1) 🎯 MVP

**Goal**: A public `/directorio` route renders a responsive grid of eligible business cards from the server read, with empty/loading/error states.

**Independent Test**: Open `/directorio` → cards render for eligible businesses; with none eligible → empty state; with the API down → error state with retry; pending navigation → skeletons.

### Tests for User Story 1

- [X] T009 [P] [US1] In `apps/book/src/modules/directory/tests/actions.test.ts` cover `getDirectoryBusinesses`: maps rows to `DirectoryBusiness` (null-safe), passes a trimmed `q`, and returns the failure when `apiRequest` fails (mock `shared/api/client` with the hoisted-mock pattern from `public-booking/tests/queries.test.ts`).
- [X] T010 [P] [US1] In `apps/book/src/modules/directory/tests/DirectoryView.test.tsx` cover: grid renders one card per business; empty state when there are no businesses; error state with a retry.

### Implementation for User Story 1

- [X] T011 [US1] Create `apps/book/src/modules/directory/components/BusinessCard.tsx` (Server Component) rendering the card shell: logo/avatar (or initial fallback), name, category badge, short description (or placeholder), location (or placeholder), and a primary action labelled "Ver perfil" (link target finalized in US4).
- [X] T012 [US1] Create `apps/book/src/modules/directory/components/BusinessCardGrid.tsx` rendering a responsive grid (1/2/3 columns) of `BusinessCard` and the empty-state copy when the list is empty.
- [X] T013 [US1] Create `apps/book/src/modules/directory/components/DirectoryStates.tsx` with the skeleton grid and the friendly error state (retry).
- [X] T014 [US1] Create `apps/book/src/modules/directory/DirectoryView.tsx` (Server Component) taking `{ query, businesses }` and composing the header, the search slot (filled in US2), the grid and the states.
- [X] T015 [US1] Create `apps/book/src/app/directorio/page.tsx` as a thin Server Component: read `searchParams.q`, call `getDirectoryBusinesses`, and render `<DirectoryView />`.
- [X] T016 [US1] Create `apps/book/src/app/directorio/loading.tsx` rendering the skeleton grid from `DirectoryStates`.

**Checkpoint**: US1 works independently — the directory lists businesses with proper states — MVP.

---

## Phase 4: User Story 2 - Search and filter businesses (Priority: P1)

**Goal**: A text search that filters the directory by name/category/city (case-insensitive) without a full reload, with clear/no-results behavior.

**Independent Test**: Type a matching term → grid narrows and the URL becomes `/directorio?q=<term>`; clear it → full list; type a nonsense term → no-results state; typing quickly keeps focus.

### Tests for User Story 2

- [X] T017 [P] [US2] In `apps/book/src/modules/directory/tests/DirectorySearch.test.tsx` cover: input is labelled; typing debounces a single URL update to `/directorio?q=<term>`; clearing restores the base URL; focus is retained while typing.
- [X] T018 [P] [US2] In `apps/book/src/modules/directory/tests/DirectoryView.test.tsx` add a case: a non-empty `q` with zero results → the **no-results** state (distinct from the empty-directory state).

### Implementation for User Story 2

- [X] T019 [US2] Create `apps/book/src/modules/directory/components/DirectorySearch.tsx` (`'use client'`) — an accessible labelled input that debounces (~300 ms) and calls `useDirectorySearch` to `router.replace` the `q` param (serializable props `value`/`basePath` only; no server callbacks).
- [X] T020 [US2] In `apps/book/src/modules/directory/DirectoryView.tsx` render `<DirectorySearch value={query} />` and pass the no-results condition to `BusinessCardGrid` (empty `q` + 0 rows → empty; non-empty `q` + 0 rows → no-results).
- [X] T021 [US2] In `apps/book/src/modules/directory/components/BusinessCardGrid.tsx` add the no-results copy with a "clear search" affordance linking back to `/directorio`.

**Checkpoint**: Search filters the directory server-side; empty vs no-results are distinct; US1 still passes.

---

## Phase 5: User Story 3 - Understand a business at a glance from its card (Priority: P1)

**Goal**: Each card shows logo/avatar, cover, name, short description, location and general weekly hours, degrading gracefully with placeholders.

**Independent Test**: Inspect a card → logo/avatar, cover, name, description, location and formatted hours; a business missing cover/description → placeholders; a business with no hours → neutral placeholder.

### Tests for User Story 3

- [X] T022 [P] [US3] In `apps/book/src/modules/directory/tests/hours.test.ts` cover `formatDirectoryHours`: empty array → neutral label; single range → compact label; multiple weekdays → grouped label (e.g. `Lun–Vie 09:00–18:00`).
- [X] T023 [P] [US3] In `apps/book/src/modules/directory/tests/BusinessCard.test.tsx` cover: full content renders (logo, cover, name, description, location, hours); missing cover/description → placeholders; empty hours → neutral placeholder; the card does not render broken markup.

### Implementation for User Story 3

- [X] T024 [US3] Create `apps/book/src/modules/directory/utils/hours.ts` with `formatDirectoryHours(ranges: DirectoryHoursRange[]): string | null` (Spanish weekday labels; compacts contiguous ranges; `null` for empty).
- [X] T025 [US3] In `apps/book/src/modules/directory/components/BusinessCard.tsx` add the cover image (neutral fallback), the avatar/logo fallback, and the formatted hours (or neutral placeholder for `null`), keeping the layout resilient when fields are missing.

**Checkpoint**: Cards are complete and degrade gracefully; US1–US2 still pass.

---

## Phase 6: User Story 4 - Open a business and start booking (Priority: P1)

**Goal**: "Ver perfil" navigates to the business's public page `/[tenantSlug]`, from which the existing booking flow can start; the directory is reachable from the public navigation.

**Independent Test**: Activate "Ver perfil" on a card → lands on `/[tenantSlug]`, where the existing service catalog and booking flow (calendar, slots, advance when required) are available; a "Directorio" entry appears in the public navigation.

### Tests for User Story 4

- [X] T026 [P] [US4] In `apps/book/src/modules/directory/tests/BusinessCard.test.tsx` add a case: the primary action links to `/${slug}` (accessible name contains the business name) and a secondary "Reservar" affordance points to the same public page.

### Implementation for User Story 4

- [X] T027 [US4] In `apps/book/src/modules/directory/components/BusinessCard.tsx` finalize the CTA as a Next.js `Link` to `/${slug}` labelled "Ver perfil" (plus a secondary "Reservar" link to the same page), with an accessible name that includes the business name.
- [X] T028 [P] [US4] Add a public "Directorio" entry linking to `/directorio` in the existing public navigation (`apps/book/src/shared/components/AdminNavigation.ts` and/or the landing view), guarded so it does not alter admin-only flows.

**Checkpoint**: Discovery connects to the existing booking flow; all four stories work.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Snapshot sync, gates and validation.

- [X] T029 [P] Confirm `apps/book/codegen.schema.gql` matches `apps/api/src/schema.gql` for the `searchBusinesses` surface and that codegen is clean (`npm run codegen -w @foundly/book`).
- [X] T030 Run the book gates: `npm run typecheck -w @foundly/book`, `npm run build -w @foundly/book`, `npm run test -w @foundly/book`, `npm run lint -w @foundly/book` (zero regressions, strict TS, no `any`).
- [ ] T031 Execute the `specs/book/019-business-directory/quickstart.md` scenarios end-to-end (Scenarios 1–5) against a running API with `searchBusinesses`. **DEFERRED — requires the `api` companion (`specs/api/018-business-directory`) implemented and a live environment; the behaviors are covered by the module tests.**
- [X] T032 [P] Confirm accessibility essentials: the search input has a label, cards expose a meaningful primary link, and colors use canonical tokens (no magic colors).

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: Depends on Setup — **BLOCKS all user stories**. Also depends on the `api` companion (`searchBusinesses`) for T003/T008.
- **User Stories (Phases 3–6)**: Depend on Foundational. US1 first (creates the view/grid/card). US2 extends `DirectoryView`. US3 enriches `BusinessCard`. US4 finalizes the card CTA.
- **Polish (Phase 7)**: Depends on the desired stories being complete.

### User Story Dependencies

- **US1 (P1)**: after Foundational — no other story dependency. **MVP.**
- **US2 (P1)**: after US1 (extends `DirectoryView.tsx`); otherwise independent.
- **US3 (P1)**: after US1 (enriches `BusinessCard.tsx`); independent of US2.
- **US4 (P1)**: after US3 (finalizes `BusinessCard.tsx`); independent of US2.

### Within Each User Story

- Tests first (they must fail), then components, then wiring.
- The search island receives serializable props only (no server callbacks across the RSC boundary).

### Parallel Opportunities

- T002 (Setup) and T005 (types) are `[P]`.
- Within each story, the `tests/*` tasks marked `[P]` run in parallel.
- US3 and US4 touch `BusinessCard.tsx` and run sequentially, but their tests can be written/run independently.

---

## Parallel Example: User Story 1

```bash
# Write both spec files together:
Task: "T009 [US1] actions.test.ts (mapping + error)"
Task: "T010 [US1] DirectoryView.test.tsx (grid/empty/error)"

# Then the components (different files):
Task: "T011 [US1] BusinessCard.tsx"
Task: "T012 [US1] BusinessCardGrid.tsx"
Task: "T013 [US1] DirectoryStates.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1 Setup → 2. Phase 2 Foundational → 3. Phase 3 US1 → 4. **STOP and VALIDATE** (grid + states render) → 5. Demo.

### Incremental Delivery

1. Setup + Foundational (module data-layer) → ready.
2. US1 → validate → deploy (browse).
3. US2 → validate (search) → deploy.
4. US3 → validate (card content) → deploy.
5. US4 → validate (navigation to booking) → deploy.
6. Polish → gates + snapshot + quickstart.

### Notes

- `[P]` = different files, no incomplete dependency.
- The UI never calls `apiRequest`/`useQuery`/Server Actions directly; reads go through `actions.ts`, interactions through `hooks.ts` (§5.VI).
- Only serializable props cross server → client; the search island holds the only debounce logic (§5.V).
- The existing `/[tenantSlug]` public page and booking flow are reused unchanged.
