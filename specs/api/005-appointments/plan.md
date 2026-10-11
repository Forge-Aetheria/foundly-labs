# Implementation Plan: Foundly API — Appointments & Bookings GraphQL Module

**Branch**: `005-appointments` | **Date**: 2026-10-11 | **Spec**: `specs/api/005-appointments/spec.md`

**Input**: Feature specification from `/specs/api/005-appointments/spec.md`

## Summary

Add the `appointments` domain module to `apps/api` (`apps/api/src/modules/appointments/`) on top of the
established Prisma seam: agenda queries (`appointments` with tenant/date-range/specialist/status
filters and `appointment(id)`), a `createAppointment` mutation with service/specialist existence +
same-business validation and a no-overlap guarantee, an `updateAppointmentStatus` mutation with an
allowed-transitions map, and `cancelAppointment` with an optional reason. A targeted additive schema
change adds `Appointment.cancellationReason String?`; the Prisma client is regenerated. Registered in
`AppModule`; DB-free unit + e2e specs under the swc/vitest setup from `003`.

## Technical Context

**Language/Version**: TypeScript strict · Node 20+ · NestJS 11 · GraphQL 16 · Prisma 6

**Primary Dependencies**: `@foundly/database` (Appointment/Service/Specialist models, existing);
`@nestjs/graphql`, `@nestjs/apollo`, `@apollo/server`, `graphql` (existing); dev: `@nestjs/testing`,
`supertest`, vitest (swc transform).

**Storage**: Prisma + PostgreSQL via `@foundly/database`. One **additive** schema field —
`Appointment.cancellationReason String?` — then `npm run generate -w @foundly/database`. All flows go
through the injectable `PrismaService` (`apps/api/src/shared/prisma/`).

**Testing**: Vitest + `@nestjs/testing` + supertest (swc metadata transform from `003`); DB-free via a
mocked `PrismaService`. Unit specs per flow; resolver e2e specs over `POST /graphql`.

**Target Platform**: Node.js HTTP server (NestJS), monorepo.

**Project Type**: Monorepo — one `apps/api` domain module (+ additive DB field).

**Performance Goals**: N/A (tenant-scoped agenda reads).

**Constraints**: `packages/*` never import from `apps/*`; persistence stays behind `@foundly/database`;
tests require no live DB; strict typing; reuse `PrismaService`, `tenant-scope` helpers and the
error-code conventions (`VALIDATION_ERROR`/`NOT_FOUND`/`CONFLICT`) from `003`/`004`; no regressions.

**Scale/Scope**: agenda reads (filters), create with existence + overlap checks, status update by an
allowed-transitions map, cancel with optional reason. Notifications, rescheduling, no-show, payments,
check-in and tenant-level auth are out of scope.

## Constitution Check

_GATE: must pass before Phase 0 research. Re-check after Phase 1 design._

- **SDD**: passes — spec exists (`specs/api/005-appointments/spec.md`) and references `specs/business-model.md`.
- **Persistence governance**: the storage strategy is ratified (Prisma + PostgreSQL via `@foundly/database`); this feature makes only an **additive** schema field (`cancellationReason`) under the same strategy — no new technology, no governance amendment.
- **`packages/*` never import from `apps/*`**: unchanged; `apps/api` consumes `@foundly/database`.
- **Strict typing (constitution §5.IV)**: all GraphQL types/services fully typed; machine-readable errors via `extensions.code`.
- **GraphQL dev posture**: code-first `autoSchemaFile`; playground/introspection only outside production.
- **Module structure**: `apps/api/src/modules/appointments/` (NestJS standard) reusing `shared/prisma` + `shared/tenant-scope` — no new top-level project.

**Post-design re-check**: PASS — one thin module over the existing seam; additive field only; tests DB-free; gates preserved.

## Project Structure

### Documentation (this feature)

```text
specs/api/005-appointments/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   └── appointments-graphql.contract.md
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
packages/database/
├── prisma/schema.prisma              # EDIT (additive): Appointment + cancellationReason String?
└── (regenerate client via npm run generate -w @foundly/database)

apps/api/src/
├── app.module.ts                     # + AppointmentsModule
├── modules/appointments/
│   ├── appointments.module.ts        # imports SharedPrismaModule
│   ├── appointments.types.ts         # AppointmentObject (type "Appointment"), refs, inputs
│   ├── appointments.service.ts       # queries/filters; create (existence+overlap); status; cancel
│   ├── appointments.resolver.ts      # queries appointments/appointment + 3 mutations
│   ├── appointments.service.spec.ts  # unit (mocked PrismaService)
│   └── appointments.resolver.spec.ts # GraphQL e2e (stubbed PrismaService)
└── shared/                           # existing seam + tenant-scope/error helpers (003/004, reused)
```

**Structure Decision**: module-scoped types (local `AppointmentService`/`AppointmentSpecialist` refs to
avoid GraphQL type-name collisions with `Service`/`Specialist` from `003`/`004`), one service over
`PrismaService`, registered once in `AppModule`. The only persistence change is the additive
`cancellationReason` column.

## Complexity Tracking

> Fill ONLY if Constitution Check has violations that must be justified

| Violation | Why Needed | Simpler Alternative Rejected Because |
| --------- | ---------- | ------------------------------------ |
| _None_    | —          | —                                    |
