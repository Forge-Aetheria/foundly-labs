---

description: "Task list for Foundly Book — Super Admin Console"
---

# Tasks: Foundly Book — Super Admin Console (Global Dashboard & Business Management)

**Input**: Design documents from `/specs/book/020-super-admin-panel/`

**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/, quickstart.md

**Tests**: Included — the spec requires automated coverage (FR-014/SC-006). Tests live under `apps/book/src/modules/super-admin/tests/` (constitution §10).

**Organization**: Tasks are grouped by user story. The module data-layer is built in Foundational; each story then adds a testable slice of the console.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: US1–US5, mapped to the spec's user stories
- Exact file paths are included in every task

## Path Conventions

- Route (thin): `apps/book/src/app/super-admin/`
- Module: `apps/book/src/modules/super-admin/`
- Snapshot: `apps/book/codegen.schema.gql` (already synced by `api/019`)

> **Shared-file note**: `SuperAdminView.tsx` is created in US1 and extended by US2/US3/US4 (sequential on that file). `OverrideSubscriptionDialog.tsx` is created in US4.

> **External dependency**: the API surface (`platformMetrics`, `managedBusinesses`, `overrideTenantSubscription`) is already implemented in `apps/api` (`specs/api/019-super-admin-panel`); the snapshot is already synced.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Baseline and module scaffold.

- [X] T001 Establish a green baseline: run `npm run typecheck -w @foundly/book`, `npm run test -w @foundly/book`, `npm run lint -w @foundly/book` and record the results (no code changes).
- [X] T002 [P] Create the module directory `apps/book/src/modules/super-admin/` (with `components/`, `dialogs/`, `utils/`, `tests/`) and the route directory `apps/book/src/app/super-admin/`.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The console data-layer that every story depends on (constitution §5.VI).

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T003 [P] Create `apps/book/src/modules/super-admin/super-admin.graphql` with `PlatformMetrics` (businesses {total active}, users {available total active}, plans {free pro}, proConversion), `ManagedBusinesses($query,$limit,$offset)` (tenantId slug name plan status expiresAt) and `OverrideTenantSubscription($input: OverrideTenantSubscriptionInput!)`.
- [X] T004 Run `npm run codegen -w @foundly/book` to generate the `PlatformMetrics`/`ManagedBusinesses`/`OverrideTenantSubscription` documents/types in `apps/book/src/shared/api/generated.ts` (depends on T003).
- [X] T005 [P] Create `apps/book/src/modules/super-admin/utils/types.ts` with `PlatformMetricsView { businessesTotal; businessesActive; usersTotal: number | null; usersActive: number | null; usersAvailable: boolean; plansFree; plansPro; proConversion }`, `ManagedBusinessView { tenantId; slug; name; plan: 'FREE' | 'PRO'; status: 'active' | 'past_due' | 'expired' | 'canceled'; expiresAt: string | null }` and `OverrideFormValues { plan: 'FREE' | 'PRO' | null; status: 'active' | 'past_due' | 'expired' | 'canceled' | null; expiresAt: string | null }`.
- [X] T006 [P] Create `apps/book/src/modules/super-admin/utils/schemas.ts` with a zod schema for the override form: `plan` ∈ {FREE, PRO} or null, `status` ∈ {active, past_due, expired, canceled} or null, `expiresAt` ISO-8601 or null, and a refinement requiring at least one change.
- [X] T007 Create `apps/book/src/modules/super-admin/actions.ts` (`'use server'`) with `getPlatformMetrics()`, `getManagedBusinesses({ query, limit, offset })` and `overrideSubscription(input)` using `apiRequestAdmin`; map responses to the view models (null-safe) and return `ActionResult` failures unchanged (depends on T004, T005).
- [X] T008 Create `apps/book/src/modules/super-admin/hooks.ts` (`'use client'`) with `usePlatformMetrics`, `useManagedBusinesses` and `useOverrideSubscription` wrapping the actions (naming per §5.VI; depends on T007).

**Checkpoint**: The console data-layer (documents, types, schemas, actions, hooks) is ready.

---

## Phase 3: User Story 1 - Reach a Super Admin-only console (Priority: P1) 🎯 MVP

**Goal**: A protected `/super-admin` route: anonymous → sign-in, non-admin → access-denied with no platform data, platform owner → the console shell.

**Independent Test**: Open `/super-admin` signed out → redirected to `/login`; as a business owner → AccessDenied with no data; as the Super Admin → the console renders.

### Tests for User Story 1

- [X] T009 [P] [US1] In `apps/book/src/modules/super-admin/tests/SuperAdminView.test.tsx` cover: a `FORBIDDEN` read renders the AccessDenied state with no metrics/table; a successful read renders the console shell (header + slots).

### Implementation for User Story 1

