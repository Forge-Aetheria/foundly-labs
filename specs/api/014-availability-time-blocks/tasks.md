---
description: "Task list for Foundly API — Availability Time Blocks"
---

# Tasks: Foundly API — Availability Time Blocks

**Input**: Design documents from `/specs/api/014-availability-time-blocks/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/time-blocks.contract.md, quickstart.md

**Tests**: Included — FR-011/FR-012 require automated coverage (unit + e2e).

**Organization**: Tasks are grouped by user story (US1 read · US2 add · US3 remove) so each is independently implementable and testable.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: US1 · US2 · US3
- Every task includes an exact file path.

## Path Conventions

- Backend: `apps/api/src/…`; Prisma: `packages/database/prisma/…`; codegen snapshot: `apps/book/codegen.schema.gql`.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm the entity is new and plan the migration.

- [x] T001 Confirm no time-block entity exists yet (weekly `Availability` only) and that a new `TimeBlock` model + migration is required — `packages/database/prisma/schema.prisma`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The persistence entity, GraphQL types, seam and wiring shared by all stories.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T002 [P] Add the `TimeBlock` model (`id` cuid, `tenantId`, `specialistId?`, `startAt DateTime`, `endAt DateTime`, `reason?`, `createdAt`, `@@index([tenantId, startAt])`) with relations to `Tenant` and `Specialist`, and generate a migration — `packages/database/prisma/schema.prisma`, `packages/database/prisma/migrations/<new>/migration.sql`
- [x] T003 [P] Create `TimeBlockObject { id, tenantId, specialistId, startAt, endAt, reason }` and `AddTimeBlockInput { tenantId?, tenantSlug?, specialistId?, startAt, endAt, reason? }` in `apps/api/src/modules/time-block/time-block.types.ts`
- [x] T004 [P] Create the `TIME_BLOCK_STORE` seam + `TimeBlockStore` (`resolveTenantId`, `list`, `create`, `removeById`, `specialistBelongsToTenant`) + `PrismaTimeBlockStore` in `apps/api/src/modules/time-block/time-block.store.ts`
- [x] T005 [P] Create the in-memory `createMemoryTimeBlockStore()` (with `seed`/`tenantBySlug`) in `apps/api/src/modules/time-block/time-block.test-store.ts`
- [x] T006 Create `TimeBlockModule` and register it in `app.module.ts` — `apps/api/src/modules/time-block/time-block.module.ts`, `apps/api/src/app.module.ts`

**Checkpoint**: Foundation ready.

---

## Phase 3: User Story 1 - Read a business's time blocks (Priority: P1) 🎯 MVP

**Goal**: Public read of a business's blocks, ordered, with an optional specialist filter.

**Independent Test**: `timeBlocks(tenantId:"no-such-tenant")` → `[]`; after seeding, `timeBlocks(tenantSlug:"estudio-ana")` returns the blocks ordered by start; a `specialistId` returns that specialist's blocks plus business-wide ones.

### Tests for User Story 1 ⚠️

- [x] T007 [P] [US1] Unit tests list: empty / one / many (ordered by `startAt asc`) / specialist filter (specialist + business-wide) / unknown slug → `[]` in `apps/api/src/modules/time-block/time-block.service.spec.ts`
- [x] T008 [P] [US1] e2e: public `timeBlocks` read by slug (empty then populated) in `apps/api/src/modules/time-block/time-block.e2e.spec.ts`

### Implementation for User Story 1

- [x] T009 [US1] Implement `TimeBlockService.list(scope, specialistId)` (resolve `tenantId`/`tenantSlug`; unknown slug → `[]`; order by `startAt asc`; specialist filter includes business-wide) in `apps/api/src/modules/time-block/time-block.service.ts`
- [x] T010 [US1] Implement the public `timeBlocks(tenantId, tenantSlug, specialistId)` query in `apps/api/src/modules/time-block/time-block.resolver.ts`

**Checkpoint**: User Story 1 is functional and independently testable (MVP).

---

## Phase 4: User Story 2 - Add a time block (Priority: P1)

**Goal**: Authenticated, tenant-scoped add with range validation and specialist ownership.

**Independent Test**: With a tenant token, add a valid block → it appears; anonymous → `UNAUTHENTICATED`; `endAt <= startAt` or malformed instants → `VALIDATION_ERROR`; foreign `specialistId` → rejected.

### Tests for User Story 2 ⚠️

- [x] T011 [P] [US2] Unit tests add: valid persists; anonymous/non-tenant → `UNAUTHENTICATED`; `endAt <= startAt`/malformed → `VALIDATION_ERROR`; foreign specialist → rejected; `reason` > 200 → `VALIDATION_ERROR` in `apps/api/src/modules/time-block/time-block.service.spec.ts`
- [x] T012 [P] [US2] e2e: anonymous add → `UNAUTHENTICATED`; authenticated round-trip; invalid range → `VALIDATION_ERROR` in `apps/api/src/modules/time-block/time-block.e2e.spec.ts`

### Implementation for User Story 2

- [x] T013 [US2] Implement `TimeBlockService.add(user, input)` — `requireTenant` (no scope → `UNAUTHENTICATED`); validate `startAt`/`endAt` are valid ISO instants with `endAt > startAt`; validate optional `specialistId` belongs to the tenant; `reason` ≤ 200 chars (trim; empty → null) in `apps/api/src/modules/time-block/time-block.service.ts`
- [x] T014 [US2] Implement the `addTimeBlock(input)` mutation with `@RequireAuth()` + `@AuthUser` in `apps/api/src/modules/time-block/time-block.resolver.ts`

**Checkpoint**: User Stories 1 and 2 both work independently.

---

## Phase 5: User Story 3 - Remove a time block (Priority: P2)

**Goal**: Authenticated, tenant-scoped removal; foreign/missing id → `NOT_FOUND`.

**Independent Test**: Remove an owned block → `true` and it disappears; a foreign id → `NOT_FOUND` and the record remains; anonymous → `UNAUTHENTICATED`.

### Tests for User Story 3 ⚠️

- [x] T015 [P] [US3] Unit tests remove: owned → `true`; foreign/missing → `NOT_FOUND` (record intact); anonymous → `UNAUTHENTICATED` in `apps/api/src/modules/time-block/time-block.service.spec.ts`

### Implementation for User Story 3

- [x] T016 [US3] Implement `TimeBlockService.remove(user, id)` (tenant-scoped delete; not removed → `NOT_FOUND`) in `apps/api/src/modules/time-block/time-block.service.ts`
- [x] T017 [US3] Implement the `removeTimeBlock(id)` mutation with `@RequireAuth()` + `@AuthUser` in `apps/api/src/modules/time-block/time-block.resolver.ts`

**Checkpoint**: All user stories are independently functional.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [x] T018 Sync the versioned codegen schema snapshot with the new SDL (regenerate from the running API `schema.gql`) — `apps/book/codegen.schema.gql`
- [x] T019 Run and pass API gates: `npm run typecheck -w @foundly/api`, `npm run test -w @foundly/api`, `npm run lint -w @foundly/api`, `npm run build -w @foundly/api` — `apps/api/package.json`
- [x] T020 Execute the `quickstart.md` scenarios and confirm the expected outcomes — `specs/api/014-availability-time-blocks/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: none.
- **Foundational (Phase 2)**: after Setup — BLOCKS all user stories.
- **US1/US2/US3**: after Foundational. `time-block.service.ts`/`time-block.resolver.ts` are shared files edited sequentially in priority order (US1 → US2 → US3).
- **Polish (Phase 6)**: after the desired stories; T018 also unblocks the Book feature `015`.

