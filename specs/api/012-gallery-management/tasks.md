---
description: "Task list for Foundly API — Gallery Management"
---

# Tasks: Foundly API — Gallery Management

**Input**: Design documents from `/specs/api/012-gallery-management/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/gallery.contract.md, quickstart.md

**Tests**: Included — FR-011/FR-012 require automated coverage (unit + e2e).

**Organization**: Tasks are grouped by user story (US1 read · US2 add · US3 remove) so each story is independently implementable and testable.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: US1 · US2 · US3 (user stories from spec.md)
- Every task includes an exact file path.

## Path Conventions

- Backend: `apps/api/src/…`; the codegen schema snapshot lives at `apps/book/codegen.schema.gql`.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm there is nothing to install/migrate.

- [x] T001 Confirm no new dependencies and that the `GalleryPhoto` entity already exists (model + init migration), so no migration is created — `packages/database/prisma/schema.prisma`, `packages/database/prisma/migrations/20261012002831_init_foundly_schema/migration.sql`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Types, persistence seam and module wiring shared by all stories.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T002 [P] Create `GalleryItem` (`id: ID!`, `url: String!`, `title: String`, `description: String`, `category: String`, `order: Int!`) and `AddGalleryItemInput` (`url: String! = ""`, optional `title`/`description`/`category`) in `apps/api/src/modules/gallery/gallery.types.ts`
- [x] T003 [P] Create the `GALLERY_STORE` symbol, `GalleryStore` interface (`resolveTenantId`, `listByTenant`, `findByUrl`, `nextOrder`, `create`, `removeById`) and `PrismaGalleryStore` (maps Prisma `sortOrder` ↔ GraphQL `order`) in `apps/api/src/modules/gallery/gallery.store.ts`
- [x] T004 [P] Create the in-memory `createMemoryGalleryStore()` (with `seed`/`tenantBySlug`) in `apps/api/src/modules/gallery/gallery.test-store.ts`
- [x] T005 Create `GalleryService` scaffold and `GalleryResolver` scaffold, and register `GalleryModule` in `app.module.ts` (imports list) — `apps/api/src/modules/gallery/gallery.service.ts`, `apps/api/src/modules/gallery/gallery.resolver.ts`, `apps/api/src/modules/gallery/gallery.module.ts`, `apps/api/src/app.module.ts`

**Checkpoint**: Foundation ready — user stories can begin.

---

## Phase 3: User Story 1 - Read a business gallery (Priority: P1) 🎯 MVP

**Goal**: Public read of a business's photos by id or slug, ordered, empty-safe.

**Independent Test**: `gallery(tenantId:"no-such-tenant")` returns `[]`; after seeding, `gallery(tenantSlug:"estudio-ana")` returns the photos in order.

### Tests for User Story 1 ⚠️

- [x] T006 [P] [US1] Unit test list-by-id / list-by-slug / unknown-slug → `[]` in `apps/api/src/modules/gallery/gallery.service.spec.ts`
- [x] T007 [P] [US1] e2e test: public read by slug returns `[]` then the populated list in `apps/api/src/modules/gallery/gallery.e2e.spec.ts`

### Implementation for User Story 1

- [x] T008 [US1] Implement `GalleryService.list(scope)` (resolve `tenantId`/`tenantSlug`; unknown slug → `[]`; order by `sortOrder asc, createdAt asc`) in `apps/api/src/modules/gallery/gallery.service.ts`
- [x] T009 [US1] Implement the public `gallery(tenantId, tenantSlug)` query in `apps/api/src/modules/gallery/gallery.resolver.ts` (`apps/api/src/modules/gallery/gallery.module.ts` already wired in T005)

**Checkpoint**: User Story 1 is functional and independently testable (MVP).

---

## Phase 4: User Story 2 - Add a photo to my gallery (Priority: P1)

**Goal**: Authenticated, tenant-scoped add with URL validation, dedupe and display order.

**Independent Test**: With a tenant token, add a valid photo → it appears; anonymous add → `UNAUTHENTICATED`; duplicate URL in the same tenant → `CONFLICT`; invalid URL → `VALIDATION_ERROR`.

### Tests for User Story 2 ⚠️

- [x] T010 [P] [US2] Unit tests add valid / anonymous (`UNAUTHENTICATED`) / duplicate (`CONFLICT`) / invalid URL (`VALIDATION_ERROR`) / category normalization in `apps/api/src/modules/gallery/gallery.service.spec.ts`
- [x] T011 [P] [US2] Resolver test: `addGalleryItem` scopes from `ctx.user` and rejects an identity without a tenant in `apps/api/src/modules/gallery/gallery.resolver.spec.ts`
- [x] T012 [P] [US2] e2e tests: anonymous add → `UNAUTHENTICATED`; ownership round-trip; duplicate → `CONFLICT`; invalid → `VALIDATION_ERROR` in `apps/api/src/modules/gallery/gallery.e2e.spec.ts`

### Implementation for User Story 2

- [x] T013 [US2] Implement `GalleryService.add(user, input)` with `requireTenant` (missing scope → `UNAUTHENTICATED`); enforce `url` required and absolute `http(s)`, `title` ≤ 200 chars, `description` ≤ 2000 chars, `category` ∈ {`local`,`trabajos`,`equipo`} (normalized, trim, empty→null); duplicate URL within the tenant → `CONFLICT`; assign `order = max(sortOrder)+1` in `apps/api/src/modules/gallery/gallery.service.ts`
- [x] T014 [US2] Implement the `addGalleryItem(input)` mutation with `@RequireAuth()` + `@AuthUser` and `@Args('input', { type: () => AddGalleryItemInput })` in `apps/api/src/modules/gallery/gallery.resolver.ts`

**Checkpoint**: User Stories 1 and 2 both work independently.

---

## Phase 5: User Story 3 - Remove a photo from my gallery (Priority: P2)

**Goal**: Authenticated, tenant-scoped removal; foreign/missing id → `NOT_FOUND`.

**Independent Test**: Remove an owned photo → `true` and it disappears; removing a foreign id → `NOT_FOUND` and the record remains; anonymous → `UNAUTHENTICATED`.

### Tests for User Story 3 ⚠️

- [x] T015 [P] [US3] Unit tests remove owned / foreign (`NOT_FOUND`, record intact) / anonymous (`UNAUTHENTICATED`) in `apps/api/src/modules/gallery/gallery.service.spec.ts`
- [x] T016 [P] [US3] Resolver test remove owned → `true` and foreign → `NOT_FOUND` in `apps/api/src/modules/gallery/gallery.resolver.spec.ts`

### Implementation for User Story 3

- [x] T017 [US3] Implement `GalleryService.remove(user, id)` (tenant-scoped `deleteMany`; not removed → `NOT_FOUND`) in `apps/api/src/modules/gallery/gallery.service.ts`
- [x] T018 [US3] Implement the `removeGalleryItem(id)` mutation with `@RequireAuth()` + `@AuthUser` in `apps/api/src/modules/gallery/gallery.resolver.ts`

**Checkpoint**: All user stories are independently functional.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Snapshot sync and gate validation.

- [x] T019 Sync the versioned codegen schema snapshot with the new SDL (regenerate from the running API `schema.gql`) — `apps/book/codegen.schema.gql`
- [x] T020 Run and pass API gates: `npm run typecheck -w @foundly/api`, `npm run test -w @foundly/api`, `npm run lint -w @foundly/api`, `npm run build -w @foundly/api` — `apps/api/package.json`
- [x] T021 Execute the `quickstart.md` scenarios against the running API and confirm the expected outcomes

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: no dependencies.
- **Foundational (Phase 2)**: after Setup — BLOCKS all user stories.
- **User Stories (Phase 3+)**: after Foundational. US1/US2/US3 can start in parallel, but `gallery.service.ts` and `gallery.resolver.ts` are shared files edited sequentially in priority order (US1 → US2 → US3).
- **Polish (Phase 6)**: after the desired stories are complete; T019 also unblocks the Book feature `013`.

### User Story Dependencies

- **US1 (P1)**: after Foundational — no dependencies.
- **US2 (P1)**: after Foundational — independent; may run after US1 to avoid same-file edits.
- **US3 (P2)**: after Foundational — independent; may run after US2 to avoid same-file edits.

### Within Each User Story

- Tests written and failing before implementation.
- Service method before its resolver operation.
- Story complete before the next priority.

### Parallel Opportunities

- T002, T003, T004 (Foundational) are `[P]` (different files).
- The test tasks in each story are `[P]` (different files): T006/T007, T010/T011/T012, T015/T016.

---

## Parallel Example: User Story 2

```bash
# Launch the US2 test tasks together (different files):
Task: "Unit tests add valid/anonymous/duplicate/invalid in apps/api/src/modules/gallery/gallery.service.spec.ts"
Task: "Resolver test addGalleryItem scope in apps/api/src/modules/gallery/gallery.resolver.spec.ts"
Task: "e2e add scenarios in apps/api/src/modules/gallery/gallery.e2e.spec.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1 Setup → Phase 2 Foundational.
2. Phase 3 (US1) → validate the public read independently.
3. Then add US2 (add) and US3 (remove) incrementally.

### Incremental Delivery

1. Setup + Foundational → foundation ready.
2. US1 → public read works (mini-site can consume it).
3. US2 → add works; US3 → remove works.
4. Phase 6 → snapshot synced + gates green.

---

## Notes

- `[P]` = different files, no dependencies.
- `[Story]` maps each task to a user story for traceability.
- Constraint values are quoted from `data-model.md` (URL absolute http(s); title ≤ 200; description ≤ 2000; category ∈ {local, trabajos, equipo}).
- Environment note (resolved 2026-10-13): the API test transform no longer uses SWC — `apps/api/vitest.config.ts` compiles TypeScript with the pure-JS TypeScript compiler (`ts.transpileModule`), so the previous WDAC block on the unsigned `@swc/core` addon no longer applies and the full `test` gate runs locally (typecheck and direct unit specs included).
