# Contract: Server Actions (Admin Operations)

**Feature**: `specs/book/001-book-admin-panel/` | **Date**: 2026-10-08

Defines the mutation surface exposed by `apps/book` (Next.js Server Actions). Every action: authenticates via the Foundly Pass session, enforces the required role, validates input with Zod, runs inside a transaction when it affects appointments, and returns a discriminated result.

## Result shape

```ts
type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string; fields?: Record<string, string> } };
```

## Actions

| Action                                                           | Role                               | Input (summary)                                                                | Guarantees                                                                                                                                                                 |
| ---------------------------------------------------------------- | ---------------------------------- | ------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `createAppointment`                                              | admin, professional (own resource) | `resourceId`, `serviceId`, `clientName`, `clientContact?`, `startAt`, `notes?` | Recomputes availability; computes `endAt` from service duration; writes `applied*` snapshot; rejects overlap inside a transaction (SC-003); writes a `created` audit entry |
| `rescheduleAppointment`                                          | admin, professional (own resource) | `appointmentId`, `startAt`                                                     | Only for `pending`/`confirmed`; same conflict checks as create; writes `rescheduled` audit with from/to                                                                    |
| `cancelAppointment`                                              | admin, professional (own resource) | `appointmentId`, `reason`                                                      | Requires reason; terminal state; writes `cancelled` audit                                                                                                                  |
| `changeAppointmentStatus`                                        | admin, professional (own resource) | `appointmentId`, `status`                                                      | Enforces the lifecycle transition table (data-model §7)                                                                                                                    |
| `createService` / `updateService`                                | admin                              | service fields                                                                 | Validates duration/buffer; snapshot-free (catalog only)                                                                                                                    |
| `setServiceActive`                                               | admin                              | `serviceId`, `active`                                                          | Deactivation never alters existing appointments (FR-014)                                                                                                                   |
| `setRate`                                                        | admin                              | `serviceId`, `amountCents`, `currency`, `effectiveFrom`, `effectiveTo?`        | Rejects overlapping periods for the same service                                                                                                                           |
| `upsertAvailabilityRule` / `deleteAvailabilityRule`              | admin                              | rule fields / `ruleId`                                                         | Validates `startTime < endTime` and granularity                                                                                                                            |
| `createTimeBlock` / `deleteTimeBlock`                            | admin                              | block fields / `blockId`                                                       | Creating a conflicting block returns `CONFLICT` until resolved (FR-013)                                                                                                    |
| `resolveBlockConflict`                                           | admin                              | `blockId`, `appointmentId`, `resolution` (`keep` \| `move` \| `cancel`)        | Applies the chosen resolution atomically                                                                                                                                   |
| `createStaff` / `updateStaff` / `setStaffActive` / `removeStaff` | admin                              | staff fields / `{ id, ... }` / `{ id, active }` / `{ id }`                     | Tenant-scoped from the session (FR-026); validates name; toggling/removing a professional drops it from the public roster without touching appointments (FR-014)           |
| `updateProfile`                                                  | admin                              | profile + contact + social fields                                              | Persists `name/category/bio/address/phone/social` on the tenant read by `getPublicBusiness`                                                                                |
| `addGalleryImage` / `removeGalleryImage`                         | admin                              | `{ url }`                                                                      | Add rejects duplicates (`CONFLICT`); remove fails with `NOT_FOUND` if the URL is absent                                                                                    |

## Reads (server components / queries)

| Query                             | Role                         | Output                                              |
| --------------------------------- | ---------------------------- | --------------------------------------------------- |
| `listAgenda`                      | admin, professional (scoped) | Appointments for a date range and optional resource |
| `getDayAvailability`              | admin, professional          | `DayAvailability[]` from the availability engine    |
| `listServices` / `listRates`      | admin, professional (read)   | Catalog data                                        |
| `listAvailability` / `listBlocks` | admin, professional (read)   | Rules and blocks                                    |

## Error codes

- `UNAUTHENTICATED`, `FORBIDDEN`
- `VALIDATION_ERROR` (with `fields`)
- `CONFLICT` (double-booking or block/appointment conflict)
- `STATE_ERROR` (invalid lifecycle transition)
- `NOT_FOUND`

## Rules

- Mutations affecting appointments MUST recompute conflicts server-side regardless of what the UI sent.
- No action trusts client-computed `endAt`, price or availability.
- All actions return the typed `ActionResult`; UI never reads raw thrown errors for control flow.

## Verification

- Action tests assert rejection of overlapping bookings (`CONFLICT`), invalid transitions (`STATE_ERROR`), and role violations (`FORBIDDEN`).
- An action test asserts the `applied*` snapshot is unchanged after a catalog price update.
