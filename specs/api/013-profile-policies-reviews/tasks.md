---
description: "Task list for Foundly API — Business Profile, Policies & Reviews"
---

# Tasks: Foundly API — Business Profile, Policies & Reviews

**Input**: Design documents from `/specs/api/013-profile-policies-reviews/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/business-profile-reviews.contract.md, quickstart.md

**Tests**: Included — FR-013/FR-014 require automated coverage (unit + e2e).

**Organization**: Tasks are grouped by user story (US1 update profile · US2 public profile read · US3 reviews read · US4 review create) so each is independently implementable and testable.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: US1 · US2 · US3 · US4
- Every task includes an exact file path.

## Path Conventions

- Backend: `apps/api/src/…`; Prisma: `packages/database/prisma/…`; codegen snapshot: `apps/book/codegen.schema.gql`.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm reuse and plan the one migration.

- [x] T001 Confirm `BusinessProfile` already stores `slug/bio/address/phone/instagram/whatsapp/logo/cover/policies(Json)` (no new columns) and identify the new `Review` model/migration — `packages/database/prisma/schema.prisma`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared GraphQL types for the profile surface (used by US1 and US2).

**⚠️ CRITICAL**: No profile user story can begin until this is complete.

- [x] T002 [P] Add `PortalPolicyObject { title: String!, body: String! }` and `BusinessPolicyInput { title: String!, body: String! }`, add `UpdateBusinessProfileInput { name, category, slug, bio, address, phone, instagram, whatsapp, logo, cover, policies: [BusinessPolicyInput!] }`, and change `BusinessProfileObject.policies` from `String` to `[PortalPolicyObject!]!` in `apps/api/src/modules/tenants/tenants.types.ts`

**Checkpoint**: Profile types ready.

---

## Phase 3: User Story 1 - Update my business profile (Priority: P1) 🎯 MVP

**Goal**: Authenticated, tenant-scoped partial profile update.

**Independent Test**: With a tenant token, update fields and read them back; anonymous → `UNAUTHENTICATED`; invalid URL → `VALIDATION_ERROR`; taken slug → `CONFLICT`; only provided fields change.

### Tests for User Story 1 ⚠️

- [x] T003 [P] [US1] Unit tests `updateProfile`: valid update persists; anonymous/non-tenant → `UNAUTHENTICATED`; `instagram: "not-a-url"` → `VALIDATION_ERROR`; duplicate/reserved slug → `CONFLICT`/`VALIDATION_ERROR` preserving the old slug; partial update keeps other fields — `apps/api/src/modules/tenants/tenants.service.spec.ts`

### Implementation for User Story 1

- [x] T004 [US1] Implement `TenantsService.updateProfile(tenantId, input)` — partial update (`name`/`category` on `Tenant`; `slug/bio/address/phone/instagram/whatsapp/logo/cover/policies` on `BusinessProfile`); validate slug format `^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])?$` + `RESERVED_SLUGS` + uniqueness (`CONFLICT`, preserve previous); validate absolute http(s) URLs for `instagram`/`whatsapp`/`logo`/`cover`; `bio` ≤ 2000; `name`/`category` ≤ 120; policies `[{title, body}]` non-empty fields; serialize policies to `Json` — `apps/api/src/modules/tenants/tenants.service.ts`
- [x] T005 [US1] Implement `updateMyBusinessProfile(input: UpdateBusinessProfileInput!): TenantObject!` with `@RequireAuth()` + `@AuthUser`, scoped to `ctx.user.tenantId` — `apps/api/src/modules/tenants/tenants.resolver.ts`

**Checkpoint**: User Story 1 works independently (MVP).

---

## Phase 4: User Story 2 - Read the full public business profile (Priority: P1)

**Goal**: Public read returns structured policies and optional contact/social fields.

**Independent Test**: `tenant(slug:)` returns identity, contact/social, `bio` and `policies` (empty/one/many); optional fields empty without error.

### Tests for User Story 2 ⚠️

- [x] T006 [P] [US2] Unit tests public read: structured policies parsed from `Json` (0/1/many); optional fields null-safe — `apps/api/src/modules/tenants/tenants.service.spec.ts`

### Implementation for User Story 2

- [x] T007 [US2] Update `TenantsService.toProfileObject` to parse `policies` (Json) into `PortalPolicyObject[]` (invalid/missing → empty) and expose them via `tenant`/`tenants` — `apps/api/src/modules/tenants/tenants.service.ts`

**Checkpoint**: Public profile read returns the complete content.

---

## Phase 5: User Story 3 - Read customer reviews and rating (Priority: P2)

**Goal**: Public reviews list + aggregate rating.

**Independent Test**: `reviews(tenantSlug:)` returns items (newest first) + `average` + `count`; empty → `{items:[], average:null, count:0}`; unknown slug → same empty.

### Tests for User Story 3 ⚠️

- [x] T008 [P] [US3] Unit tests `summary`: empty / one / many, average and count, ordering newest-first — `apps/api/src/modules/reviews/reviews.service.spec.ts`
- [x] T009 [P] [US3] e2e: public `reviews` read by slug (empty then populated) — `apps/api/src/modules/reviews/reviews.e2e.spec.ts`

### Implementation for User Story 3

- [x] T010 [US3] Add Prisma `Review` model (`id cuid`, `tenantId`, `author`, `rating Int`, `comment`, `createdAt @default(now())`) + `Tenant.reviews` relation and generate a migration — `packages/database/prisma/schema.prisma`, `packages/database/prisma/migrations/<new>/migration.sql`
- [x] T011 [P] [US3] Create `ReviewObject { id, author, rating, comment, createdAt }` and `ReviewSummaryObject { items, average: Float, count: Int! }` in `apps/api/src/modules/reviews/reviews.types.ts`
- [x] T012 [P] [US3] Create the `REVIEWS_STORE` seam + `ReviewsStore` (`resolveTenantId`, `listByTenant`, `aggregate`) + `PrismaReviewsStore` in `apps/api/src/modules/reviews/reviews.store.ts`
- [x] T013 [P] [US3] Create the in-memory `createMemoryReviewsStore()` (with `seed`/`tenantBySlug`) in `apps/api/src/modules/reviews/reviews.test-store.ts`
- [x] T014 [US3] Implement `ReviewsService.summary(scope)` (latest first + average/count; unknown slug → empty) in `apps/api/src/modules/reviews/reviews.service.ts`
- [x] T015 [US3] Implement the public `reviews(tenantId, tenantSlug)` query and wire `ReviewsModule` + register it in `app.module.ts` — `apps/api/src/modules/reviews/reviews.resolver.ts`, `apps/api/src/modules/reviews/reviews.module.ts`, `apps/api/src/app.module.ts`

**Checkpoint**: Reviews read works independently.

---

## Phase 6: User Story 4 - Record a customer review (Priority: P2)

**Goal**: Public visitor review submission with validation.

**Independent Test**: `addReview` with a valid author/rating/comment → created and reflected in the summary; `rating: 9`/empty `comment` → `VALIDATION_ERROR`; unknown business → `NOT_FOUND`.

### Tests for User Story 4 ⚠️

- [x] T016 [P] [US4] Unit tests `add`: valid creates and appears; invalid rating (out of 1–5)/empty author/over-long comment → `VALIDATION_ERROR`; unknown business → `NOT_FOUND` — `apps/api/src/modules/reviews/reviews.service.spec.ts`
- [x] T017 [P] [US4] e2e: public `addReview` round-trip + validation error — `apps/api/src/modules/reviews/reviews.e2e.spec.ts`

### Implementation for User Story 4

- [x] T018 [US4] Implement `ReviewsService.add(input)` (resolve business via `tenantId`/`tenantSlug`; validate `author` non-empty ≤120, `rating` integer 1–5, `comment` non-empty ≤2000; unknown → `NOT_FOUND`) in `apps/api/src/modules/reviews/reviews.service.ts`
- [x] T019 [US4] Add `AddReviewInput { tenantId, tenantSlug, author, rating, comment }` and implement the public `addReview(input)` mutation (no `@RequireAuth`) in `apps/api/src/modules/reviews/reviews.types.ts`, `apps/api/src/modules/reviews/reviews.resolver.ts`

**Checkpoint**: All user stories work independently.

---

## Phase 7: Polish & Cross-Cutting Concerns

- [x] T020 Sync the versioned codegen schema snapshot with the new SDL (regenerate from the running API `schema.gql`) — `apps/book/codegen.schema.gql`
- [x] T021 Run and pass API gates: `npm run typecheck -w @foundly/api`, `npm run test -w @foundly/api`, `npm run lint -w @foundly/api`, `npm run build -w @foundly/api` — `apps/api/package.json`
- [x] T022 Execute the `quickstart.md` scenarios and confirm the expected outcomes — `specs/api/013-profile-policies-reviews/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: none.
- **Foundational (Phase 2)**: after Setup — blocks US1/US2 (profile types).
- **US1/US2 (Phase 3/4)**: after Foundational; share `tenants.types.ts`/`tenants.service.ts` → executed sequentially.
- **US3 (Phase 5)**: independent of the profile stories; introduces the `reviews` module + migration.
- **US4 (Phase 6)**: depends on US3 (module/service/store exist).
- **Polish (Phase 7)**: after the desired stories; T020 also unblocks the Book feature `014`.

