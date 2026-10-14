# Phase 1 — Data Model: Foundly API — Advance Payments, Service Advance Rules & Agenda Control

**Feature**: `specs/api/016-advance-payments` · **Date**: 2026-10-13

## Persistence entities (Prisma)

### `enum PaymentMethodType` (NEW)

| Value | Meaning |
|---|---|
| `pago_movil` | Pago Móvil |
| `binance` | Binance Pay |
| `zelle` | Zelle |
| `transfer` | Transferencia |
| `cash` | Efectivo |

### `enum AdvanceKind` (NEW)

| Value | Meaning |
|---|---|
| `fixed` | Fixed amount in cents (`advanceValue` = cents) |
| `percent` | Percentage of the service price (`advanceValue` = 1–100) |

### `PaymentMethod` (NEW table)

| Field | Type | Notes |
|---|---|---|
| `id` | `String @id @default(cuid())` | Primary key |
| `tenantId` | `String` | Owner business (FK → `Tenant.id`) |
| `type` | `PaymentMethodType` | Method kind |
| `label` | `String?` | Display title (GraphQL `title`) |
| `details` | `String?` | Structured receiving data (JSON-encoded) |
| `instructions` | `String?` | Free-form instructions for the client |
| `active` | `Boolean @default(false)` | Offered in the public flow only when true |
| `createdAt` | `DateTime @default(now())` | — |
| `updatedAt` | `DateTime @updatedAt` | — |

**Relations**: `Tenant 1 ── * PaymentMethod`.
**Constraints/Indexes**: `@@unique([tenantId, type])`, `@@index([tenantId, active])`.

### `Service` (EXTENDED, +3 columns)

| Field | Type | Notes |
|---|---|---|
| `requiresAdvance` | `Boolean @default(false)` | **NEW** |
| `advanceKind` | `AdvanceKind?` | **NEW** — set only when `requiresAdvance` |
| `advanceValue` | `Int?` | **NEW** — cents (fixed) or 1–100 (percent) |

### `Appointment` (EXTENDED, +5 columns — embedded advance payment)

| Field | Type | Notes |
|---|---|---|
| `paymentMethodType` | `PaymentMethodType?` | **NEW** |
| `advanceAmountCents` | `Int?` | **NEW** |
| `paymentReference` | `String?` | **NEW** |
| `paymentProofUrl` | `String?` | **NEW** — absolute http(s) |
| `paymentSubmittedAt` | `DateTime?` | **NEW** |

### `AppointmentNotification` (NEW table)

| Field | Type | Notes |
|---|---|---|
| `id` | `String @id @default(cuid())` | Primary key |
| `tenantId` | `String` | FK → `Tenant.id` |
| `appointmentId` | `String` | FK → `Appointment.id`, `onDelete: Cascade` |
| `kind` | `String` | `status_change` \| `reschedule` |
| `message` | `String` | Localized, user-facing text |
| `channel` | `String @default("simulated")` | Reserved for a real channel |
| `createdAt` | `DateTime @default(now())` | — |

**Relations**: `Tenant 1 ── * AppointmentNotification`; `Appointment 1 ── * AppointmentNotification` (cascade delete).
**Indexes**: `@@index([appointmentId, createdAt])`.

**Migration**: one new migration — create `PaymentMethodType`/`AdvanceKind` enums, create `PaymentMethod`, add the 3 `Service` columns, add the 5 `Appointment` columns, create `AppointmentNotification`, and add the indexes/FKs. No backfill (all new columns default/nullable).

## GraphQL types (code-first)

```graphql
enum PaymentMethodType { pago_movil binance zelle transfer cash }
enum AdvanceKind { fixed percent }

type PaymentMethodObject {
  id: ID!
  tenantId: String!
  type: PaymentMethodType!
  title: String
  details: String
  instructions: String
  active: Boolean!
  createdAt: String!
  updatedAt: String!
}

input UpsertPaymentMethodInput {
  type: PaymentMethodType!
  title: String
  details: String
  instructions: String
  active: Boolean
}

input RescheduleAppointmentInput {
  id: ID!
  startAt: String!        # ISO-8601 with offset
  specialistId: ID
}
```

`ServiceObject` (public) and `MyService` (admin) gain:

```graphql
requiresAdvance: Boolean!
advanceKind: AdvanceKind
advanceValue: Int
```

`CreateServiceInput`/`UpdateServiceInput`/`CreateMyServiceInput`/`UpdateMyServiceInput` gain the same three fields (all optional except where noted).

`AppointmentObject` gains:

```graphql
paymentMethodType: PaymentMethodType
advanceAmountCents: Int
paymentReference: String
paymentProofUrl: String
paymentSubmittedAt: String
notifications: [AppointmentNotificationObject!]!
```

