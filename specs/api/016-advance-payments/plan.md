# Implementation Plan: Foundly API — Advance Payments, Service Advance Rules & Agenda Control

**Branch**: `016-advance-payments` | **Date**: 2026-10-13 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/api/016-advance-payments/spec.md`

## Summary

Extend the Foundly API with the backend required by the advance-payment booking phase: (1) a new `payments` module persisting per-business **PaymentMethod** rows (type ∈ mobile_payment | bank_transfer | binance, free-form details/instructions, active flag, one per (business, type)) with an authenticated tenant-scoped CRUD and a public active-only read; (2) a per-service **advance rule** (`requiresAdvance` + `advanceKind` fixed|percent + `advanceValue`) exposed on both the admin catalog (`MyService`) and the public `Service`, validated on create/update; (3) an **advance payment** captured on public appointment creation (method type, amount, reference, proof URL) with server-side enforcement that the method is active and the amount matches the rule; (4) authenticated, tenant-scoped agenda control — a ranged agenda read (`myAppointments`), manual create (`createMyAppointment`, advance-exempt), accept/reject (`updateAppointmentStatus`/`cancelAppointment`) and a new **reschedule** mutation — each recording an `AppointmentNotification` on a real change; and (5) exposing the advance payment + notifications on the appointment object. Public availability reads stay credential-free. All new writes are tenant-scoped from the verified identity. Adds 3 Prisma enums, 2 models and columns on `Service`/`Appointment` in **one migration**.

## Technical Context

**Language/Version**: TypeScript 5.9 (strict) · NestJS 11 · Node ≥ 20.

**Primary Dependencies**: `@nestjs/graphql` (code-first), `@foundly/database` (Prisma 6), `jose` (identity via the global `AuthModule`). **No new dependencies.**

**Storage**: PostgreSQL via Prisma. New `PaymentMethod` and `AppointmentNotification` models, enums `PaymentMethodType`/`AdvanceKind`, and columns on `Service` (advance rule) and `Appointment` (embedded advance payment) → **one new migration**, no backfill required (defaults/nullable).

**Testing**: Vitest — unit (services against in-memory stores) and e2e (`AppModule` + local JWKS + memory store). `tsc --noEmit`; `nest build`; root ESLint.

**Target Platform**: NestJS HTTP/GraphQL server (`apps/api`).

**Project Type**: Web service (GraphQL API).

**Performance Goals**: standard read/write latency; public reads filter by `(tenantId, active)` on indexed columns; agenda reads filter by `(tenantId, startAt)`; writes are single-row, tenant-scoped.

**Constraints**: strict TS, no `any`; every write derives the business from the authenticated identity; the public availability read/submission stay credential-free; amount must match the service rule; notifications recorded only on a real status/date change.

**Scale/Scope**: 1 new module (`payments`, ~7 files) + extensions to `services`, `catalog` and `appointments` modules; 6 GraphQL operations new/changed on payments, 4 on services/catalog advance fields, 7 on appointments; 1 migration; 1 SDL snapshot sync.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **SDD (§5.I)** — spec + this plan exist; `tasks.md` downstream; no code before approval.
- **Dominio (§2.III)** — spec in `specs/api/`; changes confined to `apps/api` (+ Prisma schema/migration in `packages/database` + codegen snapshot in `apps/book`).
- **Tipado estricto (§5.IV)** — code-first enums/types, typed rows/inputs; no `any`; no hand-written client DTOs.
- **Opt-in protection (§5.II / 008)** — new admin reads/writes use `@RequireAuth` + `@AuthUser`; public reads/booking stay public like `013`/`015`.
- **Capa de datos por módulo (§5.VI)** — the Book consumes this surface through its modules' `actions.ts`/`hooks.ts`; the API exposes codegen-friendly operations only.
- **Gates (§3.I)** — `build`, `typecheck`, `test`, lint for `@foundly/api` with zero regressions.
- **Test location (TODO(monorepo))** — `apps/api` keeps the NestJS colocated `*.spec.ts` convention; the `code-rules.md` §10 migration remains deferred (confirmed with the owner, 2026-10-13).
- **Governance (§1)** — subordinated to `specs/business-model.md` and `constitution.md`; enables the monetizable, trustworthy Foundly Book (`business-model.md` §2.3).

**Pre-Phase-0**: PASS. **Post-Phase-1**: PASS (no violations → Complexity Tracking empty).

## Project Structure

### Documentation (this feature)

```text
specs/api/016-advance-payments/
├── plan.md
├── spec.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── advance-payments.contract.md
├── checklists/requirements.md
└── tasks.md                 # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
apps/api/src/modules/payments/                    # NEW module
├── payments.types.ts        # PaymentMethodType enum (registerEnumType) + PaymentMethodObject + UpsertPaymentMethodInput
├── payments.store.ts        # PaymentsStore seam + PAYMENTS_STORE token + PrismaPaymentsStore
├── payments.test-store.ts   # in-memory store
├── payments.service.ts      # requireTenant + listForAdmin/listPublic/upsert/remove
├── payments.resolver.ts     # myPaymentMethods/upsertPaymentMethod/deletePaymentMethod (@RequireAuth) + paymentMethods (public)
├── payments.module.ts
└── payments.*.spec.ts       # unit + e2e (NestJS colocated convention)

apps/api/src/modules/services/                    # public service surface
├── services.types.ts        # + requiresAdvance/advanceKind/advanceValue on ServiceObject + inputs
└── services.service.ts      # + validate/persist/map advance rule

apps/api/src/modules/catalog/                     # admin catalog surface
├── catalog.types.ts         # + advance fields on MyService + Create/UpdateMyServiceInput
├── catalog.store.ts         # + advance fields in ServiceRow/select/persist
├── catalog.test-store.ts    # + advance fields
└── catalog.service.ts       # + advance rule validation

apps/api/src/modules/appointments/
├── appointments.types.ts    # + advance payment fields, notifications, MyAppointments/Reschedule inputs
├── appointments.service.ts  # + advance enforcement, createMy, reschedule, notifications, ranged my-read
└── appointments.resolver.ts # + myAppointments/myAppointment/createMyAppointment/reschedule; @RequireAuth on controls

apps/api/src/app.module.ts                        # register PaymentsModule
packages/database/prisma/schema.prisma            # PaymentMethod, AppointmentNotification, enums, Service/Appointment columns
packages/database/prisma/migrations/<new>/migration.sql
apps/book/codegen.schema.gql                      # versioned SDL snapshot (consumed by book 017)
```

**Structure Decision**: A new `payments` module following the ratified **store-seam** pattern (`time-block`/`reviews`/`catalog`) owns payment-method persistence. Service advance fields are threaded through the two existing service surfaces (`services` public, `catalog` admin) to avoid duplicating the read. Appointment changes extend the existing `appointments` module (Pattern A, direct Prisma) in place, adding the embedded advance payment, notifications, an authenticated ranged read and a reschedule operation while leaving the public availability read untouched.

## Complexity Tracking

> Not required: Constitution Check passes with no violations.
