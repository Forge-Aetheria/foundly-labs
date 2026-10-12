# Feature Specification: Foundly API — GraphQL Execution Layer & Data Integration

**Feature Branch**: `007-graphql-api-layer`

**Created**: 2026-10-11

**Status**: Draft

**Input**: User description: "Specification: GraphQL API Layer & Prisma Integration (Foundly Ecosystem). Implement the foundational GraphQL API layer inside `apps/api` integrated with the centralized `@foundly/database` package using a professional monorepo structure. Ensure alignment with the Supabase PostgreSQL connection patterns already established. (1) Dependency Integration (`apps/api`): reference `@foundly/database` within the monorepo workspace and set up the GraphQL server instance (established framework/Yoga/Apollo stack). (2) GraphQL Context (`apps/api/src/context.ts`): initialize and inject the shared `prisma` client from `@foundly/database` into the request context. (3) Schema and Resolvers (`apps/api/src/schema`): define type definitions including a robust `healthCheck` query and resolvers that validate the database connection via Prisma. (4) SDD Compliance: follow the constitution and workspace guidelines; validate against TypeScript strict standards."

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Verify the service and its data layer are always reachable (Priority: P1)

As an operations owner, I want a single service health query that reports whether the API and its underlying data store are reachable, so that I can confirm the ecosystem's backend is alive and detect data-layer outages before they affect customers.

**Why this priority**: Every domain query and mutation in the ecosystem depends on the backend being up and on the data store answering; a health probe is the smallest, most valuable slice of the execution layer and unlocks observability for all other modules.

**Independent Test**: Start the API, call the health query in an environment where the data store is reachable, and in an environment where it is not; confirm the returned status reflects each state and that the service itself never crashes.

**Acceptance Scenarios**:

1. **Given** the API is running and the data store is reachable, **When** a caller issues the health query, **Then** it returns a status indicating the service and data layer are available.
2. **Given** the API is running but the data store is unreachable, **When** a caller issues the health query, **Then** it returns a status indicating the data layer is unavailable, without the service crashing or returning an internal error.
3. **Given** the API is running, **When** a caller issues the health query, **Then** the probe performs a read-only check and never persists or alters any data.

---

### User Story 2 - Execute every request through one shared data seam (Priority: P2)

As a backend developer, I want every GraphQL request to be resolved with access to the workspace's shared data-access component, so that all current and future domain modules read and write through a single persistence seam instead of each managing its own connection.

**Why this priority**: The ratified domain modules (tenants, services, specialists, availability, appointments, auth) are only consistent if they resolve against the same shared data seam; this story makes that seam available to the whole execution layer.

**Independent Test**: Resolve a health query and one representative read flow from an existing domain module, and confirm both use the same shared data seam available in every request; the corresponding automated test passes.

**Acceptance Scenarios**:

1. **Given** a GraphQL request, **When** it is resolved, **Then** the request is executed with access to the shared data-access component injected for the whole request lifetime.
2. **Given** the shared data-access component, **When** it is produced by its own package, **Then** the API resolves it through the workspace dependency at runtime without duplicate instances.
3. **Given** an existing domain module, **When** its resolvers run, **Then** they use the same shared data seam as the health probe.

---

### User Story 3 - Keep the workspace healthy and SDD-compliant (Priority: P3)

As a maintainer, I want the new execution layer to integrate cleanly with the monorepo and the ratified connection pattern, so that the API keeps building, type-checking and testing with no regressions across the workspace.

**Why this priority**: The constitutional workflow requires every increment to keep the workspace gates green and to stay within the ratified storage/connection posture; a clean integration is the acceptance gate.

**Independent Test**: Run the API build, typecheck and test commands along with the data package gates, and confirm no regressions in existing workspaces.

**Acceptance Scenarios**:

1. **Given** the API workspace, **When** its `build` and `typecheck` run, **Then** they complete successfully.
2. **Given** the API workspace, **When** its automated test suite runs, **Then** it passes, including coverage for the health probe and the shared data seam.
3. **Given** the whole workspace, **When** existing apps and packages are built and tested, **Then** there are no regressions.
4. **Given** the execution layer, **When** it connects to the data store, **Then** it uses the established connection pattern already ratified for the environment.

