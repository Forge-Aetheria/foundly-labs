# Research: Mobile Availability Module

**Feature**: `specs/mobile/008-availability-module/spec.md`
**Date**: 2026-10-25

## R1 — API surface

**Decision**: Reuse `availability`, `createAvailability`, `updateAvailability`, `removeAvailability`, `timeBlocks`, `addTimeBlock` and `removeTimeBlock`.

**Rationale**: The API and web module already implement the full weekly-schedule and time-block flows. No backend changes are needed.

## R2 — Weekly schedule reconciliation

**Decision**: Load current tenant-level rules (`specialistId = null`), compare with the draft by weekday, then:
- Remove rules for closed days.
- Update rules for open days that already exist.
- Create rules for newly opened days.
- Send default `slotGranularityMinutes: 30`, `minLeadTimeMinutes: 0`, `bookingHorizonDays: 60`.

**Rationale**: Mirrors `apps/book/src/modules/availability/actions.ts` and avoids separate save endpoints.

## R3 — Time blocks

**Decision**: Send `startAt`/`endAt` as `${date}T${time}:00`; full-day blocks use `00:00` and `23:59`. Deletion calls `removeTimeBlock`.

**Rationale**: Matches the API string contract and web behavior.

## R4 — Scope boundaries

**Decision**: Do not expose breaks, granularity, lead time, horizon or specialist selection.

**Rationale**: The web editor does not expose them either in the current UI; the mobile version stays in parity.

## R5 — Loading and errors

**Decision**: Load rules and blocks in parallel; use `LoadingState` screen/overlay, `RefreshControl`, mutation pending flags and inline errors.

**Rationale**: Consistent with the other mobile modules and the loading policy.

## R6 — Time validation

**Decision**: Treat `HH:mm` strings lexicographically for same-day comparisons (valid for zero-padded 24-hour times) and validate `end > start`.

**Rationale**: Simple, deterministic, and matches the API format.
