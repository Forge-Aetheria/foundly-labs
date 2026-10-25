# Tasks: Mobile Team Module

**Input**: `specs/mobile/004-team-module/`
**Status**: Implemented (retrospective task list)

## Phase 1: Setup

- [X] T001 Confirm specialist CRUD and assignment operations in `apps/api`.
- [X] T002 Confirm `Specialist` and `SpecialistService` models in `packages/database`.
- [X] T003 Create `apps/mobile/src/modules/team/team.graphql` including list, CRUD and assignment mutations.

## Phase 2: Foundational

- [X] T004 Create `team/services.ts` for fetch, create, update, delete, assign and unassign.
- [X] T005 Create `team/hooks.ts` with `useTeam`, `useCreateTeamMember`, `useUpdateTeamMember`, `useDeleteTeamMember` and `useSyncTeamMemberServices`.
- [X] T006 Create `team-form.ts` with draft mapping, validation and service diff helpers.
- [X] T007 Add unit tests in `team/__tests__/team-form.test.ts`.

## Phase 3: User Story 1 — Team list (P1)

- [X] T008 Create `TeamView` with search, loading, empty, error, refresh and overlay states.
- [X] T009 Render member cards with avatar, role, bio, active switch and service chips.
- [X] T010 Connect `app/(drawer)/equipo.tsx` to `TeamView`.

## Phase 4: User Story 2 — Create member (P2)

- [X] T011 Create `TeamMemberFormModal` with name, role, bio, avatar and active fields.
- [X] T012 Reuse `useServices` for service selection and `pickAndUploadTenantImage` for avatars.
- [X] T013 Wire create mutation, service synchronization and pending state.

## Phase 5: User Story 3 — Edit, activate and delete (P3)

- [X] T014 Wire edit mode with per-member modal remount and update mutation.
- [X] T015 Add active toggle with update mutation and pending indicator.
- [X] T016 Add delete confirmation and mutation.
- [X] T017 Invalidate the team query after all mutations and show mutation errors.

## Phase 6: Polish

- [X] T018 Run `typecheck`, `lint`, `test` and `expo export`.
- [X] T019 Verify no placeholder remains in `/equipo`.
