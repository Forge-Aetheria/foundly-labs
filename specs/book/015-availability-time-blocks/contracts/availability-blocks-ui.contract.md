# Contract — Availability Time Blocks UI (module data layer + views)

**Feature**: `specs/book/015-availability-time-blocks`

Repository rule (constitution §5.VI): the UI calls **only** these functions/types; it never imports the transport, codegen documents, or the Server Actions directly.

## Availability module (`src/modules/availability/`)

### `actions.ts` (server-only)

```ts
listTimeBlocks(tenantId: string): Promise<ActionResult<TimeBlock[]>>;
addTimeBlock(input: unknown): Promise<ActionResult<TimeBlock>>;
removeTimeBlock(input: unknown): Promise<ActionResult<{ id: string }>>;
```

- Reads/writes go through `apiRequestAdmin` (`timeBlocks`, `addTimeBlock`, `removeTimeBlock`).
- `addTimeBlock` validates with `timeBlockSchema` (→ `VALIDATION_ERROR` with field errors), composes ISO instants, and calls the mutation.
- `removeTimeBlock` validates the id and calls the mutation.
- Session errors are handled globally by `apiRequestAdmin` (redirect to `/auth/session-expired`); never inline text.

### `hooks.ts` (`'use client'`)

```ts
useListTimeBlocks(): (tenantId: string) => Promise<ActionResult<TimeBlock[]>>;
useAddTimeBlock(): (input: unknown) => Promise<ActionResult<TimeBlock>>;
useRemoveTimeBlock(): (input: unknown) => Promise<ActionResult<{ id: string }>>;
```

### Error presentation

| Error | Surface |
|---|---|
| `VALIDATION_ERROR` | inline field errors (`fields`) |
| `STATE_ERROR` / `NOT_FOUND` | clean alert (`ApiErrorDialog`) |
| `UNAUTHENTICATED` | global session handler (redirect) — never inline |

## Admin view (`/admin/availability`)

- **Server view**: `AvailabilityView` resolves the tenant via `getAdminTenantId()` and calls `listAvailabilityRules(tenantId)` + `listTimeBlocks(tenantId)`; passes `rules`, `blocks` and any `error` to `AvailabilityEditor`.
- **`AvailabilityEditor` props**: `{ rules: AvailabilityRule[]; blocks: TimeBlock[]; error?: string | null }`.
- **Behaviors**: the weekly configuration (unchanged) plus a **blocks** area — a list of the real blocks (start/end, optional reason) with a removal action (confirmation) and an add form (`date`, `startTime`, `endTime`, optional `reason`) that persists via `useAddTimeBlock`; a clean empty state when there are none.

## Public portal (`/book/<slug>`)

- `fetchOfferedSlots` fetches the blocks (public `TimeBlocks` query by slug, plus the selected specialist) and passes them to `computeAvailability`, excluding blocked intervals from the offered slots. Business-wide blocks apply to all specialists; specialist blocks apply to that specialist.
