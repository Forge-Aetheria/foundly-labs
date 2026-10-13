# Phase 1 — Data Model: Foundly Book — Profile, Policies & Reviews

**Feature**: `specs/book/014-profile-policies-reviews` · **Date**: 2026-10-13

The client does not own persistence; it models the API's profile/review data and the domain types already used by the mini-site.

## Domain types (client) — `shared/types/tenancy.ts` (existing)

### `Tenant` (business)

| Field | Type | Notes |
|---|---|---|
| `name` / `category` | `string` | Identity (editable) |
| `slug` | `string` | Public URL (editable, unique) |
| `bio` | `string \| null` | "About" |
| `address` / `phone` | `string \| null` | Contact |
| `social` | `{ instagram?; whatsapp? } \| null` | Networks |
| `avatar` / `cover` | `string \| null` | Logo / cover |
| `gallery?` | `GalleryPhoto[]` | (feature 013) |
| `businessHours` | `BusinessHours[]` | read-only summary |
| `policies?` | `PortalPolicy[]` | reservation/cancellation entries |

### `PortalPolicy`

| Field | Type | Notes |
|---|---|---|
| `id` | `string` | Synthesized from the server list index (server has no id) |
| `tenantId` | `string` | From the profile |
| `title` / `body` | `string` | Entry content |

### `Review`

| Field | Type | Notes |
|---|---|---|
| `id` | `string` | |
| `tenantId` | `string` | Owning business |
| `author` | `string` | |
| `rating` | `number` | 1–5 |
| `comment` | `string` | |
| `date` | `string` | ISO date (`createdAt`) |

## Public projection — `public-booking/utils/types.ts`

- `PublicPolicyView { title; body }` (existing) ← mapped from the profile `policies`.
- `PublicReview { id; author; rating; comment; date }` (existing) ← mapped from the API reviews.
- `PublicBusinessProfile` gains real `policies`, `reviews`, `rating` (average) and `reviewCount` (fields already declared).

## Mapping (API → domain)

| API | Domain | Rule |
|---|---|---|
| `profile.policies[{title,body}]` | `PortalPolicy[]` | synthesize `id` from index; `tenantId` from profile |
| `profile.{slug,bio,address,phone,instagram,whatsapp,logo,cover}` | `Tenant` fields | `null`→`undefined`/`null` per field |
| `reviews.items[{id,author,rating,comment,createdAt}]` | `Review[]` / `PublicReview[]` | `createdAt`→`date` |
| `reviews.average` / `reviews.count` | `rating` / `reviewCount` | null average → `null` rating |

## Input models

### `updateProfileSchema` (`modules/profile/utils/schemas.ts`)

| Field | Rule |
|---|---|
| `name` / `category` | trimmed, non-empty, ≤ 120 |
| `slug` | trimmed, pattern `^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])?$` |
| `bio` | trimmed, ≤ 2000, optional |
| `address` / `phone` | trimmed, optional |
| `instagram` / `whatsapp` / `logo` / `cover` | trimmed, absolute URL, optional |
| `policies` | array of `{ title: non-empty ≤ 120, body: non-empty ≤ 2000 }`, may be empty |

### `reviewSchema` (`modules/reviews/utils/schemas.ts`)

| Field | Rule |
|---|---|
| `tenantSlug` | non-empty |
| `author` | trimmed, non-empty, ≤ 120 |
| `rating` | integer 1–5 |
| `comment` | trimmed, non-empty, ≤ 2000 |

## State

- Editor: local draft seeded from the server profile; saved only on a successful Server Action; field errors inline; server errors via `ApiErrorDialog`.
- Public reviews: list + aggregate from the server; submitting a review appends the server-confirmed review and refreshes the displayed rating.
