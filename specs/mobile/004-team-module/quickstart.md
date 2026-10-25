# Quickstart Validation: Mobile Team Module

**Feature**: `specs/mobile/004-team-module/spec.md`
**Date**: 2026-10-25

## Prerequisites

- Authenticated tenant session.
- API reachable from the device.
- At least one service in the catalog for assignment tests.

## Automated verification

```bash
pnpm --filter @foundly/mobile typecheck
pnpm --filter @foundly/mobile lint
pnpm --filter @foundly/mobile test
pnpm --filter @foundly/mobile build
```

Expected: all pass; team form tests cover mapping, validation and service diffs.

## Manual validation

1. Open **Equipo** from the drawer; confirm the placeholder is gone.
2. With existing members, confirm name, role, avatar/initials, status and service chips.
3. Without members, confirm the empty state.
4. Create a member with name and role; confirm it appears.
5. Upload an avatar and confirm the preview updates.
6. Assign two services and confirm the chips appear after saving.
7. Edit the member, remove one service and add another; confirm the chips update.
8. Toggle active/inactive from the list; confirm the state persists.
9. Delete a member and confirm the confirmation dialog appears.
10. Pull to refresh and confirm the overlay; disconnect the API and confirm the error state.
