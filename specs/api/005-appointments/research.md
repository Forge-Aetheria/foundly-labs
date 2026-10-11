# Research: Foundly API — Appointments & Bookings GraphQL Module

**Feature**: `specs/api/005-appointments/` | **Date**: 2026-10-11

## Decision 1: Module layout and seam reuse

- **Decision**: one module `apps/api/src/modules/appointments/` (types/service/resolver/module/specs)
  importing `SharedPrismaModule` and reusing `tenant-scope` helpers and error codes (`VALIDATION_ERROR`,
  `NOT_FOUND`, `CONFLICT`) from `003`/`004`.
- **Rationale**: consistent with the modular standard and the DB-free/deterministic test posture.
- **Alternatives considered**: extending the tenants module — rejected (appointments are a distinct aggregate).

## Decision 2: Cancellation reason storage (additive schema change)

- **Decision**: add `cancellationReason String?` to the `Appointment` model (nullable), regenerate the
  Prisma client. `cancelAppointment` writes the optional reason there.
- **Rationale**: the spec requires "registro de motivo opcional"; a dedicated nullable column keeps the
  general `notes` and the cancellation reason separate and is safe (the schema is young, no live data).
- **Alternatives considered**: reusing `notes` for the reason — rejected (conflates two intents and makes
  cancellation audits ambiguous); a separate `AppointmentCancellation` table — rejected (overkill now).

## Decision 3: Status vocabulary and allowed transitions

- **Decision**: canonical uppercase statuses `PENDING`, `CONFIRMED`, `CANCELLED`, `COMPLETED`; input is
  normalized to uppercase (case-insensitive). Allowed transitions map:
  `PENDING → {CONFIRMED, CANCELLED, COMPLETED}`, `CONFIRMED → {CANCELLED, COMPLETED}`,
  `CANCELLED → {}` (terminal), `COMPLETED → {}` (terminal). `updateAppointmentStatus` follows the map;
  `cancelAppointment` is allowed from `PENDING`/`CONFIRMED`.
- **Rationale**: unambiguous lifecycle and a single source of truth for valid transitions; invalid value or
  disallowed transition → `VALIDATION_ERROR`.
- **Alternatives considered**: free-form status writes — rejected (violates a verifiable lifecycle);
  a `status` enum in the DB — deferred (string column keeps migrations additive for now).

## Decision 4: Overlap rule

- **Decision**: `createAppointment` rejects when an existing **non-cancelled** appointment of the same
  specialist and tenant intersects `[startAt, endAt)` — query
  `appointment.findMany({ where: { tenantId, specialistId, startAt: { lt: endAt }, endAt: { gt: startAt }, status: { not: 'CANCELLED' } } })`; any row → error `CONFLICT`.
- **Rationale**: matches the spec's no-solapamiento requirement and the edge case "nothing is persisted".
- **Alternatives considered**: ignoring cancelled appointments on other statuses — rejected (cancelled
  slots are free again); buffer-time overlaps — deferred (buffer is out of this feature's scope).

## Decision 5: Service/specialist validation on create

- **Decision**: before creating, resolve the service and specialist; both must exist and belong to the
  resolved tenant (cross-tenant or missing → `NOT_FOUND`). The applied snapshot
  (duration/amount/currency) is derived from the service; `origin` defaults to `online`.
- **Rationale**: satisfies FR-004/FR-005 and reuses the snapshot fields already in the model.
- **Alternatives considered**: trusting client-supplied snapshot values — rejected (snapshot should come
  from the catalog to stay consistent).

## Decision 6: GraphQL date surfaces

- **Decision**: output `startAt`/`endAt` as `GraphQLISODateTime`; create input uses ISO-8601 strings
  (`startAt`/`endAt`) parsed to `Date` with `endAt > startAt` validation; agenda filters `startDate`/
  `endDate` are inclusive ISO strings applied over `startAt`.
- **Rationale**: standard, explicit; inclusive boundary semantics are deterministic.
- **Alternatives considered**: epoch numbers — rejected (less readable); exclusive bounds — rejected
  (spec Assumption states inclusive).

## Decision 7: Agenda read semantics

- **Decision**: `appointments` filters AND-combined: `tenantId` (or `tenantSlug` resolved before the
  query), `startAt >= startDate`, `startAt <= endDate`, `specialistId`, normalized `status`; unknown
  slug → `[]`. `appointment(id)` returns the record or `null`.
- **Rationale**: matches the spec filter list and the empty-on-unknown read convention.
- **Alternatives considered**: OR filters — rejected (undefined; AND is least surprising).

## Decision 8: DB-free tests

- **Decision**: unit specs per flow (create success + overlap `CONFLICT`, missing/cross-tenant targets
  `NOT_FOUND`, invalid range/status `VALIDATION_ERROR`, status map, cancel with/without reason), and
  resolver e2e specs over `POST /graphql` with a stubbed `PrismaService`. The `Appointment` row shape is
  emulated by the fake including the new `cancellationReason` and the `service`/`specialist` refs.
- **Rationale**: keeps gates DB-free and deterministic; the fake mirrors the final model.
- **Alternatives considered**: live Postgres in tests — rejected (same posture as `003`/`004`).

## Risks

- Schema regeneration ripple on generated types — additive field only; regenerate in the same change set.
- Overlap query semantics must mirror the fake exactly — documented in the contract.
- GraphQL type-name collisions — mitigated by local ref type names (`AppointmentService`,
  `AppointmentSpecialist`).
