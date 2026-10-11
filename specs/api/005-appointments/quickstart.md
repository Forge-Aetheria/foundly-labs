# Quickstart: Foundly API — Appointments & Bookings GraphQL Module

**Feature**: `specs/api/005-appointments/` | **Date**: 2026-10-11

## Onboarding

1. `npm install` at the repository root.
2. Regenerate the Prisma client after the additive `cancellationReason` field:
   `npm run generate -w @foundly/database`.
3. (Optional, DB-backed uses) export `DATABASE_URL` to a Postgres. **Not required** for this feature's
   gates — specs run DB-free against a mocked `PrismaService`.

## Manual walkthrough

1. `npm run dev -w @foundly/api` (port 3002); open `http://localhost:3002/graphql`.
2. Book an appointment for an existing service/specialist:

   ```graphql
   mutation {
     createAppointment(
       input: {
         tenantSlug: "estudio-ana"
         serviceId: "srv"
         specialistId: "sp"
         clientName: "María"
         startAt: "2026-10-12T10:00:00Z"
         endAt: "2026-10-12T10:30:00Z"
       }
     ) {
       id
       status
       startAt
       appliedAmountCents
     }
   }
   ```

3. Read the agenda with filters:

   ```graphql
   query {
     appointments(
       tenantSlug: "estudio-ana"
       startDate: "2026-10-12T00:00:00Z"
       endDate: "2026-10-12T23:59:59Z"
       status: PENDING
     ) {
       id
       status
       clientName
     }
   }
   ```

4. Transition and cancel:

   ```graphql
   mutation {
     updateAppointmentStatus(id: "apt", status: CONFIRMED) {
       id
       status
     }
   }
   mutation {
     cancelAppointment(id: "apt", reason: "Cliente canceló") {
       id
       status
       cancellationReason
     }
   }
   ```

5. Overlap / not-found cases yield `CONFLICT` / `NOT_FOUND` / `VALIDATION_ERROR` via
   `errors[].extensions.code`.

## Verification matrix

| Scenario                                                        | Expected                                           |
| --------------------------------------------------------------- | -------------------------------------------------- |
| `npm run generate -w @foundly/database`                         | client regenerated (adds `cancellationReason`)     |
| `npm run build -w @foundly/api`                                 | exit 0 (code-first adds the appointments surface)  |
| `npm run typecheck -w @foundly/api`                             | `tsc --noEmit` clean                               |
| `npm run test -w @foundly/api`                                  | 100% pass (existing + appointments unit/e2e)       |
| `npm run lint` (root)                                           | clean                                              |
| `appointments(...)` filters                                     | tenant/date/specialist/status scoped list          |
| `createAppointment` free slot                                   | persisted with snapshot from the service           |
| `createAppointment` overlap                                     | `CONFLICT`, nothing persisted                      |
| `createAppointment` missing/cross-tenant target                 | `NOT_FOUND`                                        |
| `updateAppointmentStatus` invalid/disallowed                    | `VALIDATION_ERROR`                                 |
| `cancelAppointment` from PENDING/CONFIRMED                      | `CANCELLED` + reason; otherwise `VALIDATION_ERROR` |
| `npm run build -w @foundly/book`, `npm run test -w @foundly/ui` | no regressions                                     |

Refer to `contracts/appointments-graphql.contract.md` for exact types/behaviour and `data-model.md` for
validation rules and the status transitions.

## Test commands

| Command                                                         | Scope                  |
| --------------------------------------------------------------- | ---------------------- |
| `npm run generate -w @foundly/database`                         | Prisma DB-First client |
| `npm run build                                                  | typecheck              | test -w @foundly/api` | API gates (incl. appointments) |
| `npm run lint` (root)                                           | workspace lint         |
| `npm run build -w @foundly/book`, `npm run test -w @foundly/ui` | regression gates       |
