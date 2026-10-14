# Phase 0 — Research: Foundly API — Advance Payments, Service Advance Rules & Agenda Control

**Feature**: `specs/api/016-advance-payments` · **Date**: 2026-10-13

All Technical Context unknowns are resolved below (no `NEEDS CLARIFICATION` remained).

## R1 — Payment methods as a first-class, tenant-scoped entity

- **Decision**: Add a `PaymentMethod` model (`tenantId`, `type`, `label?`, `details?`, `instructions?`, `active`, timestamps) with a Prisma enum `PaymentMethodType { mobile_payment, bank_transfer, binance }` and a `@@unique([tenantId, type])` constraint (one configuration per type per business). Serve it through a new `payments` module using the store-seam pattern.
- **Rationale**: The method set is a fixed closed vocabulary with a natural key (type); a row-per-type + enum gives a DB-level guarantee, indexed reads and single-row updates. A JSON blob on `BusinessProfile` (the alternative) would lose type safety, a per-row active flag and the uniqueness guarantee.
- **Alternatives considered**: JSON on `BusinessProfile` — rejected (no type safety/indexing/uniqueness per type). Separate table without uniqueness — rejected (would allow duplicate Binance configs).

## R2 — Details and instructions are free-form strings

- **Decision**: Model `details` and `instructions` as nullable `String` fields (free-form, multi-line), not typed per-method structures.
- **Rationale**: The spec's assumption explicitly makes receiving data free-form per method ("Pago Móvil: banco/teléfono/cédula", "Transferencia: banco/cuenta/titular", "Binance: email/Pay ID"), which differ per business and per method. Free-form avoids a schema redesign per method and keeps the GraphQL input simple.
- **Alternatives considered**: Typed per-method inputs — rejected (premature; different businesses need different fields). GraphQL JSON scalar — rejected (unnecessary complexity; a string suffices).

## R3 — Service advance rule: kind + value

- **Decision**: Add `requiresAdvance Boolean @default(false)`, `advanceKind AdvanceKind?` (`fixed` | `percent`) and `advanceValue Int?` to `Service`. `advanceValue` is **cents** when `fixed` and an **integer 1–100** when `percent`. Validate on create/update: `requiresAdvance: true` ⇒ a valid kind and a positive value (≤ 100 for percent); `requiresAdvance: false` ⇒ clear kind and value.
- **Rationale**: One compact pair expresses both requested modes; the validation keeps the booking flow deterministic and lets the server recompute the expected amount (R5).
- **Alternatives considered**: Two nullable fields (`advanceAmountCents`, `advancePercent`) — rejected (allows both set; ambiguous). Percent stored as basis points — rejected (the UI works in whole percentages).

## R4 — Advance payment embedded on the appointment

