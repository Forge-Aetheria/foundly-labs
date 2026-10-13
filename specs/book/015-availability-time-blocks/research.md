# Phase 0 — Research: Foundly Book — Availability Time Blocks

**Feature**: `specs/book/015-availability-time-blocks` · **Date**: 2026-10-13

## R1 — Module data layer in the availability module

- **Decision**: Extend `modules/availability` with `timeBlocks.graphql`, `actions.ts` (`listTimeBlocks`, `addTimeBlock`, `removeTimeBlock`) and `hooks.ts` (`useListTimeBlocks`, `useAddTimeBlock`, `useRemoveTimeBlock`). The editor consumes only the hooks.
- **Rationale**: Constitution §5.VI; availability already owns the weekly rules; blocks are a natural part of the same domain.
- **Alternatives considered**: A separate "blocks" module — rejected (same domain, would fragment the editor).

## R2 — Session-aware transport for admin

- **Decision**: Admin reads/writes use `apiRequestAdmin` (feature `012`) so a missing/rejected token routes to the global session-expiry flow.
- **Rationale**: Consistent session handling; today `listTimeBlocks()` returns `[]` with no transport.
- **Alternatives considered**: Raw `apiRequest` + manual token — rejected.

## R3 — Domain mapping

- **Decision**: Map the API `TimeBlockObject` to the domain `TimeBlock` (`id`, `resourceId = specialistId ?? tenantId`, `startAt`, `endAt`, `kind: 'block'`, `recurrence: 'none'`, `recurrenceUntil: null`, `reason`).
- **Rationale**: Reuses the existing domain type (used by `computeAvailability`) without adding fields; the v1 API is one-off blocks.
- **Alternatives considered**: Change the domain type to drop `kind`/`recurrence` — rejected (broader ripple; the fields are harmless defaults).

## R4 — Admin editor interaction

- **Decision**: The editor lists blocks (start/end/reason) and offers an add form (date + start time + end time + optional reason) and a remove action with confirmation. The existing weekly config and save flow are preserved.
- **Rationale**: Extends the current `AvailabilityEditor` without a redesign; matches the `availability` screen intent.
- **Alternatives considered**: A separate screen — rejected (the spec targets `/admin/availability`).

## R5 — Public exclusion of blocked slots

- **Decision**: In `fetchOfferedSlots` (public-booking), fetch the business-wide + specialist blocks for the requested range (public `TimeBlocks` query by slug + specialistId) and pass them to `computeAvailability` (replacing the hardcoded `blocks: []`).
- **Rationale**: Makes the feature end-to-end — a block actually prevents booking. The domain `TimeBlock` already feeds `computeAvailability`.
- **Alternatives considered**: Admin-only display — rejected (blocks would not affect real availability).

## R6 — Validation

- **Decision**: `zod` schema for the add form: required date, required `startTime`/`endTime`, `end > start` (computed in the business timezone as an ISO instant), optional `reason` ≤ 200.
- **Rationale**: Inline validation consistent with the module; mirrors the API bounds.
- **Alternatives considered**: Server-only validation — rejected (worse UX).

## R7 — Codegen

- **Decision**: Add `timeBlocks.graphql`, sync `apps/book/codegen.schema.gql` from the API SDL, and regenerate `generated.ts`; the client uses only generated documents/types.
- **Rationale**: Constitution §5.VI (codegen-only DTOs); offline codegen via the versioned snapshot.
- **Alternatives considered**: Hand-written types — forbidden.
