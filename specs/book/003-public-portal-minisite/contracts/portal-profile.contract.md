# Contract: Portal Profile (public data surface)

**Feature**: `specs/book/003-public-portal-minisite/` | **Date**: 2026-10-09 | **Amended**: 2026-10-10 (provider landing)

Defines the read surface of the public provider landing. All data flows through
`apps/book/src/features/public-booking/queries.ts` and MUST respect tenant status (FR-016).

## Resolve result

`getPublicBusiness(slug)` returns:

| Outcome   | Shape                                                                                             |
| --------- | ------------------------------------------------------------------------------------------------- |
| available | `PublicBusinessProfile` (below)                                                                    |
| unavailable | `{ status: 'unavailable'; reason: 'not-found' \| 'draft' \| 'suspended' }`                    |

## PublicBusinessProfile

| Field          | Type                                                                     | Source                          |
| -------------- | ------------------------------------------------------------------------ | ------------------------------- |
| `slug`         | string                                                                   | `Tenant.slug`                   |
| `name`         | string                                                                   | `Tenant.name`                   |
| `category`     | string                                                                   | `Tenant.category`               |
| `cover`        | string \| null                                                           | `Tenant.cover`                  |
| `avatar`       | string \| null                                                           | explicit `Tenant.avatar`        |
| `bio`          | string \| null                                                           | `Tenant.bio`                    |
| `address`      | string \| null                                                           | `Tenant.address`                |
| `phone`        | string \| null                                                           | `Tenant.phone`                  |
| `social`       | `{ instagram?: string; whatsapp?: string } \| null`                      | `Tenant.social`                 |
| `services`     | `{ id, name, description, durationMinutes, priceCents, currency, category }[]` | `Service` + current `Rate` + `Service.category` |
| `specialists`  | `{ id, name, role, avatar, bio }[]` (active only)                        | `Resource` (+ metadata)         |
| `weeklyHours`  | `{ weekday, isOpen, startTime, endTime }[7]`                             | `Tenant.businessHours`          |
| `policies`     | `{ title, body }[]`                                                      | `PortalPolicy`                  |
| `gallery`      | `string[]` (Unsplash URLs)                                               | `Tenant.gallery`                |
| `rating`       | `number \| null` (average, 1 decimal)                                    | averaged from `Review`          |
| `reviewCount`  | `number`                                                                 | count of `Review`               |
| `reviews`      | `{ id, author, rating, comment, date }[]` (newest first)                 | `Review` store collection       |

## Review (mock content)

```ts
interface Review {
  id: string;
  tenantId: string;
  author: string;
  rating: number; // 1–5
  comment: string;
  date: string;   // ISO-8601
}
```

Rating rule: `rating = round10(reviewCount === 0 ? null : sum(reviews.rating) / reviewCount)`
(two-decimal rounding, exposed with one decimal by the UI). `reviews` are sorted newest first.

## Seed reference (FR-026)

The store seeds a full provider test business:

| Tenant | slug               | Highlights                                                              |
| ------ | ------------------ | ----------------------------------------------------------------------- |
| `estudio-ana` | `estudio-ana` | Admin/onboarding seed (services, specialists, policies, no gallery/reviews). |
| `rona-piercing` | `rona-piercing` | Provider landing: gallery, 3 categories/services with rates, 3 specialists, business hours, 3 policies and 5 reviews (average 4.6). |

## Rules

- Only `active` tenants resolve to `available` (FR-016); draft/suspended/unknown return `unavailable` with zero data.
- `services` excludes inactive services; `specialists` excludes inactive resources (FR-006/FR-007).
- `priceCents`/`currency` come from the current applicable rate (effective period contains "now").
- `gallery` defaults to `[]` and `rating` to `null` when the tenant has no gallery/reviews.
- Optional profile fields that are `null` are omitted by the UI rather than rendered as empty values (FR-003/FR-004).