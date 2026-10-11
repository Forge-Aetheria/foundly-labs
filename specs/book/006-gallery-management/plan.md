# Implementation Plan: Foundly Book — Gallery Management

**Branch**: `006-gallery-management` | **Date**: 2026-10-10 | **Spec**: `specs/book/006-gallery-management/spec.md`

**Input**: Feature specification from `/specs/book/006-gallery-management/spec.md`

## Summary

Turn `/admin/gallery` into a curated photo manager: a glassmorphism card grid of the business's
photos, an add-photo modal (URL required/validated, optional short title/description and a
category tag Local · Trabajos · Equipo), a lightbox preview and a confirmed removal. Photo records
carry a stable identity and metadata, and every admin mutation writes to the same store seam read by
`getPublicBusiness`, so the public `#galeria` block reflects changes immediately. Reuses the
existing storefront feature module and the `@foundly/ui` primitives.

## Technical Context

**Language/Version**: TypeScript 5.9 · React 19 · Next.js 15.5 (App Router)

**Primary Dependencies**: `@foundly/ui` (design system) · MUI v6 (engine of `@foundly/ui`) · Zod 4

**Storage**: None — in-memory seam `apps/book/src/shared/infra/store.ts`

**Testing**: Vitest + RTL + vitest-axe (`npm run test -w @foundly/book`); `@foundly/ui` suite for shared primitives (`npm run test -w @foundly/ui`)

**Target Platform**: Web (Next.js server components + client islands)

**Project Type**: Web application (monorepo workspace)

**Performance Goals**: N/A (small admin surfaces; static photo URLs)

**Constraints**: C1 — views use `@foundly/ui` only; C2 — `apps/book/src/shared` stays free of React/Next/MUI/storage imports; C3 — persistence only through the store seam.

**Scale/Scope**: single-screen admin feature + model enrichment; ~1 grid view + 1 form modal + 1 lightbox.

## Constitution Check

_GATE: must pass before Phase 0 research. Re-check after Phase 1 design._

- Specs live under `/specs/<dominio>/<nnn>-<feature>/` → **OK** (`book/006-gallery-management`).
- Views consume `@foundly/ui` + tokens, no hex literals → **OK** (glass cards and pills via `GLASS_CARD_SX` / tokens).
- Domain logic pure → **OK** (`GalleryPhoto` is a plain model; URL/category rules validated in actions and shared UI).
- Persistence not defined → **OK** (mutations go through the store seam only; uploads out of scope, URL-based).

_Re-check after Phase 1 design:_ **PASS** — no new `@foundly/ui` primitives required (Modal/TextField/Badge/Chip/Checkbox cover the surface); the model change stays in `apps/book/src/shared` (pure types); all mutations remain behind the store seam.

## Project Structure

### Documentation (this feature)

```text
specs/book/006-gallery-management/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   └── admin-gallery.contract.md
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
apps/book/src/shared/types/tenancy.ts                      # EXTEND: GalleryPhoto + Tenant.gallery
apps/book/src/shared/infra/store.ts                              # EXTEND: seed gallery items (Ana, Rona)
apps/book/src/modules/{staff,gallery,profile}/utils/schemas.ts               # EXTEND: gallery photo schema (url/title/description/category)
apps/book/src/modules/{staff,gallery,profile}/utils/actions.ts               # EXTEND: add/update/remove gallery photo by id
apps/book/src/modules/{staff,gallery,profile}/utils/queries.ts               # EXTEND: listGallery returns GalleryPhoto[]
apps/book/src/modules/gallery/components/GalleryManager.tsx     # REWRITE: grid + form + lightbox + remove
apps/book/src/modules/gallery/tests/GalleryManager.test.tsx # UPDATE tests
apps/book/src/modules/{staff,gallery,profile}/tests/actions.test.ts          # UPDATE gallery action tests
apps/book/src/modules/public-booking/utils/types.ts             # EXTEND: PublicGalleryPhoto
apps/book/src/modules/public-booking/utils/queries.ts           # EXTEND: map gallery items
apps/book/src/modules/public-booking/components/ProviderSections.tsx  # GallerySection items + empty state
specs/book/006-gallery-management/                         # feature docs (this feature)
```

**Structure Decision**: Feature docs in the domain spec folder; implementation reuses the existing
`storefront` feature module under `apps/book/src/modules/` (no new app/package, no new `@foundly/ui`
primitives required — `Modal`, `TextField` (multiline/maxLength), `Badge`, `Chip`, `Checkbox` cover the surface).

## Complexity Tracking

| Violation                                                 | Why Needed                                                                                         | Simpler Alternative Rejected Because                                           |
| --------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Gallery model changes from `string[]` to `GalleryPhoto[]` | Photos need title, category and a stable identity for precise removal/preview (spec FR-002/FR-008) | Keeping `string[]` would drop metadata and make removal ambiguous (duplicates) |
| Two seed tenants migrate their gallery seeds              | Mock store must render the enriched cards out of the box                                           | Leaving raw strings would break the type contract after the model change       |
