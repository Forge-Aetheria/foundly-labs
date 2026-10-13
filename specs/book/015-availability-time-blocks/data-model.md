# Phase 1 — Data Model: Foundly Book — Availability Time Blocks

**Feature**: `specs/book/015-availability-time-blocks` · **Date**: 2026-10-13

The client does not own persistence; it models the API's `TimeBlockObject` and the domain `TimeBlock` already used by the slot engine.

## Domain type — `shared/types/appointments.ts` (existing)

### `TimeBlock`

| Field | Type | Notes |
|---|---|---|
| `id` | `string` | Stable identity |
| `resourceId` | `string` | Specialist id, or the tenant id when business-wide |
| `startAt` | `string` | ISO-8601 instant |
| `endAt` | `string` | ISO-8601 instant |
| `kind` | `'break' \| 'block'` | v1 maps to `'block'` |
| `recurrence` | `'none' \| 'daily' \| 'weekly'` | v1 maps to `'none'` |
| `recurrenceUntil` | `string \| null` | v1 maps to `null` |
| `reason` | `string \| null` | Optional |

## Mapping (API → domain)

| API `TimeBlockObject` | Domain `TimeBlock` | Rule |
|---|---|---|
| `id` | `id` | — |
| `specialistId` (nullable) | `resourceId` | `specialistId ?? tenantId` (business-wide) |
| `startAt` / `endAt` | `startAt` / `endAt` | ISO strings kept as-is |
| — | `kind` | constant `'block'` |
| — | `recurrence` | constant `'none'` |
| — | `recurrenceUntil` | constant `null` |
| `reason` (nullable) | `reason` | `null` preserved |

## Input model (admin add) — `modules/availability/utils/schemas.ts`

`timeBlockSchema`:

| Field | Rule |
|---|---|
| `date` | required, `YYYY-MM-DD` |
| `startTime` | required, `HH:mm` |
| `endTime` | required, `HH:mm`, strictly after `startTime` |
| `reason` | optional, ≤ 200 chars |

The action composes `startAt`/`endAt` ISO instants from `date` + times (business timezone) before calling the API.

## Public slot computation input

`fetchOfferedSlots` (public-booking) maps the fetched blocks to the `computeAvailability` `blocks` input (start/end instants) so blocked intervals are removed from the offered slots. Business-wide blocks apply to every specialist; specialist blocks apply to that specialist.

## State

- Admin editor: the blocks list is seeded from the server render and updated with server-confirmed results on add/remove (no optimistic fake data).
- Public flow: blocks are read server-side per request; no client state.
