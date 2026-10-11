# Contract: Appointments GraphQL module (`apps/api`)

**Feature**: `specs/api/005-appointments/` | **Date**: 2026-10-11

## Endpoint posture (unchanged)

`POST /graphql` (Apollo/NestJS, code-first, `autoSchemaFile`); playground/introspection only when
`NODE_ENV !== 'production'`.

## Types

```graphql
type AppointmentService {
  id: ID!
  name: String!
}
type AppointmentSpecialist {
  id: ID!
  name: String!
}

type Appointment {
  id: ID!
  tenantId: String!
  serviceId: String!
  specialistId: String!
  clientName: String!
  clientContact: String
  startAt: DateTime!
  endAt: DateTime!
  status: AppointmentStatus!
  appliedDurationMinutes: Int!
  appliedAmountCents: Int!
  appliedCurrency: String!
  origin: String!
  notes: String
  cancellationReason: String
  service: AppointmentService!
  specialist: AppointmentSpecialist!
}

enum AppointmentStatus {
  PENDING
  CONFIRMED
  CANCELLED
  COMPLETED
}

input CreateAppointmentInput {
  tenantId: String
  tenantSlug: String
  serviceId: ID!
  specialistId: ID!
  clientName: String!
  clientContact: String
  startAt: String! # ISO-8601
  endAt: String! # ISO-8601 (strictly after startAt)
  origin: String # default "online"
  notes: String
}
```

`status` inputs accept the enum values; the service normalizes to uppercase. `startDate`/`endDate`
filters are ISO strings applied inclusive over `startAt`.

## Queries

| Query          | Arguments                                                                                                                                            | Returns           | Behaviour                                                            |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------- | -------------------------------------------------------------------- |
| `appointments` | `tenantId: String`, `tenantSlug: String` (at least one), `startDate: String`, `endDate: String`, `specialistId: String`, `status: AppointmentStatus` | `[Appointment!]!` | AND-combined filters over `startAt` (inclusive); unknown slug → `[]` |
| `appointment`  | `id: ID!`                                                                                                                                            | `Appointment`     | detail (service + specialist refs); `null` when missing              |

## Mutations

| Mutation                  | Arguments                             | Returns        | Behaviour                                                                                                                                                                                          |
| ------------------------- | ------------------------------------- | -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `createAppointment`       | `input: CreateAppointmentInput!`      | `Appointment!` | resolves tenant; validates service+specialist (existence + same tenant); validates range; overlap check (non-cancelled specialist appointments); snapshots service values; returns the appointment |
| `updateAppointmentStatus` | `id: ID!, status: AppointmentStatus!` | `Appointment!` | follows the transitions map; invalid/disallowed → `VALIDATION_ERROR`; missing → `NOT_FOUND`                                                                                                        |
| `cancelAppointment`       | `id: ID!, reason: String`             | `Appointment!` | allowed from `PENDING`/`CONFIRMED`; sets `CANCELLED` + `cancellationReason` (if given); otherwise `VALIDATION_ERROR`; missing → `NOT_FOUND`                                                        |

## Error semantics

| Condition                                                                   | Code               |
| --------------------------------------------------------------------------- | ------------------ |
| invalid range / invalid or disallowed status / missing client name          | `VALIDATION_ERROR` |
| service or specialist missing / cross-tenant / unknown tenant slug on write | `NOT_FOUND`        |
| overlapping appointment for the same specialist                             | `CONFLICT`         |
| `appointment(id)` not found (read)                                          | returns `null`     |

Errors are returned as GraphQL `errors` entries with stable `extensions.code`.

## Tests (DB-free)

- Unit: `appointments.service.spec.ts` — filters, `appointment(id)`, create success (snapshot+reasons),
  overlap `CONFLICT`, missing/cross-tenant `NOT_FOUND`, invalid range `VALIDATION_ERROR`, status map
  (valid/invalid/disallowed), cancel with/without reason + illegal cancel.
- E2E: `appointments.resolver.spec.ts` — `appointments`/`appointment`, the three mutations and error
  codes over `POST /graphql` with a stubbed `PrismaService` (row shape includes `cancellationReason`).
