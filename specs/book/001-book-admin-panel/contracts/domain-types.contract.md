# Contract: Domain Types (Book entities)

**Feature**: `specs/book/001-book-admin-panel/` | **Date**: 2026-10-08

Defines the TypeScript type surface consumed by `apps/book`. Field-level definitions and validation rules live in `data-model.md`; this contract fixes the interfaces and invariants that other artifacts rely on. **No persistence technology is defined.**

## Interfaces

Exported from `apps/book/src/shared/types/appointments.ts`:

| Interface               | Purpose                                | Key fields                                                                                                                                     |
| ----------------------- | -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `Resource`              | Bookable professional/room/asset       | `id`, `name`, `type`, `active`, `timezone`                                                                                                     |
| `Service`               | Service catalog                        | `id`, `name`, `durationMinutes`, `bufferMinutes`, `active`                                                                                     |
| `Rate`                  | Service pricing over effective periods | `id`, `serviceId`, `amountCents`, `currency`, `effectiveFrom`, `effectiveTo`                                                                   |
| `AvailabilityRule`      | Weekly working hours per resource      | `id`, `resourceId`, `weekday`, `startTime`, `endTime`, `slotGranularityMinutes`, `minLeadTimeMinutes`, `bookingHorizonDays`                    |
| `TimeBlock`             | Breaks and blocked periods             | `id`, `resourceId`, `startAt`, `endAt`, `kind`, `recurrence`, `recurrenceUntil`                                                                |
| `Appointment`           | Bookings                               | `id`, `resourceId`, `serviceId`, `clientName`, `startAt`, `endAt`, `status`, `appliedDurationMinutes`, `appliedAmountCents`, `appliedCurrency` |
| `AppointmentAuditEntry` | Audit trail                            | `id`, `appointmentId`, `action`, `fromValue`, `toValue`, `reason`, `actorId`                                                                   |
| `AppointmentStatus`     | Lifecycle state union                  | `pending \| confirmed \| checked-in \| completed \| cancelled \| no-show`                                                                      |

## Required invariants

- `Appointment.endAt` MUST be strictly after `Appointment.startAt`.
- `Rate.effectiveTo` MUST be `null` or strictly after `effectiveFrom`.
- `AvailabilityRule.endTime` MUST be strictly after `startTime`; `slotGranularityMinutes > 0`.
- `Appointment.status` MUST be one of the `AppointmentStatus` values.
- `Appointment.applied*` fields are snapshots written at creation and never recomputed from the catalog.

## Boundaries

- The domain types live in `apps/book/src/shared` and MUST NOT import React, Next.js, MUI, or any storage client.
- The in-memory store (`apps/book/src/shared/infra/store.ts`) is the only module that reads/writes collections of these types.
- Input validation is performed with the Zod schemas in `apps/book/src/modules/**/utils/schemas.ts`.

## Verification

- Type-level: `tsc --noEmit` enforces the interfaces and unions.
- Behavior: tests assert the invariants (no overlapping active appointments, price snapshot unchanged after catalog change).
