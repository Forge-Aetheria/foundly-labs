---

description: "Task list for Foundly Book — Tenant Media Uploads & Cover Fallback"
---

# Tasks: Foundly Book — Tenant Media Uploads & Cover Fallback

**Input**: Design documents from `/specs/book/021-tenant-media-uploads/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Included (spec FR-002/FR-006/FR-009 and quickstart require unit + a11y coverage).

**Organization**: Grouped by user story so each is independently testable.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: US1 (upload), US2 (hero fallback), US3 (URL fallback), US4 (a11y/consistency)

## Phase 1: Setup

- [x] T001 Confirm Supabase Storage provisioning notes in `specs/book/021-tenant-media-uploads/quickstart.md` (bucket `tenant-media`, public read + owner-scoped write).

---

## Phase 2: Foundational (blocking prerequisites)

**Purpose**: The shared util and control every story depends on.

- [x] T002 [P] Create `apps/book/src/shared/utils/uploadImage.ts` (`validateImageFile`, `uploadImage`, `TENANT_MEDIA_BUCKET`, `MAX_IMAGE_BYTES`, `ACCEPTED_IMAGE_TYPES`, `MediaKind`).
- [x] T003 [P] Tests for the util in `apps/book/src/shared/utils/uploadImage.test.ts` (type/size rejection, success URL, storage-unavailable + upload-error `STATE_ERROR`).
- [x] T004 [P] Refactor `apps/book/src/modules/public-booking/utils/uploadProof.ts` to delegate to `uploadImage` (same bucket/messages/result).
- [x] T005 Create `apps/book/src/shared/components/ImageUploadField.tsx` (client: file picker + drag&drop + preview + URL fallback; uses `@foundly/ui`).
- [x] T006 Tests for the control in `apps/book/src/shared/components/ImageUploadField.test.tsx` (upload success, invalid type, oversize, URL fallback, failure keeps value, a11y).

**Checkpoint**: util + control green → stories can proceed.

---

## Phase 3: User Story 1 - Upload images from the admin (Priority: P1) 🎯 MVP

**Goal**: Profile logo/cover, staff avatar and gallery photo can be uploaded from the device.

**Independent Test**: Upload a valid image in each of the four fields and confirm it is persisted and rendered.

- [x] T007 [P] [US1] Add `useUploadProfileImage` to `apps/book/src/modules/profile/hooks.ts` and `useUploadStaffAvatar` to `apps/book/src/modules/staff/hooks.ts` and `useUploadGalleryPhoto` to `apps/book/src/modules/gallery/hooks.ts` (wrap `uploadImage`).
- [x] T008 [US1] Wire `ImageUploadField` into `apps/book/src/modules/profile/components/ProfileEditor.tsx` (logo + cover), keeping the save-time advisory aspect check.
- [x] T009 [US1] Wire `ImageUploadField` into `apps/book/src/modules/staff/components/StaffManager.tsx` (avatar).
- [x] T010 [US1] Wire `ImageUploadField` into `apps/book/src/modules/gallery/components/GalleryManager.tsx` (photo URL, keeping the add-modal flow).
- [x] T011 [US1] Thread the tenant scope: `ProfileView.tsx`, `StaffView.tsx`, `GalleryView.tsx` pass `tenantId` to the managers.
- [x] T012 [US1] Update module tests (`profile/tests/ProfileEditor.test.tsx`, `staff/tests/StaffManager.test.tsx`, `gallery/tests/GalleryManager.test.tsx`) for the new control + upload path.

**Checkpoint**: US1 fully functional and independently testable.

---

## Phase 4: User Story 2 - Always-visible public hero (Priority: P1)

**Goal**: The public profile never shows an empty hero.

**Independent Test**: Empty cover → gallery fallback; empty cover+gallery → branded gradient.

- [x] T013 [US2] Update `apps/book/src/modules/public-booking/components/CoverBanner.tsx` to accept `fallback`/`name` and render cover → first gallery photo → gradient/pattern.
- [x] T014 [US2] Update `apps/book/src/modules/public-booking/components/PublicPortal.tsx` to pass `fallback={profile.gallery?.[0]?.url ?? null}`.
- [x] T015 [US2] Update `apps/book/src/modules/public-booking/tests/PublicPortal.test.tsx` with the three hero states.

**Checkpoint**: Hero always visible.

---

## Phase 5: User Story 3 - URL fallback preserved (Priority: P2)

**Goal**: Pasting a URL still works for every media field.

**Independent Test**: Paste a valid `https://` image in each field, save, and confirm persistence/preview.

- [x] T016 [US3] Ensure the URL input stays in `ImageUploadField` and existing URL labels are preserved; add explicit URL-paste assertions in the component test (T006).

---

## Phase 6: User Story 4 - Consistency & accessibility (Priority: P3)

**Goal**: One shared control, keyboard-operable, a11y-clean.

- [x] T017 [US4] Verify `ImageUploadField` uses `@foundly/ui` + tokens only and is keyboard-operable; assert `vitest-axe` clean in T006/T012.

---

## Phase 7: Spec amendments & polish

- [x] T018 [P] Amend `specs/book/005-staff-management/spec.md` (assumption: avatar upload now in scope via 021).
- [x] T019 [P] Amend `specs/book/006-gallery-management/spec.md` (FR-006 + assumption: upload in scope via 021; URL remains a fallback).
- [x] T020 [P] Amend `specs/book/007-business-profile/spec.md` (assumption: logo/cover upload in scope via 021).
- [x] T021 [P] Cross-reference `specs/book/013-gallery-integration/spec.md`, `specs/book/014-profile-policies-reviews/spec.md`, `specs/book/016-admin-ux-hardening/research.md`.
- [x] T022 Update `.specify/feature.json` to point at `specs/book/021-tenant-media-uploads`.
- [x] T023 Run gates: `typecheck`, `lint`, `test`, `build` for `@foundly/book`.

---

## Dependencies & Execution Order

- Phase 2 blocks all stories (T002–T006).
- US1 (Phase 3) depends on Phase 2.
- US2 (Phase 4) is independent of US1 (public hero only).
- US3 (Phase 5) is satisfied by the control built in Phase 2.
- US4 (Phase 6) is verified by the tests from Phase 2/3.
- Phase 7 depends on the implementation.

## Notes

- [P] tasks touch different files.
- Verify tests fail before implementing (TDD) where practical.
- No API/Prisma change; media stays a URL string.
