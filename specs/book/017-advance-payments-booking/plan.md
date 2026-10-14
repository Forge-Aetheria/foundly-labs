# Implementation Plan: Foundly Book — Advance Payments, Booking Calendar & Agenda Control

**Branch**: `017-advance-payments-booking` | **Date**: 2026-10-13 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/book/017-advance-payments-booking/spec.md`

## Summary

Deliver the monetization/UX phase requested for Foundly Book on top of the new backend from `specs/api/016-advance-payments`: (1) unlock `/admin/configuracion` with a real **payment-methods** editor (Pago Móvil, Transferencia, Binance — details/instructions + active flag, with toasts and revalidation); (2) replace the public booking date **pills** with a real **month calendar** that fetches a whole month of availability and reveals the day's slots below; (3) add a **mandatory advance step** (method picker + amount + reference + **uploaded proof**) to the public flow when the service requires it, uploading the screenshot to **Supabase Storage**; (4) switch the admin agenda to `desde`/`hasta` **date-range** inputs defaulting to today → end of the current month; (5) wire **accept / reject / reschedule** actions with notifications; and (6) render the collected **advance payment** in the appointment detail (method, amount, reference, proof preview + link fallback). All data access stays in each module's `actions.ts`/`hooks.ts`; the UI never calls the transport or Server Actions directly (constitution §5.VI).

## Technical Context

**Language/Version**: TypeScript 5.9 (strict) · Next.js 15.5 (App Router, React 19) · Node ≥ 20.

**Primary Dependencies**: `graphql-request`, `graphql-codegen`, `@foundly/ui`, `@supabase/ssr` + `@supabase/supabase-js` (already present — used for auth, now also for Storage), `zod`. **No new dependencies.**

**Storage**: PostgreSQL via `apps/api` over GraphQL (the client is storage-agnostic), plus **Supabase Storage** for the proof screenshot (public bucket `payment-proofs`, validated mime/size).

**Testing**: Vitest + RTL + vitest-axe; `tsc --noEmit`; `next build`; root ESLint.

**Target Platform**: Vercel multi-zone (book zone).

**Project Type**: Web application (Next.js server-first).

**Performance Goals**: agenda/config/catalog reads resolved on the server; the month calendar fetches availability in one request per visible month; the proof upload is an interactive client action; no Core Web Vitals impact.

**Constraints**: strict TS, no `any`; Server-First; UI → `hooks.ts` only; codegen-only API DTOs; RSC boundary (serializable props only); design tokens via `@foundly/ui`; accessibility (WCAG) for the calendar, the payment step and the modals.

**Scale/Scope**: 6 user stories; a new `configuration` module + `/admin/configuracion` route; the public booking flow (calendar + payment step + upload); the agenda module (range + controls + detail); the services module (advance rule); shared payment types; 1 SDL snapshot sync (from API `016`).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **SDD (§5.I)** — spec + this plan exist; `tasks.md` downstream; no code before approval.
- **Dominio (§2.III)** — spec in `specs/book/`; changes confined to `apps/book` (+ the SDL snapshot from `specs/api/016-advance-payments`).
- **Capa de datos por módulo (§5.VI)** — every new read/write goes in the module's `actions.ts` and is exposed via `hooks.ts` (`useFetchPaymentMethods`, `useUpsertPaymentMethod`, `useUploadPaymentProof`, `useRescheduleAppointment`, …); UI forbidden from calling the transport/Server Actions directly.
- **Server-First (§5.II)** — config, agenda, services and the portal resolve their reads on the server; `hooks.ts` only for interactive mutations.
- **RSC boundary (§5.V / code-rules §8)** — the calendar, payment step, config editor, agenda and detail modals are `'use client'`; they receive only serializable props.
- **Tipado estricto (§5.IV)** — codegen-only API types; domain types in `shared/types`; no `any`.
- **Design system (§6)** — `@foundly/ui` primitives only; semantic colors from tokens; the calendar is built from tokens (no third-party date library).
- **Gates (§3.I)** — `build`, `typecheck`, `test`, lint for `@foundly/book` with zero regressions.
- **Governance (§1)** — subordinated to `specs/business-model.md` and `constitution.md`; supports the monetizable, trustworthy product experience (`business-model.md` §2.3).

**Pre-Phase-0**: PASS. **Post-Phase-1**: PASS (no violations → Complexity Tracking empty).

## Project Structure

### Documentation (this feature)

```text
specs/book/017-advance-payments-booking/
├── plan.md
├── spec.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── advance-payments-booking.contract.md
├── checklists/requirements.md
└── tasks.md                 # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
apps/book/src/shared/types/payments.ts               # NEW PaymentMethod/AdvancePayment/AdvanceKind + labels
apps/book/src/shared/types/appointments.ts           # + advance rule on Service; + payment/notifications on Appointment

