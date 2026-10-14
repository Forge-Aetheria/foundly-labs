# Quickstart — Foundly API — Review Moderation

**Feature**: `specs/api/015-review-moderation` · Runnable validation scenarios.

## Prerequisites

- `apps/api/.env` with `DATABASE_URL`, `SUPABASE_AUTH_URL`, `CORS_ORIGINS`.
- Postgres/Supabase reachable and migrated (`npm run db:migrate -w @foundly/database` — applies the `state` column + backfill).
- A Supabase access token with `app_metadata.tenant_id` set (obtained by signing in through the app).

## Run

```bash
npm run db:migrate -w @foundly/database
npm run dev -w @foundly/api        # http://localhost:3002/graphql
```

## Scenario 1 — A submitted review is pending (hidden)

```graphql
mutation { addReview(input: { tenantSlug: "<my-slug>", author: "Ana", rating: 5, comment: "Genial" }) { id state } }
```

**Expected**: `state = "pending"`. Then:

```graphql
query { reviews(tenantSlug: "<my-slug>") { items { id } average count } }
```

**Expected**: the new review is **absent**; `average: null`, `count: 0` (if no approved reviews).

## Scenario 2 — The owner sees all states (admin read)

```graphql
query { myReviews { id state author } }
```

**Expected**: the pending review is returned (any state). Anonymous (no bearer) → `UNAUTHENTICATED`.

```graphql
query { myReviews(state: pending) { id state } }
```

**Expected**: only pending reviews.

## Scenario 3 — Approve (idempotent) makes it public

```graphql
mutation { setReviewState(id: "<review-id>", state: approved) { id state } }
```

**Expected**: `state = "approved"`. Re-running the same mutation → still succeeds (`state = "approved"`). Then `reviews(tenantSlug: "<my-slug>")` includes it and `count`/`average` reflect it.

## Scenario 4 — Reject hides it

```graphql
mutation { setReviewState(id: "<review-id>", state: rejected) { id state } }
```

**Expected**: `state = "rejected"`; the review disappears from `reviews` and from the aggregate. `setReviewState(id, pending)` → `VALIDATION_ERROR`.

## Scenario 5 — Delete

- `deleteReview(id: "<mine>")` → `true`; a second call → `NOT_FOUND`.
- With a token bound to another tenant, `deleteReview(id: "<mine>")` → `NOT_FOUND` and the record remains.
- Anonymous → `UNAUTHENTICATED`.

## Scenario 6 — Cross-tenant isolation

- With a token bound to tenant B, `myReviews` returns only B's reviews (never A's).
- `setReviewState`/`deleteReview` on one of A's review ids → `NOT_FOUND` and A's review is intact.

## Automated checks

```bash
npm run typecheck -w @foundly/api
npm run test -w @foundly/api        # unit + e2e (AppModule + local JWKS + memory store)
npm run lint -w @foundly/api
npm run build -w @foundly/api
```

> Environment note: the API test transform no longer uses SWC — `apps/api/vitest.config.ts` compiles TypeScript with the pure-JS TypeScript compiler (`ts.transpileModule`), so the suite runs locally on Windows.