- [X] T010 [US1] Create `apps/book/src/modules/super-admin/components/SuperAdminStates.tsx` with `DashboardSkeleton`, `AccessDenied` (message + a link back to the workspace) and `EmptyState`; add a client `ErrorState` (retry via `router.refresh()`).
- [X] T011 [US1] Create `apps/book/src/modules/super-admin/SuperAdminView.tsx` (Server Component) taking `{ query, page, metrics, businesses, denied, error }` and rendering the header + slots; when `denied` → `AccessDenied` (and nothing else); when `error` → `ErrorState`.
- [X] T012 [US1] Create `apps/book/src/app/super-admin/layout.tsx` (Server guard): resolve the session via `getEffectiveSession`; no session → `redirect('/login')`; otherwise render the console chrome and `children`.
- [X] T013 [US1] Create `apps/book/src/app/super-admin/page.tsx` (thin Server Component): read `searchParams.q`/`page`, call `getPlatformMetrics()` and `getManagedBusinesses(...)`, and render `<SuperAdminView />` (mapping `FORBIDDEN` → `denied`).
- [X] T014 [US1] Create `apps/book/src/app/super-admin/loading.tsx` rendering `DashboardSkeleton`.

**Checkpoint**: The route, guard and shell work independently — MVP.

---

## Phase 4: User Story 2 - Read the platform dashboard (Priority: P1)

**Goal**: Summary cards (total/active businesses, total users with an "unavailable" state, PRO conversion) and the FREE vs PRO distribution.

**Independent Test**: The dashboard shows the summary cards and the plan distribution; with `users.available = false` the user card shows "unavailable" while the rest renders.

### Tests for User Story 2

- [X] T015 [P] [US2] In `apps/book/src/modules/super-admin/tests/MetricsCards.test.tsx` cover: the business/active/user/conversion figures render; `usersAvailable: false` → the user card shows the "unavailable" state; the FREE vs PRO counts render in the distribution.

### Implementation for User Story 2

- [X] T016 [US2] Create `apps/book/src/modules/super-admin/components/MetricsCards.tsx` (Server) rendering Total Negocios, Negocios Activos, Total Usuarios (unavailable state) and the PRO conversion using `@foundly/ui` `Card`/`Typography`/`Stack`.
- [X] T017 [US2] Create `apps/book/src/modules/super-admin/components/PlanDistribution.tsx` (Server) rendering the FREE vs PRO split (counts + a segmented bar using tokens).
- [X] T018 [US2] In `apps/book/src/modules/super-admin/SuperAdminView.tsx` compose `MetricsCards` + `PlanDistribution` into the dashboard region.

**Checkpoint**: The dashboard renders; US1 still passes.

---

## Phase 5: User Story 3 - Manage all businesses (Priority: P1)

**Goal**: A bounded/paginated, searchable table of all businesses with name, plan, status and expiry.

**Independent Test**: The table lists businesses with the four columns; typing filters via the URL; pages change the URL; empty/loading/error states render.

### Tests for User Story 3

- [X] T019 [P] [US3] In `apps/book/src/modules/super-admin/tests/ManagedBusinessesTable.test.tsx` cover: rows render name/plan/status/expiry; an empty list shows the empty state; a plan/status badge is present per row.

### Implementation for User Story 3

- [X] T020 [US3] Create `apps/book/src/modules/super-admin/components/ManagedBusinessesTable.tsx` (Server) with a semantic table (caption + headers Nombre/Plan/Estado/Vencimiento/Acciones), a `BusinessRow` per view model, and an actions cell hosting the override trigger (added in US4); handle the empty state.
- [X] T021 [US3] Create `apps/book/src/modules/super-admin/components/SuperAdminSearch.tsx` (`'use client'`) — a labelled input that debounces (~300 ms) and writes `q` to the URL via `router.replace`.
- [X] T022 [US3] In `apps/book/src/modules/super-admin/SuperAdminView.tsx` compose the search + `ManagedBusinessesTable`, and render simple page navigation (prev/next) that writes the `page` query param.

**Checkpoint**: The table is searchable and paged; US1–US2 pass.

---

## Phase 6: User Story 4 - Force a business subscription (Priority: P1)

**Goal**: An override dialog per business to change plan/status/expiry via `overrideTenantSubscription`, reflecting the result immediately.

**Independent Test**: Open the dialog from a row, set Plan=PRO/Estado=active/Vencimiento=future, confirm → the row shows the new state; FREE/cleared expiry reflect; invalid input is blocked; an API error shows inline.

### Tests for User Story 4

- [X] T023 [P] [US4] In `apps/book/src/modules/super-admin/tests/OverrideSubscriptionDialog.test.tsx` cover: the dialog is prefilled from the row; submitting with no change is blocked; a valid submit calls the hook and closes; a rejected result shows the inline error.

### Implementation for User Story 4

