# UI Contract: Team Module

**Feature**: `specs/mobile/004-team-module`

## Module surface

```ts
export function useTeam(): UseQueryResult<TeamMember[], TeamError>;
export function useCreateTeamMember(): UseMutationResult<..., CreateMySpecialistInput>;
export function useUpdateTeamMember(): UseMutationResult<..., { id: string; input: UpdateMySpecialistInput }>;
export function useDeleteTeamMember(): UseMutationResult<true, TeamError, string>;
export function useSyncTeamMemberServices(): UseMutationResult<true, TeamError, SyncTeamServicesInput>;
```

## Screen contract

- `app/(drawer)/equipo.tsx` renders `TeamView` only.
- `TeamView` provides:
  - Title “Equipo”, search and add button.
  - Loading, empty, error/retry states.
  - Pull-to-refresh and refresh overlay.
  - Member cards with `SessionAvatar`, name, role, bio, active switch and service chips.
  - Edit and delete actions; delete requires confirmation.
  - Visible mutation errors.

## Form contract

- `TeamMemberFormModal` receives `{ visible, member, onClose }`.
- Fields: name, role, bio, avatar (upload/preview), active and service selection.
- Service selection uses the existing `useServices` hook.
- Save:
  1. Validate name/bio.
  2. Create or update the specialist.
  3. Diff service ids and synchronize assignments.
  4. Close only on success.
- Pending state disables submission and shows loading.

## Reuse guarantees

- `SessionAvatar` for avatars/initials.
- `initialsFrom` for fallbacks.
- `pickAndUploadTenantImage` for uploads.
- `LoadingState`, `EmptyState`, `ErrorState`, `Button` and `TextField` as-is.
