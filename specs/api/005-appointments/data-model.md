# Data Model: Foundly API — Appointments & Bookings GraphQL Module

**Feature**: `specs/api/005-appointments/` | **Date**: 2026-10-11

## Storage strategy

- Persistence: Prisma + PostgreSQL via `@foundly/database` (ratified `002`/`specs/architecture.md`).
- One **additive** change this feature: `Appointment.cancellationReason String?` (nullable), followed by
  `npm run generate -w @foundly/database`.

## Appointment entity (evolved from 003)

| Field                    | Type        | Notes                                |
| ------------------------ | ----------- | ------------------------------------ |
| `id`                     | cuid        | PK                                   |
| `tenantId`               | String      | FK tenant                            |
| `specialistId`           | String      | FK specialist                        |
| `serviceId`              | String      | FK service                           |
| `clientName`             | String      | required                             |
| `clientContact`          | String?     | phone/email                          |
| `startAt` / `endAt`      | DateTime    | UTC; `endAt > startAt`               |
| `status`                 | String      | `PENDING                             | CONFIRMED | CANCELLED | COMPLETED`, default `PENDING` |
| `appliedDurationMinutes` | Int         | snapshot from the service at booking |
| `appliedAmountCents`     | Int         | snapshot from the service at booking |
| `appliedCurrency`        | String      | snapshot from the service            |
| `origin`                 | String      | default `online`                     |
| `notes`                  | String?     | free-form                            |
| **`cancellationReason`** | **String?** | **ADDED** — optional cancel reason   |

References: `Appointment` N:1 `Tenant`, N:1 `Specialist`, N:1 `Service`.

## Status lifecycle (allowed transitions)

| From        | To                                    |
| ----------- | ------------------------------------- |
| `PENDING`   | `CONFIRMED`, `CANCELLED`, `COMPLETED` |
| `CONFIRMED` | `CANCELLED`, `COMPLETED`              |
| `CANCELLED` | — (terminal)                          |
| `COMPLETED` | — (terminal)                          |

`cancelAppointment` is allowed only from `PENDING`/`CONFIRMED` and sets `CANCELLED` (+ optional reason).

## Validation rules

- `endAt > startAt`; `clientName` required; `status` ∈ the canonical set (case-insensitive input normalized to uppercase).
- Service and specialist must exist and belong to the same tenant (cross-tenant/missing → `NOT_FOUND`).
- No overlap with a non-cancelled appointment of the same specialist+tenant (`[startAt, endAt)` intersection → `CONFLICT`).
- Snapshot (`appliedDurationMinutes`/`appliedAmountCents`/`appliedCurrency`) derived from the service; `origin` default `online`.
- Agenda filters: `startAt >= startDate` and `startAt <= endDate` (inclusive); unknown `tenantSlug` on reads → `[]`.

## GraphQL surface (this feature)

| Operation                                                                           | Kind     | Notes                                                          |
| ----------------------------------------------------------------------------------- | -------- | -------------------------------------------------------------- |
| `appointments(tenantId?/tenantSlug?, startDate?, endDate?, specialistId?, status?)` | Query    | filtered agenda list                                           |
| `appointment(id)`                                                                   | Query    | detail or `null`                                               |
| `createAppointment(input)`                                                          | Mutation | validates existence + overlap; returns the created appointment |
| `updateAppointmentStatus(id, status)`                                               | Mutation | follows the transitions map                                    |
| `cancelAppointment(id, reason?)`                                                    | Mutation | sets `CANCELLED` + `cancellationReason`                        |

Detailed shapes live in `contracts/appointments-graphql.contract.md`.