- [X] T024 [US4] Create `apps/book/src/modules/super-admin/dialogs/OverrideSubscriptionDialog.tsx` (`'use client'`) using `@foundly/ui` `Modal`, with Plan (FREE/PRO), Estado (active/past_due/expired/canceled) and Vencimiento (date, clearable) controls, zod validation before submit, and serializable props (`business`, `open`, `onClose`, `onSubmit`).
- [X] T025 [US4] Create `apps/book/src/modules/super-admin/components/OverrideSubscriptionButton.tsx` (`'use client'`): opens the dialog, calls `useOverrideSubscription`, and on success closes + `router.refresh()`; wire it into the `ManagedBusinessesTable` actions cell (serializable `business` prop only).

**Checkpoint**: Overrides persist and the table reflects them; US1–US3 pass.

---

## Phase 7: User Story 5 - See clear denial when not authorized (Priority: P2)

**Goal**: A clear, non-broken "no access" experience for non-admins, with no leaked platform data.

**Independent Test**: As a business owner, `/super-admin` shows AccessDenied with a path back and zero platform data; an anonymous visitor is redirected to sign-in.

### Tests for User Story 5

- [X] T026 [P] [US5] In `apps/book/src/modules/super-admin/tests/SuperAdminView.test.tsx` add a case asserting the AccessDenied state renders **no** metrics, table rows or override controls.

### Implementation for User Story 5

- [X] T027 [US5] In `apps/book/src/modules/super-admin/components/SuperAdminStates.tsx` finalize the `AccessDenied` copy and the "back to workspace" link, and ensure the anonymous redirect is covered by the layout guard (T012).

**Checkpoint**: Denial is clear and leak-free; all stories functional.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Gates, snapshot and validation.

- [X] T028 Run the book gates: `npm run typecheck -w @foundly/book`, `npm run build -w @foundly/book`, `npm run test -w @foundly/book`, `npm run lint -w @foundly/book` (zero regressions, strict TS, no `any`).
- [X] T029 [P] Confirm `apps/book/codegen.schema.gql` already matches `apps/api/src/schema.gql` for the platform surface and that `npm run codegen -w @foundly/book` is clean.
- [X] T030 [P] Verify accessibility/tokens: labelled search input, semantic table, keyboard-operable dialog, plan/status indicated by text (not color alone), and no magic colors.
- [ ] T031 Execute the `specs/book/020-super-admin-panel/quickstart.md` scenarios (1–5) end-to-end. **DEFERRED — requires the API running with a Super Admin session; the behaviors are covered by the module tests.**

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: Depends on Setup — **BLOCKS all user stories**.
- **User Stories (Phases 3–7)**: Depend on Foundational. US1 creates the view/route; US2/US3/US4 extend `SuperAdminView.tsx`; US5 verifies denial.
- **Polish (Phase 8)**: Depends on the desired stories being complete.

### User Story Dependencies

- **US1 (P1)**: after Foundational — no other story dependency. **MVP.**
- **US2 (P1)**: after US1 (extends `SuperAdminView.tsx`).
- **US3 (P1)**: after US2 (extends `SuperAdminView.tsx`); table is independent otherwise.
- **US4 (P1)**: after US3 (adds the actions cell).
- **US5 (P2)**: after US1 (verifies the denied state).

### Within Each User Story

- Tests first (they must fail), then components, then wiring.
- Client islands receive serializable props only (no server callbacks across the RSC boundary).

### Parallel Opportunities

- T002, T003, T005, T006 (Setup/Foundational) where marked `[P]`.
- Within each story, the `*.spec.ts(x)` tasks marked `[P]` run in parallel (T009, T015, T019, T023, T026).

---

## Parallel Example: User Story 2

```bash
# Write the dashboard test first:
Task: "T015 [US2] MetricsCards.test.tsx"

# Then the components (different files):
Task: "T016 [US2] MetricsCards.tsx"
Task: "T017 [US2] PlanDistribution.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1 Setup → 2. Phase 2 Foundational → 3. Phase 3 US1 → 4. **STOP and VALIDATE** (route guard + shell + denied) → 5. Demo.

### Incremental Delivery

1. Setup + Foundational (data-layer) → ready.
2. US1 → validate (access + shell) → deploy.
3. US2 → validate (dashboard) → deploy.
4. US3 → validate (table + search) → deploy.
5. US4 → validate (override dialog) → deploy.
6. US5 → validate (denial) → deploy.
7. Polish → gates + snapshot + quickstart.

### Notes

- `[P]` = different files, no incomplete dependency.
- The UI never calls the API/hooks directly; reads go through `actions.ts`, interactions through `hooks.ts` (§5.VI).
- Authorization is server-side; the console renders no platform data on denial.
- No new dependencies; no migrations; the snapshot is already synced.
