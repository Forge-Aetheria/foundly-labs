# Feature Specification: Foundly — Persistence & GraphQL (Prisma + Apollo)

**Feature Branch**: `002-persistence-graphql`

**Created**: 2026-10-11

**Status**: Draft

**Input**: User description: "Avanzar con el backend: integración de la capa de persistencia DB-First (Prisma + PostgreSQL) y configuración de GraphQL (Apollo Server) en NestJS. (1) Configurar `@foundly/database`: inicializar el paquete de base de datos, `schema.prisma` DB-First (Supabase o Postgres local vía Docker), modelos base (Tenants, Services, Staff, Appointments, Gallery, Profiles, Availability) y generar el cliente de Prisma disponible para `apps/api`. (2) GraphQL en `apps/api`: instalar e integrar `@nestjs/graphql`, `@nestjs/apollo` y `@apollo/server`; configurar el módulo GraphQL en `AppModule` (Code-First o híbrido según compatibilidad), con playground/sandbox en desarrollo; crear un resolver de prueba (HealthResolver) para validar el endpoint. (3) Gates: `npm run build -w @foundly/api`, `npm run test -w @foundly/api` limpios."

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Seed the persistence layer (Priority: P1)

As a backend developer, I want a shared database package (`@foundly/database`) with a DB-First Prisma schema and a generated client so that the API can model and query the system's domain data.

**Why this priority**: Persistence is the foundation for every future backend feature; without the package and models nothing can be stored or queried.

**Independent Test**: The `@foundly/database` package builds, its Prisma client is generated and importable in `apps/api`, and the base models cover the domain entities; schema validation passes.

**Acceptance Scenarios**:

1. **Given** the monorepo, **When** `@foundly/database` is present, **Then** it exposes a generated Prisma client and a DB-First `schema.prisma`.
2. **Given** the schema, **When** inspected, **Then** it defines the base domain models (tenants, services, staff, appointments, gallery, profiles, availability) with their relationships.
3. **Given** `apps/api`, **When** it depends on the database package, **Then** the Prisma client resolves and type-checks.

---

### User Story 2 - Expose the API over GraphQL (Priority: P2)

As a backend developer, I want the API's HTTP layer to serve GraphQL (Apollo) with a development playground so that consumers can query the service in a standard, introspectable way.

**Why this priority**: GraphQL is the API's public contract surface; a working endpoint with a health query proves the integration end-to-end.

**Independent Test**: Start the API, open the GraphQL endpoint, run the health query and receive the expected payload; the resolver is unit-tested.

**Acceptance Scenarios**:

1. **Given** the API, **When** it boots, **Then** it serves GraphQL at an HTTP endpoint with the development playground/sandbox enabled.
2. **Given** a health resolver, **When** the `health` query runs, **Then** it returns the service status.
3. **Given** the GraphQL integration, **When** the API is built and typed, **Then** code compiles and tests pass.

---

### User Story 3 - Verify integration gates (Priority: P3)

As a maintainer, I want the monorepo build/test/typecheck to stay green after the persistence and GraphQL changes.

**Why this priority**: A green workspace is the gate for shipping the new layer safely.

**Acceptance Scenarios**:

1. **Given** the API workspace, **When** `npm run build -w @foundly/api` runs, **Then** it completes successfully.
2. **Given** the API workspace, **When** `npm run test -w @foundly/api` and `npm run typecheck -w @foundly/api` run, **Then** they pass.
3. **Given** the whole workspace, **When** existing apps/packages are built/tested, **Then** there are no regressions.

---

### Edge Cases

- Prisma client not generated (missing `prisma generate`): the generation step is part of the build/verification and is documented; resolution fails loudly if absent.
- No live database configured (local Postgres via Docker not running): the health GraphQL query must not depend on the database connection; persistence-dependent flows are deferred.
- Code-First schema generation conflicts (decorator/emitter issues in the current stack): the feature adopts the documented mode (Code-First or hybrid) that compiles cleanly.
- Playground enabled in production: the playground is gated to development environments only.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: The monorepo MUST include a shared `@foundly/database` workspace exporting a generated Prisma client (DB-First).
- **FR-002**: The Prisma schema MUST define the base domain models — Tenants, Services, Staff, Appointments, Gallery, Profiles, Availability — with their core fields and relationships, ready for PostgreSQL (Supabase or local via Docker).
- **FR-003**: `apps/api` MUST depend on and consume the generated Prisma client without breaking its build or typecheck.
- **FR-004**: The API MUST integrate a GraphQL server (Apollo) registered in the root module, with the development playground/sandbox enabled only in non-production environments.
- **FR-005**: The API MUST expose a sample GraphQL query (e.g., `health`) backed by a resolver that answers the service status without requiring a live database.
- **FR-006**: All gates MUST pass: `npm run build -w @foundly/api`, `npm run test -w @foundly/api`, `npm run typecheck -w @foundly/api`, and no regressions in the existing workspace.

### Key Entities _(include if feature involves data)_

- **Tenant**: business identity (name, category, slug, logo/cover, contact, hours).
- **Service**: catalog offering (name, duration, price/rate, category, active).
- **Staff (Resource)**: professional (name, role, avatar, bio, assigned services, active).
- **Appointment**: booking of a service by a client for a staff member (time range, status, applied snapshot).
- **Gallery**: business photo catalog (url, title, description, category).
- **Profile**: business profile fields (about, policies, socials).
- **Availability**: working rules/blocks driving bookable slots.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: `@foundly/database` builds and its Prisma client is generated; `apps/api` type-checks importing it.
- **SC-002**: The GraphQL endpoint responds to the `health` query with the correct payload (200) and the resolver test passes.
- **SC-003**: `npm run build -w @foundly/api`, `npm run test -w @foundly/api` and `npm run typecheck -w @foundly/api` all pass after the integration.
- **SC-004**: Existing workspace gates (e.g., `apps/book` build, `@foundly/ui` tests) remain green.

## Assumptions

- The storage strategy is ratified as **Prisma + PostgreSQL** (Supabase or local Postgres via Docker) in `specs/architecture.md`, resolving the governance TODO(PERSISTENCE); this feature documents that ratification.
- Prisma client generation (`prisma generate`) is part of the build/verification flow; no live DB is required for the GraphQL health query.
- The GraphQL schema mode (Code-First) is chosen for compatibility with NestJS decorators; playground/sandbox is limited to development.
- The base models mirror the domain already designed in `apps/book` (`domain/tenancy`, `domain/appointments`, `features/public-booking/storefront`) so future backend features map 1:1.
- Database seeding/migrations and per-entity CRUD resolvers are out of scope for this feature (they follow in later `/specs/api/` features).