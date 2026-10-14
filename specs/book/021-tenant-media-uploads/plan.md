# Implementation Plan: Foundly Book — Tenant Media Uploads & Cover Fallback

**Branch**: `021-tenant-media-uploads` | **Date**: 2026-10-14 | **Spec**: `specs/book/021-tenant-media-uploads/spec.md`

**Input**: Feature specification from `/specs/book/021-tenant-media-uploads/spec.md`

## Summary

Introduce direct image upload for the four admin media fields — profile logo, profile cover, staff avatar and gallery photo — plus an always-visible hero banner fallback on the public business profile. Implement a generic storage utility (`shared/utils/uploadImage.ts`) and a reusable, client-side `ImageUploadField` control (`shared/components/`), and wire them into `ProfileEditor`, `StaffManager` and `GalleryManager`, keeping the existing URL text input as a manual alternative. The stored value remains a URL string, so the backend/API and database are untouched. Finally, amend the "upload out of scope / URL-only" premise in `005`, `006` and `007` (with cross-references in `013`, `014`, `016`).

## Technical Context

**Language/Version**: TypeScript 5.9 · React 19 · Next.js 15.5 (App Router)

**Primary Dependencies**: `@foundly/ui` (design system) · MUI v6 (engine of `@foundly/ui`) · `@supabase/ssr` + `@supabase/supabase-js` (already used by `017`)

**Storage**: Supabase Storage (one tenant-scoped bucket `tenant-media`, path `{tenantId}/{kind}/{uuid}.{ext}`). No database/schema change.

**Testing**: Vitest + RTL + vitest-axe (`npm run test -w @foundly/book`); `@foundly/ui` suite for shared primitives (`npm run test -w @foundly/ui`)

**Target Platform**: Web (Next.js server components + client islands)

**Project Type**: Web application (monorepo workspace)

**Performance Goals**: N/A — one file per interaction, ≤ 5 MB; previews use object URLs.

**Constraints**: C1 — admin views use `@foundly/ui` only (plus MUI `Box` already used for layout); C2 — the shared field is a client component (it owns file input/drag&drop); C3 — `apps/book/src/shared/utils/uploadImage.ts` stays framework-light and holds no React; C4 — no API/Prisma change: media stays a URL string.

**Scale/Scope**: 4 admin fields, 1 reusable control, 1 public hero fallback; ~1 util + 1 component + 3 integrations + tests + spec amendments.

## Constitution Check

_GATE: must pass before Phase 0 research. Re-check after Phase 1 design._

- Specs live under `/specs/<dominio>/<nnn>-<feature>/` → **OK** (`book/021-tenant-media-uploads`).
- References `specs/business-model.md` and declares the decisions it respects → **OK** (Assumptions + governance note).
- Data layer per module (§5.VI): the upload is a client-side storage call, not a Server Action; it is exposed through each module's `hooks.ts` (`useUploadProfileImage` / `useUploadStaffAvatar` / `useUploadGalleryPhoto`), consistent with `public-booking/hooks.ts#useUploadPaymentProof`. UI components never import the raw util directly. → **OK**
- Server/Client boundary (§5.V, `code-rules.md` §8): `code-rules.md` §8.2 states that `packages/ui` primitives are intentionally non-`'use client'` (only `FoundlyThemeProvider`). Because `ImageUploadField` inherently needs client state (file input, drag&drop, preview), it is placed in `apps/book/src/shared/components/` (client), not in `packages/ui`. Promotion to `@foundly/ui` is deferred until the design system admits client composite components. → **OK** (justified; see Complexity Tracking).
- Design tokens only, `@foundly/ui` primitives for UI → **OK** (reuses `Button`, `TextField`, `Stack`, `Typography`).
- Strict typing, no `any` → **OK** (`ActionResult<{ url: string }>`; no implicit casts).

_Re-check after Phase 1 design:_ **PASS** — no API contract or Prisma change; the new util is pure-ish (client) and the new component is the single media control; the cover fallback reuses existing public gallery data.

## Project Structure

### Documentation (this feature)

```text
specs/book/021-tenant-media-uploads/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   └── media-upload.contract.md
├── checklists/
│   └── requirements.md
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
apps/book/src/shared/utils/uploadImage.ts                     # NEW: validate + upload to Supabase Storage → public URL
apps/book/src/shared/utils/uploadImage.test.ts                # NEW: validation + upload tests
apps/book/src/shared/components/ImageUploadField.tsx          # NEW: reusable client media control (upload + preview + URL fallback)
apps/book/src/shared/components/ImageUploadField.test.tsx     # NEW: upload/preview/URL/validation/a11y tests
apps/book/src/modules/public-booking/utils/uploadProof.ts     # REFACTOR: delegate to shared uploadImage
apps/book/src/modules/profile/hooks.ts                        # EXTEND: useUploadProfileImage
apps/book/src/modules/staff/hooks.ts                          # EXTEND: useUploadStaffAvatar
apps/book/src/modules/gallery/hooks.ts                        # EXTEND: useUploadGalleryPhoto
apps/book/src/modules/profile/components/ProfileEditor.tsx    # UPDATE: ImageUploadField for logo + cover
apps/book/src/modules/staff/components/StaffManager.tsx       # UPDATE: ImageUploadField for avatar
apps/book/src/modules/gallery/components/GalleryManager.tsx   # UPDATE: ImageUploadField for photo URL
apps/book/src/modules/profile/ProfileView.tsx                 # UPDATE: pass tenant scope
apps/book/src/modules/staff/StaffView.tsx                     # UPDATE: pass tenant scope
apps/book/src/modules/gallery/GalleryView.tsx                 # UPDATE: pass tenant scope
apps/book/src/modules/public-booking/components/CoverBanner.tsx        # UPDATE: gallery/brand fallback
apps/book/src/modules/public-booking/components/PublicPortal.tsx       # UPDATE: pass gallery fallback
apps/book/src/modules/public-booking/tests/PublicPortal.test.tsx       # UPDATE: cover fallback tests
apps/book/src/modules/{profile,staff,gallery}/tests/*.test.tsx         # UPDATE: media field tests
specs/book/005-staff-management/spec.md                       # AMEND premise
specs/book/006-gallery-management/spec.md                     # AMEND premise
specs/book/007-business-profile/spec.md                       # AMEND premise
specs/book/013-gallery-integration/spec.md                    # CROSS-REF
specs/book/014-profile-policies-reviews/spec.md               # CROSS-REF
specs/book/016-admin-ux-hardening/research.md                 # CROSS-REF
```

**Structure Decision**: Feature docs live in the `book` domain spec folder. Implementation reuses the existing admin modules (`profile`, `staff`, `gallery`) and cross-app `shared/`. No new package, no `packages/ui` change (§5.V), no API change. The Supabase bucket/policies are provisioned operationally (quickstart).

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
| --------- | ---------- | ------------------------------------ |
| Reusable client component placed in `apps/book/src/shared/components/` instead of `packages/ui` | The control needs client state (file input, drag&drop, preview); `code-rules.md` §8.2 keeps `packages/ui` primitives server-renderable (only `FoundlyThemeProvider` is client) | Adding a client component to `packages/ui` would break the §5.V / §8.2 contract that primitives remain serializable |
| New client-side Supabase Storage dependency usage on admin surfaces | Upload must go device → storage directly (same pattern as `017`); no server action needed | Routing bytes through the NestJS API would require new API endpoints/Prisma work, contradicting FR-008 |
