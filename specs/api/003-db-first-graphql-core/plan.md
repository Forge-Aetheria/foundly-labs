# Implementation Plan: Foundly API — DB-First Core Data & GraphQL Domain

**Branch**: `003-db-first-graphql-core` | **Date**: 2026-10-11 | **Spec**: `specs/api/003-db-first-graphql-core/spec.md`

**Input**: Feature specification from `/specs/api/003-db-first-graphql-core/spec.md`

## Summary

Refine the DB-First persistence schema (`packages/database/prisma/schema.prisma`) so the seven booking
entities — `Tenant`, `BusinessProfile`, `Service`, `Specialist` (staff), `Availability`, `Appointment`,
`GalleryPhoto` — model the reservation SaaS 1:1 with the `apps/book` domain, and create the first
domain module in `apps/api/src/modules/` (`Tenants`, the aggregate root) exposing the anchor business
and its public profile/services over GraphQL (code-first), backed by the shared Prisma client through a
mockable `PrismaService` seam. Adds unit/integration coverage and keeps the workspace gates green
without requiring a live database.

## Technical Context

**Language/Version**: TypeScript strict · Node 20+ · NestJS 11 · Prisma 6 · GraphQL 16

**Primary Dependencies**: `@foundly/database` (Prisma client seam, existing); `@nestjs/graphql`, `@nestjs/apollo`, `@apollo/server`, `graphql` (already in `apps/api`); dev: `@nestjs/testing`, `supertest`, vitest.

**Storage**: Prisma + PostgreSQL (DB-First, ratified in `002-persistence-graphql`). The schema evolves in place (`schema.prisma`); the generated client is reproducible via `prisma generate` and does not require a running database for this feature's gates.

**Testing**: Vitest + `@nestjs/testing` + supertest. A mockable `PrismaService` wraps the shared client so unit/contract tests stay green without a live DB; one GraphQL e2e spec drives read/write flows with stubbed data.

**Target Platform**: Node.js HTTP server (NestJS) + shared `@foundly/database` package.

**Project Type**: Monorepo — API domain module (`apps/api`) + shared data package (`packages/database`).

**Performance Goals**: N/A (internal API; first domain module).

**Constraints**: `packages/*` never import from `apps/*`; persistence stays behind `@foundly/database` (single seam from 002); tests must not require a live DB; strict typing (no `any`, no implicit casts); no regressions in `apps/book`/`@foundly/ui`.

**Scale/Scope**: schema for the 7 booking entities (+ explicit specialist↔service join) and one domain module (`Tenants`) with a read surface (list anchor business, resolve by public slug, its services) and one initial creation mutation (tenant + public profile). Per-entity CRUD, migrations/seeding, and tenant-level auth are out of scope.

## Constitution Check

_GATE: must pass before Phase 0 research. Re-check after Phase 1 design._

- **SDD**: passes — the spec exists (`specs/api/003-…/spec.md`) and references `specs/business-model.md`; this plan implements it.
- **Persistence governance**: the storage strategy (Prisma + PostgreSQL via `@foundly/database`) was ratified in `002`/`specs/architecture.md`; this feature **evolves the schema under the ratified strategy** — no new storage technology, no governance amendment.
- **`packages/*` never import from `apps/*`**: `@foundly/database` keeps depending only on `@prisma/client`; `apps/api` imports from `@foundly/database` (allowed direction).
- **Strict typing (constitution §5.IV)**: GraphQL object/input types and the service layer are fully typed; no `any`, no implicit casts; Prisma generated types are re-exported.
- **GraphQL dev posture**: playground/introspection stay enabled only when `NODE_ENV !== 'production'` (unchanged from 002).
- **Module structure**: `apps/api/src/modules/<modulo>/` follows the NestJS modular standard the user requested and the monorepo "thin routes/surfaces + modules + shared" pattern; no new top-level project is introduced (no Complexity Tracking violation).

**Post-design re-check**: PASS — schema stays in the ratified seam; `apps/api` gains a thin, mockable data access through `PrismaService`; the module is API-local; gates preserved.

## Project Structure

### Documentation (this feature)

```text
specs/api/003-db-first-graphql-core/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   ├── database-schema.contract.md
│   └── tenants-graphql.contract.md
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
packages/database/                       # existing shared package (@foundly/database)
├── prisma/
│   └── schema.prisma                    # EVOLVED DB-First: Tenant, BusinessProfile, Service,
│                                        #   Specialist, Availability, Appointment, GalleryPhoto
│                                        #   + SpecialistService (M:N join)
└── src/index.ts                         # unchanged: exports prisma client + generated types

apps/api/
└── src/
    ├── app.module.ts                    # + TenantsModule
    ├── shared/
    │   └── prisma/
    │       ├── prisma.module.ts         # provides PrismaService
    │       └── prisma.service.ts        # @Injectable wrapper over @foundly/database prisma client
    └── modules/
        └── tenants/
            ├── tenants.module.ts        # wires resolver + service, imports SharedPrisma
            ├── tenants.types.ts         # code-first object/input types (Tenant, BusinessProfile…)
            ├── tenants.service.ts       # reads/writes via PrismaService ($transaction for create)
            ├── tenants.resolver.ts      # queries tenant(slug)/tenants + createTenant mutation
            ├── tenants.service.spec.ts  # unit (mocked PrismaService)
            └── tenants.resolver.spec.ts # GraphQL e2e (stubbed PrismaService)
```

**Structure Decision**: the DB schema and client remain the single persistence seam in
`@foundly/database`; `apps/api` exposes a thin `PrismaService` provider (mockable) and the first
domain module under `apps/api/src/modules/tenants/`, keeping the GraphQL layer (code-first) as
resolver+service over that seam.

## Complexity Tracking

> Fill ONLY if Constitution Check has violations that must be justified

| Violation | Why Needed | Simpler Alternative Rejected Because |
| --------- | ---------- | ------------------------------------ |
| _None_    | —          | —                                    |