### Parallel Opportunities

- T002, T003, T004, T005 are `[P]` (different files).
- Test tasks are `[P]` (different files): T007/T008, T011/T012, T015.

---

## Parallel Example: User Story 1

```bash
# Launch the US1 test tasks together (different files):
Task: "Unit list tests in apps/api/src/modules/time-block/time-block.service.spec.ts"
Task: "e2e public read in apps/api/src/modules/time-block/time-block.e2e.spec.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1)

1. Phase 1 Setup → Phase 2 Foundational.
2. Phase 3 (US1) → validate the public read independently.
3. Then US2 (add) and US3 (remove).

### Incremental Delivery

1. Setup + Foundational → entity + types + seam ready.
2. US1 → public read (enables the booking flow to consume blocks).
3. US2 → add; US3 → remove.
4. Phase 6 → snapshot synced + gates green.

---

## Notes

- `[P]` = different files, no dependencies.
- Constraint values quoted from `data-model.md` (`endAt` strictly after `startAt`; valid ISO-8601 instants; `reason` ≤ 200 chars; `specialistId` must belong to the tenant).
- Reads are public; writes are authenticated and tenant-scoped.
- Environment note: if WDAC blocks the unsigned `@swc/core` addon, run the API `test` gate where that policy is absent (typecheck and direct unit specs are unaffected).
