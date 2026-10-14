# Quickstart — Foundly Book — Advance Payments, Booking Calendar & Agenda Control

**Feature**: `specs/book/017-advance-payments-booking` · Runnable validation scenarios.

## Prerequisites

- `apps/book/.env` with `API_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- The API running with the `016` surface (`specs/api/016-advance-payments`) and a migrated DB.
- A **Supabase Storage bucket** named `payment-proofs` (public read) with an insert policy allowing the booking client to upload images (mime `image/png|jpeg|webp`, ≤ 5 MB). Create it once:
  - Storage → New bucket → `payment-proofs` (public bucket) → policy `INSERT` for `anon` with the size/mime constraints above.
- A signed-in owner bound to a business.

## Run

```bash
npm run codegen -w @foundly/book     # after syncing codegen.schema.gql + adding the new operations
npm run dev -w @foundly/book         # http://localhost:3001
```

## Scenario 1 — Configure payment methods (US1)

1. Open `/admin/configuracion`; the "próximamente" notice is gone and the three method cards (Pago Móvil, Transferencia, Binance) are shown.
2. Enable Pago Móvil, fill details + instructions, save → green toast; reload → values persist and it is shown active.
3. Disable it and save → it is no longer offered in the public flow.

## Scenario 2 — Real calendar (US2)

1. Open the public provider page and start a booking → Step "Fecha y hora" shows a real **month calendar**, not date pills.
2. Days with availability are selectable; selecting one reveals its time slots **below** the calendar; a day without availability is disabled/none shown.
3. Navigate months → days reflect real backend availability.

## Scenario 3 — Mandatory advance step (US3)

1. In `/admin/services`, mark a service as requiring an advance (e.g. 50 %) and ensure at least one method is active.
2. Book that service: a **Pago de adelanto** step appears (method, amount, reference, screenshot upload). Completing it is required before confirming.
3. Confirm → the appointment is created in **Pending** and carries the payment.
4. Book a service without the flag → **no** payment step.
5. With an advance service and **no** active method → the flow is blocked with a clear message.

## Scenario 4 — Agenda range (US4)

1. Open `/admin/agenda` → the range defaults to **today → the last day of the current month**.
2. Change `desde`/`hasta` → only appointments inside the range are listed; an empty range shows a clean empty state; `hasta < desde` is corrected inline.

## Scenario 5 — Status actions + notification (US5)

1. On a pending appointment open the detail → **Aceptar** (→ Confirmada), **Rechazar** (→ Cancelada) and **Reagendar** (new date/time). Each shows a success toast and refreshes.
2. Reschedule into an already-taken slot → blocked with a conflict message; the original slot is preserved.

## Scenario 6 — Verify the advance in the detail (US6)

1. Open the detail of an appointment created with an advance → the **Adelanto** section shows method, amount, reference and the proof preview (with an "Abrir comprobante" link).
2. A non-advance appointment → no Adelanto section.
3. A proof that cannot render → a link/fallback is shown (no broken image).

## Automated checks

```bash
npm run test -w @foundly/book
npm run typecheck -w @foundly/book
npm run lint -w @foundly/book
npm run build -w @foundly/book
```
