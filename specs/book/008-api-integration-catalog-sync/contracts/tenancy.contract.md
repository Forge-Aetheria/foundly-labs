# Contract: Tenancy (business create + public portal read)

**Feature**: `specs/book/008-api-integration-catalog-sync` | **Date**: 2026-10-12

## Operations (public — no bearer required today)

### `createTenant`

| Item      | Detail                                                                  |
| --------- | ----------------------------------------------------------------------- |
| Type      | Mutation                                                                |
| Variables | `{ input: CreateTenantInput! }`                                         |
| Returns   | `TenantObject!`                                                         |

`CreateTenantInput`: `name: String!`, `category: String!`, `timezone: String!`,
`currency: String?` (default `EUR`), `profile: BusinessProfileInput!` where
`BusinessProfileInput`: `slug: String!`, `bio/address/phone/instagram/whatsapp/logo/cover: String?`,
`brandColors/policies: String?` (JSON text).

### `tenant`

| Item      | Detail                                                      |
| --------- | ----------------------------------------------------------- |
| Type      | Query                                                       |
| Variables | `{ slug: String! }`                                         |
| Returns   | `TenantObject` (null when not found)                        |

`TenantObject`: `id, name, category, status, timezone, currency`, `profile: BusinessProfileObject?`,
`services: [ServiceObject!]!` (name, description, durationMinutes, priceCents, currency, category,
active).

## Slug rules

- Pattern `^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])?$`; reserved slugs rejected (`admin`, `onboarding`,
  `api`, `www`, `app`, `public`, `static`, `assets`).
- Duplicate → `CONFLICT` ("Slug already taken").

## Onboarding flow (ownership binding)

Used by `createBusiness` server action (see [session-auth.contract.md](./contracts/session-auth.contract.md)):

```text
local draft (idempotent by draftId) → createTenant(input) → bind tenant_id (admin updateUserById, merge) → refreshSession()
```

- The action is idempotent: same `draftId` produces one provision; duplicates are guarded locally via
  `OnboardingProvision` semantics.
- Result shapes map into the book `Tenant` type per [data-model.md](../data-model.md) §1.

## Public portal read (`getPublicBusiness(slug)`)

- Authoritative fields from `tenant(slug)`: `name`, `category`, `status` (must be `active`),
  `profile.*` (slug, bio, address, phone, instagram, whatsapp, logo, cover).
- Local merge (unchanged rendering): `gallery`, `reviews`, `policies`, `businessHours`,
  `isPublic` — read from the in-memory seam until those domains migrate.
- If `tenant(slug)` returns null or unmigrated fields are missing, the portal renders with the local
  data it already has (graceful degradation per FR-006/FR-007).

## Admin tenancy seam

- `getCurrentTenant(session)` builds a book `Tenant` from the session's `tenantId` + authoritative
  `tenant`/catalog data; the id always comes from the session claim (never the URL).
- Session absent or not tenant-bound → `UNAUTHENTICATED` → redirect `/onboarding` (unchanged UI
  behaviour).