# Research: Foundly Book — Staff Management

**Feature**: `specs/book/005-staff-management/` | **Date**: 2026-10-10

## Prior art in the codebase

- `apps/book/src/features/storefront/` already implements `StaffManager` (table), `createStaff` /
  `updateStaff` / `setStaffActive` / `removeStaff`, and tenant-scoped authorization. This feature
  upgrades the surface (table → glass card grid) and the data (adds service assignment).
- The public portal (`features/public-booking`) maps tenant `resources` → `specialists` and renders
  them in `ProviderSections#TeamSection`; deactivated resources are already excluded
  (`resource.active`), so the status toggle reuses that guarantee (spec FR-007).
- `@foundly/ui` has no `Switch`/`Checkbox`/`Select` primitives; `TextField` lacks `multiline`/`maxLength`.
  The DS wraps MUI components thinly (`TextField`, `Chip`, `DataTable`), so extending it is the
  established pattern and satisfies C1/FR-009.

## Decisions

1. **Service assignment model**: `Resource.serviceIds?: string[]`. Storing ids (not names) keeps one
   source of truth; names are resolved at render (admin catalog) and at public resolution (`queries.ts`).
2. **Grid instead of table**: a responsive `Stack` grid of glass cards mirrors the public `TeamSection`
   visual language; per-card actions stay explicit pill buttons (no menu primitive in the DS yet).
3. **State sync**: components keep local state updated from action results; actions write to the same
   `getStore()` seam read by `getPublicBusiness`, so the public view reflects changes (mock seam; real
   persistence deferred).
4. **Validation split**: schema-level (name/role required, `VALIDATION_ERROR`) in `actions.ts`, plus a
   client-side pre-check in the modal for instant feedback; "no services" is a warning, not a blocker.

## Risks

- Adding `serviceIds` is a data-model change: keep the field optional so existing fixtures/seeds/tests
  remain valid.
- New `@foundly/ui` primitives must stay thin and token-consistent; add minimal tests to keep the
  shared-ui suite green.