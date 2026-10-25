# Quickstart Validation: Mobile Reviews Module

**Feature**: `specs/mobile/007-reviews-module/spec.md`
**Date**: 2026-10-25

## Prerequisites

- Authenticated tenant session.
- API reachable from the device.
- Reviews in pending, approved and rejected states for filter/moderation tests.

## Automated verification

```bash
pnpm --filter @foundly/mobile typecheck
pnpm --filter @foundly/mobile lint
pnpm --filter @foundly/mobile test
pnpm --filter @foundly/mobile build
```

Expected: all pass; review helper tests cover filters, labels and transitions.

## Manual validation

1. Open **Reseñas** from the drawer; confirm the placeholder is gone.
2. With reviews, confirm author, rating, date, comment and state.
3. Filter by Pendientes/Aprobadas/Rechazadas and confirm the list.
4. Filter with no matches and confirm the empty state.
5. Approve a pending review and confirm the state changes.
6. Reject a pending review and confirm the state changes.
7. Confirm approve is disabled for approved reviews and reject for rejected.
8. Delete a review and confirm the confirmation dialog.
9. Pull to refresh and confirm the overlay.
10. Disconnect the API and confirm the error state with retry.
11. Trigger a moderation error (if possible) and confirm the list remains intact.
