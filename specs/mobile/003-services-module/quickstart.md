# Quickstart Validation: Mobile Services Module

**Feature**: `specs/mobile/003-services-module/spec.md`
**Date**: 2026-10-25

## Prerequisites

- Authenticated tenant session.
- API reachable from the device.
- At least one service, or permission to create one.

## Automated verification

```bash
pnpm --filter @foundly/mobile typecheck
pnpm --filter @foundly/mobile lint
pnpm --filter @foundly/mobile test
pnpm --filter @foundly/mobile build
```

Expected: all pass; the services form tests cover cents conversion, validation, labels and defaults.

## Manual validation

1. Open **Servicios** from the drawer; confirm the placeholder is gone.
2. With existing services, confirm name, category, duration, price, advance and status.
3. Without services, confirm the empty state.
4. Create a service with name, duration, price and no advance; confirm it appears.
5. Create a service with a fixed advance and confirm the amount is shown in EUR.
6. Create a service with a percentage advance and confirm the percentage is shown.
7. Edit a service and verify the list updates.
8. Delete a service and confirm the confirmation dialog appears.
9. Pull to refresh; confirm the overlay appears while fetching.
10. Stop the API or lose connectivity; confirm the error state and retry.
