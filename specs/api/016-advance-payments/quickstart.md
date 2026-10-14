# Quickstart — Foundly API — Advance Payments, Service Advance Rules & Agenda Control

**Feature**: `specs/api/016-advance-payments` · Runnable validation scenarios.

## Prerequisites

- `apps/api/.env` with `DATABASE_URL`, `SUPABASE_AUTH_URL`, `CORS_ORIGINS`.
- Postgres/Supabase reachable and migrated (`npm run db:migrate -w @foundly/database` — applies the new models/enums/columns).
- A Supabase access token with `app_metadata.tenant_id` set (obtained by signing in through the app).

## Run

```bash
npm run db:migrate -w @foundly/database
npm run dev -w @foundly/api        # http://localhost:3002/graphql
```

## Scenario 1 — Configure payment methods (admin)

```graphql
mutation { upsertPaymentMethod(input: { type: mobile_payment, label: "Pago Móvil", details: "Banco: X / Tel: 0414...", instructions: "Envía el capture.", active: true }) { id type active } }
```

**Expected**: the method is returned with `active: true`. `myPaymentMethods` lists it. Anonymous (no bearer) → `UNAUTHENTICATED`. A second upsert of the same `type` replaces the row (no duplicates).

## Scenario 2 — Public read shows only active methods

```graphql
query { paymentMethods(tenantSlug: "<my-slug>") { type active } }
```

**Expected**: only `active` methods. Disable one (`upsertPaymentMethod(..., active: false)`) → it disappears. Unknown slug → `[]`.

## Scenario 3 — Service advance rule

```graphql
mutation { createMyService(input: { name: "Corte", priceCents: 2000, durationMinutes: 30, requiresAdvance: true, advanceKind: percent, advanceValue: 50 }) { id requiresAdvance advanceKind advanceValue } }
```

**Expected**: the rule is exposed on `MyService` and on the public `Service`. `requiresAdvance: true` without a kind/value → `VALIDATION_ERROR`; `higher percent` (> 100) → `VALIDATION_ERROR`.

## Scenario 4 — Book with an advance (public)

```graphql
mutation { createAppointment(input: { tenantSlug: "<my-slug>", serviceId: "<svc>", specialistId: "<specialist>", clientName: "Ana", startAt: "<iso>", endAt: "<iso>", origin: "online", paymentMethodType: mobile_payment, advanceAmountCents: 1000, paymentReference: "REF-1", paymentProofUrl: "https://.../proof.png" }) { id status paymentMethodType advanceAmountCents paymentProofUrl } }
```

**Expected**: `status = "PENDING"` and the payment fields are returned. Omitting a payment field, using an inactive method, or a mismatched amount → `VALIDATION_ERROR` and **no** appointment. A non-advance service → the payload is ignored and it still books.

## Scenario 5 — Agenda range + controls (admin)

```graphql
query { myAppointments(from: "2026-10-01T00:00:00.000Z", to: "2026-10-31T23:59:59.999Z") { id startAt status paymentProofUrl notifications { kind message } } }
```

- `updateAppointmentStatus(id: "<id>", status: CONFIRMED)` → status Confirmed **and** a `status_change` notification appears.
- `cancelAppointment(id: "<id>", reason: "No disponible")` → Cancelled + notification.
- `rescheduleAppointment(input: { id: "<id>", startAt: "<new-iso>" })` → start/end move + `reschedule` notification. A slot already taken → `CONFLICT` and the record is unchanged.
- Anonymous → `UNAUTHENTICATED`; with a token bound to tenant B, A's ids → `NOT_FOUND`.

## Scenario 6 — Cross-tenant isolation

- `myPaymentMethods`/`myAppointments` return only the caller's business.
- `upsertPaymentMethod`/`deletePaymentMethod`/`rescheduleAppointment` on another business's ids → `NOT_FOUND` and the records are intact.

## Automated checks

```bash
npm run typecheck -w @foundly/api
npm run test -w @foundly/api        # unit + e2e (AppModule + local JWKS + memory store)
npm run lint -w @foundly/api
npm run build -w @foundly/api
```

> Environment note: the API test transform no longer uses SWC — `apps/api/vitest.config.ts` compiles TypeScript with the pure-JS TypeScript compiler (`ts.transpileModule`), so the suite runs locally on Windows.
