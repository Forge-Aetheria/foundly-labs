# Data Model: Foundly Book — Gallery Management

**Feature**: `specs/book/006-gallery-management/` | **Date**: 2026-10-10

## New entity: GalleryPhoto

A single photo in the business's visual catalog. Lives in `apps/book/src/domain/tenancy/types.ts`.

```ts
export type GalleryCategory = 'local' | 'trabajos' | 'equipo';

export interface GalleryPhoto {
  id: string;              // stable identity (rejection of duplicates, precise removal)
  url: string;             // absolute http(s) image URL
  title?: string;          // short optional title/description
  description?: string;    // short optional description
  category?: GalleryCategory; // optional tag: local | trabajos | equipo
}
```

Rules:

- `url` is required and must be a valid absolute http(s) URL (Zod `z.string().url()`).
- `title`/`description` optional, trimmed, bounded (title ≤ 120, description ≤ 250).
- `category` optional, from the closed set `local | trabajos | equipo` (display labels Local/Trabajos/Equipo); absent = "sin categoría".
- Duplicate URLs in the same tenant gallery are rejected (`CONFLICT`).
- Removal is by `id`, never by URL, so duplicates/ambiguity cannot delete the wrong photo.

## Change to existing entity: Tenant

`gallery` migrates from a plain URL list to annotated photos:

```ts
export interface Tenant {
  // ...
  /** NEW shape — photo catalog with metadata (006-gallery-management). */
  gallery?: GalleryPhoto[];
}
```

Seed data for both tenants (`estudio-ana`, `rona-piercing`) migrates `string[]` → `GalleryPhoto[]`
(with inferred categories such as `local`, `trabajos`, `equipo`).

## Derived / read surface

### Public gallery photo (`apps/book/src/features/public-booking/types.ts`)

```ts
export interface PublicGalleryPhoto {
  id: string;
  url: string;
  title?: string;
  description?: string;
  category?: string; // display label, e.g. 'Trabajos'
}
```

`getPublicBusiness` maps `Tenant.gallery` → `PublicGalleryPhoto[]` exposing the same items the admin
manages; the public `#galeria` renders url, optional title and the category badge.

## Relationships

A `Tenant` owns a `gallery: GalleryPhoto[]`. It is independent of `Service`/`Resource`; only the
tenant's public profile reads it. The admin (storefront) mutations and the public query share the
same store seam, so both sides always see the same collection.