# Contract — Review Moderation GraphQL Surface

**Feature**: `specs/api/015-review-moderation` · **Surface**: `POST {API_URL}/graphql`

The public read/submission stay credential-free (as in `013`); the admin read and the moderation writes require a Supabase access token (bearer) and are tenant-scoped from the verified identity.

## Types

```graphql
enum ReviewState {
  pending
  approved
  rejected
}

type ReviewObject {
  id: ID!
  author: String!
  rating: Int!
  comment: String!
  state: ReviewState!   # NEW
  createdAt: String!
}

type ReviewSummaryObject {
  items: [ReviewObject!]!   # public: approved only
  average: Float            # public: over approved only
  count: Int!               # public: approved only
}
```

## Operations

### `query reviews(tenantId: ID, tenantSlug: String): ReviewSummaryObject!` — public (changed behavior)

- **Scope**: by `tenantId` **or** `tenantSlug`.
- **Behavior**: returns **only `approved`** reviews (newest first); `average`/`count` computed over approved only. A business with no approved reviews → `{ items: [], average: null, count: 0 }`. Unknown slug → empty (no error).
- **Auth**: none.

### `mutation addReview(input: AddReviewInput!): ReviewObject!` — public (unchanged shape, new default)

- **Behavior**: creates a review with `state = 'pending'`. Validation unchanged from `013` (author required ≤ 120, rating integer 1–5, comment required ≤ 2000).
- **Auth**: none.

### `query myReviews(state: ReviewState): [ReviewObject!]!` — authenticated

- **Auth**: valid, tenant-bound bearer (`@RequireAuth`).
- **Scope**: `ctx.user.tenantId`; an optional `state` filters the result.
- **Behavior**: returns **all** of the caller's business reviews (any state) unless filtered, newest first.
- **Errors**: `UNAUTHENTICATED` (no/invalid token or no tenant scope).

### `mutation setReviewState(id: ID!, state: ReviewState!): ReviewObject!` — authenticated

- **Auth**: valid, tenant-bound bearer.
- **Scope**: updates only if the review belongs to `ctx.user.tenantId`.
- **Validation**: `state ∈ { approved, rejected }`; `pending` → `VALIDATION_ERROR`.
- **Idempotency**: setting the current state again succeeds and returns the row.
- **Errors**: `UNAUTHENTICATED` · `VALIDATION_ERROR` (`pending`) · `NOT_FOUND` (missing or foreign id).

### `mutation deleteReview(id: ID!): Boolean!` — authenticated

- **Auth**: valid, tenant-bound bearer.
- **Scope**: deletes only if the review belongs to `ctx.user.tenantId`.
- **Errors**: `UNAUTHENTICATED` · `NOT_FOUND` (missing or foreign id — no existence oracle).

## Error codes (standardized envelope)

| Situation | Code |
|---|---|
| Anonymous / invalid / non-tenant-bound token on admin read or moderation | `UNAUTHENTICATED` |
| `setReviewState` target `pending` | `VALIDATION_ERROR` |
| `setReviewState` / `deleteReview` of a missing or foreign review (by id) | `NOT_FOUND` |
| Public read with an unknown slug | empty result (not an error) |
| Public read of a business with no approved reviews | empty result + `average: null`, `count: 0` |

## Tenant isolation guarantees

1. Writers never read a tenant identifier from the client payload as the authority (`ctx.user.tenantId` is the only source).
2. Public reads expose **only** `approved` reviews; pending/rejected content never leaves the tenant boundary.
3. By-id writes are scoped to the caller's tenant; a foreign id behaves as not-found and leaves the record untouched.
4. The admin read cannot be scoped to another business via arguments (no tenant argument at all).
