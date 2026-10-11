# Feature Specification: Foundly API — DB-First Core Data & GraphQL Domain

**Feature Branch**: `003-db-first-graphql-core`

**Created**: 2026-10-11

**Status**: Draft

**Input**: User description: "Atención: Vamos a iniciar la implementación de la capa de datos y lógica de negocio en el backend (`apps/api` y `@foundly/database`) bajo el enfoque DB-First. Objetivo: (1) Definición del Schema de Prisma (`packages/database/prisma/schema.prisma`): diseñar y configurar los modelos relacionales esenciales para el SaaS de reservas — `Tenant`, `BusinessProfile`, `Service`, `Staff`/`Specialist`, `Availability`, `Appointment`, `GalleryPhoto` — y ejecutar la generación del cliente Prisma. (2) Módulo Core GraphQL en `apps/api`: crear el primer módulo de dominio (ej. `Tenants` o `Services`) en `apps/api/src/modules/` siguiendo la estructura modular estándar e implementar el primer `Resolver` y `Service` conectado con el cliente de Prisma para exponer consultas (Queries) y mutaciones (Mutations) iniciales a través de GraphQL, con sus pruebas unitarias/integración. (3) Verificación de Gates: `npm run build`, typecheck (`tsc --noEmit`) y tests del monorepo."

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Define the reservation data model (Priority: P1)

As a backend developer, I want a single shared data model for the booking SaaS that covers the business, its catalog, professionals, schedules, appointments and gallery, so that every backend service reads and writes the same entities.

**Why this priority**: Every query, mutation and future feature depends on having the booking domain represented in one place; without it nothing can be persisted consistently.

**Independent Test**: Inspect the shared schema and confirm the seven booking entities exist with their essential fields and relationships; validate that the generated data-access client is produced by the package build and resolves in `apps/api`.

**Acceptance Scenarios**:

1. **Given** the shared data layer, **When** the schema is inspected, **Then** it defines the seven booking entities (Tenant, BusinessProfile, Service, Staff/Specialist, Availability, Appointment, GalleryPhoto) with their relationships.
2. **Given** the business identity, **When** a business is represented, **Then** its public slug is unique and its public profile (branding, colors, logo, socials, slug, policies) belongs to it.
3. **Given** the generated data-access client, **When** the database package builds, **Then** the client is produced and importable by the API without errors.

---

### User Story 2 - Expose the first domain module over GraphQL (Priority: P2)

As a backend consumer, I want to retrieve and initially create the core business entity (a tenant and its public profile) through the API's GraphQL service, so that client applications can onboard a business and read its catalog foundation.

**Why this priority**: The tenant is the aggregate root that anchors profile, services, staff, schedules, appointments and gallery; exposing it first unlocks sequential modules.

**Independent Test**: Start the API, query the anchor business entity (and its public profile), run an initial creation flow, and verify the returned payloads; resolver/service tests pass.

**Acceptance Scenarios**:

1. **Given** the API, **When** a consumer queries the anchor entity, **Then** it returns the persisted business data (identity + public profile) or an empty result when none exists.
2. **Given** the API, **When** a consumer submits the initial creation flow, **Then** the data is persisted and the resource is returned with its generated identifier.
3. **Given** the domain module, **When** the GraphQL service is introspected, **Then** the new queries and mutations appear in the schema contract.

---

### User Story 3 - Keep the workspace gates green (Priority: P3)

As a maintainer, I want the API, the shared data package and the rest of the workspace to keep building, type-checking and testing correctly after these changes.

**Why this priority**: A green workspace is the acceptance gate for shipping the new data layer and domain module safely.

**Independent Test**: Run the API and data-package build, typecheck and test commands, and confirm the existing workspaces show no regressions.

**Acceptance Scenarios**:

1. **Given** the API workspace, **When** `build` and `typecheck` run, **Then** they complete successfully.
2. **Given** the API workspace, **When** the automated test suite runs, **Then** it passes, including unit and integration coverage for the new domain module.
3. **Given** the data package, **When** its build, typecheck and tests run, **Then** they pass.
4. **Given** the whole workspace, **When** existing apps and packages are built and tested, **Then** there are no regressions.

---

### Edge Cases

