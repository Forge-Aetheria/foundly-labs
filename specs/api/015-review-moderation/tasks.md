---
description: "Task list for Foundly API — Review Moderation"
---

# Tasks: Foundly API — Review Moderation

**Input**: Design documents from `/specs/api/015-review-moderation/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/review-moderation.contract.md, quickstart.md

**Tests**: Included — FR-010 requires automated coverage (unit + e2e).

**Organization**: Tasks are grouped by user story (US1 approve/reject · US2 admin read · US3 delete) so each is independently implementable and testable. The public read change (US0/prerequisite) is part of the foundational work.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: US1 · US2 · US3
- Every task includes an exact file path.

## Path Conventions

- Backend: `apps/api/src/…` (NestJS colocated `*.spec.ts`); Prisma: `packages/database/prisma/…`; codegen snapshot: `apps/book/codegen.schema.gql`.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm the entity and the moderation gap before touching schema.

- [x] T001 Confirm `Review` has no state field today and that a new enum + column + backfill migration is required — `packages/database/prisma/schema.prisma`, `packages/database/prisma/migrations/`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The persistence state, enum, seam and public-read change shared by all stories.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T002 [P] Add `enum ReviewState { pending approved rejected }` and `state ReviewState @default(pending)` to `Review` with `@@index([tenantId, state])`, and generate a migration that creates the enum + column and **backfills existing rows to `approved`** — `packages/database/prisma/schema.prisma`, `packages/database/prisma/migrations/<new>/migration.sql`
- [x] T003 [P] Register the code-first `ReviewState` enum (`registerEnumType`) and add `state: ReviewState` to `ReviewObject` — `apps/api/src/modules/reviews/reviews.types.ts`
- [x] T004 [P] Extend `ReviewRow` with `state` and the `ReviewsStore` interface with `listByTenant(tenantId, state?)`, `setState(id, tenantId, state)`, `deleteById(id, tenantId)`; implement them in `PrismaReviewsStore` (filter/select `state`, single-row update/delete scoped by id + tenant) — `apps/api/src/modules/reviews/reviews.store.ts`
- [x] T005 [P] Extend `createMemoryReviewsStore()` with the same operations and a `state`-aware `seed`/`create` — `apps/api/src/modules/reviews/reviews.test-store.ts`
- [x] T006 Update `ReviewsService.summary` (public) to read only `approved` and aggregate over approved, and `add` to persist `pending` — `apps/api/src/modules/reviews/reviews.service.ts`
- [x] T007 Update the public `reviews` e2e expectations (submitted → pending/hidden; approved → visible) — `apps/api/src/modules/reviews/reviews.e2e.spec.ts`

**Checkpoint**: Schema + seam + public read reflect the moderation model.

---

## Phase 3: User Story 1 - Approve or reject a submitted review (Priority: P1) 🎯 MVP

**Goal**: The owner can set a review to `approved`/`rejected` (idempotent), changing its public visibility.

**Independent Test**: With a tenant token, `setReviewState(id, approved)` publishes the review (it appears in `reviews`); `setReviewState(id, rejected)` hides it; repeating the same call succeeds; `pending` → `VALIDATION_ERROR`; anonymous → `UNAUTHENTICATED`; a foreign id → `NOT_FOUND`.

### Tests for User Story 1 ⚠️

- [x] T008 [P] [US1] Unit tests `setState`: approve → approved; reject → rejected; idempotent re-set; `pending` → `VALIDATION_ERROR`; foreign/missing → `NOT_FOUND`; anonymous → `UNAUTHENTICATED` in `apps/api/src/modules/reviews/reviews.service.spec.ts`
- [x] T009 [P] [US1] e2e: pending submission → approve → visible in public `reviews` + aggregate; reject → hidden; repeat call idempotent in `apps/api/src/modules/reviews/reviews.e2e.spec.ts`

### Implementation for User Story 1

- [x] T010 [US1] Implement `ReviewsService.setState(user, id, state)` — `requireTenant`; reject `pending` with `VALIDATION_ERROR`; delegate to `store.setState`; `null` → `NOT_FOUND`; return the updated row in `apps/api/src/modules/reviews/reviews.service.ts`
- [x] T011 [US1] Implement the `setReviewState(id, state)` mutation with `@RequireAuth()` + `@AuthUser` in `apps/api/src/modules/reviews/reviews.resolver.ts`

**Checkpoint**: Moderation (approve/reject) works and is idempotent.

---

## Phase 4: User Story 2 - See the reviews awaiting moderation (Priority: P1)

**Goal**: The owner reads all of their business reviews (any state), optionally filtered.

**Independent Test**: As the owner, `myReviews` returns every state (including pending); `myReviews(state: pending)` returns only pending; anonymous → `UNAUTHENTICATED`; another tenant's reviews are never returned.

### Tests for User Story 2 ⚠️

- [x] T012 [P] [US2] Unit tests `listForAdmin`: returns all states; filters by state; tenant-scoped (never another tenant); anonymous → `UNAUTHENTICATED` in `apps/api/src/modules/reviews/reviews.service.spec.ts`
- [x] T013 [P] [US2] e2e: authenticated `myReviews` returns pending+approved+rejected; `myReviews(state: rejected)` filters; anonymous → `UNAUTHENTICATED` in `apps/api/src/modules/reviews/reviews.e2e.spec.ts`

### Implementation for User Story 2

- [x] T014 [US2] Implement `ReviewsService.listForAdmin(user, state?)` — `requireTenant` + `store.listByTenant(tenantId, state)` in `apps/api/src/modules/reviews/reviews.service.ts`
- [x] T015 [US2] Implement the `myReviews(state)` query with `@RequireAuth()` + `@AuthUser` in `apps/api/src/modules/reviews/reviews.resolver.ts`

**Checkpoint**: User Stories 1 and 2 both work independently.

---

## Phase 5: User Story 3 - Delete an inappropriate review (Priority: P2)

**Goal**: The owner deletes a review for good; foreign/missing → `NOT_FOUND`.

**Independent Test**: Delete an owned review → `true` and it disappears from both `myReviews` and `reviews`; a foreign id → `NOT_FOUND` and the record remains; anonymous → `UNAUTHENTICATED`.

### Tests for User Story 3 ⚠️

- [x] T016 [P] [US3] Unit tests `remove`: owned → `true`; foreign/missing → `NOT_FOUND` (record intact); anonymous → `UNAUTHENTICATED` in `apps/api/src/modules/reviews/reviews.service.spec.ts`
- [x] T017 [P] [US3] e2e: delete an owned review removes it everywhere; foreign id → `NOT_FOUND`; anonymous → `UNAUTHENTICATED` in `apps/api/src/modules/reviews/reviews.e2e.spec.ts`

### Implementation for User Story 3

- [x] T018 [US3] Implement `ReviewsService.remove(user, id)` — `requireTenant`; `store.deleteById(id, tenantId)`; `false` → `NOT_FOUND`; return `true` in `apps/api/src/modules/reviews/reviews.service.ts`
- [x] T019 [US3] Implement the `deleteReview(id)` mutation with `@RequireAuth()` + `@AuthUser` in `apps/api/src/modules/reviews/reviews.resolver.ts`

**Checkpoint**: All user stories are independently functional.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [x] T020 Sync the versioned codegen schema snapshot with the new SDL (regenerate from the running API `schema.gql`) — `apps/book/codegen.schema.gql`
- [x] T021 Run and pass API gates: `npm run typecheck -w @foundly/api`, `npm run test -w @foundly/api`, `npm run lint -w @foundly/api`, `npm run build -w @foundly/api` — `apps/api/package.json`
- [ ] T022 Execute the `quickstart.md` scenarios and confirm the expected outcomes — `specs/api/015-review-moderation/quickstart.md` (requires live DB + Supabase token; automated gates covered by T021)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: none.
- **Foundational (Phase 2)**: after Setup — BLOCKS all user stories (schema + seam + public read).
- **US1/US2/US3**: after Foundational. `reviews.service.ts`/`reviews.resolver.ts` are shared files edited sequentially in priority order (US1 → US2 → US3).
- **Polish (Phase 6)**: after the desired stories; T020 also unblocks the Book feature `016`.

### Parallel Opportunities

- T002, T003, T004, T005 are `[P]` (different files).
- Test tasks are `[P]` (different files): T008/T009, T012/T013, T016/T017.

---

## Implementation Strategy

### MVP First (User Story 1)

1. Phase 1 Setup → Phase 2 Foundational (schema + public read + seam).
2. Phase 3 (US1) → approve/reject changes public visibility.
3. Then US2 (admin read) and US3 (delete).

### Incremental Delivery

1. Setup + Foundational → moderation model + hidden-until-approved public read.
2. US1 → approve/reject (MVP).
3. US2 → admin list; US3 → delete.
4. Phase 6 → snapshot synced + gates green.

---

## Notes

- `[P]` = different files, no dependencies.
- `apps/api` keeps the NestJS colocated `*.spec.ts` convention (code-rules §10 migration deferred; confirmed with the owner).
- Constraint values quoted from `data-model.md` (state ∈ {pending, approved, rejected}; moderation target ∈ {approved, rejected}; tenant from `ctx.user`).
- Depends on nothing new; extends the `013` reviews surface.
- Environment note: the API test transform no longer uses SWC — `apps/api/vitest.config.ts` uses the pure-JS TypeScript compiler, so the full `test` gate runs locally.
