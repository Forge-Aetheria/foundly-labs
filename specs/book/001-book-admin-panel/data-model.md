# Phase 1 — Data Model: Foundly Book Admin Panel

**Feature**: `specs/book/001-book-admin-panel/` | **Date**: 2026-10-08

Derived from the Key Entities in `spec.md`. The model is expressed as **plain TypeScript interfaces** (`apps/book/src/shared/types/appointments.ts`) and held in an **in-memory store** (`apps/book/src/shared/infra/store.ts`). No persistence technology is defined or implied.

## Conventions

- Instants (`*At`) are ISO-8601 UTC strings; wall-clock interpretation happens in the resource/business `timezone`.
- Money amounts are integer minor units (`amountCents`) plus an ISO-4217 `currency`.
- Durations are minutes (`durationMinutes`, `bufferMinutes`).
- `id` values are opaque strings (generated with `crypto.randomUUID()`).

## Entity Overview

```text
Resource 1───* AvailabilityRule          Resource 1───* TimeBlock
Resource *───* Service  (services offered)
Service  1───* Rate                       Service  1───* Appointment
                                          Appointment *───1 Resource
```

## 1. Resource (Profesional/Recurso)

A bookable professional, room or asset.

| Field      | Type                                  | Rules                            |
| ---------- | ------------------------------------- | -------------------------------- |
| `id`       | string                                | required, unique                 |
| `name`     | string                                | required, 1–120 chars            |
| `type`     | `'professional' \| 'room' \| 'asset'` | required, default `professional` |
| `active`   | boolean                               | default `true`                   |
| `timezone` | string (IANA)                         | required                         |

**Rule**: deactivating a resource (`active=false`) must not delete or modify existing appointments (FR-014).

## 2. Service (Servicio)

A bookable offering.

| Field             | Type           | Rules                 |
| ----------------- | -------------- | --------------------- |
| `id`              | string         | required, unique      |
| `name`            | string         | required, 1–120 chars |
| `description`     | string \| null | optional              |
| `durationMinutes` | number         | required, `> 0`       |
| `bufferMinutes`   | number         | required, `>= 0`      |
| `category`        | string \| null | optional              |
| `active`          | boolean        | default `true`        |

**Rule**: a service with future appointments can be deactivated but not removed while referenced (FR-014).

## 3. Rate (Tarifa)

The price of a service over an effective period.

| Field           | Type              | Rules                                 |
| --------------- | ----------------- | ------------------------------------- |
| `id`            | string            | required, unique                      |
| `serviceId`     | string            | required, references a Service        |
| `amountCents`   | number            | required, `>= 0`                      |
| `currency`      | string (ISO-4217) | required                              |
| `effectiveFrom` | string            | required                              |
| `effectiveTo`   | string \| null    | optional; when set, `> effectiveFrom` |

**Rule**: rates for the same service must not overlap in time. The rate applied to an appointment is the one whose period contains the appointment start (FR-007).

## 4. AvailabilityRule (Regla de disponibilidad)

Recurring working hours for a resource.

| Field                    | Type             | Rules                           |
| ------------------------ | ---------------- | ------------------------------- |
| `id`                     | string           | required, unique                |
| `resourceId`             | string           | required, references a Resource |
| `weekday`                | number           | required, `0–6`                 |
| `startTime`              | string `"HH:mm"` | required                        |
| `endTime`                | string `"HH:mm"` | required, `> startTime`         |
| `slotGranularityMinutes` | number           | required, `> 0`                 |
| `minLeadTimeMinutes`     | number           | required, `>= 0`                |
| `bookingHorizonDays`     | number           | required, `> 0`                 |

**Rule**: granularity divides evenly into the working interval length; multiple rules per resource/day are allowed (split shifts).

## 5. TimeBlock (Bloqueo de horario)

A period when a resource is unavailable.

| Field             | Type                            | Rules                             |
| ----------------- | ------------------------------- | --------------------------------- |
| `id`              | string                          | required, unique                  |
| `resourceId`      | string                          | required, references a Resource   |
| `startAt`         | string                          | required                          |
| `endAt`           | string                          | required, `> startAt`             |
| `kind`            | `'break' \| 'block'`            | required, default `block`         |
| `recurrence`      | `'none' \| 'daily' \| 'weekly'` | required, default `none`          |
| `recurrenceUntil` | string \| null                  | required when `recurrence ≠ none` |
| `reason`          | string \| null                  | optional                          |

