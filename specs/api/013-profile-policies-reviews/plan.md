# Implementation Plan: Foundly API — Business Profile, Policies & Reviews

**Branch**: `013-profile-policies-reviews` | **Date**: 2026-10-13 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/api/013-profile-policies-reviews/spec.md`

## Summary

Add an authenticated, tenant-scoped `updateMyBusinessProfile` mutation (updates `Tenant.name/category` + the existing `BusinessProfile` slug/bio/address/phone/instagram/whatsapp/logo/cover and a structured policies list), and a new `Review` entity with a **public read** (`reviews(tenantId?, tenantSlug?)` → items + aggregate rating) and a **public guest submission** (`addReview`), reusing the ratified store-seam/service/resolver pattern and the standardized error envelope.

## Technical Context

**Language/Version**: TypeScript 5.9 (strict) · NestJS 11 · Node ≥ 20.

**Primary Dependencies**: `@nestjs/graphql` (code-first), `@foundly/database` (Prisma 6), `jose` (identity via the global `AuthModule`). **No new dependencies.**

**Storage**: PostgreSQL via Prisma. Reuses `BusinessProfile` (contact/social/about/`policies Json`); adds a new `Review` model → **one new migration**.

**Testing**: Vitest — unit (service/resolver against an in-memory store) and e2e (`AppModule` + local JWKS). `tsc --noEmit`; `nest build`; root ESLint.

**Target Platform**: NestJS HTTP/GraphQL server (`apps/api`).

**Project Type**: Web service (GraphQL API).

**Performance Goals**: standard read/write latency; reviews per business are bounded (list + aggregate computed in one query path).

**Constraints**: strict TS, no `any`; profile writes tenant-scoped from `ctx.user` (never client input); reviews read/write public with basic validation; no moderation workflow in v1.

**Scale/Scope**: profile update (extend `tenants` module) + a new `reviews` module (~5 files) + tests; ~4 GraphQL operations; 1 migration.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **SDD (§5.I)** — spec + this plan exist; `tasks.md` downstream; no code before approval.
- **Dominio (§2.III)** — spec in `specs/api/`; changes confined to `apps/api` (+ codegen snapshot in `apps/book`).
- **Tipado estricto (§5.IV)** — code-first types, typed rows/inputs; no `any`; no hand-written client DTOs.
- **Opt-in protection (§5.II / 008)** — only `updateMyBusinessProfile` uses `@RequireAuth`; `reviews`/`addReview` are public by design.
- **Gates (§3.I)** — `build`, `typecheck`, `test`, lint for `@foundly/api` with zero regressions.
- **Governance (§1)** — subordinated to `specs/business-model.md` and `constitution.md`.

**Pre-Phase-0**: PASS. **Post-Phase-1**: PASS (no violations → Complexity Tracking empty).

## Project Structure

### Documentation (this feature)

```text
specs/api/013-profile-policies-reviews/
├── plan.md
├── spec.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── business-profile-reviews.contract.md
├── checklists/requirements.md
└── tasks.md                 # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
apps/api/src/modules/
├── tenants/
│   ├── tenants.types.ts         # + BusinessPolicyInput, PortalPolicyObject; UpdateBusinessProfileInput; profile.policies → [PortalPolicyObject!]!
│   ├── tenants.service.ts       # + updateProfile(tenantId, input); parse/serialize policies
│   ├── tenants.resolver.ts      # + updateMyBusinessProfile(input) @RequireAuth
│   └── tenants.service.spec.ts  # + update cases
├── reviews/                     # NEW module
│   ├── reviews.types.ts         # ReviewObject, ReviewSummaryObject, AddReviewInput
│   ├── reviews.store.ts         # REVIEWS_STORE seam + PrismaReviewsStore
│   ├── reviews.test-store.ts    # in-memory store
│   ├── reviews.service.ts       # list(scope) + aggregate; add(input)
│   ├── reviews.resolver.ts      # reviews query (public); addReview mutation (public)
│   ├── reviews.module.ts
│   └── *.spec.ts
apps/api/src/app.module.ts       # register ReviewsModule
packages/database/prisma/schema.prisma  # + Review model (+ migration)
apps/book/codegen.schema.gql     # versioned SDL snapshot (codegen input)
```

**Structure Decision**: Profile update extends the existing `tenants` module (it owns tenant+profile); reviews follow the gallery/catalog store-seam pattern. No new packages.

## Complexity Tracking

> Not required: Constitution Check passes with no violations.
