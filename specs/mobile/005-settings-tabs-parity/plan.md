# Implementation Plan: Mobile Settings Tabs Parity

**Branch**: `005-settings-tabs-parity` | **Date**: 2026-10-25 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/mobile/005-settings-tabs-parity/spec.md`

## Summary

Rebuild the mobile Configuración screen as a three-tab hub: business profile, payment methods and security. Profile supports business identity, tags, slug, public visibility, logo upload and save. Payments supports full CRUD and per-type details. Security supports password change with reauthentication.

## Technical Context

**Language/Version**: TypeScript 5.9 strict, React 19.3, React Native 0.88, Expo SDK 58.

**Primary Dependencies**: `@tanstack/react-query`, `graphql-request`, `expo-image-picker`, Supabase Auth/Storage, generated GraphQL types.

**Storage**: Existing business/payment tables and `tenant-media` bucket; no new tables.

**Testing**: Jest 30 + `jest-expo` + RNTL.

**Target Platform**: iOS and Android.

**Performance Goals**: Tab content usable in under 2 seconds; mutations reflected immediately or after invalidation.

**Constraints**: Reuse shared components; tokenized colors; safe-area-aware footers; no direct data calls in UI.

**Scale/Scope**: Three tabs, business profile fields, payment CRUD, password change.

## Constitution Check

| Gate | Status | Evidence |
| ---- | ------ | -------- |
| SDD and governance | PASS | Spec and governance references present. |
| Mobile spec location | PASS | `specs/mobile/005-settings-tabs-parity/`. |
| Module data layer | PASS | Hooks only in components; services in settings/auth modules. |
| Codegen-only contracts | PASS | `settings.graphql`, `payments.graphql`. |
| Reuse 5.VII | PASS | Reuses Button, TextField, LoadingState, SessionAvatar, shared media helper. |
| Design tokens | PASS | No raw hex in components; overlay token added. |
| Verification | PASS | Typecheck, lint, 61 tests and export executed. |

## Project Structure

```text
specs/mobile/005-settings-tabs-parity/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/settings-ui.contract.md
├── checklists/requirements.md
└── tasks.md

apps/mobile/src/modules/settings/
├── SettingsView.tsx
├── settings.graphql
├── payments.graphql
├── services.ts
├── hooks.ts
├── categories.ts
├── payments.ts
└── components/
    ├── ConfigurationTabs.tsx
    ├── ProfileSettingsTab.tsx
    ├── PaymentsSettingsTab.tsx
    └── SecuritySettingsTab.tsx
```

## Risks and Mitigations

| Risk | Mitigation |
| ---- | ---------- |
| Payment detail type mismatch | Centralize parsing/serialization in `payments.ts` and test it. |
| Logo upload failures | Shared media helper with permissions and size validation. |
| Password update errors | Reauthenticate with current password and map errors. |
| Keyboard/safe-area overlap | KeyboardAvoidingView and safe-area padding in modals/footers. |
| Duplicate actions | Pending flags disable controls and show loading. |

## Complexity Tracking

No violations. The password change is placed in the auth module and consumed via a hook.
