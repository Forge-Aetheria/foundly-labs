# Data Model: Mobile Gallery Module

**Feature**: `specs/mobile/006-gallery-module/spec.md`
**Date**: 2026-10-25

No persistent schema changes. Uses the existing `GalleryPhoto` model.

## GalleryPhoto (view model)

| Field | Type | Notes |
| ----- | ---- | ----- |
| `id` | `string` | Photo id. |
| `url` | `string` | Required image URL. |
| `title` | `string \| null` | Optional. |
| `description` | `string \| null` | Optional. |
| `category` | `string \| null` | `local`, `trabajos`, `equipo` or null. |
| `order` | `number` | Server sort order (read-only). |

## GalleryDraft (form)

| Field | Type | Validation |
| ----- | ---- | ---------- |
| `url` | `string` | Required; http/https URL after upload or manual entry. |
| `title` | `string` | Optional. |
| `description` | `string` | Optional. |
| `category` | `GalleryCategory \| ''` | Optional; closed set. |
| `uploading` | `boolean` | Disables save while uploading. |

## Category set

| Value | Label |
| ----- | ----- |
| `local` | Local |
| `trabajos` | Trabajos |
| `equipo` | Equipo |

## State transitions

- Load: `gallery(tenantId)` → grid/list with loading, empty or error.
- Upload: picker → shared media helper → URL fills the draft.
- Add: draft → `addGalleryItem` → invalidate gallery query → new photo appears.
- Delete: confirmation → `removeGalleryItem` → invalidate gallery query.
- Refresh: pull-to-refresh / invalidation with overlay.
- Image error: local broken state per photo id; no list failure.

## Validation rules

- URL must be a non-empty `http(s)` URL.
- Uploaded images must be PNG/JPG/WEBP and ≤ 5 MB.
- Category must belong to the closed set or be empty.
- Optional metadata empty strings map to `null`.