apps/book/src/modules/configuration/                 # NEW module (unlocks /admin/configuracion)
├── configuration.graphql                            # MyPaymentMethods / UpsertPaymentMethod / DeletePaymentMethod / PublicPaymentMethods
├── actions.ts                                        # listPaymentMethods / upsertPaymentMethod / deletePaymentMethod / listPublicPaymentMethods
├── hooks.ts                                          # useFetchPaymentMethods / useUpsertPaymentMethod / useDeletePaymentMethod
├── utils/schemas.ts                                  # paymentMethodSchema
├── components/PaymentsConfig.tsx                     # 3 method editors (Switch + details/instructions)
├── ConfigurationView.tsx                             # server view
└── tests/                                            # actions + PaymentsConfig
apps/book/src/app/admin/configuracion/page.tsx       # thin route → ConfigurationView

apps/book/src/modules/public-booking/
├── dialogs/CalendarStep.tsx                          # NEW month calendar + slots below (replaces the pills)
├── dialogs/PaymentStep.tsx                           # NEW mandatory advance step (method/amount/reference/upload)
├── dialogs/BookingFlow.tsx                           # dynamic steps + payment payload on confirm
├── utils/uploadProof.ts                              # NEW Supabase Storage upload + mime/size validation
├── utils/types.ts                                    # + requiresAdvance on PublicService
├── utils/schemas.ts                                  # + advancePaymentSchema / proofUrlSchema
├── actions.ts                                        # + listPublicPaymentMethods; bookPublicAppointment carries the advance
├── hooks.ts                                          # + useFetchPaymentMethods / useUploadPaymentProof
└── tests/                                            # CalendarStep, PaymentStep, BookingFlow, actions
apps/book/src/shared/tenancy/tenancy.graphql          # + advance fields on services
apps/book/src/modules/public-booking/...              # PublicService maps the rule

apps/book/src/modules/services/
├── services.graphql                                  # + advance fields on MyService + create/update inputs
├── actions.ts                                        # map advance rule
├── utils/schemas.ts                                  # + advance rule validation
├── components/ServiceCatalog.tsx                     # + "Requiere adelanto" (kind + value)
└── tests/                                            # actions + ServiceCatalog

apps/book/src/modules/agenda/
├── agenda.graphql                                    # + payment/notifications + MyAppointments/MyAppointment/RescheduleAppointment
├── AgendaView.tsx                                    # ranged (from/to) server read
├── components/Agenda.tsx                             # desde/hasta inputs + accept/reject/reschedule + detail payment
├── actions.ts                                        # ranged read, reschedule, apiRequestAdmin for controls, map payment/notifications
├── hooks.ts                                          # + useRescheduleAppointment
├── utils/schemas.ts                                  # reschedule (already) + range schema
├── tests/                                            # Agenda, actions
apps/book/src/app/admin/agenda/page.tsx              # + searchParams (from/to)

apps/book/codegen.schema.gql                          # versioned SDL snapshot (from API 016)
apps/book/src/shared/api/generated.ts                 # regenerated
apps/book/README.md                                   # + payments/calendar/agenda documentation
```

**Structure Decision**: Canonical module data layer per constitution §5.VI. The payment-method configuration gets its own `configuration` module (the route exists and is broader than payments); the public booking flow and the agenda are extended in place; the services module carries the advance rule. The Supabase Storage upload is a client utility invoked through a `public-booking` hook.

## Complexity Tracking

> Not required: Constitution Check passes with no violations.
