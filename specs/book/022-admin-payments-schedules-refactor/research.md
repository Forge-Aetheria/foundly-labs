# Research: Foundly Book — Admin Payments & Schedules Redesign

**Feature**: `specs/book/022-admin-payments-schedules-refactor/` | **Date**: 2026-10-14

## Prior art in the codebase

- `apps/book/src/modules/configuration/` already owns the `/admin/configuracion` payments editor (three fixed cards with a free-form `details` + `instructions` and a single `Switch`). Feature `017`/`api-016` introduced it; the `PaymentMethod` type lives in `apps/book/src/shared/types/payments.ts`.
- `apps/book/src/modules/availability/` owns `/admin/availability`: a weekly editor + a time-block card, backed by `specs/api/014-availability-time-blocks`. The current weekly editor renders a `Chip` toggle and unused "break" inputs (never persisted).
- The API `payments` module (`apps/api/src/modules/payments/`) persists one method per `(tenantId, type)` with `type`, `label`, `details`, `instructions`, `active`. The GraphQL SDL is snapshotted to `apps/book/codegen.schema.gql` and the generated types to `shared/api/generated.ts` (not versioned).

## Decisions

1. **Five closed types** — `pago_movil`, `binance`, `zelle`, `transfer`, `cash` — replace the old `mobile_payment`/`bank_transfer` and keep `binance`. The value set lives in the API enum (`specs/api/016`) and in the book `PaymentMethodType`.
2. **`title` instead of `label`** on the API surface (GraphQL object + input); the underlying Prisma column stays `label` and is mapped in `payments.store.ts`, so no DB column rename is needed.
3. **Structured `details` as JSON text**: the receiving data is a `PaymentMethodDetails` object (`holder`, `cedula`, `phone`, `bank`, `payId`, `email`, `account`) serialized to the existing `details` string column (`JSON.stringify`) and parsed on read (legacy free-form text degrades to `{ account: text }`). No JSON scalar/column.
4. **Card + modal UX** (`PaymentsConfig`): a card per configured method (title, type, summary, badge, Editar/toggle/Eliminar) and a create/edit `Modal` whose type selector drives the visible structured fields (`PAYMENT_TYPE_FIELDS`). Only unconfigured types are offered when creating; editing locks the type; the create CTA is disabled when all five exist.
5. **Schedule redesign** (`AvailabilityEditor`): weekly rows with a `Switch` per weekday (Monday-first) + start/end `type="time"` inputs and a "Guardar horario semanal" button; a blocks card with a selectable "Rango de horas"/"Días completos" chip pair. Full-day blocks are sent as `00:00–23:59`, so no backend change is needed.
6. **Testing** mirrors existing module tests (RTL + hooks mocked; action tests with the transport mocked); a11y asserted with `vitest-axe`.

## Risks

- **DB enum migration**: renaming enum values requires a backend migration (`mobile_payment → pago_movil`, `bank_transfer → transfer`, add `zelle`/`cash`) and a Prisma client regeneration; until then the API build fails on the stale generated client (documented, out of scope for the book gates).
- **Legacy data**: appointments referencing old enum values must be migrated with the enum. The book parser tolerates legacy free-form `details`.
- **Generated types**: `apps/book/src/shared/api/generated.ts` is produced by codegen from the SDL snapshot; the snapshot must be edited first (done) and codegen re-run.
