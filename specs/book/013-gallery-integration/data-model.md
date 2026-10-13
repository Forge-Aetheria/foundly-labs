# Phase 1 — Data Model: Foundly Book — Gallery Integration

**Feature**: `specs/book/013-gallery-integration` · **Date**: 2026-10-13

The client does not own persistence; it models the API's `GalleryItem` and the domain `GalleryPhoto` already used by the mini-site.

## Domain type (client) — `shared/types/tenancy.ts` (existing)

### `GalleryPhoto`

| Field | Type | Notes |
|---|---|---|
| `id` | `string` | Stable identity |
| `url` | `string` | Absolute image URL |
| `title?` | `string` | Optional short title |
| `description?` | `string` | Optional short description |
| `category?` | `GalleryCategory` | `'local' \| 'trabajos' \| 'equipo'` |

### `GalleryCategory` / labels (existing)

- `GALLERY_CATEGORIES = ['local','trabajos','equipo'] as const`
- `GALLERY_CATEGORY_LABELS = { local: 'Local', trabajos: 'Trabajos', equipo: 'Equipo' }`

## Public projection — `modules/public-booking/utils/types.ts` (existing)

### `PublicGalleryPhoto`

| Field | Type | Notes |
|---|---|---|
| `id` | `string` | |
| `url` | `string` | |
| `title?` | `string` | |
| `description?` | `string` | |
| `category?` | `string` | **Display label** (Local / Trabajos / Equipo), mapped from the stored value |

Consumed by `ProviderSections.GallerySection` (`#galeria`).

## Mapping (API → domain)

| API `GalleryItem` | Domain `GalleryPhoto` | Rule |
|---|---|---|
| `id` | `id` | — |
| `url` | `url` | — |
| `title` (nullable) | `title?` | `null` → `undefined` |
| `description` (nullable) | `description?` | `null` → `undefined` |
| `category` (nullable) | `category?` | keep only if ∈ closed set; unknown → `undefined` |
| `order` | — | not surfaced to the UI model (server already ordered the list) |

## Input model (admin add) — `modules/gallery/utils/schemas.ts`

Zod schema `addGalleryItemSchema`:

| Field | Rule |
|---|---|
| `url` | trimmed, valid absolute URL, ≤ 2000 |
| `title` | trimmed, ≤ 200 chars, optional/nullish (empty → null) |
| `description` | trimmed, ≤ 2000 chars, optional/nullish (empty → null) |
| `category` | `enum(GALLERY_CATEGORIES)`, optional/nullish |

`removeGalleryItemSchema`: `{ id: string (min 1) }`.

## State

- Admin list state is seeded from the server render and updated with server-confirmed results on add/remove (item appended on add; item filtered on remove).
- No optimistic fake data: items are only added/removed after a successful Server Action result.
