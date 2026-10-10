# Contract: Booking Flow (guided 4-step)

**Feature**: `specs/book/003-public-portal-minisite/` | **Date**: 2026-10-09

Defines the interactive booking flow surface. Client state lives inside an `@foundly/ui` `Modal` (`BookingFlow`) and all writes go through the existing action seam (research R4/B).

## Flow steps (FR-009…FR-015)

| Step  | Title          | Behaviour                                                                                        |
| ----- | -------------- | ------------------------------------------------------------------------------------------------ |
| 1     | Especialista   | Only shown when the tenant has > 1 active specialist; otherwise skipped (FR-010). Preselected single specialist when exactly 1. |
| 2     | Fecha y hora   | Minimalist day-pill selector (weekday + day, e.g. "lun 12") + time-slot grid from `fetchOfferedSlots(resourceId, serviceId, day)`; only bookable slots offered (FR-011). Both use landing pill buttons. |
| 3     | Tus datos      | Validated fields: `name` (required), `email` (required, format), `phone` (required, format), `notes` (optional). Inline errors block progression (FR-012). |
| 4     | Confirmación   | Summary glass card: service, specialist, date+time, client data + "Confirmar cita". Creates the appointment (FR-013). |

## Visual surface

- The flow runs inside an `@foundly/ui` `Modal` with the `glass` surface (translucent `surface.glass` +
  blur, 12px overlay radius), showing the module canvas behind it.
- Every control and card replicates the landing canon (`004-book-brand-canvas`): primary/secondary pill
  buttons (`PRIMARY_BUTTON_SX`/`SECONDARY_BUTTON_SX`) and translucent glass cards (`GLASS_CARD_SX`), all
  from `apps/book/src/app/components/landingCanon.ts`.

## Action contract

- `fetchOfferedSlots({ tenantSlug, serviceId, resourceId, startDate, endDate })` → `SlotDay[]` (`{ date, slots: [{ startAt, endAt }] }`), scoped to the specialist (research R5).
- `bookPublicAppointment({ tenantSlug, serviceId, resourceId, startAt, clientName, clientEmail, clientPhone, notes })`:
  - success → `{ ok: true, data: Appointment }` (origin `online`, status `pending`).
  - `CONFLICT` if the resource has an overlapping active appointment (still enforced at write time, FR-014).
- On `CONFLICT`, the flow surfaces the message and **keeps the client data** (FR-015); the client picks another slot.

## Field validation (schemas)

| Field   | Rule                                                        |
| ------- | ----------------------------------------------------------- |
| `name`  | required, 1–120 chars                                       |
| `email` | required, valid email format                                |
| `phone` | required, 8–20 chars (digits, spaces, `+`, `-`)             |
| `notes` | optional, max 2000 chars                                    |

## Guarantees

- The modal is hydration-safe (step state is client-only).
- All UI comes from `@foundly/ui` primitives with theme tokens (pill buttons, bold typography, rounded cards) plus the landing-canonic glass/pill overrides in `landingCanon.ts`.
- The flow is keyboard-operable (esc/backdrop close per the `Modal` primitive defaults, labeled controls).