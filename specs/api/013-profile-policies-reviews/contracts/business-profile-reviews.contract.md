# Contract — Business Profile Update & Reviews GraphQL Surface

**Feature**: `specs/api/013-profile-policies-reviews` · **Surface**: `POST {API_URL}/graphql`

Profile reads are public (existing `tenant`/`tenants`); the profile **update** is authenticated and tenant-scoped; **reviews** are public read + public submission (visitor, no account).

## Types

```graphql
input BusinessPolicyInput { title: String!  body: String! }

input UpdateBusinessProfileInput {
  name: String
  category: String
  slug: String
  bio: String
  address: String
  phone: String
  instagram: String
  whatsapp: String
  logo: String
  cover: String
  policies: [BusinessPolicyInput!]
}

type PortalPolicyObject { title: String!  body: String! }

type ReviewObject { id: ID!  author: String!  rating: Int!  comment: String!  createdAt: String! }

type ReviewSummaryObject { items: [ReviewObject!]!  average: Float  count: Int! }

input AddReviewInput {
  tenantId: ID
  tenantSlug: String
  author: String!
  rating: Int!
  comment: String!
}
```

`BusinessProfileObject.policies` becomes `[PortalPolicyObject!]!` (was an opaque `String`); no current consumer selected it.

## Operations

### `mutation updateMyBusinessProfile(input: UpdateBusinessProfileInput!): TenantObject!` — authenticated

- **Auth**: valid, tenant-bound bearer (`@RequireAuth`).
- **Scope**: applies to `ctx.user.tenantId` only; a client-supplied tenant is never accepted.
- **Behavior**: partial update — only provided fields change (`name`/`category` on `Tenant`; the rest on `BusinessProfile`). Returns the updated aggregate.
- **Validation**: slug format/reserved/uniqueness; absolute http(s) URLs for social/images; bounded text; policies as `[{title, body}]`.
- **Errors**: `UNAUTHENTICATED` (no/invalid token or no tenant scope) · `VALIDATION_ERROR` (bad slug format/reserved, malformed URL, empty policy title/body, over-length text) · `CONFLICT` (slug already taken) · `NOT_FOUND` (profile missing).

### `query reviews(tenantId: ID, tenantSlug: String): ReviewSummaryObject!` — public

- **Scope**: by `tenantId` **or** `tenantSlug` (at least one required).
- **Behavior**: returns `{ items (newest first), average, count }`; unknown slug → `{ items: [], average: null, count: 0 }`; missing both references → `VALIDATION_ERROR`.
- **Auth**: none.

### `mutation addReview(input: AddReviewInput!): ReviewObject!` — public (visitor)

- **Auth**: none (resolved option A).
- **Scope**: attributes the review to the business resolved from `tenantId`/`tenantSlug`.
- **Validation**: `author` non-empty (≤ 120), `rating` integer 1–5, `comment` non-empty (≤ 2000).
- **Errors**: `VALIDATION_ERROR` (bad inputs / missing business reference) · `NOT_FOUND` (unknown business).
- **Note**: no moderation/rate-limiting in v1 (documented follow-up).

## Tenant isolation guarantees

1. Profile updates derive the tenant from the identity; no client-supplied tenant is trusted.
2. Reviews are attributed to the referenced business only; reads are scoped to that business.
3. Cross-business by-id access never modifies or reveals another business's records.

## Error codes (standardized envelope)

| Situation | Code |
|---|---|
| Anonymous / invalid / non-tenant-bound token on profile update | `UNAUTHENTICATED` |
| Bad slug format/reserved, malformed URL, empty policy field, over-length text, bad review input | `VALIDATION_ERROR` |
| Slug already used by another business | `CONFLICT` |
| Unknown business on review create / missing profile on update | `NOT_FOUND` |
| Unknown slug on reviews read | `{ items: [], average: null, count: 0 }` (not an error) |
