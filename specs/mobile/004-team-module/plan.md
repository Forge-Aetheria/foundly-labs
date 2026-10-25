# Implementation Plan: Mobile Team Module

**Branch**: `004-team-module` | **Date**: 2026-10-25 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/mobile/004-team-module/spec.md`

## Summary

Replace the mobile Team placeholder with a functional specialists module. The view lists tenant specialists with their assigned services, supports create/edit/delete, avatar upload, active status and service assignment synchronization.

The API already exposes specialist CRUD and assignment mutations. Because `MySpecialist` does not expose assigned services, the list uses the public `specialists(tenantId)` query, which includes the services relation.

## Technical Context

**Language/Version**: TypeScript 5.9 strict, React 19.3, React Native 0.88, Expo SDK 58.

**Primary Dependencies**: `@tanstack/react-query`, `graphql-request`, `@expo/vector-icons`, `expo-image-picker`, generated GraphQL types.

**Storage**: Supabase Storage (`tenant-media`) for avatars; no new database tables.

**Testing**: Jest 30 + `jest-expo` + RNTL.

**Target Platform**: iOS and Android.

**Performance Goals**: Team list visible in under 2 seconds; assignments reflected after save.

**Constraints**: Reuse `useServices` for service selection; no direct data calls in UI; tokenized colors.

**Scale/Scope**: Tenant team list, CRUD, service assignment sync, avatar upload.

## Constitution Check

| Gate | Status | Evidence |
| ---- | ------ | -------- |
| SDD and governance references | PASS | Spec references the required documents. |
| Mobile spec location | PASS | `specs/mobile/004-team-module/`. |
| Module data layer | PASS | `services.ts` + `hooks.ts`; UI uses hooks. |
| Codegen-only contracts | PASS | `team.graphql`; generated types only. |
| Reuse principle 5.VII | PASS | Reuses `SessionAvatar`, `initialsFrom`, shared media helper and `LoadingState`. |
| Design tokens | PASS | All colors use tokens. |
| Thin routes | PASS | `app/(drawer)/equipo.tsx` renders `TeamView`. |
| Verification | PASS | Typecheck, lint, 61 tests and export executed. |

## Project Structure

```text
specs/mobile/004-team-module/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/team-ui.contract.md
├── checklists/requirements.md
└── tasks.md

apps/mobile/
├── app/(drawer)/equipo.tsx
└── src/modules/team/
    ├── team.graphql
    ├── services.ts
    ├── hooks.ts
    ├── team-form.ts
    ├── TeamView.tsx
    ├── components/TeamMemberFormModal.tsx
    └── __tests__/team-form.test.ts
```

## Risks and Mitigations

| Risk | Mitigation |
| ---- | ---------- |
| `MySpecialist` lacks services | Use `specialists(tenantId)` for the list and invalidate after mutations. |
| Assignment drift | Compute add/remove diffs and sync with assign/unassign mutations. |
| Avatar upload failures | Reuse shared image helper with permission, size and MIME validation. |
| Duplicate actions | Disable controls while mutations are pending. |
| Form state leaking between members | Remount the modal per member id. |

## Complexity Tracking

No violations. The only additional hook is `useSyncTeamMemberServices`, required to keep assignment orchestration out of the UI.
