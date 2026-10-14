# Data Model: Foundly Book — Admin Payments & Schedules Redesign

**Feature**: `specs/book/022-admin-payments-schedules-refactor/` | **Date**: 2026-10-14

## PaymentMethod (extended)

`apps/book/src/shared/types/payments.ts`.

```ts
export type PaymentMethodType = 'pago_movil' | 'binance' | 'zelle' | 'transfer' | 'cash';

export interface PaymentMethodDetails {
  holder?: string;   // Titular
  cedula?: string;   // Cédula / RIF (Pago Móvil)
  phone?: string;    // Teléfono (Pago Móvil)
  bank?: string;     // Banco (Pago Móvil)
  payId?: string;    // Binance Pay ID
  email?: string;    // Zelle
  account?: string;  // Transferencia (cuenta)
}

export interface PaymentMethod {
  id: string;
  tenantId: string;
  type: PaymentMethodType;
  title: string | null;          // was `label`
  details: PaymentMethodDetails | null; // parsed from the JSON `details` string
  instructions: string | null;
  active: boolean;
}
```

Helpers:

- `parsePaymentDetails(raw: string | null | undefined): PaymentMethodDetails | null` — JSON parse; legacy free-form text → `{ account: raw }`.
- `serializePaymentDetails(details): string | null` — drops blank fields; `JSON.stringify`.
- `paymentDetailSummary(details): string` — `Titular: … · Banco: …`.
- `PAYMENT_TYPE_FIELDS: Record<PaymentMethodType, (keyof PaymentMethodDetails)[]>` and `PAYMENT_DETAIL_LABELS`.

Rules:

- Closed type set of five values; at most one method per `(tenant, type)`.
- Blank optional fields are dropped before persistence; the record stays valid.
- `title` and `instructions` are free text (≤ 120 / ≤ 2000 chars).

## WeeklySchedule (AvailabilityRule — unchanged shape)

Per weekday (0 = Sunday): `isOpen`, `startTime`, `endTime`. The redesigned editor renders Monday-first and persists the open/closed state + times through `saveWeeklyAvailability`.

## TimeBlock (unchanged shape, new "full day" semantics)

`{ startAt, endAt, reason }`. A **full-day** block is expressed as `00:00–23:59` of the selected date (no new backend flag); a **range** block uses the chosen start/end times.

## API contract delta (`specs/api/016-advance-payments`)

| Element | Before | After |
| ------- | ------ | ----- |
| `PaymentMethodType` | `mobile_payment`, `bank_transfer`, `binance` | `pago_movil`, `binance`, `zelle`, `transfer`, `cash` |
| `PaymentMethodObject` | `label: String` | `title: String` |
| `UpsertPaymentMethodInput` | `label: String` | `title: String` |
| `details` | `String` free-form | `String` JSON-encoded object (contract value) |

Prisma: the DB column stays `label` and is mapped to the API `title` in the store; only the enum needs a migration.

## Relationships

A `Tenant` owns `PaymentMethod[]` (unique per type) and `AvailabilityRule[]` + `TimeBlock[]`. The public booking advance step reads only active payment methods and renders the structured summary; the public slot computation excludes time blocks. No new entity is introduced by this feature.
