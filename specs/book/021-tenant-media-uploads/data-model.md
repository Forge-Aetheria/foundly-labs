# Data Model: Foundly Book — Tenant Media Uploads & Cover Fallback

**Feature**: `specs/book/021-tenant-media-uploads/` | **Date**: 2026-10-14

## No persistent schema change

The feature does **not** add or migrate database entities. Media continues to be persisted on the existing fields as URL strings:

| Field | Entity | Type (unchanged) | Notes |
| ----- | ------ | ---------------- | ----- |
| `avatar` | `Tenant` | `string \| null` | Profile logo; now may hold an uploaded asset URL |
| `cover` | `Tenant` | `string \| null` | Profile cover; source of the public hero |
| `avatar` | `Resource` (staff) | `string \| null` | Professional avatar |
| `url` | `GalleryPhoto` | `string` | Gallery photo; now may hold an uploaded asset URL |

## Transient value object: MediaAsset

Not persisted; produced by the upload util and reduced to its `url`.

```ts
/** Storage bucket that holds tenant-owned media (feature 021). */
export const TENANT_MEDIA_BUCKET = 'tenant-media';

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const ACCEPTED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp'] as const;
export type AcceptedImageType = (typeof ACCEPTED_IMAGE_TYPES)[number];

export type MediaKind = 'logo' | 'cover' | 'avatar' | 'gallery';

export interface UploadImageOptions {
  /** Storage bucket (defaults to TENANT_MEDIA_BUCKET). */
  bucket?: string;
  /** Tenant scope (first path segment) — the owner of the asset. */
  scope: string;
  /** Optional sub-folder under the scope (e.g. the media kind). */
  folder?: MediaKind;
}

/** Path shape (tenant media): `{scope}/{folder}/{uuid}.{ext}`. */
```

Functions:

- `validateImageFile(file): { ok: true } | { ok: false; message: string }` — enforces `ACCEPTED_IMAGE_TYPES` and `MAX_IMAGE_BYTES`.
- `uploadImage(file, options): Promise<ActionResult<{ url: string }>>` — validates, uploads via the browser Supabase client, returns the public URL; never throws.

## Derived / read surface: hero fallback

`PublicBusinessProfile` already provides everything needed; no new public field:

```ts
// apps/book/src/modules/public-booking/utils/types.ts (unchanged)
export interface PublicBusinessProfile {
  cover: string | null;
  gallery?: PublicGalleryPhoto[]; // first item becomes the hero fallback
  name: string;
  // ...
}
```

Resolution order for the hero banner:

1. `cover` when non-empty;
2. else `gallery[0].url` when the gallery has photos;
3. else an on-brand gradient/pattern banner containing `name`.

## Relationships

A `Tenant` owns its media assets through the storage path prefix (`{tenantId}/…`) and references their public URLs from its own `avatar`/`cover`, its `Resource.avatar` rows and its `GalleryPhoto.url` rows. Selection of the hero banner is derived at render time from the same public profile data already delivered to the portal.
