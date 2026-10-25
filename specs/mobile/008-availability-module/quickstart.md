# Quickstart Validation: Mobile Availability Module

**Feature**: `specs/mobile/008-availability-module/spec.md`
**Date**: 2026-10-25

## Prerequisites

- Authenticated tenant session.
- API reachable from the device.
- Existing availability rules and/or permission to configure them.
- Existing time blocks or permission to add them.

## Automated verification

```bash
pnpm --filter @foundly/mobile typecheck
pnpm --filter @foundly/mobile lint
pnpm --filter @foundly/mobile test
pnpm --filter @foundly/mobile build
```

Expected: all pass; helper tests cover weekday mapping, time validation and block formatting.

## Manual validation

1. Open **Disponibilidad** from the drawer; confirm the placeholder is gone.
2. Confirm the seven days show their open/closed state and hours.
3. Open a closed day, set valid hours and save; reopen and confirm persistence.
4. Close an open day and save; confirm the rule is removed.
5. Try an end time earlier than the start; confirm the validation error.
6. With time blocks, confirm date, time/full-day and reason.
7. Without blocks, confirm the empty state.
8. Add a range block and confirm it appears.
9. Add a full-day block and confirm it shows as full day.
10. Delete a block and confirm the confirmation dialog.
11. Pull to refresh and confirm the overlay.
12. Disconnect the API and confirm the error state with retry.
