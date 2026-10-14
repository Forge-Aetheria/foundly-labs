# Research: Foundly Book — Tenant Media Uploads & Cover Fallback

**Feature**: `specs/book/021-tenant-media-uploads/` | **Date**: 2026-10-14

## Prior art in the codebase

- `apps/book/src/modules/public-booking/utils/uploadProof.ts` already implements a working, browser-side Supabase Storage upload: it validates type (`image/png|jpeg|webp`) and size (≤ 5 MB), uploads to the `payment-proofs` bucket under `{tenantSlug}/{uuid}.{ext}`, and returns `getPublicUrl(path)`. This is the seed for the generic util.
- `apps/book/src/shared/auth/supabase/client.ts` exposes `createBrowserSupabaseClient()` (singleton, returns `null` when `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` are absent). The same client is reused.
- Media fields today are URL-only text inputs: `ProfileEditor.tsx` (logo/cover, with advisory aspect rules in `profile/utils/image-rules.ts`), `StaffManager.tsx` (avatar), `GalleryManager.tsx` (photo URL).
- `CoverBanner.tsx` returns `null` when `cover` is empty; `PublicPortal` passes only `profile.cover`. `PublicBusinessProfile` already carries `gallery?: PublicGalleryPhoto[]`, so the fallback needs no new data.
- `apps/book/src/shared/types/result.ts` provides `ActionResult<T>` / `ok` / `fail`.

## Decisions

1. **Generic util** `shared/utils/uploadImage.ts`: `validateImageFile(file)`, `uploadImage(file, { bucket, folder })` returning `ActionResult<{ url: string }>`, plus shared constants (`MAX_IMAGE_BYTES = 5 MB`, `ACCEPTED_IMAGE_TYPES`). `uploadProof.ts` is refactored to delegate to it (behaviour preserved: same bucket, same validation messages, same result shape). *Rationale*: single source of truth for validation/storage; the public-booking hook and all admin hooks share it.
2. **Single bucket, tenant folders**: bucket `tenant-media`, path `{tenantId}/{kind}/{uuid}.{ext}` with `kind ∈ {logo, cover, avatar, gallery}`. *Rationale*: one bucket to provision and one policy set; tenant id as the first path segment enables a simple owner-scoped write policy and public read. Rejected `avatars/covers/gallery` as three buckets (more ops surface) and `{tenantSlug}` as folder (slug is mutable; tenant id is stable).
3. **Reusable control in `apps/book/src/shared/components/ImageUploadField.tsx`**: a `'use client'` component with props `{ label, value, onChange, onUpload, helperText?, error?, preview?, urlLabel?, urlPlaceholder?, disabled? }`. It renders a preview, a hidden `<input type="file">` with an accessible label, a "Subir imagen" button and a drag&drop zone, plus the URL `TextField` as the manual fallback. *Rationale*: one control across all four fields (FR-009); placement outside `packages/ui` respects `code-rules.md` §8.2.
4. **Upload injected via module hooks**: `ImageUploadField` never imports Supabase. Each module's `hooks.ts` exposes the upload wrapper (`useUploadProfileImage`, `useUploadStaffAvatar`, `useUploadGalleryPhoto`) that closes over the tenant scope and `kind`, and `onUpload={thatHook(scope, kind)}`. *Rationale*: consistent with §5.VI and with `useUploadPaymentProof`; keeps the component testable with a mocked `onUpload`.
5. **Tenant scope threading**: `ProfileView`/`StaffView`/`GalleryView` already resolve `getAdminTenantId()`; pass it as `tenantId` to the managers. `ProfileEditor` may use `profile.id`. Uploads are disabled (URL-only) when the scope is empty, which also keeps existing component tests valid without a scope.
6. **Cover fallback** in `CoverBanner`: accept `fallback?: string | null` and `name`. Render `cover ?? fallback` when present; otherwise an on-brand gradient/pattern banner containing the business name (never `null`). `PublicPortal` passes `fallback={profile.gallery?.[0]?.url ?? null}`.
7. **Aspect guidance stays advisory** (`016`): an uploaded non-conforming image is stored and rendered with `object-fit` fit; the existing `checkImage` save-time rule remains, degrading gracefully when dimensions cannot be measured.

## Risks

- **Storage not configured in some environments**: `createBrowserSupabaseClient()` returns `null`; the util returns a friendly `STATE_ERROR`, and the field surfaces it while keeping the previous value (FR-006). Covered by a unit test.
- **Test environment has no Supabase**: tests mock `onUpload` (component) or mock the client module (util) — no network.
- **Replacing the URL `TextField`** in three components could regress existing tests. Mitigation: keep the same accessible URL label (`URL de la imagen`, `Logo (URL)`, `Portada (URL)`, `Foto / Avatar (URL)`) so current queries still resolve; add focused new tests.
- **`import.meta`/`crypto.randomUUID` in jsdom**: the util falls back to a time+random id when `crypto.randomUUID` is absent (as `uploadProof` already does).
