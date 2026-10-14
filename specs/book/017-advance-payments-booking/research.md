# Phase 0 — Research: Foundly Book — Advance Payments, Booking Calendar & Agenda Control

**Feature**: `specs/book/017-advance-payments-booking` · **Date**: 2026-10-13

All Technical Context unknowns are resolved below (no `NEEDS CLARIFICATION` remained).

## R1 — Configuration module owns the payment-method editor

- **Decision**: Add a new `modules/configuration/` module (`configuration.graphql`, `actions.ts`, `hooks.ts`, `utils/schemas.ts`, `components/PaymentsConfig.tsx`, server `ConfigurationView.tsx`) and turn `app/admin/configuracion/page.tsx` into a thin route rendering it. It consumes the API `016` `myPaymentMethods`/`upsertPaymentMethod`/`deletePaymentMethod`.
- **Rationale**: `/admin/configuracion` already exists as a `PlaceholderPanel` and is a Configuration surface (broader than payments); a dedicated module keeps the data layer canonical (§5.VI) and leaves room for future settings.
- **Alternatives considered**: Put it in `modules/payments` — rejected (route is "Configuración", not only payments). Extend `shared/` — rejected (§5.VI forbids domain logic outside modules).

## R2 — Three fixed method cards with a free-form details/instructions fields

- **Decision**: Render exactly three cards (Pago Móvil, Transferencia, Binance) driven by `PaymentMethodType`; each has an `active` `Switch`, a `details` multi-line field and an `instructions` multi-line field, plus a single "Guardar" that upserts every changed method. Labels/hints are per type.
- **Rationale**: The type set is closed (spec FR-001); free-form details match the API `016` model and the spec assumptions.
- **Alternatives considered**: A dynamic "add method" list — rejected (the closed set is fixed and simpler to operate).

## R3 — Real month calendar built with `@foundly/ui` tokens

- **Decision**: Replace `SlotStep`'s fixed 7-day pills with a new client `dialogs/CalendarStep.tsx`: a 6×7 month grid with previous/next month navigation, today highlighted, days with no availability disabled, and the selected day's slots rendered below. It calls `fetchOfferedSlots` once per visible month (`startDate` = first visible day, `endDate` = last visible day) and derives day availability from the returned `SlotDay[]`.
- **Rationale**: The spec (FR-005) requires a real interactive calendar reflecting persisted availability; `computeAvailability` already accepts an arbitrary inclusive range, so a month fetch is a natural extension of the existing action. `packages/ui` has no Calendar/DatePicker (verified), so it is built from `Card`/`Button`/`Typography`/tokens with no new dependency.
- **Alternatives considered**: Add MUI `DateCalendar` — rejected (the repo uses `@foundly/ui`, not MUI React components directly). One request per day — rejected (chatty).

## R4 — Advance step inserted dynamically into the booking flow

- **Decision**: `BookingFlow` composes its step list from `service.requiresAdvance`: when true it inserts a **payment** step between "Tus datos" and "Confirmación" (labels become Especialista · Fecha y hora · Tus datos · Adelanto · Confirmación). The `PaymentStep` collects the active method (fetched via `listPublicPaymentMethods`), amount, reference and proof; confirmation stays blocked until complete. `bookPublicAppointment` sends the payment payload.
- **Rationale**: FR-006/FR-007; a dynamic step keeps the non-advance flow unchanged (FR: no step when not required) and the mandate server-enforced too.
- **Alternatives considered**: Always show the step disabled — rejected (spec US3.1: no step for non-advance services).

## R5 — Proof upload via Supabase Storage (browser client)

- **Decision**: Add `modules/public-booking/utils/uploadProof.ts` exposing `uploadPaymentProof(file)` using the browser Supabase client (`createBrowserSupabaseClient`) to upload to a **public** bucket `payment-proofs` under a `payment-proofs/<tenantSlug>/<uuid>.<ext>` path, returning the public URL. It validates mime (`image/png|jpeg|webp`) and size (≤ 5 MB) before uploading. Exposed to the UI through `hooks.ts` (`useUploadPaymentProof`). The server action re-validates the proof URL shape.
- **Rationale**: `@supabase/ssr`/`supabase-js` are already dependencies and Supabase is the existing auth provider; client-side uploads avoid shipping a service-role key to the API (which has no storage integration). UUID object names keep public URLs unguessable.
- **Privacy note / follow-up**: a public bucket is the pragmatic v1 (spec delivers a preview/link); hardening to a private bucket + signed URLs is recorded as a follow-up, not in scope. The bucket and its policies are an operations step documented in `quickstart.md` and `README.md`.
- **Alternatives considered**: Upload through `apps/api` (multipart) — rejected (new storage dependency + credentials). Paste an image URL — rejected by the resolved spec (CL-001).

