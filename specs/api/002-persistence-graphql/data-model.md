# Data Model: Foundly — Persistence & GraphQL

**Feature**: `specs/api/002-persistence-graphql/` | **Date**: 2026-10-11

## Storage strategy (ratified)

- Provider: **PostgreSQL** (`postgresql`), DB-First via **Prisma**.
- Connection: `DATABASE_URL` env (`postgresql://USER:PASS@HOST:5432/foundly`), compatible with Supabase
  or a local container (`postgres:16`) via Docker.
- Client lives in `@foundly/database` (generated to the workspace `@prisma/client`).

## Base models (`packages/database/prisma/schema.prisma`)

Mirrors the domain already modeled in `apps/book` (`domain/tenancy`, `domain/appointments`,
`features/public-booking`, `features/storefront`) for 1:1 future mapping.

| Model         | Key fields                                                                | Relations                          |
| ------------- | ------------------------------------------------------------------------- | ---------------------------------- |
| **Tenant**    | `id`, `name`, `slug` (unique), `category`, `status`, `timezone`, `currency`, `businessHours Json`, `createdAt/updatedAt` | 1:N services, staff, appointments, gallery, profiles |
| **Profile**   | `id`, `tenantId`, `bio`, `address`, `phone`, `instagram`, `whatsapp`, `avatar`, `cover`, `policies Json` | N:1 tenant                        |
| **Service**   | `id`, `tenantId`, `name`, `description?`, `durationMinutes`, `bufferMinutes`, `category?`, `priceCents`, `currency`, `active` | N:1 tenant, N:M staff (via relation), 1:N appointments |
| **Staff**     | `id`, `tenantId`, `name`, `role?`, `avatar?`, `bio?`, `serviceIds String[]`, `active` | N:1 tenant, 1:N appointments       |
| **Appointment**| `id`, `tenantId`, `staffId`, `serviceId`, `clientName`, `clientContact?`, `startAt`, `endAt`, `status`, `appliedDurationMinutes`, `appliedAmountCents`, `appliedCurrency`, `origin`, `notes?` | N:1 tenant/staff/service |
| **Gallery**   | `id`, `tenantId`, `url`, `title?`, `description?`, `category?`, `sortOrder` | N:1 tenant                        |
| **Availability**| `id`, `tenantId`, `staffId?`, `weekday`, `startTime`, `endTime`, `slotGranularityMinutes`, `minLeadTimeMinutes`, `bookingHorizonDays`, `breaks Json?` | N:1 tenant (N:1 staff optional) |

Validation/notes:

- Slug is unique per tenant and follows the existing slug rule (format + reserved).
- `Appointment.status` uses the domain lifecycle: pending/confirmed/checked-in/completed/cancelled/no-show.
- Dates stored as UTC timestamps (`DateTime`); `businessHours`/`policies`/`breaks` as `Json`.
- The `health` GraphQL query has NO data dependency (works without a live DB).

## GraphQL surface (this feature)

| Operation | Resolver         | Output                         |
| --------- | ---------------- | ------------------------------ |
| `health`  | `HealthResolver` | `{ service, status }` (no DB)  |

The full CRUD GraphQL resolvers per entity are out of scope (deferred to later `/specs/api/` features).