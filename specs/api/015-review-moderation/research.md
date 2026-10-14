# Phase 0 — Research: Foundly API — Review Moderation

**Feature**: `specs/api/015-review-moderation` · **Date**: 2026-10-13

All Technical Context unknowns are resolved below (no `NEEDS CLARIFICATION` remained).

## R1 — Moderation state as a first-class field on `Review`

- **Decision**: Add a `state` column to the existing `Review` model with a dedicated Prisma enum `ReviewState { pending, approved, rejected }` (default `pending`). Do **not** model moderation as a separate table or a JSON blob.
- **Rationale**: The state is a scalar attribute of a review with a fixed vocabulary; a column + enum gives indexed filtering, a DB-level default and a single-row update. A `ReviewModeration` side table would add a join for no benefit; a JSON blob would lose type safety and indexing.
- **Alternatives considered**: Separate `ReviewModeration` table — rejected (1:1, adds joins). Status stored as free `String` — rejected (no vocabulary guarantee).

## R2 — Publication model: new submissions are `pending`; the public read shows only `approved`

- **Decision**: `addReview` keeps its public, unauthenticated behavior but creates rows in `pending`. The public `reviews` query returns only `approved` rows and computes `average`/`count` over `approved` only (empty list + `average: null`, `count: 0` when none).
- **Rationale**: Matches the requested "aprobar/filtrar/eliminar" workflow and FR-001/FR-002/FR-009; a business with only pending/rejected reviews shows a clean empty state, never an error.
- **Alternatives considered**: Publish immediately and hide on reject — rejected (any submitted content would be public before review; the spec explicitly chooses moderation-first). Keep `013` behavior — superseded by this feature.

## R3 — Admin read authorization & scope

- **Decision**: Add `myReviews(state: ReviewState)` requiring `@RequireAuth`; the tenant is `requireTenant(user)` (`ctx.user.tenantId`) and the optional `state` filters the caller's reviews. Mirrors `catalog.myServices`.
- **Rationale**: Only the owner may see unapproved content; the tenant must come from the verified identity, never from an argument (FR-006/FR-007).
- **Alternatives considered**: Public read of all states — rejected (leaks unmoderated content).

## R4 — Moderation state transition

- **Decision**: A single `setReviewState(id: ID!, state: ReviewState!)` mutation sets the state to `approved` or `rejected`, **idempotent** for the target state (setting the current state again succeeds and returns the row). `pending` is **not** an accepted moderation target (`VALIDATION_ERROR`).
- **Rationale**: FR-004; a single operation covers approve/reject and is naturally idempotent via an update-by-(id, tenantId) that returns the row. Rejecting `pending` prevents re-opening a moderated review.
- **Alternatives considered**: Separate `approveReview`/`rejectReview` — rejected (duplicate logic). Allow `pending` — rejected (not a moderation action; would let clients reset state).

## R5 — Deletion semantics

- **Decision**: `deleteReview(id: ID!)` hard-deletes the row scoped by `(id, ctx.user.tenantId)`; returns `true` on success, `NOT_FOUND` when the id is missing **or** belongs to another tenant (no existence oracle), `UNAUTHENTICATED` when there is no tenant scope.
- **Rationale**: FR-005/FR-008; mirrors `removeTimeBlock` and gallery removal.
- **Alternatives considered**: Soft delete via a `deleted` state — deferred (the spec allows removal "for good"; a fourth state is out of scope).

## R6 — Persistence seam extension

- **Decision**: Extend the existing `ReviewsStore` interface: `listByTenant(tenantId, state?)` (used by both the admin read and, with `state = approved`, the public aggregate), `setState(id, tenantId, state): Promise<ReviewRow | null>`, and `deleteById(id, tenantId): Promise<boolean>`. `ReviewRow` gains `state`. `PrismaReviewsStore` and `createMemoryReviewsStore()` implement the same contract.
- **Rationale**: Keeps the single, already-ratified seam and the DB-free specs; consistent with `CATALOG_STORE`/`GALLERY_STORE`/`TIME_BLOCK_STORE`.
- **Alternatives considered**: Direct Prisma in the service — rejected (harder to test, diverges).

## R7 — Migration & backfill

- **Decision**: One migration adds the `ReviewState` enum, the `state` column (`NOT NULL DEFAULT 'pending'`) and the index `@@index([tenantId, state])`; existing rows are backfilled to `approved` so already-published content stays public. Generate with `prisma migrate diff` (live DB → schema) and apply with `prisma migrate deploy`, then regenerate the client.
- **Rationale**: Preserves existing published reviews (spec Assumptions); avoids a shadow DB (managed Postgres), consistent with the `013`/`014` migrations.
- **Alternatives considered**: Backfill pending — rejected (would silently hide existing published content). Drop & recreate — rejected (destructive).

## R8 — Enum representation & codegen

- **Decision**: Register the code-first enum `ReviewState` (values `pending | approved | rejected`, lower-case to match the spec vocabulary) via `registerEnumType(ReviewState, { name: 'ReviewState' })`, and expose `state` on `ReviewObject`. Sync the versioned SDL snapshot `apps/book/codegen.schema.gql` for `book 016`.
- **Rationale**: The spec and the Book UI use the lower-case vocabulary; GraphQL permits lower-case enum values. A single shared enum keeps API and client aligned, codegen-only DTOs (constitution §5.VI).
- **Alternatives considered**: Upper-case GraphQL values mapped from a lower-case Prisma enum — rejected (pointless mapping churn across API + Book).

## R9 — Error envelope

- **Decision**: Reuse `validationError` / `notFoundError` from `shared/tenant-scope` and the `UNAUTHENTICATED` scope error used by `catalog` (`scopeError()` for a missing tenant). Public read of a business with no approved reviews → empty (never an error). Unknown slug → empty.
- **Rationale**: Single, stable, already-normalized contract; matches `013`/`014`.
- **Alternatives considered**: New moderation-specific codes — rejected (would break the standardized envelope and the Book error mapping).
