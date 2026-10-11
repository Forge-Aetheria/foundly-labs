# Implementation Plan: Foundly API — GraphQL Modules for Services, Specialists & Availability

**Branch**: `004-services-specialists-availability` | **Date**: 2026-10-11 | **Spec**: `specs/api/004-services-specialists-availability/spec.md`

**Input**: Feature specification from `/specs/api/004-services-specialists-availability/spec.md`

## Summary

Add three domain modules to `apps/api` on top of the 003 data layer and Prisma seam: `services`
(catalog CRUD + tenant scoping + category/duration filters), `specialists` (professional CRUD +
biography + service assignments via `SpecialistService`), and `availability` (weekly schedule
read/write scoped to business and optionally specialist). Each module ships a code-first GraphQL
resolver/service over the existing `PrismaService`, with DB-free unit + e2e tests under the swc/vitest
instrumentation established in `003`.

## Technical Context

**Language/Version**: TypeScript strict · Node 20+ · NestJS 11 · GraphQL 16 · Prisma 6

**Primary Dependencies**: `@foundly/database` (Prisma seam; models `Service`, `Specialist`,
`SpecialistService`, `Availability` already evolved in `003`); `@nestjs/graphql`, `@nestjs/apollo`,
`@apollo/server`, `graphql` (existing); dev: `@nestjs/testing`, `supertest`, vitest (swc transform).

**Storage**: Prisma + PostgreSQL via `@foundly/database` (ratified in 002/003). No schema change in this
feature; the four entities already exist. All find/create/update/delete flows go through the injectable
`PrismaService` (`apps/api/src/shared/prisma/`).

**Testing**: Vitest + `@nestjs/testing` + supertest with the swc plugin (decorator metadata) configured in
`003`; DB-free via a mocked `PrismaService` (in-memory fakes). Unit specs per service, e2e specs per
resolver over `POST /graphql`.

**Target Platform**: Node.js HTTP server (NestJS), monorepo.

**Project Type**: Monorepo — three `apps/api` domain modules.

**Performance Goals**: N/A (catalog/specialist/availability operations with tenant-scoped reads).

**Constraints**: `packages/*` never import from `apps/*`; persistence stays behind `@foundly/database`;
tests must not require a live DB; strict typing (no `any`, no implicit casts); no regressions in
existing apps/packages; reuse the 003 `PrismaService` seam and error-code conventions.

**Scale/Scope**: list/detail/create/update/(de)activate/remove per module; category + duration-range
filters; specialist↔service assignments in both directions; weekly availability entries. Tenant-level
auth, appointments, gallery and tenant management are out of scope.

## Constitution Check

_GATE: must pass before Phase 0 research. Re-check after Phase 1 design._

- **SDD**: passes — the spec exists (`specs/api/004-…/spec.md`) and references `specs/business-model.md`; this plan implements it.
- **Persistence governance**: storage strategy ratified (Prisma + PostgreSQL via `@foundly/database`); this feature only adds domain modules — no schema/technology change, no governance amendment.
- **`packages/*` never import from `apps/*`**: unchanged; `apps/api` consumes `@foundly/database` (allowed direction).
- **Strict typing (constitution §5.IV)**: all GraphQL object/input types and services fully typed; errors are machine-readable via `extensions.code` (reusing `VALIDATION_ERROR`/`NOT_FOUND`/`CONFLICT` from 003).
- **GraphQL dev posture**: code-first `autoSchemaFile`; playground/introspection only outside production (unchanged).
- **Module structure**: `apps/api/src/modules/<modulo>/` (NestJS standard, user-requested); reuses the `apps/api/src/shared/prisma/` seam — no new top-level project (no Complexity Tracking violation).

**Post-design re-check**: PASS — three thin modules over the existing seam; no schema drift; tests stay
DB-free; gates preserved.

## Project Structure

### Documentation (this feature)

```text
specs/api/004-services-specialists-availability/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   ├── services-graphql.contract.md
│   ├── specialists-graphql.contract.md
│   └── availability-graphql.contract.md
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
apps/api/src/
├── app.module.ts                       # + ServicesModule, SpecialistsModule, AvailabilityModule
├── modules/
│   ├── services/
│   │   ├── services.module.ts          # imports SharedPrismaModule
│   │   ├── services.types.ts           # ServiceObject, SpecialistRefObject, ServiceInput(s), filters
│   │   ├── services.service.ts         # findByTenant (tenantId/slug) + filters; CRUD; cleans assignments
│   │   ├── services.resolver.ts        # queries services/service + mutations
│   │   ├── services.service.spec.ts    # unit (mocked PrismaService)
│   │   └── services.resolver.spec.ts   # GraphQL e2e (stubbed PrismaService)
│   ├── specialists/
│   │   ├── specialists.module.ts
│   │   ├── specialists.types.ts        # SpecialistObject, ServiceRefObject, SpecialistInput
│   │   ├── specialists.service.ts      # CRUD + assign/unassign via SpecialistService
│   │   ├── specialists.resolver.ts
│   │   ├── specialists.service.spec.ts
│   │   └── specialists.resolver.spec.ts
│   └── availability/
│       ├── availability.module.ts
│       ├── availability.types.ts       # AvailabilityObject, AvailabilityInput
│       ├── availability.service.ts     # read by tenant/specialist; create/update/remove; validation
│       ├── availability.resolver.ts
│       ├── availability.service.spec.ts
│       └── availability.resolver.spec.ts
└── shared/prisma/                      # existing PrismaService seam (003, reused unchanged)
```

**Structure Decision**: three independent domain modules under `apps/api/src/modules/`, each owning its
GraphQL types (no cross-module imports — ref types such as `SpecialistRefObject`/`ServiceRefObject` are
declared locally to avoid circular type dependencies) and each consuming the existing global
`PrismaService`.

## Complexity Tracking

> Fill ONLY if Constitution Check has violations that must be justified

| Violation | Why Needed | Simpler Alternative Rejected Because |
| --------- | ---------- | ------------------------------------ |
| _None_    | —          | —                                    |
