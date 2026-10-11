# Research: Foundly Book — Gallery Management

**Feature**: `specs/book/006-gallery-management/` | **Date**: 2026-10-10

## Prior art in the codebase

- `apps/book/src/modules/{staff,gallery,profile}/` already ships a `GalleryManager` (URL grid + separate
  add-remove) and `addGalleryImage`/`removeGalleryImage`. This feature upgrades the model from plain
  URL strings to annotated photos (title, category) and adds a lightbox preview with precise removal.
- The public landing renders `#galeria` from `Tenant.gallery` via `getPublicBusiness`
  (`modules/public-booking/utils/queries.ts`) and `ProviderSections#GallerySection`; no UI changes are
  needed there beyond rendering the new metadata and an empty state.
- `@foundly/ui` already provides `Modal` (lightbox shell), `TextField` (multiline/maxLength), `Badge`
  and `Chip` (selectable tag picker); no new shared primitives are required.

## Decisions

1. **Photo model**: `GalleryPhoto { id, url, title?, description?, category? }`. A stable `id`
   (random uuid) makes removal precise and allows duplicates to be handled cleanly (spec FR-008).
2. **Category set**: fixed trio `Local` · `Trabajos` · `Equipo` plus `sin categoría` (none), rendered
   as a user-facing tag; implement as a selectable `Chip` row and displayed as a `Badge`.
3. **URL validation**: schema-level via Zod `z.string().url()` → `VALIDATION_ERROR` with inline field
   errors (consistent with the staff module).
4. **Precise removal**: remove by photo `id`, not by URL; confirmation via `AlertDialog`.
5. **Lightbox**: reuse the `@foundly/ui` `Modal` (large glass surface) to preview the selected photo;
   keyboard dismissible (ESC/backdrop) per the DS contract.
6. **State sync**: components update local state from action results; actions write to the same
   `getStore()` seam read by `getPublicBusiness`, so the public `#galeria` reflects additions and
   removals immediately (mock seam; real persistence deferred).
7. **Migration of seeds**: both seeded tenants (`estudio-ana`, `rona-piercing`) move from `string[]`
   to `GalleryPhoto[]` with inferred categories; a public read maps them to `PublicGalleryPhoto`.

## Risks

- Changing `Tenant.gallery` from `string[]` to `GalleryPhoto[]` touches the store, the public query
  and both admin components — the plan sequences model → actions → components → tests to keep each
  step green.
- The existing `storefront/actions.test.ts` and `GalleryManager.test.tsx` assert string arrays; they
  must be updated alongside the model (TDD: adapt tests first).
