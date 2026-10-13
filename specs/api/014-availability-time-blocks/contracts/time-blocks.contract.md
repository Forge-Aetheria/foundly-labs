# Contract — Availability Time Blocks GraphQL Surface

**Feature**: `specs/api/014-availability-time-blocks` · **Surface**: `POST {API_URL}/graphql`

Blocks are public to read (needed by the public booking flow); writes require a Supabase access token (bearer) and are tenant-scoped from the verified identity.

## Types

```graphql
type TimeBlockObject {
  id: ID!
  tenantId: String!
  specialistId: String        # null = business-wide
  startAt: String!
  endAt: String!
  reason: String
}

input AddTimeBlockInput {
  tenantId: ID
  tenantSlug: String
  specialistId: ID
  startAt: String! = ""
  endAt: String! = ""
  reason: String
}
```

## Operations

### `query timeBlocks(tenantId: ID, tenantSlug: String, specialistId: ID): [TimeBlockObject!]!` — public

- **Scope**: by `tenantId` **or** `tenantSlug` (at least one required).
- **Behavior**: returns the tenant's blocks ordered by `startAt asc`. With `specialistId`, returns that specialist's blocks **plus** business-wide blocks. Unknown `tenantSlug` → `[]`. Missing both references → `VALIDATION_ERROR`.
- **Auth**: none.

### `mutation addTimeBlock(input: AddTimeBlockInput!): TimeBlockObject!` — authenticated

- **Auth**: valid, tenant-bound bearer (`@RequireAuth`).
- **Scope**: persists under `ctx.user.tenantId` (client-supplied tenant is ignored).
- **Validation**: `startAt`/`endAt` valid ISO instants with `endAt > startAt`; optional `specialistId` must belong to the tenant; optional `reason` ≤ 200 chars.
- **Errors**: `UNAUTHENTICATED` (no/invalid token or no tenant scope) · `VALIDATION_ERROR` (bad range/instant, foreign specialist, over-length reason).

### `mutation removeTimeBlock(id: ID!): Boolean!` — authenticated

- **Auth**: valid, tenant-bound bearer.
- **Scope**: deletes only if the block belongs to `ctx.user.tenantId`.
- **Errors**: `UNAUTHENTICATED` · `NOT_FOUND` (missing or foreign id — no existence oracle).

## Error codes (standardized envelope)

| Situation | Code |
|---|---|
| Anonymous / invalid / non-tenant-bound token on a write | `UNAUTHENTICATED` |
| Invalid/missing instants, `endAt <= startAt`, foreign specialist, over-length reason | `VALIDATION_ERROR` |
| Remove of a missing or foreign block (by id) | `NOT_FOUND` |
| Unknown slug on read | `[]` (empty list, not an error) |

## Tenant isolation guarantees

1. Writes never read a tenant identifier from the client payload as the authority.
2. Reads are scoped by the provided business reference; blocks are public by design.
3. By-id writes are scoped to the caller's tenant; a foreign id behaves as not-found and leaves the record untouched.
4. A named specialist must belong to the caller's tenant.
