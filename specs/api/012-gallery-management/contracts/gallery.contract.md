# Contract — Gallery GraphQL Surface

**Feature**: `specs/api/012-gallery-management` · **Surface**: `POST {API_URL}/graphql`

The gallery is exposed via code-first GraphQL. Reads are public; writes require a Supabase access token (bearer) and are tenant-scoped from the verified identity.

## Types

```graphql
type GalleryItem {
  id: ID!
  url: String!
  title: String
  description: String
  category: String
  order: Int!
}

input AddGalleryItemInput {
  url: String! = ""
  title: String
  description: String
  category: String
}
```

## Operations

### `query gallery(tenantId: ID, tenantSlug: String): [GalleryItem!]!` — public

- **Scope**: by `tenantId` **or** `tenantSlug` (at least one required).
- **Behavior**: returns the tenant's photos ordered by `order` asc (then creation). Unknown `tenantSlug` → `[]`. Missing both references → `VALIDATION_ERROR` (consistent with other public reads).
- **Auth**: none.

### `mutation addGalleryItem(input: AddGalleryItemInput!): GalleryItem!` — authenticated

- **Auth**: requires a valid, tenant-bound bearer token (`@RequireAuth`).
- **Scope**: persists under `ctx.user.tenantId` (client cannot set the tenant).
- **Validation**: absolute `http(s)` URL; title ≤ 200; description ≤ 2000; category ∈ {local, trabajos, equipo}.
- **Ordering**: `order = max(existing sortOrder) + 1`.
- **Errors**: `UNAUTHENTICATED` (no/invalid token or no tenant scope) · `VALIDATION_ERROR` (bad input) · `CONFLICT` (duplicate URL in the same tenant).

### `mutation removeGalleryItem(id: ID!): Boolean!` — authenticated

- **Auth**: requires a valid, tenant-bound bearer token.
- **Scope**: deletes only if the photo belongs to `ctx.user.tenantId`.
- **Errors**: `UNAUTHENTICATED` (no/invalid token or no tenant scope) · `NOT_FOUND` (missing or foreign id — no existence oracle).

## Error codes (standardized envelope)

| Situation | Code |
|---|---|
| Anonymous / invalid / non-tenant-bound token on a write | `UNAUTHENTICATED` |
| Empty, non-absolute or non-http(s) URL; bad category; over-length fields | `VALIDATION_ERROR` |
| Duplicate URL within the same tenant | `CONFLICT` |
| Remove of a missing or foreign photo (by id) | `NOT_FOUND` |
| Unknown slug on read | `[]` (empty list, not an error) |

## Tenant isolation guarantees

1. Writes never read a tenant identifier from the client payload.
2. Reads are scoped by the provided business reference; gallery content is public by design.
3. By-id writes are scoped to the caller's tenant; a foreign id behaves as not-found and leaves the record untouched.
4. The same URL may exist in different tenants (dedupe is per-tenant).
