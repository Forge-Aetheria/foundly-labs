# Contract: Database schema (DB-First, `@foundly/database`)

**Feature**: `specs/api/003-db-first-graphql-core/` | **Date**: 2026-10-11

## Package contract (`@foundly/database`)

| Script      | Command / expectation                                                      |
| ----------- | -------------------------------------------------------------------------- |
| `generate`  | `prisma generate` produces the client into the workspace `@prisma/client`. |
| `build`     | `tsc` over `src/` (strict).                                                |
| `typecheck` | `tsc --noEmit` clean.                                                      |
| `test`      | vitest suite (schema sanity) green.                                        |

- Exports: `PrismaClient` instance + generated types (unchanged from 002).
- Dependency rule: `@foundly/database` never imports from `apps/*`; it depends only on `@prisma/client`.

## Schema models (this feature)

Evolution from the 002 base models:

| 002 (old)      | 003 (canonical)         | Notes                                                                                 |
| -------------- | ----------------------- | ------------------------------------------------------------------------------------- |
| `Tenant`       | `Tenant`                | drops `slug`/`businessHours` (moves to profile)                                       |
| `Profile`      | **`BusinessProfile`**   | adds `slug` (unique), `logo`, `brandColors`, keeps socials/policies/bio/address/phone |
| `Service`      | `Service`               | unchanged                                                                             |
| `Staff`        | **`Specialist`**        | `serviceIds String[]` → explicit `SpecialistService` join                             |
| `Appointment`  | `Appointment`           | `staffId`→`specialistId` (relation to Specialist)                                     |
| `Gallery`      | **`GalleryPhoto`**      | renamed, categorized                                                                  |
| `Availability` | `Availability`          | unchanged, optional `specialistId`                                                    |
| _(new)_        | **`SpecialistService`** | explicit M:N join (composite PK)                                                      |

Constraints:

- `BusinessProfile.slug` UNIQUE; `Tenant` keeps programmatic identity only.
- `BusinessProfile.tenantId` UNIQUE (1:1).
- `SpecialistService` composite PK `(specialistId, serviceId)` with FKs to `Specialist`/`Service`.
- `Availability.weekday ∈ [0,6]`; `Appointment.endAt > startAt`; `Service.durationMinutes > 0`.

## Generated client requirement

- Client regenerates from the schema (`npm run generate -w @foundly/database`) and is available to
  `apps/api` before typecheck/build (generate step is part of the verification matrix; see quickstart).
- No live database is required to generate the client or run this feature's gates.

## Gates

- `npm run generate -w @foundly/database` success.
- `npm run build|typecheck|test -w @foundly/database` green.
- No regressions in `apps/book` / `@foundly/ui` / `apps/api`.