### Parallel Opportunities

- T011, T012, T013 are `[P]` (different files).
- Test tasks within a story are `[P]` (different files): T003, T006, T008/T009, T016/T017.

---

## Parallel Example: User Story 3

```bash
# Launch the US3 preparatory files together (different files):
Task: "Create ReviewObject/ReviewSummaryObject in apps/api/src/modules/reviews/reviews.types.ts"
Task: "Create REVIEWS_STORE seam in apps/api/src/modules/reviews/reviews.store.ts"
Task: "Create in-memory store in apps/api/src/modules/reviews/reviews.test-store.ts"
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2)

1. Phase 1 Setup → Phase 2 Foundational.
2. Phase 3 (US1 update) + Phase 4 (US2 read) → the profile editor becomes real.
3. Then US3 (reviews read) and US4 (review create).

### Incremental Delivery

1. Setup + Foundational → types ready.
2. US1/US2 → editable, persistent profile.
3. US3 → public reviews + rating.
4. US4 → public review submission.
5. Phase 7 → snapshot synced + gates green.

---

## Notes

- `[P]` = different files, no dependencies.
- Constraint values quoted from `data-model.md` (slug pattern; URLs absolute http(s); bio ≤ 2000; name/category ≤ 120; author ≤ 120; rating integer 1–5; comment ≤ 2000).
- Reviews creation is **public** (resolved option A); profile updates are authenticated/tenant-scoped.
- Environment note: if WDAC blocks the unsigned `@swc/core` addon, run the API `test` gate where that policy is absent (typecheck and direct unit specs are unaffected).