**Rule**: overlapping blocks for a resource are merged when computing availability. Creating a block that conflicts with existing appointments is rejected until the conflict is resolved (FR-013).

## 6. Appointment (Cita)

A booking of a service for a client with a specific resource and time range.

| Field                    | Type                  | Rules                           |
| ------------------------ | --------------------- | ------------------------------- |
| `id`                     | string                | required, unique                |
| `resourceId`             | string                | required, references a Resource |
| `serviceId`              | string                | required, references a Service  |
| `clientName`             | string                | required, 1–120 chars           |
| `clientContact`          | string \| null        | optional                        |
| `startAt`                | string                | required                        |
| `endAt`                  | string                | required, `> startAt`           |
| `status`                 | AppointmentStatus     | required, default `pending`     |
| `notes`                  | string \| null        | optional                        |
| `appliedDurationMinutes` | number                | required (snapshot)             |
| `appliedAmountCents`     | number                | required (snapshot)             |
| `appliedCurrency`        | string                | required (snapshot)             |
| `origin`                 | `'admin' \| 'online'` | required, default `admin`       |
| `cancellationReason`     | string \| null        | optional                        |

**Invariants**:

- **No overlap**: for a given resource, no two appointments with an active status may overlap in time (FR-004); capacity is 1 in v1.
- **Snapshot**: `applied*` fields are copied at creation and never change when catalog values change (FR-008, SC-005).
- `endAt > startAt` and within the business `bookingHorizonDays`.
- `endAt` may cross midnight — conflict and availability logic treats bookings as intervals.

## 7. AppointmentStatus (Estado de cita) — lifecycle

```text
pending ──▶ confirmed ──▶ checked-in ──▶ completed
   │            │              │
   └────────────┴──────────────┴──▶ cancelled
   └───────────────────────────────▶ no-show
```

| State        | Meaning                        | Allowed next states            |
| ------------ | ------------------------------ | ------------------------------ |
| `pending`    | Created, awaiting confirmation | confirmed, cancelled, no-show  |
| `confirmed`  | Confirmed with the client      | checked-in, cancelled, no-show |
| `checked-in` | Client arrived / in service    | completed, cancelled           |
| `completed`  | Service delivered              | — (terminal)                   |
| `cancelled`  | Cancelled with a reason        | — (terminal)                   |
| `no-show`    | Client did not attend          | — (terminal)                   |

**Transition rules**: cancellation requires a reason and writes an audit entry; `completed` and `cancelled` are terminal; rescheduling is allowed for `pending`/`confirmed`; only active statuses participate in overlap/availability checks.

## 8. AppointmentAuditEntry (Auditoría de cita)

| Field           | Type                                                                         | Rules                               |
| --------------- | ---------------------------------------------------------------------------- | ----------------------------------- |
| `id`            | string                                                                       | required, unique                    |
| `appointmentId` | string                                                                       | required, references an Appointment |
| `action`        | `'created' \| 'rescheduled' \| 'cancelled' \| 'status-changed' \| 'updated'` | required                            |
| `fromValue`     | string \| null                                                               | optional                            |
| `toValue`       | string \| null                                                               | optional                            |
| `reason`        | string \| null                                                               | optional                            |
| `actorId`       | string                                                                       | required (Foundly Pass user)        |
| `createdAt`     | string                                                                       | required                            |

## Availability Engine (domain service)

Pure function contract (see `contracts/availability.contract.md`):

- Input: resource, service (duration + buffer), date range, availability rules, time blocks, existing appointments, "now", business timezone.
- Output: ordered list of bookable slots (`startAt`/`endAt` as UTC instants) per day, or a reason when a day has no availability.
- Deterministic and side-effect free; the single source of truth for "what can be booked", used both for the agenda UI and for server-side mutation checks.

## Collection rules (in-memory store)

- In-memory collections (`resources`, `services`, `rates`, `availabilityRules`, `timeBlocks`, `appointments`, `audit`) hold the entities above.
- Referenced entities (a service used by an appointment, etc.) are deactivated rather than removed.
- When persistence is ratified, these rules map to the storage layer; the domain types and the engine remain unchanged.
