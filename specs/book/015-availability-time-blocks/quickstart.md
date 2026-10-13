# Quickstart — Foundly Book — Availability Time Blocks

**Feature**: `specs/book/015-availability-time-blocks` · Runnable validation scenarios.

## Prerequisites

- `apps/book/.env` with `API_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- The API running with the time-block surface (`specs/api/014-availability-time-blocks`) and a migrated DB.
- A signed-in owner bound to a business.

## Run

```bash
npm run codegen -w @foundly/book     # after adding timeBlocks.graphql + syncing codegen.schema.gql
npm run dev -w @foundly/book         # http://localhost:3001
```

## Scenario 1 — List real blocks (admin)

1. Open `http://localhost:3001/admin/availability`.
2. **Expected**: the section shows the business's real time blocks (or a clean empty state), not a hardcoded zero.

## Scenario 2 — Add a block (persisted)

1. In the blocks area, pick a date, a start and an end time (optional reason) and save.
2. **Expected**: the block appears in the list and is still there after a reload.
3. Invalid input (end not after start, or missing date/time) → inline error, nothing saved.

## Scenario 3 — Remove a block

1. Choose a block and remove it (confirm).
2. **Expected**: it disappears and stays gone after a reload.

## Scenario 4 — Blocked slots are not bookable (public)

1. Add a block covering an otherwise-available slot (e.g. tomorrow 10:00–12:00).
2. Open `http://localhost:3001/<your-slug>` and start the booking flow for that day/specialist.
3. **Expected**: the blocked interval is not offered.
4. Remove the block → the slot is offered again.

## Scenario 5 — Session safety

1. With an expired/absent session, trigger a block read/write.
2. **Expected**: the app routes through the global session-expiry handler (`/login` with a notice); no raw error text appears in the section.

## Automated checks

```bash
npm run test -w @foundly/book
npm run typecheck -w @foundly/book
npm run lint -w @foundly/book
npm run build -w @foundly/book
```
