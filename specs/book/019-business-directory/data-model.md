# Phase 1 — Data Model: Foundly Book — Public Business Directory & Discovery

**Feature**: `specs/book/019-business-directory` · **Date**: 2026-10-14

The directory owns no persistence. It consumes the public `searchBusinesses` query (`specs/api/018-business-directory`) and maps each result to a card view model. All API-facing types come from `graphql-codegen` (`shared/api/generated.ts`); the view model lives in the module.

## Consumed API shape (codegen — from api 018)

```graphql
query SearchBusinesses($query: String, $limit: Int, $offset: Int) {
  searchBusinesses(query: $query, limit: $limit, offset: $offset) {
    tenantId
    slug
    name
    category
    description
    address
    phone
    logo
    cover
    schedule { weekday startTime endTime }
  }
}
```

## View-model entities (module)

### `DirectoryBusiness` — the card view model

| Field | Type | Notes |
|---|---|---|
| `tenantId` | `string` | Identity of the business |
| `slug` | `string` | Target of "Ver perfil" (`/[tenantSlug]`) |
| `name` | `string` | Card title |
| `category` | `string` | Shown as a pill/badge |
| `description` | `string \| null` | Short description; placeholder when empty |
| `address` | `string \| null` | Location; placeholder when empty |
| `logo` | `string \| null` | Avatar/logo URL; fallback to initial-letter avatar |
| `cover` | `string \| null` | Cover image URL; neutral fallback when empty |
| `hours` | `DirectoryHoursRange[]` | General weekly schedule (may be empty) |

### `DirectoryHoursRange`

| Field | Type | Notes |
|---|---|---|
| `weekday` | `number` | 0 = Sunday … 6 = Saturday |
| `startTime` | `string` | `HH:mm` |
| `endTime` | `string` | `HH:mm` |

`utils/hours.ts` formats the ranges into a compact label (e.g. `Lun–Vie 09:00–18:00`); an empty array renders a neutral placeholder (FR-006/FR-009).

### `DirectorySearchParams`

| Field | Type | Notes |
|---|---|---|
| `q` | `string` | Current search term from the URL; trimmed; empty means "all" |

### `DirectoryState` — the view state machine

| State | Trigger | UI |
|---|---|---|
| `loading` | navigation pending (Suspense/`loading.tsx`) | skeleton cards |
| `ready` | one or more businesses returned | card grid |
| `empty` | no eligible businesses at all (no active search term) | empty-state copy |
| `noResults` | a non-empty term returned nothing | "no results" copy + clear action |
| `error` | the read failed | friendly error + retry |

## Mapping (actions.ts)

```
SearchBusinessesQuery['searchBusinesses'][number]
  → DirectoryBusiness {
      tenantId, slug, name, category,
      description: description ?? null,
      address:     address ?? null,
      logo:        logo ?? null,
      cover:       cover ?? null,
      hours:       schedule.map(({ weekday, startTime, endTime }) => ({ weekday, startTime, endTime })),
    }
```

- On a failed read (`ActionResult` not ok) the action returns the failure; the view renders the `error` state.
- `empty` vs `noResults` is decided by the view: a non-empty trimmed `q` with zero rows → `noResults`; otherwise zero rows → `empty`.

## Validation rules (from requirements)

- **FR-003** — `q` is trimmed; an empty/whitespace term is treated as "no filter" (full list).
- **FR-005/FR-009** — card fields are rendered as-is; `null`/empty → placeholders; the card always renders.
- **FR-006** — the CTA link is built from `slug` (`/${slug}`), never from user input other than the returned slug.
- **FR-008** — every state in `DirectoryState` has a defined UI; the error state offers a retry.

## Derived / served projections

- **Directory grid**: the mapped `DirectoryBusiness[]` from the current `q`.
- **Card**: a single `DirectoryBusiness` plus its formatted hours.
- **Consumer of the profile**: the CTA navigates to the existing public page `/[tenantSlug]`, which resolves the business through `public-booking` (unchanged).
