# Tasks: Mobile Settings Tabs Parity

**Input**: `specs/mobile/005-settings-tabs-parity/`
**Status**: Implemented (retrospective task list)

## Phase 1: Setup

- [X] T001 Confirm business/payment mutations exist in the API and generated schema.
- [X] T002 Add `payments.graphql` and extend `settings.graphql` with tags/logo fields.
- [X] T003 Add payment/category constants and helpers in the settings module.

## Phase 2: Foundational

- [X] T004 Extend `settings/services.ts` with business, payment and delete operations.
- [X] T005 Extend `settings/hooks.ts` with `useUpdateBusinessProfile`, payment query and mutations.
- [X] T006 Implement password change in `auth/services.ts` and `useChangePassword` in `auth/hooks.ts`.
- [X] T007 Create a shared image upload helper and reuse it for the logo.

## Phase 3: User Story 1 — Profile tab (P1)

- [X] T008 Create `ConfigurationTabs` with Profile/Payments/Security.
- [X] T009 Create `ProfileSettingsTab` with name, category, tags, slug and public switch.
- [X] T010 Add logo upload/preview and URL fallback.
- [X] T011 Add validation, save mutation, pending state and success/error feedback.
- [X] T012 Rebuild `SettingsView` as the tab container with loading/error/overlay states.

## Phase 4: User Story 2 — Payments tab (P2)

- [X] T013 Create `PaymentsSettingsTab` with list, status and details summary.
- [X] T014 Add create/edit modal with dynamic fields per method type.
- [X] T015 Add toggle active and delete with confirmation.
- [X] T016 Add pending states and loading overlays.
- [X] T017 Add payment helper tests.

## Phase 5: User Story 3 — Security tab (P3)

- [X] T018 Create `SecuritySettingsTab` with current/new/confirm password.
- [X] T019 Add validation, reauthentication, success/error feedback and pending state.

## Phase 6: Polish

- [X] T020 Run typecheck, lint, tests and expo export.
- [X] T021 Verify safe-area handling and keyboard behavior in all tabs.
