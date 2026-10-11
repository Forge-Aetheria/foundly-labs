# Research: Foundly API — DB-First Core Data & GraphQL Domain

**Feature**: `specs/api/003-db-first-graphql-core/` | **Date**: 2026-10-11

## Decision 1: First domain module = Tenants (aggregate root)

- **Decision**: build the first module around **Tenants** (`apps/api/src/modules/tenants/`); it exposes
  the anchor business (queries by list and by public slug), its public profile and its services, plus
  one initial creation mutation (`createTenant` creating the business + its public profile).
- **Rationale**: the spec allows `Tenants` or `Services`; Tenant is the root aggregate everything else
  (profile, services, specialists, availability, appointments, gallery) hangs from, so it unlocks the
  sequential modules with the least rework.
- **Alternatives considered**: `Services` first — rejected (services have no meaning without a tenant;
  a tenant module supersets the useful reads).

## Decision 2: Schema evolution — entity naming and fields

- **Decision**: evolve the ratified base schema so the seven booking entities are named/typed per the
  spec: `Profile` → **`BusinessProfile`** (gains `slug`, `logo`, `brandColors`, socials, `policies`),
  `Staff` → **`Specialist`** (canonical professional; cross-appointment references use `specialist`),
  `Gallery` → **`GalleryPhoto`** (categorized portfolio photos), keeping `Tenant`, `Service`,
  `Availability` and `Appointment` (extended where needed).
- **Rationale**: the feature description fixes these names and fields; the DB model should mirror them
  for 1:1 mapping with `apps/book` surfaces.
- **Alternatives considered**: keep 002 names (`Profile`, `Staff`, `Gallery`) — rejected (stale naming
  vs. the requested booking model; rename now while the schema is young).

## Decision 3: Public slug lives on BusinessProfile

- **Decision**: move the public, unique **`slug`** to `BusinessProfile` (the "public identity");
  `Tenant` keeps operational data (name, category, status, timezone, currency) and a programmatic
  identity, no public slug.
- **Rationale**: the spec (FR-003) defines BusinessProfile as "información pública, colores, logo,
  redes, **slug** y políticas" — the public façade owns the public identifier; resolving a public
  business means resolving by `BusinessProfile.slug`.
- **Alternatives considered**: keep `slug` on Tenant (002 shape) — rejected (fights the requested
  model and pushes public URL identity into an operational row).
- **Risk**: `apps/book`'s in-memory seam resolves by `tenant.slug`; mapped later through
  `BusinessProfile.slug` when the backend surface is wired to book.

## Decision 4: Specialist↔Service as an explicit relational join

- **Decision**: an explicit **`SpecialistService`** join model (specialistId, serviceId) models "which
  services a professional can perform" instead of the `String[]` scalar list from 002.
- **Rationale**: relational integrity (referential FK, no dangling ids), native filtering in queries,
  and the spec's "relación con servicios" requirement.
- **Alternatives considered**: keep `serviceIds String[]` — rejected (no FK integrity, poor querying);
  implicit Prisma m-n — rejected (less explicit for join-specific data later).

## Decision 5: Testing without a live database

- **Decision**: `apps/api` wraps the shared client in an injectable **`PrismaService`**
  (`apps/api/src/shared/prisma/`). Unit specs override it with an in-memory fake; one GraphQL e2e spec
  (supertest over `POST /graphql`) runs with the mocked provider so both read and write flows are
  covered DB-free.
- **Rationale**: the established gates must stay green without a running Postgres; mocking at the
  Prisma seam isolates the resolver/service logic and keeps CI deterministic.
- **Alternatives considered**: real Postgres (docker) in tests — rejected (adds infra requirement and
  flakiness); testing only schema sanity (002) — rejected (no coverage of this feature's logic).

## Decision 6: API module layout

- **Decision**: `apps/api/src/modules/<modulo>/` holds each domain module (resolver/service/types/
  specs); cross-cutting data access lives in `apps/api/src/shared/prisma/` (`PrismaModule` +
  `PrismaService`), registered once in `AppModule`.
- **Rationale**: matches the "estructura modular estándar" requested, mirrors the monorepo
  `modules/` + `shared/` convention (constitution §7), and keeps the GraphQL layer testable.
- **Alternatives considered**: a single giant root provider — rejected (no module isolation for the
  scheduled sequential modules).

## Decision 7: Query/mutation surface (code-first GraphQL)

- **Decision**: `Tenant` object type exposes `slug`-resolvable identity + `profile` + `services`;
  queries `tenants` (list) and `tenant(slug)` (single); mutation `createTenant(input)` persists
  tenant+profile in a transaction (`$transaction`) and returns the created aggregate.
- **Rationale**: satisfies FR-010/FR-011 with the minimal useful surface; code-first types compile
  from decorators into `schema.gql`.
- **Alternatives considered**: SDL-first — rejected (002 already adopted code-first); full per-entity
  CRUD — rejected (exceeds this feature's scope; deferred).
- **Edge posture**: create rejects a duplicate slug with a GraphQL error (`CONFLICT`-style code);
  missing relations resolve to null/empty; stays DB-free in the agreed tests.

## Risks

- Renaming models/relations ripples through generated types and any API usage — mitigated by doing it
  in the same change set as the generated client regeneration.
- `PrismaService` mocks must track the nested-create behaviour (tenant+profile in one transaction) —
  documented in the contracts so tasks implement the fake faithfully.
- `schema.gql` is regenerated by code-first; it must be kept ephemeral/git-ignored consistent with 002.
- Moving the public slug affects `apps/book` integration later — **mapping note**: public business
  resolution now targets `BusinessProfile.slug` (GraphQL `tenant(slug)`), which maps to `apps/book`'s
  `getPublicBusiness(slug)` / `Tenant.slug` when the backend surface is wired to book; not blocked in
  this feature.