---

### Edge Cases

- **Data store unreachable**: The health query reports the data layer as unavailable instead of throwing an internal error, and repeated calls do not crash the service.
- **Data store recovery**: After an outage ends, the health query returns to "available" without a service restart.
- **Slow data store**: When the data store responds slowly, the probe either returns a degraded status or fails within a short, standard timeout rather than hanging indefinitely.
- **Empty / brand-new data store**: With no seeded data, reads return empty results and the health probe still reports the data layer as available.
- **Read-only guarantee**: Executing the health probe must never modify, insert, or remove data.
- **Introspection and discovery**: Clients can discover the health query in the schema contract (per the ratified development posture).
- **Missing dependencies**: If the shared data-access package is not resolvable at build time, the API build fails with a clear resolution error instead of silently wiring a broken seam.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: The API MUST expose a health query that reports, in real time, whether the service is running.
- **FR-002**: The health query MUST verify the data layer is reachable and report a clear "available" or "unavailable" outcome in its response.
- **FR-003**: The health probe MUST be read-only: it never persists, alters, or deletes data.
- **FR-004**: When the data layer is unreachable, the API MUST report the health outcome accordingly and MUST NOT crash or return an internal error.
- **FR-005**: When the data layer recovers, the health outcome MUST return to "available" without requiring a restart.
- **FR-006**: Every GraphQL request MUST be executed with access to the workspace's shared data-access component, providing one persistent seam for the entire request.
- **FR-007**: The API MUST consume the shared data-access component from its workspace package so the component is produced by its package build and resolved by the API at runtime.
- **FR-008**: The execution layer MUST be wired to the established connection pattern already ratified for the environment, without introducing a new data infrastructure.
- **FR-009**: The API MUST include automated tests for the health probe (available and unavailable paths) and for the shared data seam injected into requests.
- **FR-010**: All workspace gates MUST pass (`build`, `typecheck`, `test`) with no regressions in existing apps and packages.

### Key Entities _(include if feature involves data)_

- **Health status**: The outcome of a service probe — the service availability plus the data-layer reachability, reported at request time.
- **Request context**: The per-request bundle that carries access to the shared data-access component so every resolver uses the same persistence seam.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: An operator can check service health with a single query and receive a clear status answer in under 1 second under normal conditions.
- **SC-002**: With the data store reachable, the health query reports "available"; with it unreachable, it reports "unavailable" and the service keeps running.
- **SC-003**: Every GraphQL request in the API resolves through the same shared data seam; no domain operation introduces a second persistence path.
- **SC-004**: The health probe is verified to never modify, insert, or remove data.
- **SC-005**: The API and data package gates pass and the existing workspaces show no regressions.

## Assumptions

- **Established stack is reused**: The GraphQL serving framework already ratified by the earlier API specs is reused as-is; this feature ratifies the execution layer built on top of it, not a new framework.
- **Public health probe**: The health query is a public, unauthenticated operational probe (standard for service health checks); domain operations keep the ratified authentication/authorization posture.
- **Single shared data seam**: The shared data-access component is a single instance provided to all resolvers and domain modules (per the ratified data layer features), avoiding duplicate connections.
- **Established connection pattern**: Connection to the data store follows the Supabase PostgreSQL pooler pattern already ratified (`DATABASE_URL` for runtime, direct/`DIRECT_URL` for tooling); no new infrastructure.
- **Read-only probe**: The health probe does not require migrations or seeding; it only needs the data store to answer a trivial read.
- **Scope boundary**: This feature covers the execution layer and the health probe; new domain modules and extended domain surface arrive through their own ratified features.
- **Dev posture for introspection**: Schema discovery (introspection/playground) follows the ratified development posture (enabled outside production only).
- **Respect for the governance hierarchy**: This spec follows `specs/business-model.md` (the ecosystem's value proposition and service pricing remain the source of truth for any domain behavior this execution layer exposes) and the authority order of `constitution.md` — per SDD it precedes any implementation of the execution layer, and it adds no persistence or entitlement behavior of its own.