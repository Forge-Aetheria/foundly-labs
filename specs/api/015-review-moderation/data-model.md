# Phase 1 — Data Model: Foundly API — Review Moderation

**Feature**: `specs/api/015-review-moderation` · **Date**: 2026-10-13

## Persistence entity (Prisma — `Review` EXTENDED)

### `enum ReviewState`

| Value | Meaning |
|---|---|
| `pending` | Submitted, awaiting moderation (default) |
| `approved` | Publicly visible |
| `rejected` | Hidden from the public; retained for the owner |

### `Review` (existing table, +1 column)

| Field | Type | Notes |
|---|---|---|
| `id` | `String @id @default(cuid())` | Primary key (unchanged) |
| `tenantId` | `String` | Owner business (FK → `Tenant.id`) (unchanged) |
| `author` | `String` | (unchanged) |
| `rating` | `Int` | 1–5 (unchanged) |
| `comment` | `String` | (unchanged) |
| `state` | `ReviewState @default(pending)` | **NEW** moderation state |
| `createdAt` | `DateTime @default(now())` | (unchanged) |

**Relations**: `Tenant 1 ── * Review` (unchanged).
**Indexes**: keep `@@index([tenantId, createdAt])`; **add** `@@index([tenantId, state])` for filtered scoped reads.
**Migration**: one new migration — create the `ReviewState` enum, `ALTER TABLE "Review" ADD COLUMN "state" "ReviewState" NOT NULL DEFAULT 'pending'`, create the index, and `UPDATE "Review" SET "state" = 'approved'` (backfill existing rows as approved).

## GraphQL types (code-first)

### `ReviewState` (enum, registered)

```graphql
enum ReviewState { pending approved rejected }
```

### `ReviewObject` (ObjectType — EXTENDED)

| Field | GraphQL type | Source |
|---|---|---|
| `id` | `ID!` | `Review.id` |
| `author` | `String!` | `Review.author` |
| `rating` | `Int!` | `Review.rating` |
| `comment` | `String!` | `Review.comment` |
| `state` | `ReviewState!` | `Review.state` — **NEW** |
| `createdAt` | `String!` | ISO-8601 (`Review.createdAt`) |

### `ReviewSummaryObject` (ObjectType — unchanged shape)

| Field | GraphQL type | Notes |
|---|---|---|
| `items` | `[ReviewObject!]!` | **public reads: approved only** |
| `average` | `Float` | mean over approved only; `null` when none |
| `count` | `Int!` | count of approved only |

### Moderation arguments (no new input type)

- `myReviews(state: ReviewState)` — optional `state` filter (admin read).
- `setReviewState(id: ID!, state: ReviewState!)` — `state` restricted to `approved | rejected` at runtime.
- `deleteReview(id: ID!)`.

## Internal seam types

### `ReviewRow` — `reviews.store.ts` (EXTENDED)

| Field | Type | Notes |
|---|---|---|
| `id` | `string` | — |
| `tenantId` | `string` | — |
| `author` | `string` | — |
| `rating` | `number` | — |
| `comment` | `string` | — |
| `state` | `'pending' \| 'approved' \| 'rejected'` | **NEW** |
| `createdAt` | `string` | ISO |

### `ReviewsStore` (interface extension)

```ts
interface ReviewsStore {
  resolveTenantId(scope: TenantScopeInput): Promise<string | null>;
  listByTenant(tenantId: string, state?: ReviewState): Promise<ReviewRow[]>;
  create(tenantId: string, input: { author; rating; comment }): Promise<ReviewRow>; // state = pending
  setState(id: string, tenantId: string, state: ReviewState): Promise<ReviewRow | null>;
  deleteById(id: string, tenantId: string): Promise<boolean>;
}
```

`setState`/`deleteById` scope by `(id, tenantId)`; a foreign/missing id yields `null`/`false` (mapped to `NOT_FOUND`).

## Validation rules (from requirements)

- **FR-001/FR-009** — `create` persists `state = 'pending'`; no client-supplied state on submission.
- **FR-002** — public read filters `state = 'approved'`; aggregate over approved only; empty → `{ items: [], average: null, count: 0 }`.
- **FR-003** — `myReviews(state?)` filters the caller's tenant only; optional state narrows.
- **FR-004** — `setReviewState` accepts only `approved`/`rejected`; `pending` → `VALIDATION_ERROR`; setting the current state again succeeds (idempotent).
- **FR-005** — `deleteReview` removes the row.
- **FR-006/FR-007** — tenant always `ctx.user.tenantId`; missing/non-tenant scope → `UNAUTHENTICATED`.
- **FR-008** — foreign/missing id on `setReviewState`/`deleteReview` → `NOT_FOUND`; row untouched.

## State transitions

| From | To | Allowed | Result |
|---|---|---|---|
| `pending` | `approved` | yes | published |
| `pending` | `rejected` | yes | hidden |
| `approved` | `rejected` | yes | hidden |
| `rejected` | `approved` | yes | published |
| any | same | yes | **no-op success** (idempotent) |
| any | `pending` | no | `VALIDATION_ERROR` |
| (new) | `pending` | yes | created by submission |

## Derived / served projections

- **Public** (`reviews`): `items` = approved rows (newest first), `average`/`count` over approved.
- **Admin** (`myReviews`): the tenant's rows in any state (optionally filtered), newest first.
- **Consumer side (Book `016`)**: admin moderation list with `state` per review; public page shows only approved. The Book maps `ReviewState` to its moderation badges/actions (see `specs/book/016-admin-ux-hardening`).
