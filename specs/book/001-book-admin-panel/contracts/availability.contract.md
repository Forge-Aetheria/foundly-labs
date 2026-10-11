# Contract: Availability Engine

**Feature**: `specs/book/001-book-admin-panel/` | **Date**: 2026-10-08

The availability engine is a pure, framework-agnostic module (`apps/book/src/shared/utils`). It is the single source of truth for which slots can be booked, used by both the agenda UI (via server reads) and server-side mutation checks.

## Interface

```ts
export type AppointmentStatus =
  'pending' | 'confirmed' | 'checked-in' | 'completed' | 'cancelled' | 'no-show';

export interface AvailabilityRequest {
  resourceId: string;
  service: { durationMinutes: number; bufferMinutes: number };
  /** Business-local ISO dates (inclusive). */
  range: { startDate: string; endDate: string };
  timezone: string;
  rules: AvailabilityRuleInput[]; // weekly working hours
  blocks: TimeBlockInput[]; // breaks and blocked periods
  appointments: AppointmentInput[]; // existing bookings for the resource
  /** Reference "now" used for lead time. */
  now: Date;
}

export interface Slot {
  startAt: Date; // UTC
  endAt: Date; // UTC (service duration, excludes buffer)
}

export interface DayAvailability {
  date: string; // business-local ISO date
  slots: Slot[];
  /** Present when the day has no slots, explaining why (e.g. "no-working-hours", "fully-blocked", "booked"). */
  reason?: string;
}

export function computeAvailability(request: AvailabilityRequest): DayAvailability[];
```

## Required behavior

1. **Working hours**: slots are only produced inside intervals derived from `rules` for the day's weekday.
2. **Granularity**: slot start times align to `slotGranularityMinutes`.
3. **Breaks & blocks**: any slot overlapping a `time_block` is excluded.
4. **Existing appointments**: any slot overlapping an active appointment (`pending`, `confirmed`, `checked-in`) — including that appointment's buffer — is excluded.
5. **Service fit**: a slot is produced only if `durationMinutes` fits entirely within the remaining working interval.
6. **Lead time**: slots starting earlier than `now + minLeadTimeMinutes` are excluded.
7. **Horizon**: days beyond `bookingHorizonDays` from `now` are excluded.
8. **Timezone/DST**: duration and interval math is done in the business timezone; returned instants are UTC. Midnight-spanning appointments are handled as intervals, not per-day.
9. **Determinism**: identical input yields identical output; the function has no side effects and no I/O.

## Purity rules

- No imports from Next.js, React, MUI or application/server code inside the engine (constraint C2).
- No literal brand colors; the engine returns data only.

## Verification

- Unit tests cover: closed day, break overlap, block overlap, back-to-back appointments with buffers, lead-time edge, horizon edge, midnight-spanning appointment, and DST-transition day.
- Property test: no returned slot ever overlaps an active appointment for the same resource.
