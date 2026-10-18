---
description: "Task list for Foundly Book — Profile, Policies & Reviews (Admin + Public Portal)"
---

# Tasks: Foundly Book — Profile, Policies & Reviews (Admin + Public Portal)

**Input**: Design documents from `/specs/book/014-profile-policies-reviews/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/profile-ui.contract.md, quickstart.md

**Tests**: Included — the constitution (§3.I gates) and FR-010 require the module to be covered by automated tests.

**Depends on**: `specs/api/013-profile-policies-reviews` (profile-update + reviews surface and the SDL snapshot).

**Organization**: Grouped by user story: US1 edit profile (P1) · US3 public sections + reviews (P1) · US2 policies (P2) · US4 modular/session-safe (P2).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: US1 · US2 · US3 · US4
- Every task includes an exact file path.

## Path Conventions

- Frontend: `apps/book/src/…`; codegen snapshot: `apps/book/codegen.schema.gql`.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Make the API surface available to codegen.

- [x] T001 Sync the versioned SDL snapshot from the API before generating types — `apps/book/codegen.schema.gql` (depends on API `013` T020)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Module GraphQL operations, generated types, zod schemas, actions and hooks shared by the stories.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T002 [P] Create the profile operations (`Profile($tenantId: ID)` selecting tenant profile incl. `policies { title body }`; `UpdateBusinessProfile($input: UpdateBusinessProfileInput!)`) in `apps/book/src/modules/profile/profile.graphql`
- [x] T003 [P] Create the reviews operations (`Reviews($tenantSlug: String)` returning `{ items { id author rating comment createdAt } average count }`; `AddReview($input: AddReviewInput!)`) in `apps/book/src/modules/reviews/reviews.graphql`
- [x] T004 Run `npm run codegen -w @foundly/book` to regenerate the documents/types in `apps/book/src/shared/api/generated.ts` (depends on T001, T002, T003)
- [x] T005 [P] Create `updateProfileSchema` (zod): `name`/`category` trimmed ≤ 120; `slug` pattern `^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])?$`; `bio` ≤ 2000 optional; `address`/`phone` optional; `instagram`/`whatsapp`/`logo`/`cover` absolute URL optional; `policies` array of `{ title: non-empty ≤ 120, body: non-empty ≤ 2000 }` in `apps/book/src/modules/profile/utils/schemas.ts`
- [x] T006 [P] Create `reviewSchema` (zod): `tenantSlug` non-empty; `author` trimmed non-empty ≤ 120; `rating` integer 1–5; `comment` trimmed non-empty ≤ 2000 in `apps/book/src/modules/reviews/utils/schemas.ts`
- [x] T007 [P] Implement `getProfile(tenantId)` (via `apiRequestAdmin`) and `updateProfile(input)` Server Action (validate → `UpdateBusinessProfile` → map) in `apps/book/src/modules/profile/actions.ts`
- [x] T008 [P] Create hooks `useFetchProfile` / `useUpdateProfile` in `apps/book/src/modules/profile/hooks.ts`
- [x] T009 [P] Implement `submitPublicReview(input)` Server Action (validate → `AddReview` → map to domain `Review`) in `apps/book/src/modules/reviews/actions.ts`
- [x] T010 [P] Create hook `useSubmitReview` in `apps/book/src/modules/reviews/hooks.ts`

**Checkpoint**: Data layer ready — stories can begin.

---

## Phase 3: User Story 1 - Edit and persist the business profile (Priority: P1) 🎯 MVP

**Goal**: `/admin/profile` is a real editable form that persists to the backend.

**Independent Test**: Open `/admin/profile`, edit name/category/address/phone/Instagram/WhatsApp/bio, save, reload → values persist (and appear on the public page). Invalid URL/slug → inline error, nothing saved.

### Tests for User Story 1 ⚠️

- [x] T011 [P] [US1] Unit test `profile/actions` (getProfile maps contact + policies; updateProfile `VALIDATION_ERROR` on bad URL; `CONFLICT` maps to a slug field error) in `apps/book/src/modules/profile/tests/actions.test.ts`
- [x] T012 [P] [US1] RTL test `ProfileEditor` (fields render current values as editable; save calls `updateProfile`; invalid URL blocks with inline error) with `hooks.ts` mocked in `apps/book/src/modules/profile/tests/ProfileEditor.test.tsx`

### Implementation for User Story 1

- [x] T013 [US1] Implement the server view (resolve tenant via `getAdminTenantId()`, call `getProfile(tenantId)`, pass `profile`/`error`) in `apps/book/src/modules/profile/ProfileView.tsx`
- [x] T014 [US1] Implement the editable `ProfileEditor` (name, category, slug, logo, cover with preview, address, phone, Instagram, WhatsApp, bio; `Guardar perfil` via `useUpdateProfile`; inline field errors; `ApiErrorDialog` for transient failures) consuming only `hooks.ts` in `apps/book/src/modules/profile/components/ProfileEditor.tsx` — media refined into vertical cards and the read-only hours summary removed (feature 022 follow-up)

**Checkpoint**: User Story 1 works (MVP).

---

## Phase 4: User Story 3 - Public mini-site shows profile, contact, policies and reviews (Priority: P1)

**Goal**: The public page renders the real "Acerca de", contact/address, policies and reviews + rating, with public review submission.

**Independent Test**: Open `/book/<slug>` → sections show real backend content (or clean empty states); submit a review → it appears with an updated rating; an admin change is reflected after reload.

### Tests for User Story 3 ⚠️

- [x] T015 [P] [US3] Extend the public-booking query test to cover policies + reviews mapping (by slug → `policies`, `reviews`, `rating`, `reviewCount`; reviews failure → empty + null rating) in `apps/book/src/modules/public-booking/tests/queries.test.ts`

### Implementation for User Story 3

- [x] T016 [US3] Extend `getPublicBusinessRemote(slug)` to read the public `Reviews` summary and map the profile `policies`, populating `policies`/`reviews`/`rating`/`reviewCount` (reviews failure non-fatal) in `apps/book/src/modules/public-booking/actions.ts`
- [x] T017 [US3] Implement `ReviewForm` (author, rating 1–5, comment via `useSubmitReview`; inline validation) and render the "Acerca de", contact/address, policies and reviews sections (list + rating + form) with clean empty states in `apps/book/src/modules/reviews/components/ReviewForm.tsx`, `apps/book/src/modules/public-booking/components/ProviderSections.tsx`

**Checkpoint**: User Stories 1 and 3 both work.

---

## Phase 5: User Story 2 - Manage reservation/cancellation policies (Priority: P2)

**Goal**: The editor manages a policies list (title + body); the public card renders it.

**Independent Test**: Add/edit a policy and save → persists and appears in the public policies card; remove and save → disappears; no policies → clean empty state with an add action.

### Tests for User Story 2 ⚠️

- [x] T018 [P] [US2] RTL tests for the policies list (add/edit/remove entries; empty state) in `apps/book/src/modules/profile/tests/ProfileEditor.test.tsx`

### Implementation for User Story 2

- [x] T019 [US2] Add the policies list UI (add/edit/remove entries with `title` + `body`) to the editor, submitted within `updateProfile` in `apps/book/src/modules/profile/components/ProfileEditor.tsx`

**Checkpoint**: Policies are manageable end-to-end.

---

## Phase 6: User Story 4 - Modular, session-safe data layer (Priority: P2)

**Goal**: The profile/reviews modules follow the canonical structure and handle session expiry globally.

**Independent Test**: The modules have `actions.ts`/`hooks.ts`; the UI never imports the transport/Server Actions; an expired session on profile load/save or review submit routes to the global sign-in flow.

### Tests for User Story 4 ⚠️

- [x] T020 [P] [US4] Test that review submission validates locally (`VALIDATION_ERROR` without an API call) and delegates to the session-aware transport in `apps/book/src/modules/reviews/tests/actions.test.ts`

### Implementation for User Story 4

- [x] T021 [US4] Verify/enforce that profile and reviews data access uses `apiRequestAdmin` (no raw `apiRequest`/token handling) and that no view renders raw inline error copy (transient → `ApiErrorDialog`, validation → inline fields) across `apps/book/src/modules/profile/actions.ts`, `apps/book/src/modules/reviews/actions.ts`

**Checkpoint**: All user stories are independently functional and session-safe.

---

## Phase 7: Polish & Cross-Cutting Concerns

- [x] T022 Update `apps/book/README.md` to reflect the editable profile and the real public profile/policies/reviews sections, referencing `specs/book/014-profile-policies-reviews`
- [x] T023 Run and pass book gates: `npm run test -w @foundly/book`, `npm run typecheck -w @foundly/book`, `npm run lint -w @foundly/book`, `npm run build -w @foundly/book` — `apps/book/package.json`
- [x] T024 Execute the `quickstart.md` scenarios and confirm the expected outcomes — `specs/book/014-profile-policies-reviews/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: depends on the API feature `013` producing the SDL.
- **Foundational (Phase 2)**: after Setup — BLOCKS all user stories.
- **US1 (Phase 3)** and **US3 (Phase 4)**: after Foundational; independent files.
- **US2 (Phase 5)**: after Foundational; edits `ProfileEditor.tsx` (same file as US1 T014) → run after US1.
- **US4 (Phase 6)**: after Foundational; validates the data layer built in Foundational + US1.
- **Polish (Phase 7)**: after the desired stories.