```graphql
type AppointmentNotificationObject { id: ID! kind: String! message: String! channel: String! createdAt: String! }
```

`CreateAppointmentInput` (public) gains optional `paymentMethodType`, `advanceAmountCents`, `paymentReference`, `paymentProofUrl`.

## Internal seam types

### `PaymentMethodRow` — `payments.store.ts`

| Field | Type |
|---|---|
| `id` | `string` |
| `tenantId` | `string` |
| `type` | `'pago_movil' \| 'binance' \| 'zelle' \| 'transfer' \| 'cash'` |
| `title` | `string \| null` |
| `details` | `string \| null` (JSON-encoded object) |
| `instructions` | `string \| null` |
| `active` | `boolean` |
| `createdAt` | `string` (ISO) |
| `updatedAt` | `string` (ISO) |

```ts
interface PaymentsStore {
  resolveTenantId(scope: TenantScopeInput): Promise<string | null>;
  listByTenant(tenantId: string, active?: boolean): Promise<PaymentMethodRow[]>;
  getByType(tenantId: string, type: PaymentMethodType): Promise<PaymentMethodRow | null>;
  upsertByType(tenantId: string, type: PaymentMethodType, input: UpsertPaymentMethodInput): Promise<PaymentMethodRow>;
  deleteById(id: string, tenantId: string): Promise<boolean>;
}
```

### `ServiceRow` — `catalog.store.ts` (EXTENDED)

Adds `requiresAdvance: boolean`, `advanceKind: AdvanceKind | null`, `advanceValue: number | null`.

### `AppointmentStore` row view — `appointments.service.ts`

`APPOINTMENT_INCLUDE` gains `notifications: { orderBy: { createdAt: 'desc' } }`; the mapped `AppointmentObject` exposes the payment columns and notifications.

## Validation rules (from requirements)

- **FR-001/FR-002** — `upsertPaymentMethod` requires `type ∈ {pago_movil, binance, zelle, transfer, cash}`; one row per `(tenantId, type)`; tenant from `ctx.user`; `title` is the display title and `details` a JSON-encoded object.
- **FR-003** — public `paymentMethods` lists `active = true` only; unknown slug → `[]`.
- **FR-004/FR-005** — `requiresAdvance: true` ⇒ `advanceKind` set and `advanceValue` an integer ≥ 1 (percent ≤ 100); `requiresAdvance: false` ⇒ clear kind/value.
- **FR-006/FR-007** — public `createAppointment` for an advance service requires a complete payload, an **active** method of the given type and `advanceAmountCents === expected` where `expected = advanceValue` (fixed) or `round(priceCents * advanceValue / 100)` (percent, must be > 0).
- **FR-008** — `createMyAppointment` (authenticated) sets `origin = admin` and skips the advance requirement.
- **FR-009** — `myAppointments(from, to, status?, specialistId?)` filters `startAt ∈ [from, to]` and `tenantId = ctx.user.tenantId`.
- **FR-010** — status transitions follow `ALLOWED_TRANSITIONS`; reschedule requires a free slot (excluding self, ignoring `CANCELLED`) and a `specialistId` belonging to the tenant.
- **FR-011** — a notification row is inserted only when the status actually changes or a reschedule occurs.
- **FR-012** — the appointment read exposes the payment columns as-is (nullable) and notifications.
- **FR-013** — admin reads/writes derive the tenant from `ctx.user`; anonymous → `UNAUTHENTICATED`; foreign/missing id → `NOT_FOUND`.

## State transitions (appointments — unchanged matrix)

| From | To | Allowed |
|---|---|---|
| `PENDING` | `CONFIRMED`, `CANCELLED`, `COMPLETED` | yes |
| `CONFIRMED` | `CANCELLED`, `COMPLETED` | yes |
| `CANCELLED` / `COMPLETED` | — | no |

Reschedule is allowed only while the appointment is not `CANCELLED`/`COMPLETED`; it keeps the same status.

## Notification catalogue

| Trigger | `kind` | `message` (es) |
|---|---|---|
| status → Confirmed | `status_change` | "Tu cita fue confirmada." |
| status → Cancelled (via reject/cancel) | `status_change` | "Tu cita fue cancelada." |
| other status change | `status_change` | "Tu cita cambió de estado." |
| reschedule | `reschedule` | "Tu cita fue reprogramada." |

## Derived / served projections

- **Public** (`paymentMethods`): active methods only, ordered by `type`.
- **Admin** (`myPaymentMethods`): all of the tenant's methods.
- **Consumer side (Book `017`)**: configuration UI reads `myPaymentMethods`; the public booking flow reads `paymentMethods` for the advance step; the agenda reads `myAppointments` and controls via the appointment mutations; the detail renders `payment*` + `notifications`.