## R6 — Agenda range via `searchParams` (server-first) with default month

- **Decision**: `app/admin/agenda/page.tsx` receives `searchParams` (`from`/`to`); `AgendaView` defaults `from` = today and `to` = the last day of the current month (UTC), then calls `listAgenda({from,to})` through the new authenticated `myAppointments`. The `Agenda` client component renders two `type="date"` fields and, on apply, pushes `/admin/agenda?from=…&to=…`; the server re-renders with the new range. Invalid ranges (`to < from`) are corrected inline before navigating.
- **Rationale**: FR-009; keeps the range read on the server (Server-First) while the inputs are interactive; replaces the seven per-day buttons.
- **Alternatives considered**: Client-side fetch of a range — rejected (a read, not a mutation; §5.VI/§5.II favor server reads).

## R7 — Status controls + reschedule + notifications

- **Decision**: In `Agenda.tsx`, the detail modal gains **Aceptar** (→ Confirmed), **Rechazar** (→ Cancelled, with a reason) and **Reagendar** (date/time modal) actions. Accept/reject use `useChangeAppointmentStatus`/`useCancelAppointment`; reschedule uses the new `useRescheduleAppointment`. All run through `useAsyncAction` (pending/disable), show toasts, close/refresh, and surface conflicts inline. The API records the client notification.
- **Rationale**: FR-010; the hooks already exist for status/cancel and `rescheduleAppointmentSchema`/`lifecycle.ts` exist as scaffolding — this feature finally wires them.
- **Alternatives considered**: One combined modal — rejected (clear single-purpose actions, per spec US5).

## R8 — Appointment detail shows the advance payment with a link fallback

- **Decision**: When the appointment carries a payment, the detail modal renders a "Adelanto" section: method label, amount (formatted), reference and the proof as an `<img>` preview with an `onError` fallback (a labelled link) and an always-visible "Abrir comprobante" link. Non-advance appointments render no section.
- **Rationale**: FR-011 + edge case "proof cannot be rendered → link/fallback".
- **Alternatives considered**: Link only — rejected (the spec asks for a preview).

## R9 — Advance rule in the service catalog

- **Decision**: Extend `ServiceCatalog`'s create/edit modal with a "Requiere adelanto" `Switch`; when enabled, a kind selector (Importe fijo / Porcentaje) and a value field. Extend `serviceSchema`, `mapMyService` and `services.graphql` accordingly; show a badge in the table.
- **Rationale**: FR-004; the admin must be able to define the rule that drives the public step.
- **Alternatives considered**: Configure the rule elsewhere — rejected (it is a service attribute).

## R10 — Accessibility

- **Decision**: The calendar is a labelled grid with keyboard-operable day buttons (each with an `aria-label` including availability), month navigation buttons are labelled, the payment step labels every field and the upload input, and destructive/terminal actions use labelled buttons + confirmation. New surfaces pass `vitest-axe` with zero critical violations.
- **Rationale**: Constitution §6, `code-rules.md`; existing tests already run `vitest-axe`.
- **Alternatives considered**: None (non-negotiable).

## R11 — Error surfacing mapping

- **Decision**: Reuse `errorSurface()`/`errorMessage()`: `VALIDATION_ERROR` → inline field errors (+ yellow toast); `CONFLICT` (booking/reschedule) → precise localized inline message; `NOT_FOUND`/transient → red toast and/or `ApiErrorDialog`; `UNAUTHENTICATED` → global session redirect. Upload failures keep the entered data and allow retry.
- **Rationale**: FR/edge cases; centralized error handling with no raw provider text.
- **Alternatives considered**: Inline-only — rejected (semantic toasts are the established pattern from `016`).

## R12 — Codegen & dependency on API `016`

- **Decision**: Sync `apps/book/codegen.schema.gql` from the API `016` SDL and regenerate `generated.ts` before implementing; use only generated documents/types.
- **Rationale**: Constitution §5.VI (codegen-only DTOs); the payments/appointments operations do not exist until `api/016` lands.
- **Alternatives considered**: Hand-written DTOs — forbidden.
