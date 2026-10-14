# Implementation Plan: Foundly Book — Admin Payments & Schedules Redesign

**Branch**: `022-admin-payments-schedules-refactor` | **Date**: 2026-10-14 | **Spec**: `specs/book/022-admin-payments-schedules-refactor/spec.md`

**Input**: Feature specification from `/specs/book/022-admin-payments-schedules-refactor/spec.md`

## Summary

Redesign two admin surfaces: (1) **Métodos de Pago** (`/admin/configuracion`) as a card list with a structured create/edit modal for five method types (Pago Móvil, Binance Pay, Zelle, Transferencia, Efectivo) where each type exposes its own receiving fields; and (2) **Horarios y Disponibilidad** (`/admin/availability`) as a clean weekly schedule (per-day toggle + start/end + save) plus a dedicated block card with a "Rango de horas"/"Días completos" selector. The payment-method contract is extended (backend `PaymentMethodType` values, `title`, JSON-encoded `details`) across `apps/api` (spec `specs/api/016-advance-payments`) and mirrored in `apps/book` (`shared/types/payments.ts`, codegen snapshot, `configuration` module, public-booking read, agenda label). No new backend columns beyond the enum/`title`; the schedule side reuses the existing availability/time-block API.

## Technical Context

**Language/Version**: TypeScript 5.9 · React 19 · Next.js 15.5 (App Router)

**Primary Dependencies**: `@foundly/ui` (design system) · MUI v6 · Zod 4 · graphql-codegen

**Storage**: Backend PostgreSQL/Prisma (payment enum + `title`; `details` remains a text column holding JSON). Schedule uses existing availability/time-block tables.

**Testing**: Vitest + RTL + vitest-axe (`npm run test -w @foundly/book`); API Vitest (`npm run test -w @foundly/api`)

**Target Platform**: Web (Next.js server components + client islands)

**Project Type**: Web application (monorepo workspace)

**Constraints**: C1 — admin views use `@foundly/ui` only (plus MUI `Box`); C2 — data access through each module's `actions.ts`/`hooks.ts` (constitution §5.VI), never in the UI; C3 — codegen only, no hand-written API DTOs; C4 — the versioned SDL snapshot `apps/book/codegen.schema.gql` stays in sync with `apps/api/src/schema.gql`.

**Scale/Scope**: 2 admin surfaces redesigned, 1 shared domain type extended, 1 cross-domain contract change (enum + `title` + structured `details`), tests updated on both apps.

## Constitution Check

_GATE: must pass before Phase 0 research. Re-check after Phase 1 design._

- Specs under `/specs/<dominio>/<nnn>-<feature>/` → **OK** (`book/022-...`).
- References `specs/business-model.md` → **OK** (governance note + Assumptions).
- Backend contract change belongs to `specs/api/016-advance-payments` → **OK** (this spec delegates the enum/`title`/`details` change to the API spec and consumes it).
- Data layer per module (§5.VI): UI keeps using `hooks.ts`/`actions.ts`; `PaymentsConfig` only calls `useUpsertPaymentMethod`/`useDeletePaymentMethod`; `AvailabilityEditor` only calls `useSaveAvailability`/`useAddTimeBlock`/`useRemoveTimeBlock`. → **OK**
- Design tokens + `@foundly/ui` primitives only → **OK**.
- Strict typing, no `any` → **OK** (structured `PaymentMethodDetails`, `ActionResult`).

_Re-check after Phase 1 design:_ **PASS** — no new `packages/ui` primitive required (Chip/Switch/Modal/Card/Badge/TextField cover the surface); the backend change is contained to the payments module + snapshots.

## Project Structure

### Documentation (this feature)

```text
specs/book/022-admin-payments-schedules-refactor/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── admin-payments-schedules.contract.md
├── checklists/
│   └── requirements.md
└── tasks.md
```

### Source Code (repository root)

```text
apps/api/src/modules/payments/payments.types.ts          # enum values + title (was label)
apps/api/src/modules/payments/payments.store.ts          # map Prisma label ↔ title
apps/api/src/modules/payments/payments.service.ts        # input.title
apps/api/src/modules/payments/payments.test-store.ts     # title
apps/api/src/modules/payments/payments.service.spec.ts   # enum/title
apps/api/src/modules/payments/payments.e2e.spec.ts       # enum/title
apps/api/src/modules/appointments/appointments.service.spec.ts # enum values
apps/api/src/schema.gql                                  # SDL enum + title
apps/book/codegen.schema.gql                             # SDL snapshot (enum + title)
apps/book/src/shared/types/payments.ts                   # types, labels, details helpers
apps/book/src/modules/configuration/utils/schemas.ts     # type enum + structured details
apps/book/src/modules/configuration/actions.ts           # parse/serialize details
apps/book/src/modules/configuration/components/PaymentsConfig.tsx  # card list + modal
apps/book/src/modules/configuration/tests/{PaymentsConfig,actions}.test.tsx
apps/book/src/modules/configuration/configuration.graphql # SDL ops (title)
apps/book/src/modules/availability/components/AvailabilityEditor.tsx # schedule + blocks
apps/book/src/modules/availability/tests/AvailabilityEditor.test.tsx
apps/book/src/modules/public-booking/public-booking.graphql         # public read (title)
apps/book/src/modules/public-booking/actions.ts          # map title + parse details
apps/book/src/modules/public-booking/dialogs/PaymentStep.tsx        # structured summary
apps/book/src/modules/public-booking/utils/schemas.ts    # advance method enum
apps/book/src/modules/public-booking/tests/BookingFlow.test.tsx
apps/book/src/modules/agenda/tests/Agenda.test.tsx       # enum value
specs/book/{017-advance-payments-booking,015-availability-time-blocks}/  # amended
specs/api/016-advance-payments/                          # amended (enum/title/details)
```

**Structure Decision**: Reuse the existing `configuration` (payments) and `availability` modules; extend the shared `payments` domain type. The backend change is a focused edit of the existing `payments` module plus the SDL snapshots. No new app, package or route.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
| --------- | ---------- | ------------------------------------ |
| Cross-domain contract change (enum values + `title` + JSON `details`) | The reference redesign requires five method types and structured data the API did not model | Keeping three free-form methods cannot express Zelle/Efectivo nor the structured fields (FR-002/FR-003) |
| `details` stored as JSON text instead of a JSON column | Avoids a Prisma column type change; the API/SDL keeps `details: String` | A JSON scalar/column would require a broader backend + codegen change with no user-visible benefit |