### User Story Dependencies

- **US1 (P1)**: after Foundational — no dependency on other stories.
- **US3 (P1)**: after Foundational — independent (public path uses the generated `ReviewsDocument`).
- **US2 (P2)**: after Foundational — same editor file as US1 (sequential).
- **US4 (P2)**: after Foundational — validates actions/UI.

### Parallel Opportunities

- T002, T003, T005, T006, T007, T008, T009, T010 are `[P]` (different files).
- Test tasks are `[P]` (different files): T011/T012, T015, T018, T020.

---

## Parallel Example: Foundational

```bash
# Launch the Foundational files together (different files):
Task: "Create profile.graphql in apps/book/src/modules/profile/profile.graphql"
Task: "Create reviews.graphql in apps/book/src/modules/reviews/reviews.graphql"
Task: "Create updateProfileSchema in apps/book/src/modules/profile/utils/schemas.ts"
Task: "Create reviewSchema in apps/book/src/modules/reviews/utils/schemas.ts"
Task: "Implement profile actions in apps/book/src/modules/profile/actions.ts"
Task: "Implement reviews actions in apps/book/src/modules/reviews/actions.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1)

1. Phase 1 Setup (snapshot sync) → Phase 2 Foundational.
2. Phase 3 (US1) → validate the editable, persistent profile.
3. Then US3 (public), US2 (policies), US4 (session-safety).

### Incremental Delivery

1. Setup + Foundational → data layer ready.
2. US1 → the owner edits and persists the profile.
3. US3 → the mini-site reflects it and shows reviews (+ submission).
4. US2 → policies managed in the editor.
5. US4 → session safety verified.
6. Phase 7 → docs updated + gates green.

---

## Notes

- `[P]` = different files, no dependencies.
- Constraint values quoted from `data-model.md` (slug pattern; URLs absolute http(s); bio ≤ 2000; name/category ≤ 120; author ≤ 120; rating integer 1–5; comment ≤ 2000).
- Depends on the API feature `specs/api/013-profile-policies-reviews` for the GraphQL surface and the SDL snapshot.
