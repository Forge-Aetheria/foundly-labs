# Quickstart — Foundly API — Business Profile, Policies & Reviews

**Feature**: `specs/api/013-profile-policies-reviews` · Runnable validation scenarios.

## Prerequisites

- `apps/api/.env` with `DATABASE_URL`, `SUPABASE_AUTH_URL`, `CORS_ORIGINS`.
- Postgres/Supabase reachable and migrated (`npm run db:migrate` — applies the new `Review` migration).
- A Supabase access token with `app_metadata.tenant_id` set (obtained by signing in through the app).

## Run

```bash
npm run db:migrate -w @foundly/database
npm run dev -w @foundly/api        # http://localhost:3002/graphql
```

## Scenario 1 — Update my profile (authenticated)

Header `Authorization: Bearer <token>`.

```graphql
mutation ($input: UpdateBusinessProfileInput!) {
  updateMyBusinessProfile(input: $input) {
    id name category
    profile { slug bio address phone instagram whatsapp logo cover policies { title body } }
  }
}
# variables: { "input": { "bio": "Estudio de referencia", "address": "Calle Mayor 7",
#   "phone": "+34 612 345 678", "instagram": "https://instagram.com/estudioana",
#   "policies": [{ "title": "Cancelación", "body": "Avisa con 24 h." }] } }
```

**Expected**: the returned aggregate reflects the changes; a reload/`tenant(slug:)` shows them persisted.

## Scenario 2 — Profile update guards

- Anonymous `updateMyBusinessProfile` → error `extensions.code = "UNAUTHENTICATED"`, `data: null`.
- `slug: "admin"` (reserved) or malformed → `VALIDATION_ERROR`; previous slug preserved.
- `instagram: "not-a-url"` → `VALIDATION_ERROR`.
- A slug already used by another business → `CONFLICT`.

## Scenario 3 — Public profile read

```graphql
query { tenant(slug: "<my-slug>") { name category profile { bio address phone instagram whatsapp policies { title body } } } }
```

**Expected**: identity, contact/social, "About" and the policies list are returned.

## Scenario 4 — Reviews read + aggregate (public)

```graphql
query { reviews(tenantSlug: "<my-slug>") { items { id author rating comment createdAt } average count } }
```

**Expected**: `items` (newest first), `average` and `count`; empty business → `{ items: [], average: null, count: 0 }`.

## Scenario 5 — Submit a review (public visitor)

```graphql
mutation ($input: AddReviewInput!) { addReview(input: $input) { id author rating comment } }
# variables: { "input": { "tenantSlug": "<my-slug>", "author": "Lucía", "rating": 5, "comment": "Genial" } }
```

**Expected**: the review is created and then appears in Scenario 4; `rating: 9` or empty `comment` → `VALIDATION_ERROR`; unknown slug → `NOT_FOUND`.

## Automated checks

```bash
npm run typecheck -w @foundly/api
npm run test -w @foundly/api        # unit (service/resolver) + e2e (AppModule + local JWKS + memory store)
npm run lint -w @foundly/api
npm run build -w @foundly/api
```

> Environment note (resolved 2026-10-13): the API test transform no longer uses SWC — `apps/api/vitest.config.ts` compiles TypeScript with the pure-JS TypeScript compiler (`ts.transpileModule`), so the previous WDAC block on the unsigned `@swc/core` addon no longer applies and the full suite runs locally.
