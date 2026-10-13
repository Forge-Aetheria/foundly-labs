# Implementation Plan: Foundly API — Availability Time Blocks

**Branch**: `014-availability-time-blocks` | **Date**: 2026-10-13 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/api/014-availability-time-blocks/spec.md`

## Summary

Add a new `TimeBlock` Prisma entity (business, optional specialist, start/end instants, optional reason, timestamp) with its migration, and expose it through a new `time-block` NestJS module: a **public** `timeBlocks(tenantId?, tenantSlug?, specialistId?)` read and **authenticated, tenant-scoped** `addTimeBlock` / `removeTimeBlock` mutations guarded by the Supabase JWT identity. Mirrors the ratified store-seam/service/resolver pattern.

## Technical Context

**Language/Version**: TypeScript 5.9 (strict) · NestJS 11 · Node ≥ 20.

**Primary Dependencies**: `@nestjs/graphql` (code-first), `@foundly/database` (Prisma 6), `jose` (identity via the global `AuthModule`). **No new dependencies.**

**Storage**: PostgreSQL via Prisma. New `TimeBlock` model → **one new migration**.

**Testing**: Vitest — unit (service/resolver against an in-memory store) and e2e (`AppModule` + local JWKS). `tsc --noEmit`; `nest build`; root ESLint.

**Target Platform**: NestJS HTTP/GraphQL server (`apps/api`).

**Project Type**: Web service (GraphQL API).

**Performance Goals**: standard read/write latency; blocks are bounded per business; a single indexed query for reads.

**Constraints**: strict TS, no `any`; writes tenant-scoped from `ctx.user` (never client input); public read requires no credential; a named specialist must belong to the caller's business.

**Scale/Scope**: one module (`time-block.*`, ~6 files) + registration in `app.module.ts` + tests; 3 GraphQL operations; 1 migration.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **SDD (§5.I)** — spec + this plan exist; `tasks.md` downstream; no code before approval.
- **Dominio (§2.III)** — spec in `specs/api/`; changes confined to `apps/api` (+ codegen snapshot in `apps/book`).
- **Tipado estricto (§5.IV)** — code-first types, typed rows/inputs; no `any`; no hand-written client DTOs.
- **Opt-in protection (§5.II / 008)** — only the two mutations use `@RequireAuth`; the read stays public like availability/services.
- **Gates (§3.I)** — `build`, `typecheck`, `test`, lint for `@foundly/api` with zero regressions.
- **Governance (§1)** — subordinated to `specs/business-model.md` and `constitution.md`.

**Pre-Phase-0**: PASS. **Post-Phase-1**: PASS (no violations → Complexity Tracking empty).

## Project Structure

### Documentation (this feature)

```text
specs/api/014-availability-time-blocks/
├── plan.md
├── spec.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── time-blocks.contract.md
├── checklists/requirements.md
└── tasks.md                 # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
apps/api/src/modules/time-block/
├── time-block.types.ts      # TimeBlockObject ObjectType + AddTimeBlockInput
├── time-block.store.ts      # TIME_BLOCK_STORE seam + PrismaTimeBlockStore
├── time-block.test-store.ts # in-memory store for DB-free specs
├── time-block.service.ts    # list / add / remove (+ validation, scope)
├── time-block.resolver.ts   # timeBlocks query; addTimeBlock/removeTimeBlock mutations
├── time-block.module.ts     # wiring
└── *.spec.ts                # unit + e2e
apps/api/src/app.module.ts              # register TimeBlockModule
packages/database/prisma/schema.prisma  # + TimeBlock model (+ migration)
apps/book/codegen.schema.gql            # versioned SDL snapshot (codegen input)
```

**Structure Decision**: Mirrors the gallery/catalog module (narrow store seam + service + resolver + memory test store). The public read follows the availability/services query style. No new packages.

## Complexity Tracking

> Not required: Constitution Check passes with no violations.
