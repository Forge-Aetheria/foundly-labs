# Implementation Plan: Foundly API — Gallery Management

**Branch**: `012-gallery-management` | **Date**: 2026-10-13 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/api/012-gallery-management/spec.md`

## Summary

Expose the **existing** `GalleryPhoto` Prisma entity (already related to `Tenant` and migrated) through a new `gallery` NestJS module: a **public** `gallery(tenantId?, tenantSlug?)` read, plus **authenticated, tenant-scoped** `addGalleryItem` / `removeGalleryItem` mutations guarded by the Supabase JWT identity (`@RequireAuth`). Writes derive the tenant from `ctx.user` (never the client), validate the URL, reject duplicates with `CONFLICT`, and assign a display order. The module mirrors the ratified catalog module (store seam + service + resolver + in-memory test store).

## Technical Context

**Language/Version**: TypeScript 5.9 (strict) · NestJS 11 · Node ≥ 20.

**Primary Dependencies**: `@nestjs/graphql` (code-first), `@foundly/database` (Prisma 6 client), `jose` (identity, via the global `AuthModule`). **No new dependencies.**

**Storage**: PostgreSQL via Prisma. Entity: `GalleryPhoto` (existing; table created by `20261012002831_init_foundly_schema`). **No new migration.**

**Testing**: Vitest — unit (service/resolver against an in-memory store) and e2e (`AppModule` + local JWKS + memory store). `tsc --noEmit`; `nest build`; root ESLint.

**Target Platform**: NestJS HTTP/GraphQL server (`apps/api`).

**Project Type**: Web service (GraphQL API).

**Performance Goals**: standard read/write latency; gallery lists are small per tenant; a single indexed query for reads.

**Constraints**: strict TS, no `any`; writes tenant-scoped from `ctx.user`; public read requires no credential; unknown slug → empty list (no existence oracle on writes → `NOT_FOUND`).

**Scale/Scope**: 1 new module (`gallery.*`, ~6 files) + registration in `app.module.ts` + tests; 3 GraphQL operations.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **SDD (§5.I)** — `spec.md` + this plan exist; `tasks.md` downstream; no code before approval.
- **Dominio (§2.III)** — spec lives in `specs/api/`; changes confined to `apps/api` (+ the versioned codegen schema snapshot in `apps/book`).
- **Tipado estricto (§5.IV)** — typed rows/inputs, code-first GraphQL types; no `any`; no hand-written DTOs on the client.
- **Opt-in protection (§5.II / 008)** — only the two mutations use `@RequireAuth`; reads stay public like the other public queries.
- **Gates (§3.I)** — `build`, `typecheck`, `test`, lint for `@foundly/api` must pass with zero regressions.
- **Governance (§1)** — subordinated to `specs/business-model.md` and `constitution.md`; no entitlement/pricing behaviour introduced.

**Pre-Phase-0**: PASS. **Post-Phase-1**: PASS (no violations → Complexity Tracking empty).

## Project Structure

### Documentation (this feature)

```text
specs/api/012-gallery-management/
├── plan.md              # This file (/speckit.plan output)
├── spec.md              # Feature specification (/speckit.specify output)
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── gallery.contract.md
├── checklists/
│   └── requirements.md
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
apps/api/src/
├── app.module.ts                    # register GalleryModule
└── modules/gallery/
    ├── gallery.types.ts             # GalleryItem ObjectType + AddGalleryItemInput
    ├── gallery.store.ts             # GALLERY_STORE seam + PrismaGalleryStore
    ├── gallery.test-store.ts        # in-memory store for DB-free specs
    ├── gallery.service.ts           # list / add / remove (+ validation, dedupe, scope)
    ├── gallery.resolver.ts          # gallery query; addGalleryItem/removeGalleryItem mutations
    ├── gallery.module.ts            # wiring
    ├── gallery.service.spec.ts      # unit
    ├── gallery.resolver.spec.ts     # unit
    └── gallery.e2e.spec.ts          # integration (AppModule + JWKS + memory store)

apps/book/codegen.schema.gql         # versioned SDL snapshot synced with the new surface (codegen input)
```

**Structure Decision**: Mirrors the ratified `catalog` module (narrow store seam + service + resolver + memory test store). The public read follows the `services` / `specialists` / `availability` query style (accept `tenantId` or `tenantSlug`). No new packages; no schema/migration changes.

## Complexity Tracking

> Not required: Constitution Check passes with no violations.
