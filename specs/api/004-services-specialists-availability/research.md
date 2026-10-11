# Research: Foundly API — GraphQL Modules for Services, Specialists & Availability

**Feature**: `specs/api/004-services-specialists-availability/` | **Date**: 2026-10-11

## Decision 1: Module layout and shared seam

- **Decision**: three modules under `apps/api/src/modules/` — `services/`, `specialists/`,
  `availability/` — each with its own `*.module.ts`, `*.types.ts`, `*.service.ts`, `*.resolver.ts`
  and specs, all importing the existing global `SharedPrismaModule` (`apps/api/src/shared/prisma/`).
- **Rationale**: mirrors the "estructura modular estándar" requested and the 003 convention; the Prisma
  seam is already injectable/mockable, so modules stay thin and testable.
- **Alternatives considered**: one combined "catalog" module — rejected (three distinct aggregates with
  separate lifetimes; independent modules keep tests and tasks decoupled).

## Decision 2: Tenant scoping (tenantId / tenantSlug)

- **Decision**: read operations accept `tenantId` OR `tenantSlug` (at least one). `tenantSlug` resolves
  through `businessProfile.findUnique({ where: { slug }, include: { tenant: true } })` (the public
  identity rule from `003`); 404/unknown targets yield empty lists (no error); pointing to a target from
  another tenant's write context is validated by the row's `tenantId`.
- **Rationale**: symmetric with the 003 tenants module and the spec's filter requirements; empty-on-unknown
  keeps reads cheap and avoids leaking existence.
- **Alternatives considered**: error on unknown slug — rejected (empty-list semantics are the established
  read behaviour in 003).

## Decision 3: Type ownership (avoid circular GraphQL types)

- **Decision**: each module declares its own object/input types locally. Cross-reference data (a
  service's specialists, a specialist's services) is exposed through local ref types
  (`SpecialistRefObject { id name }`, `ServiceRefObject { id name }`) declared in the producing module;
  modules do not import types from sibling modules.
- **Rationale**: `ServiceObject`/`SpecialistObject` reference each other for both-direction assignment
  reads; local ref types keep the type graph acyclic and each module independently unit-testable.
- **Alternatives considered**: central shared `catalog.types.ts` — rejected (would touch 003's
  `tenants.types.ts`/`ServiceObject` and couple modules); importing sibling modules' full types —
  rejected (creates module-to-module coupling and potential cycles).

## Decision 4: Service filters

- **Decision**: `services(tenantId?/tenantSlug?, category?, minDuration?, maxDuration?)` — category is an
  exact match when provided; duration is a range over `durationMinutes` (min/max inclusive); combined
  filters apply as AND; omitted filters are ignored.
- **Rationale**: the spec asks for category/duration filters; exact + range is the least ambiguous reading.
- **Alternatives considered**: prefix/substring category matching — rejected (ambiguous, arbitrary);
  sorting/limit — deferred (not requested).

## Decision 5: Assignments and removal hygiene

- **Decision**: assignments use the `SpecialistService` join model. `assignServiceToSpecialist` creates
  the row (duplicate → unique `P2002` → error code `CONFLICT`); `unassignServiceFromSpecialist` deletes
  the row (absent → `NOT_FOUND`). Removing a service or specialist first `deleteMany()`s its assignment
  rows inside the same transaction as the delete, so no orphans remain.
- **Rationale**: keeps referential integrity and satisfies FR-005/FR-008/FR-012.
- **Alternatives considered**: leaving orphaned joins — rejected (breaks both-direction reads and the
  edge-case "no orphans" requirement).

## Decision 6: Availability model

- **Decision**: `AvailabilityObject { id, tenantId, specialistId?, weekday, startTime, endTime,
slotGranularityMinutes, minLeadTimeMinutes, bookingHorizonDays, breaks? }`; reads accept
  `tenantId/tenantSlug` and optional `specialistId`; writes are `createAvailability`,
  `updateAvailability` and `removeAvailability`. Validation: `weekday ∈ 0..6`, `HH:mm` start/end,
  `endTime > startTime` (lexical on `HH:mm`), granularity/lead/horizon ≥ 0.
- **Rationale**: the schema already models business-wide (specialistId null) and per-specialist entries;
  create/update/remove matches the spec's "consulta y configuración".
- **Alternatives considered**: single upsert keyed on (weekday, specialistId) — rejected (opaque to
  clients; explicit id-based create/update/remove is clearer and matches CRUD elsewhere).

## Decision 7: Error conventions

- **Decision**: reuse the 003 codes — `VALIDATION_ERROR` (bad input), `NOT_FOUND` (write target
  missing, unassign of absent), `CONFLICT` (duplicate assignment / slug taken) — as GraphQL
  `extensions.code`; successful writes return the affected resource(s).
- **Rationale**: clients already branch on these codes from 003; consistency reduces integration cost.
- **Alternatives considered**: new bespoke codes — rejected (no new error kinds are introduced).

## Decision 8: DB-free test strategy

- **Decision**: each module ships a unit spec (mocked `PrismaService` fake with `findMany`, `findUnique`,
  `create`, `update`, `delete`, `deleteMany`, `$transaction`) and a resolver e2e spec (`POST /graphql`
  against `AppModule` with the fake overridden). The swc/vitest setup from 003 already emits decorator
  metadata, so DI and `@Args`/`@Input` wiring work.
- **Rationale**: keeps the established DB-free, deterministic suite; the join transactions are emulated
  by the fake faithfully.
- **Alternatives considered**: real Postgres in CI — rejected (infra + flakiness, contradicts 003 posture).

## Risks

- Cross-module GraphQL types must stay acyclic — mitigated by local ref types (Decision 3).
- `PrismaService` fakes must emulate filter + join + transaction semantics — documented per contract so
  task implementers mirror them.
- Regenerated `schema.gql` stays ephemeral/git-ignored (already configured).
- Removing a service/specialist must clean joins atomically — covered by a transaction in the service
  and by e2e removal tests.
