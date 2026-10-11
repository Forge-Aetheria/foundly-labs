# Feature Specification: Foundly API — GraphQL Modules for Services, Specialists & Availability

**Feature Branch**: `004-services-specialists-availability`

**Created**: 2026-10-11

**Status**: Draft

**Input**: User description: "Atención: Vamos a continuar con la siguiente fase del backend (Spec 004): Implementación de Módulos GraphQL para Catálogo de Servicios, Especialistas y Disponibilidad en `apps/api`. Objetivos: (1) Módulo de Servicios (`apps/api/src/modules/services/`): DTOs/Input types, Resolver y Service para CRUD del catálogo de servicios (`Service`), consultas por `tenantId`/`tenantSlug` y filtros por categoría/duración. (2) Módulo de Especialistas/Staff (`apps/api/src/modules/specialists/`): Resolver y Service para gestionar especialistas (`Specialist`), biografía y asignación a servicios (`SpecialistService`). (3) Módulo de Disponibilidad (`apps/api/src/modules/availability/`): Resolver y Service para consulta y configuración de horarios de atención (`Availability`) por negocio/especialista. (4) Pruebas y Quality Gates: pruebas unitarias y e2e (DB-free con mocks de Prisma) para cada resolver/service nuevo, y `npm run test -w @foundly/api` / `npm run build -w @foundly/api`."

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Manage the service catalog (Priority: P1)

As a business operator, I want to add, edit, deactivate and remove the services my business offers, and retrieve them filtered, so that the catalog that feeds the booking flow always reflects reality.

**Why this priority**: The catalog is the backbone of every booking; specialists and availability are only meaningful against a defined set of services.

**Independent Test**: Query the services of a business (scoped by tenant), filter by category and duration, create/update/deactivate/remove a service and read it back — all green DB-free.

**Acceptance Scenarios**:

1. **Given** a business, **When** I query its catalog, **Then** only that business's services are returned.
2. **Given** a catalog, **When** I filter by category and/or duration range, **Then** the returned list matches the filters.
3. **Given** valid catalog data, **When** I create or update a service, **Then** it is persisted and returned with its identifier.
4. **Given** an active service, **When** I deactivate or remove it, **Then** it stops appearing in active catalog reads (or is removed entirely).

---

### User Story 2 - Manage specialists and their services (Priority: P2)

As a business operator, I want to manage my team of professionals (name, role, bio, avatar) and define which services each one performs, so that clients can book the right specialist for the right service.

**Why this priority**: Specialists are the second core booking dimension; service assignment makes the catalog bookable per professional.

