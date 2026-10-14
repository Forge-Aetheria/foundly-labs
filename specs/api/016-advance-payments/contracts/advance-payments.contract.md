# Contract — Advance Payments, Service Advance Rules & Agenda Control (GraphQL surface)

**Feature**: `specs/api/016-advance-payments` · **Surface**: `POST {API_URL}/graphql`

Public reads/booking stay credential-free; admin reads/writes require a Supabase access token (bearer) and are tenant-scoped from the verified identity.

## Types

```graphql
enum PaymentMethodType { mobile_payment bank_transfer binance }
enum AdvanceKind { fixed percent }

type PaymentMethodObject {
  id: ID!
  tenantId: String!
  type: PaymentMethodType!
  label: String
  details: String
  instructions: String
  active: Boolean!
  createdAt: String!
  updatedAt: String!
}

input UpsertPaymentMethodInput {
  type: PaymentMethodType!
  label: String
  details: String
  instructions: String
  active: Boolean
}

type AppointmentNotificationObject { id: ID! kind: String! message: String! channel: String! createdAt: String! }

input RescheduleAppointmentInput { id: ID! startAt: String! specialistId: ID }
```

`ServiceObject` / `MyService` gain `requiresAdvance: Boolean!`, `advanceKind: AdvanceKind`, `advanceValue: Int`; the create/update service inputs gain the same (all optional). `AppointmentObject` gains `paymentMethodType: PaymentMethodType`, `advanceAmountCents: Int`, `paymentReference: String`, `paymentProofUrl: String`, `paymentSubmittedAt: String`, `notifications: [AppointmentNotificationObject!]!`.

## Payment methods

### `query paymentMethods(tenantId: ID, tenantSlug: String): [PaymentMethodObject!]!` — public

- **Scope**: by `tenantId` or `tenantSlug`.
- **Behavior**: returns only `active` methods; unknown slug / none → `[]`.
- **Auth**: none.

### `query myPaymentMethods: [PaymentMethodObject!]!` — authenticated

- **Auth**: valid, tenant-bound bearer.
- **Scope**: `ctx.user.tenantId`.
- **Errors**: `UNAUTHENTICATED`.

### `mutation upsertPaymentMethod(input: UpsertPaymentMethodInput!): PaymentMethodObject!` — authenticated

- **Behavior**: creates or replaces the method for `(tenant, type)`; `active` defaults to false; details/instructions free-form.
- **Errors**: `UNAUTHENTICATED` · `VALIDATION_ERROR` (unknown type).

### `mutation deletePaymentMethod(id: ID!): Boolean!` — authenticated

- **Scope**: deletes only if it belongs to `ctx.user.tenantId`.
- **Errors**: `UNAUTHENTICATED` · `NOT_FOUND`.

## Service advance rule

- `createService`/`updateService` (public surface) and `createMyService`/`updateMyService` (admin) accept `requiresAdvance`, `advanceKind`, `advanceValue`.
- **Validation**: `requiresAdvance: true` requires `advanceKind ∈ {fixed, percent}` and an integer `advanceValue ≥ 1` (`≤ 100` for percent); `requiresAdvance: false` clears kind/value. Invalid → `VALIDATION_ERROR`.
- The rule is returned on both `ServiceObject` (public) and `MyService` (admin).

## Booking with an advance

### `mutation createAppointment(input: CreateAppointmentInput!): AppointmentObject!` — public

- **Behavior**: forces `origin = 'online'`. When the target service `requiresAdvance`, `paymentMethodType`, `advanceAmountCents`, `paymentReference` and `paymentProofUrl` are required, the referenced `PaymentMethod` must exist and be `active`, and `advanceAmountCents` must equal the expected advance (`advanceValue` fixed, or `round(priceCents * advanceValue / 100)` percent, > 0). The appointment is created in `PENDING` with the payment attached.
- **Errors**: `VALIDATION_ERROR` (incomplete/incorrect payment, inactive or missing method, invalid proof URL) · `CONFLICT` (slot overlap) · `NOT_FOUND` (unknown tenant/service/specialist).

### `mutation createMyAppointment(input: CreateAppointmentInput!): AppointmentObject!` — authenticated

- **Behavior**: tenant from `ctx.user`; `origin = 'admin'`; the advance requirement is skipped.
- **Errors**: `UNAUTHENTICATED` · `VALIDATION_ERROR` · `CONFLICT` · `NOT_FOUND`.

## Agenda read & control

### `query myAppointments(from: String!, to: String!, status: AppointmentStatus, specialistId: ID): [AppointmentObject!]!` — authenticated

- **Scope**: `ctx.user.tenantId`; `startAt ∈ [from, to]` inclusive; optional status/specialist filter; ordered by `startAt` ascending.
- **Errors**: `UNAUTHENTICATED` · `VALIDATION_ERROR` (invalid dates / `to` before `from`).

### `query myAppointment(id: ID!): AppointmentObject` — authenticated

- **Scope**: `(id, ctx.user.tenantId)`; foreign/missing → `null`.
- **Errors**: `UNAUTHENTICATED`.

### `mutation updateAppointmentStatus(id: ID!, status: AppointmentStatus!): AppointmentObject!` — authenticated

- **Behavior**: enforces `ALLOWED_TRANSITIONS`; on a real change records a `status_change` notification.
- **Errors**: `UNAUTHENTICATED` · `VALIDATION_ERROR` (illegal transition) · `NOT_FOUND`.

### `mutation cancelAppointment(id: ID!, reason: String): AppointmentObject!` — authenticated

- **Behavior**: only from `PENDING`/`CONFIRMED`; sets `CANCELLED` + reason; records a `status_change` notification (cancelled).
- **Errors**: `UNAUTHENTICATED` · `VALIDATION_ERROR` · `NOT_FOUND`.

### `mutation rescheduleAppointment(input: RescheduleAppointmentInput!): AppointmentObject!` — authenticated

- **Behavior**: moves `startAt` (and optional `specialistId`) with `endAt = startAt + appliedDurationMinutes`; requires a free slot excluding itself and ignoring `CANCELLED`; records a `reschedule` notification. Keeping the same status; rejected for `CANCELLED`/`COMPLETED`.
- **Errors**: `UNAUTHENTICATED` · `VALIDATION_ERROR` (terminal state / invalid date) · `CONFLICT` (slot overlap) · `NOT_FOUND` (foreign/missing id / specialist not in tenant).

## Error codes (standardized envelope)

| Situation | Code |
|---|---|
| Anonymous/invalid/non-tenant-bound token on admin read/write | `UNAUTHENTICATED` |
| Incomplete/incorrect advance, inactive/missing method, invalid proof URL, invalid advance rule, illegal transition, invalid range | `VALIDATION_ERROR` |
| Slot overlap on create/reschedule | `CONFLICT` |
| Missing or foreign id (by id) | `NOT_FOUND` |
| Public read with an unknown slug / no active methods | empty result (not an error) |

## Tenant isolation guarantees

1. Admin writers never read a tenant identifier from the client payload as the authority (`ctx.user.tenantId` is the only source).
2. Public reads expose only `active` payment methods and the service advance rule; no moderation/payment records leak.
3. By-id mutations are scoped to the caller's tenant; a foreign id behaves as not-found and leaves the record untouched.
4. The authenticated agenda read cannot be scoped to another business via arguments (no tenant argument at all).
5. Public `createAppointment` forces `origin = 'online'` and enforces the advance rule, so `admin` bypass is impossible.
