# Phase 1 — Data Model: Foundly API — Business Profile, Policies & Reviews

**Feature**: `specs/api/013-profile-policies-reviews` · **Date**: 2026-10-13

## Persistence entities

### `BusinessProfile` (Prisma — existing, extended usage)

| Field | Type | Notes |
|---|---|---|
| `id` | `String` | PK |
| `tenantId` | `String @unique` | FK → `Tenant.id` |
| `slug` | `String @unique` | Public URL; validated (`SLUG_PATTERN`, `RESERVED_SLUGS`) |
| `bio` | `String?` | "About" description |
| `address` | `String?` | Physical address |
| `phone` | `String?` | Contact phone / WhatsApp |
| `instagram` | `String?` | Instagram URL |
| `whatsapp` | `String?` | WhatsApp link |
| `logo` | `String?` | Logo image URL |
| `cover` | `String?` | Cover image URL |
| `brandColors` | `Json?` | (existing; out of scope here) |
| `policies` | `Json?` | **Structured as** `[{ title: string, body: string }]` |
| `createdAt`/`updatedAt` | `DateTime` | timestamps |

### `Tenant` (Prisma — existing)

| Field | Type | Notes |
|---|---|---|
| `id` | `String` | PK |
| `name` | `String` | Business name (editable) |
| `category` | `String` | Vertical (editable) |
| `status` | `String` | `active` exposes the business publicly |
| `timezone`/`currency` | `String` | (existing) |
| `profile` | `BusinessProfile?` | 1:1 |
| `reviews` | `Review[]` | **new relation** |

### `Review` (Prisma — NEW)

| Field | Type | Notes |
|---|---|---|
| `id` | `String @id @default(cuid())` | PK |
| `tenantId` | `String` | FK → `Tenant.id` |
| `author` | `String` | Reviewer display name |
| `rating` | `Int` | 1–5 (enforced in service) |
| `comment` | `String` | Review text |
| `createdAt` | `DateTime @default(now())` | Ordering (newest first) |
| `tenant` | `Tenant @relation(...)` | Owner |

**Migration**: one new migration creating `Review` + FK to `Tenant`. `BusinessProfile` is unchanged (no new columns).

## GraphQL types (code-first)

### Profile update

```graphql
input BusinessPolicyInput { title: String!  body: String! }

input UpdateBusinessProfileInput {
  name: String          # Tenant.name
  category: String      # Tenant.category
  slug: String          # BusinessProfile.slug
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

# BusinessProfileObject.policies changes from String → [PortalPolicyObject!]!
```

### Reviews

```graphql
type ReviewObject {
  id: ID!
  author: String!
  rating: Int!
  comment: String!
  createdAt: String!
}

type ReviewSummaryObject {
  items: [ReviewObject!]!
  average: Float        # null when count = 0
  count: Int!
}

input AddReviewInput {
  tenantId: ID
  tenantSlug: String
  author: String!
  rating: Int!
  comment: String!
}
```

## Validation rules (from requirements)

- **Slug** (FR-005): matches `SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])?$/`, not in `RESERVED_SLUGS`, unique → else `VALIDATION_ERROR`/`CONFLICT`; previous slug preserved on failure.
- **URLs** (FR-006): `instagram`, `whatsapp`, `logo`, `cover` when present must be absolute `http(s)` URLs → else `VALIDATION_ERROR`.
- **Policies** (FR-007): zero, one or many; each entry `title` non-empty and `body` non-empty (bounded); malformed → `VALIDATION_ERROR`.
- **Reviews** (FR-010): `author` non-empty (≤ 120), `rating` integer 1–5, `comment` non-empty (≤ 2000) → else `VALIDATION_ERROR`; unknown business → `NOT_FOUND`.
- **Text bounds**: `bio` ≤ 2000; `name`/`category` bounded (≤ 120).
- **Tenant scope** (FR-004/FR-011): update uses `ctx.user.tenantId`; missing scope → `UNAUTHENTICATED`.

## State transitions

- Profile: create (onboarding) → update (this feature) — field-level, partial.
- Review: created only (append-only in v1; no edit/delete/moderate).

## Derived values

- **Aggregate rating** = average of `rating` over the business's reviews, plus `count`; `average = null` when `count = 0`.

## Public projections (client side, feature `014`)

- `Tenant` (profile identity + contact + `policies: PortalPolicy[]`).
- `Review` list + `rating`/`reviewCount` shown on the mini-site.