- **Missing relations**: When a business record references optional data (profile, staff, services) that does not exist, reads return null/empty instead of failing.
- **Duplicate identifiers**: Creating a business with a slug that already exists is rejected with a clear, machine-readable error; the existing value is preserved.
- **Empty environment**: With no live or seeded data, read flows return empty collections and the API does not crash.
- **Entity naming variants**: The professional entity has a single canonical representation (Staff/Specialist) so consumers are not confused by duplicate names.
- **Invalid attribute values**: Mutations reject incomplete or out-of-range values (e.g., missing required fields, invalid weekday, non-positive duration/price) before persisting.
- **Client regeneration**: Regenerating the data-access client is reproducible and does not require a running database.
- **Malformed requests**: A query referencing a missing field or entity fails with a GraphQL validation/serving error, not a server crash.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: The shared data layer MUST represent the seven booking entities — Tenant, BusinessProfile, Service, Staff/Specialist, Availability, Appointment, GalleryPhoto — with their essential attributes and relationships.
- **FR-002**: The system MUST keep a business's public slug unique across all businesses.
- **FR-003**: The system MUST associate each business with exactly one public profile that carries its branding (logo/cover, brand colors), socials/contact, public slug and booking/cancellation policies.
- **FR-004**: The system MUST model each service offered by a business with its name, description, price, duration, buffer, category and active state, linked to its business.
- **FR-005**: The system MUST model each professional (staff/specialist) with name, role, biography, avatar, the services they can perform and an active state, linked to a business.
- **FR-006**: The system MUST model weekly availability as per-day schedules (weekday, start/end time, slot granularity) scoped to a business and optionally to a professional.
- **FR-007**: The system MUST model each appointment with its business, service, professional, client identity/contact, start/end time, status and the applied snapshot (duration, amount, currency, origin).
- **FR-008**: The system MUST model gallery photos scoped to a business with their URL, title, description, display category and ordering.
- **FR-009**: The data-access client generated from the schema MUST be reproducible from the package build and importable by the API.
- **FR-010**: The API MUST expose a domain module for the anchor business entity with read queries (the business with its public profile; the services belonging to it).
- **FR-011**: The API MUST expose an initial creation mutation for the anchor business (and its public profile) that persists the data and returns the created resource and its identifier.
- **FR-012**: The reads and writes MUST be wired through the shared data-access client so that both flows exercise the same persistence seam.
- **FR-013**: The API MUST include automated unit/integration coverage for at least one read flow and one write flow of the new module.
- **FR-014**: All gates MUST pass for the API and the data package (`build`, `typecheck`, `test`) with no regressions in the existing workspace.

### Key Entities _(include if feature involves data)_

- **Tenant**: The business identity (name, category, status, timezone, currency); the root aggregate that owns profile, services, staff, schedules, appointments and gallery.
- **BusinessProfile**: The public face of a business — branding (logo/cover, brand colors), contact/socials, public slug and booking/cancellation policies — owned by one Tenant.
- **Service**: A bookable offering (name, description, price, duration, buffer, category, active) owned by a Tenant.
- **Staff / Specialist**: A professional (name, role, bio, avatar, assigned services, active) owned by a Tenant.
- **Availability**: Weekly working schedule entries (weekday, start/end time, granularity, lead time/horizon) scoped to a Tenant and optionally a Staff member.
- **Appointment**: A booked occurrence referencing a Tenant, Service, Staff member, client identity/contact, start/end time and status, with an applied snapshot of duration, amount, currency and origin.
- **GalleryPhoto**: A portfolio/location photo (URL, title, description, category, order) owned by a Tenant.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: The shared data model defines the seven booking entities and their relationships, and its generated data-access client is produced by the package build without errors.
- **SC-002**: The API's GraphQL service answers at least one read query and one initial write flow for the anchor business entity with the correct payloads (HTTP 200, expected data shape).
- **SC-003**: The automated checks pass for the API and the data package — build, typecheck and test — and the full workspace shows no regressions.
- **SC-004**: The new queries and mutations appear in the GraphQL schema contract and are introspectable by clients.
- **SC-005**: The new module has automated unit and integration coverage for a read path and a write path, all green.

## Assumptions

- **Anchor module = Tenants**: the description allows `Tenants` or `Services` as the first domain module; `Tenants` is chosen because it is the aggregate root that the other entities anchor to, unlocking sequential modules (services, staff, appointments…) in later `/specs/api/` features.
- **CRUD scope**: the first module ships read queries plus an initial creation mutation for the anchor business and its public profile; update/delete flows and per-entity CRUD for the remaining entities land in later features.
- **Data/model evolution**: the schema refines the ratified DB-First entities (naming per the description, e.g., BusinessProfile carrying slug, branding and policies, gallery photos with categories) without introducing a new persistence technology; per `specs/architecture.md`, storage stays **Prisma + PostgreSQL** via `@foundly/database`.
- **No production migration/seeding**: this feature covers model definition and the generated client for a development sandbox; migrations against live data are out of scope.
- **Surface posture**: the GraphQL surface follows the current development posture (playground/introspection in non-production only); tenant-level authentication/authorization is not introduced by this feature and arrives with a later auth seam.
- **Alignment with the booking domain**: entities map 1:1 to the aggregates already designed in `apps/book` (tenancy, services, staff, appointments, availability, gallery, profile) so future backend features map cleanly.
- **This spec respects `specs/business-model.md`** (services/tariffs and the ecosystem's value proposition are the source of the Service/Appointment pricing fields) and the hierarchy of `constitution.md`; per SDD it precedes any implementation of the data layer.
