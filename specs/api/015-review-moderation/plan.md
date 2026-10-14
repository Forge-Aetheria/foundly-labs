# Implementation Plan: Foundly API — Review Moderation

**Branch**: `015-review-moderation` | **Date**: 2026-10-13 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/api/015-review-moderation/spec.md`

## Summary

Add a **moderation state** to the existing `Review` entity (`pending | approved | rejected`, default `pending`) with one migration that backfills existing rows to `approved`, and extend the existing `reviews` NestJS module with: an authenticated, tenant-scoped admin read `myReviews(state?)`; an idempotent `setReviewState(id, state)` mutation; and a `deleteReview(id)` mutation (all `@RequireAuth` + tenant derived from `ctx.user`). The public `reviews` read now returns **only approved** reviews and computes the aggregate over approved reviews only. New submissions default to `pending`. Extends `specs/api/013-profile-policies-reviews` and is the backend for the moderation story of `specs/book/016-admin-ux-hardening`.

## Technical Context

**Language/Version**: TypeScript 5.9 (strict) · NestJS 11 · Node ≥ 20.

**Primary Dependencies**: `@nestjs/graphql` (code-first), `@foundly/database` (Prisma 6), `jose` (identity via the global `AuthModule`). **No new dependencies.**

**Storage**: PostgreSQL via Prisma. The existing `Review` model gains `state` (+ enum + index) → **one new migration with a data backfill**.

**Testing**: Vitest — unit (service/resolver against the in-memory `ReviewsStore`) and e2e (`AppModule` + local JWKS + memory store). `tsc --noEmit`; `nest build`; root ESLint.

**Target Platform**: NestJS HTTP/GraphQL server (`apps/api`).

**Project Type**: Web service (GraphQL API).

**Performance Goals**: standard read/write latency; the public read filters by `state` on an indexed, tenant-scoped query; moderation writes are single-row, indexed by id + tenant.

**Constraints**: strict TS, no `any`; moderation writes derive the business from the authenticated identity (never client input); the public read stays credential-free; `setReviewState` is idempotent for the target state.

**Scale/Scope**: one existing module extended (`reviews.types/store/test-store/service/resolver`, ~6 files) ; 4 GraphQL operations (public read unchanged in shape, 1 admin read, 2 moderation mutations); 1 migration.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **SDD (§5.I)** — spec + this plan exist; `tasks.md` downstream; no code before approval.
- **Dominio (§2.III)** — spec in `specs/api/`; changes confined to `apps/api` (+ Prisma schema/migration in `packages/database` + codegen snapshot in `apps/book`).
- **Tipado estricto (§5.IV)** — code-first enum/types, typed rows/inputs; no `any`; no hand-written client DTOs.
- **Opt-in protection (§5.II / 008)** — only the admin read and the two moderation writes use `@RequireAuth`; the public read/submission stay public like `013`.
- **Gates (§3.I)** — `build`, `typecheck`, `test`, lint for `@foundly/api` with zero regressions.
- **Test location (TODO(monorepo))** — `apps/api` keeps the NestJS colocated `*.spec.ts` convention; the `code-rules.md` §10 migration is deferred (confirmed with the project owner, 2026-10-13).
- **Governance (§1)** — subordinated to `specs/business-model.md` and `constitution.md`; respects the trustworthy-reputation value proposition (`business-model.md` §2.3).

**Pre-Phase-0**: PASS. **Post-Phase-1**: PASS (no violations → Complexity Tracking empty).

## Project Structure

### Documentation (this feature)

```text
specs/api/015-review-moderation/
├── plan.md
├── spec.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── review-moderation.contract.md
├── checklists/requirements.md
└── tasks.md                 # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
apps/api/src/modules/reviews/
├── reviews.types.ts        # + ReviewState enum + state on ReviewObject (+ moderation args)
├── reviews.store.ts        # ReviewsStore seam: + state filter, setState, deleteById; ReviewRow + state
├── reviews.test-store.ts   # in-memory store gains the same operations
├── reviews.service.ts      # public filtered read/add (pending); + listForAdmin / setState / remove
├── reviews.resolver.ts     # + myReviews query; setReviewState / deleteReview mutations (@RequireAuth)
└── *.spec.ts               # unit + e2e (NestJS colocated convention)
apps/api/src/app.module.ts               # ReviewsModule already registered (no change expected)
apps/api/src/schema.gql                  # regenerated SDL (runtime artifact)
packages/database/prisma/schema.prisma   # Review.state + enum + index
packages/database/prisma/migrations/<new>/migration.sql   # add column/enum + backfill approved
apps/book/codegen.schema.gql             # versioned SDL snapshot (consumed by book 016)
```

**Structure Decision**: Extends the existing `reviews` module in place (narrow store seam + service + resolver + memory test store), mirroring the `catalog`/`gallery`/`time-block` pattern. No new module and no new packages; the moderation surface is a natural extension of the `013` reviews surface.

## Complexity Tracking

> Not required: Constitution Check passes with no violations.
