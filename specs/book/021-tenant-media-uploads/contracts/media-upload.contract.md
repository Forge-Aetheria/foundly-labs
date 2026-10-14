# Contract: Tenant Media Upload Control & Public Hero Fallback

**Feature**: `specs/book/021-tenant-media-uploads/` | **Date**: 2026-10-14

Documents the shared media control and the public hero behaviour after 021. All UI primitives come
from `@foundly/ui` and colors from theme tokens. The stored value is always a URL string, so the
backend/API contract is unchanged.

## `ImageUploadField` (shared client control)

**Location**: `apps/book/src/shared/components/ImageUploadField.tsx` (`'use client'`).

| Prop        | Type                                                | Contract |
| ----------- | --------------------------------------------------- | -------- |
| `label`     | `string`                                            | Field heading / base name; also the file input's accessible name (`Subir {label}`). |
| `value`     | `string`                                            | Current image URL (empty string when unset). |
| `onChange`  | `(url: string) => void`                             | Emitted on successful upload and on every URL edit/clear. |
| `onUpload`  | `(file: File) => Promise<ActionResult<{ url: string }>>` | Injected uploader (module hook). The control never imports storage directly. |
| `helperText`| `string?`                                           | Guidance (e.g. recommended dimensions) or field error. |
| `error`     | `boolean?`                                          | Error styling for the URL input. |
| `preview`   | `'square' \| 'circle' \| 'banner'?`                 | Preview shape (default `square`). |
| `urlLabel`  | `string?`                                           | Label of the URL fallback input (default `` `${label} (URL)` ``). |
| `disabled`  | `boolean?`                                          | Disables upload + URL input. |

Behaviour:

1. **Select**: file picker via "Subir imagen" and drag & drop onto the field both trigger the same flow.
2. **Validate locally**: `validateImageFile` blocks non-`image/png|jpeg|webp` and > 5 MB inline — no request sent.
3. **Upload**: calls `onUpload(file)`; while pending shows a busy label and disables actions.
4. **Preview**: shows the current `value` image (or a neutral placeholder) immediately.
5. **URL fallback**: a `TextField` bound to `value`/`onChange`; a pasted `http(s)` URL is previewed and saved exactly like an uploaded one.
6. **Failure**: on `{ ok: false }` shows the returned message inline and keeps the previous `value` intact (retry allowed).
7. **A11y**: file input labelled, preview `alt` descriptive, keyboard operable, `vitest-axe` clean.

## Storage util

**Location**: `apps/book/src/shared/utils/uploadImage.ts`.

- `validateImageFile(file)` → `{ ok: true } | { ok: false; message }` (type + 5 MB).
- `uploadImage(file, { tenantId, kind, bucket? })` → `ActionResult<{ url }>`; path `{tenantId}/{kind}/{uuid}.{ext}`; uses `createBrowserSupabaseClient()`; returns `STATE_ERROR` when storage is unavailable or the upload fails.
- Constants: `TENANT_MEDIA_BUCKET = 'tenant-media'`, `MAX_IMAGE_BYTES = 5 MB`, `ACCEPTED_IMAGE_TYPES`.
- `uploadProof.ts` delegates to this util (bucket `payment-proofs`, folder `{tenantSlug}`) to preserve `017` behaviour.

## Admin integrations

| Surface | Field | `label` | `urlLabel` | `kind` |
| ------- | ----- | ------- | ---------- | ------ |
| `/admin/profile` | Logo | `Logo` | `Logo (URL)` | `logo` |
| `/admin/profile` | Portada | `Portada` | `Portada (URL)` | `cover` |
| `/admin/staff` | Avatar | `Foto / Avatar` | `Foto / Avatar (URL)` | `avatar` |
| `/admin/gallery` | Foto | `Foto` | `URL de la imagen` | `gallery` |

- Upload scope is the tenant id resolved server-side (`getAdminTenantId()`) and passed to the managers; when empty the control is URL-only.
- `ProfileEditor` keeps its save-time aspect check (`016`) as advisory.

## Public hero fallback

**Location**: `apps/book/src/modules/public-booking/components/CoverBanner.tsx`.

| State | Rendered |
| ----- | -------- |
| `cover` non-empty | The cover image (unchanged). |
| `cover` empty + gallery photos | `gallery[0].url`. |
| `cover` empty + no gallery | On-brand gradient/pattern banner containing the business `name`. |

`PublicPortal` passes `fallback={profile.gallery?.[0]?.url ?? null}`; no new public API field.

## Guarantees

- 0 backend/API/Prisma changes; media stays a URL string.
- Unsupported format / oversize blocked before any request (FR-002).
- Upload failure preserves the stored value (FR-006).
- 100% of profiles render a hero banner (FR-005 / SC-003).
- `vitest-axe` clean; the control uses `@foundly/ui` + tokens exclusively.
