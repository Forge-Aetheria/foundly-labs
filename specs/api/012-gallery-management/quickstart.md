# Quickstart — Foundly API — Gallery Management

**Feature**: `specs/api/012-gallery-management` · Runnable validation scenarios.

## Prerequisites

- `apps/api/.env` with `DATABASE_URL`, `SUPABASE_AUTH_URL` and `CORS_ORIGINS` (see `apps/api/.env.example`).
- Postgres/Supabase reachable and migrated (`npm run db:migrate`). The `GalleryPhoto` table already exists from the init migration — no new migration is needed.
- A Supabase access token whose `app_metadata.tenant_id` is set (obtainable by signing in through the app).

## Run

```bash
npm run dev -w @foundly/api        # http://localhost:3002/graphql
```

## Scenario 1 — Public read (no credential)

```graphql
query { gallery(tenantId: "no-such-tenant") { id url order } }
```

**Expected**: `{ "data": { "gallery": [] } }` — empty list, no error.

## Scenario 2 — Anonymous write is rejected

```graphql
mutation { addGalleryItem(input: { url: "https://example.com/x.jpg" }) { id } }
```

**Expected**: error envelope with `extensions.code = "UNAUTHENTICATED"`, `data: null`.

## Scenario 3 — Authenticated round-trip (bearer token)

Header: `Authorization: Bearer <access-token>`.

```graphql
mutation ($input: AddGalleryItemInput!) {
  addGalleryItem(input: $input) { id url title category order }
}
# variables: { "input": { "url": "https://example.com/1.jpg", "title": "Fachada", "category": "local" } }
```

**Expected**: the created `GalleryItem` with `order: 0`. Then:

```graphql
query { gallery(tenantSlug: "<my-slug>") { id url order } }
```

**Expected**: the created photo appears, ordered.

## Scenario 4 — Duplicate & validation

- Re-sending the same `url` for the same tenant → `CONFLICT`.
- `{ "url": "not-a-url" }` → `VALIDATION_ERROR`.
- `{ "url": "https://example.com/2.jpg", "category": "raro" }` → `VALIDATION_ERROR`.

## Scenario 5 — Removal & isolation

- `removeGalleryItem(id: "<mine>")` → `true`; a second call → `NOT_FOUND`.
- With a token bound to another tenant, `removeGalleryItem(id: "<mine>")` → `NOT_FOUND` and the record remains.

## Automated checks

```bash
npm run typecheck -w @foundly/api
npm run test -w @foundly/api        # unit + e2e (AppModule + local JWKS + memory store)
npm run lint -w @foundly/api
npm run build -w @foundly/api
```

> Environment note: on machines where an Application Control (WDAC) policy blocks the unsigned `@swc/core` native addon used by the API test transform, run the suite where that policy is absent (or allow-list the binary). Type-checking and direct service/resolver unit specs are unaffected.