**Independent Test**: Create/update/deactivate/remove a specialist, assign and unassign services to them, and read both directions (a specialist's services and which specialists perform a service) — all green DB-free.

**Acceptance Scenarios**:

1. **Given** a business, **When** I manage its specialist records, **Then** only that business's specialists are affected.
2. **Given** a specialist profile, **When** I update the bio/role/avatar, **Then** the public data reflects the change.
3. **Given** a service, **When** I assign a specialist to it, **Then** the assignment is recorded and queryable from both the specialist and the service.
4. **Given** an assignment, **When** I remove it, **Then** the specialist no longer performs that service.

---

### User Story 3 - Configure availability (Priority: P3)

As a business operator, I want to define the weekly schedules (per business and optionally per specialist) that gate when services can be booked, so that the availability engine sees an accurate working calendar.

**Why this priority**: Availability is the constraint that turns the catalog into bookable slots.

**Independent Test**: Read the schedules of a business and of a specific specialist; add, update and delete schedule entries with valid ranges — all green DB-free.

**Acceptance Scenarios**:

1. **Given** a business, **When** I query its schedules, **Then** the entries for that business are returned (business-wide and per specialist).
2. **Given** a schedule entry, **When** valid start/end times and weekday are provided, **Then** it is persisted.
3. **Given** schedules with shared days, **When** I scope by specialist, **Then** only the entries for that specialist (plus business-wide fallback) are returned.
4. **Given** an invalid range, **When** I submit it, **Then** the system rejects it with a clear error and persists nothing.

---

### User Story 4 - Keep the quality gates green (Priority: P3)

As a maintainer, I want every new resolver/service covered by DB-free unit and end-to-end tests, and the workspace gates to stay green.

**Why this priority**: DB-free tests keep CI deterministic without infrastructure; green gates gate the release.

**Acceptance Scenarios**:

1. **Given** each module, **When** its test suite runs, **Then** unit and e2e coverage execute without a live database.
2. **Given** the API, **When** `test`, `typecheck` and `build` run, **Then** they pass.
3. **Given** the workspace, **When** existing apps/packages are built and tested, **Then** there are no regressions.

---

### Edge Cases

- **Unknown tenant/slug**: queries return empty results (service/specialist/availability lists) instead of failing.
- **Missing specialist or service during assignment**: assignment rejects with a clear error and persists nothing.
- **Invalid catalog values**: non-positive duration, negative price/buffer reject with a clear validation error.
- **Invalid schedule ranges**: `endTime` not after `startTime` or weekday outside 0–6 rejects with a clear validation error.
- **Duplicate assignments**: assigning the same service to a specialist twice is idempotent (no error) or rejected explicitly; duplicate assignments do not produce duplicates.
- **Filtering with no matches**: an empty filtered list is returned, not an error.
- **Removed/deactivated items**: removing a service or specialist that still has assignments is handled without orphans (assignments cleaned or rejected with guidance).
- **Empty catalog/schedule**: empty lists return cleanly; writes still validated.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: The system MUST scope service catalog operations to a single business, addressable by its identifier or its public slug.
- **FR-002**: The system MUST list a business's services, optionally filtered by category and/or duration (min/max `durationMinutes`).
- **FR-003**: The system MUST support creating a service with name, description, duration (positive), buffer (non-negative), price (non-negative), currency, category and active state.
- **FR-004**: The system MUST support updating and deactivating a service, and removing a service entirely.
- **FR-005**: The system MUST return a service's details, including the specialists that perform it.
- **FR-006**: The system MUST scope specialist operations to a single business and support creating, updating, deactivating and removing specialists.
- **FR-007**: The system MUST represent a specialist's name, role, biography and avatar.
- **FR-008**: The system MUST support assigning and unassigning a service to/from a specialist, and MUST expose the assignment in both directions (a specialist's services; the specialists of a service).
- **FR-009**: The system MUST support reading all schedule entries of a business and, per specialist, only the entries scoped to that specialist (with business-wide entries available as default).
- **FR-010**: The system MUST support creating/updating schedule entries with weekday (0–6), start/end `HH:mm` (end strictly after start), slot granularity, lead time and booking horizon, scoped to a business and optionally to a specialist.
- **FR-011**: The system MUST support removing a schedule entry.
- **FR-012**: Operation errors MUST be machine-readable: unknown targets yield empty/null results; invalid data, missing assignment targets and removal conflicts yield clear error codes; successful writes return the affected resource(s).
- **FR-013**: Each module MUST include DB-free unit and end-to-end coverage for its read and write flows.
- **FR-014**: The API gates MUST pass: `npm run build -w @foundly/api`, `npm run typecheck -w @foundly/api` and `npm run test -w @foundly/api`, with no regressions in the existing workspace.

### Key Entities _(include if feature involves data)_

- **Service**: bookable offering (name, description, category, duration, buffer, price, currency, active) owned by a Tenant, performed by zero or more Specialists.
- **Specialist**: professional (name, role, bio, avatar, active) owned by a Tenant, performing a subset of the catalog via assignments.
- **SpecialistService**: the assignment linking a Specialist to a Service (composite identity).
- **Availability**: weekly schedule entry (weekday, start/end, granularity, lead time, horizon) owned by a Tenant, optionally scoped to a Specialist.
- **Tenant / BusinessProfile**: scoping root; the public slug resolves the business for catalog/specialist/availability reads.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: A business can query, filter, create, update, deactivate and remove services in a single session without errors, and the catalog read is consistent with the writes.
- **SC-002**: A business can manage specialists and their service assignments and read both directions of the assignment, with no orphaned assignments after removals.
- **SC-003**: A business can read, create, update and remove schedule entries per business and per specialist; invalid ranges are rejected with clear errors and nothing is persisted.
- **SC-004**: Every new module's read and write flows are covered by DB-free unit and e2e tests that execute without infrastructure.
- **SC-005**: The API `build`, `typecheck` and `test` gates pass and the full workspace shows no regressions.

## Assumptions

- **Scoping resolution**: operations accept a business identifier or its public slug; slug resolution follows the established public-identity rule (`BusinessProfile.slug`) from `003-db-first-graphql-core`.
- **CRUD scope**: services/specialists/availability get list + detail + create + update + (de)activate + remove flows; per-entity behaviour follows the reservation model ratified in `003`, no new persistence technology.
- **Filters**: category is an exact match when provided; duration filters are a range (min/max duration in minutes) when provided.
- **Assignment semantics**: assigning an already-assigned service is rejected as a duplicate with a clear code; removing a service/specialist that is referenced cleans its assignment links to avoid orphans.
- **Availability scoping**: business-wide entries serve as the default calendar; specialist-scoped entries override/extend for that professional.
- **Surface posture**: the GraphQL surface keeps the current development posture (playground/introspection only outside production); no tenant-level authentication/authorization is introduced by this feature.
- **Testing posture**: unit and e2e tests mock the persistence seam, so the suite runs DB-free and deterministic (established in `003`).
- **Scope boundary**: tenant provisioning/onboarding, appointments and gallery remain out of scope and arrive in later features.
- **This spec respects `specs/business-model.md`** (pricing/rates source for Service fields) and the hierarchy of `constitution.md`; per SDD it precedes any implementation, and persistence continues under the ratified strategy (Prisma + PostgreSQL via `@foundly/database`).
