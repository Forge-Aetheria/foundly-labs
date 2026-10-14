# Phase 1 — Data Model: Foundly Book — Advance Payments, Booking Calendar & Agenda Control

**Feature**: `specs/book/017-advance-payments-booking` · **Date**: 2026-10-13

The client does not own persistence; it models UI state, the API `016` surface and the domain types used by the panel and the portal.

## Domain types — `shared/types/payments.ts` (NEW)

### `PaymentMethodType` / `AdvanceKind`

```ts
export type PaymentMethodType = 'pago_movil' | 'binance' | 'zelle' | 'transfer' | 'cash';
export type AdvanceKind = 'fixed' | 'percent';

export const PAYMENT_METHOD_ORDER: PaymentMethodType[] = ['pago_movil', 'binance', 'zelle', 'transfer', 'cash'];
export const PAYMENT_METHOD_LABELS: Record<PaymentMethodType, string> = {
  pago_movil: 'Pago Móvil',
  binance: 'Binance Pay',
  zelle: 'Zelle',
  transfer: 'Transferencia',
  cash: 'Efectivo',
};
export const ADVANCE_KIND_LABELS: Record<AdvanceKind, string> = { fixed: 'Importe fijo', percent: 'Porcentaje' };
```

> Amended by `022-admin-payments-schedules-refactor`: the type set is the five values above and `details` is a structured object.

### `PaymentMethod`

| Field | Type | Notes |
|---|---|---|
| `id` | `string` | — |
| `tenantId` | `string` | — |
| `type` | `PaymentMethodType` | one per type |
| `title` | `string \| null` | display title (was `label`) |
| `details` | `PaymentMethodDetails \| null` | structured receiving data (JSON on the wire) |
| `instructions` | `string \| null` | free-form instructions |
| `active` | `boolean` | offered in the public flow only when true |

### `AdvancePayment` (embedded on the appointment)

| Field | Type | Notes |
|---|---|---|
| `methodType` | `PaymentMethodType` | — |
| `amountCents` | `number` | — |
| `reference` | `string` | — |
| `proofUrl` | `string` | absolute http(s) |
| `submittedAt` | `string` | ISO-8601 |

## Domain type — `shared/types/appointments.ts` (EXTENDED)

### `Service` (+3 fields)

| Field | Type | Notes |
|---|---|---|
| `requiresAdvance` | `boolean` | **NEW** |
| `advanceKind` | `AdvanceKind \| null` | **NEW** — set only when `requiresAdvance` |
| `advanceValue` | `number \| null` | **NEW** — cents (fixed) or 1–100 (percent) |

### `Appointment` (+2 fields)

| Field | Type | Notes |
|---|---|---|
| `payment` | `AdvancePayment \| null` | **NEW** — present only for advance bookings |
| `notifications` | `AppointmentNotification[]` | **NEW** |

```ts
export interface AppointmentNotification { id: string; kind: string; message: string; channel: string; createdAt: string; }
```

## Public portal types — `modules/public-booking/utils/types.ts` (EXTENDED)

`PublicService` gains `requiresAdvance: boolean`, `advanceKind: AdvanceKind | null`, `advanceValue: number | null` (mapped from the `TenantBySlug` services, which gain the same fields in `tenancy.graphql`).

## Booking-flow state — `dialogs/BookingFlow.tsx`

| Field | Type | Notes |
|---|---|---|
| `step` | `number` | index into the dynamic step list |
| `specialistId` | `string \| null` | — |
| `slot` | `{ startAt; endAt } \| null` | — |
| `client` | `ClientDetails \| null` | — |
| `payment` | `AdvancePaymentDraft \| null` | populated by `PaymentStep` when required |

```ts
export interface AdvancePaymentDraft { methodType: PaymentMethodType; amountCents: number; reference: string; proofUrl: string; }
```

Steps (`requiresAdvance` ⇒ 5, else 4):
`Especialista?` · `Fecha y hora` · `Tus datos` · `Adelanto?` · `Confirmación`.

## Calendar state — `dialogs/CalendarStep.tsx`

| Field | Type | Notes |
|---|---|---|
| `monthCursor` | `string` (`YYYY-MM`, first of month) | navigation |
| `daysData` | `SlotDay[]` | availability for the visible month |
| `selectedDate` | `string \| null` | reveals slots below |
| `value` | `{ startAt; endAt } \| null` | selected slot |

`SlotDay` = `{ date: string; slots: { startAt; endAt }[] }` (existing action return). Days with no `slots` are shown disabled; month navigation refetches the range `[firstVisibleDay, lastVisibleDay]`.

## Proof upload — `utils/uploadProof.ts`

| Item | Value |
|---|---|
| Bucket | `payment-proofs` (public read) |
| Path | `payment-proofs/<tenantSlug>/<uuid>.<ext>` |
| Accepted mime | `image/png`, `image/jpeg`, `image/webp` |
| Max size | 5 MB |
| Return | `ActionResult<{ url: string }>` |

`uploadPaymentProof(file)` is exposed via `hooks.ts` as `useUploadPaymentProof()`; on failure the entered data is preserved and the user can retry.

## Agenda state — `components/Agenda.tsx`

| Field | Type | Notes |
|---|---|---|
| `range` | `{ from: string; to: string }` (`YYYY-MM-DD`) | seeded from the server props; applied via `router.push` |
| `statusFilter` | `string` (`all` \| status) | client filter |
| `modal` | `create` \| `detail` \| `reschedule` \| `null` | — |

`AgendaRow` gains `payment: AdvancePayment | null` and `notifications: AppointmentNotification[]`.

## Mapping (API → domain)

| API | Domain | Rule |
|---|---|---|
| `PaymentMethodObject` | `PaymentMethod` | 1:1 (type/title/details/instructions/active); `details` string ⇄ structured object |
| `MyService.requiresAdvance/advanceKind/advanceValue` | `Service.*` | 1:1 (nulls preserved) |
| `Appointment.paymentMethodType/advanceAmountCents/...` | `Appointment.payment` | present only when `paymentMethodType != null`; else `null` |
| `Appointment.notifications[]` | `Appointment.notifications` | 1:1 |

## Validation rules (from requirements)

- **FR-004/FR-005** — `serviceSchema`: `requiresAdvance` boolean; when true require `advanceKind ∈ {fixed, percent}` and `advanceValue ≥ 1` (`≤ 100` for percent); when false clear them.
- **FR-006** — `advancePaymentSchema` (client): method type in the closed set, `amountCents` integer ≥ 1, `reference` 1–100 chars, `proofUrl` absolute http(s).
- **FR-007** — the confirm action is blocked while the advance step is incomplete; a service requiring an advance with no active method shows a blocking message.
- **FR-009** — the agenda range defaults to today → last day of the current month; `to < from` is corrected inline before navigating.

## State

- **Config editor**: seeded from the server render; save upserts changed methods and revalidates (`router.refresh()`); no optimistic fake data.
- **Booking flow**: all steps are client state; success shows a confirmation; the payment step is mandatory when the service requires an advance.
- **Calendar**: availability is fetched per visible month; selection is client state.
- **Agenda**: range is URL state (server re-render); status filter is client state; after a control action the row updates and the surface is revalidated.
- **Toasts**: in-memory queue only (feature 016).