- **Decision**: Store the advance payment as nullable columns on `Appointment`: `paymentMethodType PaymentMethodType?`, `advanceAmountCents Int?`, `paymentReference String?`, `paymentProofUrl String?`, `paymentSubmittedAt DateTime?`.
- **Rationale**: It is a 1:1, non-recurring attribute of the booking in v1 (the spec's "Advance payment: … attached to the appointment"), so columns avoid a join and mirror the existing `applied*`/`cancellationReason` pattern.
- **Alternatives considered**: Separate `AdvancePayment` table — deferred (no re-submission history in v1; a table would add a join for no benefit). JSON column — rejected (no type safety/indexing).

## R5 — Server-side enforcement of the advance on public booking

- **Decision**: `createAppointment` (public) forces `origin = 'online'` and, when the target service `requiresAdvance`, requires `paymentMethodType`, `paymentReference`, `paymentProofUrl` (absolute http(s)) and `advanceAmountCents`, verifies an **active** `PaymentMethod` of that type exists for the tenant, and requires the amount to equal the expected advance (`advanceValue` when fixed; `Math.round(priceCents * percent / 100)` when percent, which must be > 0). Otherwise → `VALIDATION_ERROR` and nothing is created. A missing active method → `VALIDATION_ERROR` with a clear message.
- **Rationale**: The server is the authority (FR-007); recomputing the amount protects the monetization invariant (SC-001/SC-002) and prevents underpayment or a bypassed step.
- **Alternatives considered**: Trusting a client-sent `required`/`amount` — rejected (trivially bypassable). Enforcing only presence — rejected (would let a client pay 0).

## R6 — Manual appointments are a separate authenticated mutation

- **Decision**: Add `createMyAppointment` (`@RequireAuth`, tenant from `ctx.user`, `origin = 'admin'`, advance-exempt) and keep public `createAppointment` online-only. The Book admin "Nueva cita" flow switches to `createMyAppointment`.
- **Rationale**: The current public mutation accepts a client `origin`, which would let anyone claim `admin` and skip the advance (a real bypass). Splitting the surfaces by authentication closes it (FR-008/FR-013).
- **Alternatives considered**: Trust the `origin` argument — rejected (bypass). Require auth on the public mutation — rejected (public booking is anonymous).

## R7 — Authenticated, ranged agenda read

- **Decision**: Add `myAppointments(from: String!, to: String!, status?, specialistId?)` (`@RequireAuth`, tenant from `ctx.user`) returning appointments with `startAt` in `[from, to]`, and `myAppointment(id)` (`@RequireAuth`) scoped by `(id, tenantId)`. Keep the existing public `appointments(...)` read untouched for the availability engine.
- **Rationale**: FR-009/FR-013; the public read must stay credential-free because the public booking flow computes availability anonymously. The admin agenda reads its own tenant only.
- **Alternatives considered**: Reusing the public read with `startDate`/`endDate` — rejected (unauthenticated, client-supplied tenant).

## R8 — Status transitions, reschedule and notifications

- **Decision**: Harden `updateAppointmentStatus`/`cancelAppointment` with `@RequireAuth` + `@AuthUser`, scope by `(id, tenantId)`, and add `rescheduleAppointment(input)` (`startAt`, optional `specialistId`) enforcing the existing `ALLOWED_TRANSITIONS` rules and a conflict-free slot (excluding the appointment itself, ignoring `CANCELLED`). On a **real** status change or a reschedule, insert one `AppointmentNotification` (`kind`, localized `message`, `channel = 'simulated'`) in the same tenant scope. Expose `notifications` on the appointment object.
- **Rationale**: FR-010/FR-011; idempotent re-sets do not double-notify (edge case). Reuses the existing `ALLOWED_TRANSITIONS`/overlap logic.
- **Alternatives considered**: A dedicated `notifications` module — rejected (owned by appointments; a record, not a service). Fire-and-forget without persistence — rejected (FR-011 requires a record).

## R9 — Persistence seam for payments only

- **Decision**: Introduce the store seam (`PaymentsStore` + `PrismaPaymentsStore` + `createMemoryPaymentsStore()`) for the new module; extend `appointments`, `services` and `catalog` in place (direct Prisma / existing seams). `catalog.store.ts`'s `ServiceRow` gains the advance fields.
- **Rationale**: Mirrors the ratified `time-block`/`reviews`/`gallery` convention and enables DB-free specs, without refactoring the existing appointments module (Pattern A) beyond what the feature needs.
- **Alternatives considered**: Store seams everywhere — rejected (unnecessary churn for this increment).

## R10 — Enums, codegen and the SDL snapshot

- **Decision**: Register code-first enums `PaymentMethodType` and `AdvanceKind` (lower-case values matching the Book vocabulary, like `ReviewState`), sync the versioned SDL snapshot `apps/book/codegen.schema.gql`, and expose the new fields on `Service`/`MyService`/`Appointment`/`PaymentMethod`.
- **Rationale**: Single shared vocabulary API ↔ Book, codegen-only DTOs (constitution §5.VI).
- **Alternatives considered**: Upper-case GraphQL values mapped from lower-case Prisma enums — rejected (mapping churn across API + Book).

## R11 — Error envelope

- **Decision**: Reuse `validationError` / `notFoundError` / `conflictError` and the `UNAUTHENTICATED` scope error used by `catalog`/`reviews`. Unknown slug / no active methods → empty. Wrong-amount/inactive-method/incomplete-payment → `VALIDATION_ERROR`. Slot overlap → `CONFLICT`. Foreign/missing id → `NOT_FOUND`.
- **Rationale**: Single, stable, already-normalized contract; matches `013`/`014`/`015`.
- **Alternatives considered**: New payment-specific codes — rejected (would break the standardized envelope and the Book mapping).

## R12 — Proof URL validation, no upload in the API

- **Decision**: The API accepts and validates the proof as an absolute `http(s)` URL string; the binary upload happens in the Book app (Supabase Storage). The API never handles file bytes.
- **Rationale**: Keeps the API free of object-storage credentials/SDKs (none exist today) and matches the boundary drawn in `specs/book/017-advance-payments-booking` (R-upload).
- **Alternatives considered**: Multipart upload in the API — rejected (new storage dependency + credentials; the Book already carries the Supabase SDK).
