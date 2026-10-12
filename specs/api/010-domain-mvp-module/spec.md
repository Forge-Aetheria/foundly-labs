# Feature Specification: Foundly API — Domain MVP Module (Authenticated CRUD, Tenant-Isolated)

**Feature Branch**: `010-domain-mvp-module`

**Created**: 2026-10-11

**Status**: Draft

**Input**: User description: "Domain MVP Module - Core Entities & Resolvers (Foundly Ecosystem). Implement the initial domain logic and GraphQL resolvers for the core MVP entities within `apps/api`. This module connects the authenticated GraphQL layer with the `@foundly/database` Prisma schema to enable foundational CRUD operations under strict multi-tenant and authorization rules. (1) Domain Model Integration: define GraphQL types, inputs and payloads matching the core Prisma schema entities; implement domain queries (entity list, resource by ID) and mutations (create, update, delete). (2) Tenant Isolation & Security: all data operations strictly enforce tenant boundaries using the `ctx.user` context established in the auth layer; prevent cross-tenant data leaks by automatically scoping Prisma queries to the authenticated user/organization ID. (3) Validation & Error Handling: validate input payloads before hitting the database layer; utilize the standardized error pipeline to throw predictable domain exceptions (NOT_FOUND, VALIDATION_ERROR, FORBIDDEN). (4) Testing & SDD Compliance: unit tests for domain resolvers and integration tests for GraphQL queries/mutations; all existing quality gates pass with zero regressions across specs 007, 008 and 009."

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Manage core catalog resources within my own organization (Priority: P1)

As an authenticated member of an organization, I want to list, fetch, create, update and delete my organization's core catalog resources through the API, without ever seeing or touching another organization's data.

**Why this priority**: The whole MVP rests on being able to safely manage the organization's core data; without read/write capabilities that are correctly scoped, no other domain flow can be built on top.

**Independent Test**: With a valid identity, run a full create → list → fetch → update → delete round-trip on a core resource and confirm every step persists and returns the expected data; confirm a second identity from a different organization sees none of it.

**Acceptance Scenarios**:

1. **Given** an authenticated identity, **When** a core resource creation mutation runs, **Then** the resource is persisted under that identity's organization and returned with its identifier.
2. **Given** created resources, **When** the list and fetch queries run, **Then** they return only resources belonging to the caller's organization.
3. **Given** an existing owned resource, **When** update and delete mutations run, **Then** the changes persist and the resource is removed, scoped only to the caller's organization.
4. **Given** a request without a valid identity, **When** any protected operation runs, **Then** it is rejected with a clear authentication error.

---

### User Story 2 - Keep organizations isolated and failures predictable (Priority: P2)

As an operator, I want cross-tenant attempts, invalid inputs and missing resources to fail with stable, safe errors, so that no data can leak between organizations and clients can react to each failure class.

**Why this priority**: Isolation is the security boundary of the multi-tenant API; consistent error classes are how clients and operators stay predictable.

**Independent Test**: Using an identity from organization A, attempt to read/update/delete a resource of organization B by identifier → rejected without exposing the resource; send malformed input → validation error; query a deleted/unknown resource → not found; each with the documented error code and the standardized envelope.

**Acceptance Scenarios**:

1. **Given** an identity from organization A and the identifier of an organization B resource, **When** A reads, updates or deletes it, **Then** it is rejected predictably without disclosing that the resource exists.
2. **Given** incomplete or malformed input, **When** a mutation runs, **Then** it is rejected as invalid input before any data is written.
3. **Given** an identifier that does not exist in the caller's organization, **When** a fetch/update/delete runs, **Then** it returns a not-found error.
4. **Given** any failure, **When** the response is returned, **Then** it uses the standardized error envelope with a stable code (authentication, forbidden, not found, invalid input).

---

### User Story 3 - Keep the workspace green with zero regressions (Priority: P3)

As a maintainer, I want the domain MVP module to be additive and follow the ratified seams, so that the 007 execution layer, 008 identity and 009 logging/error suites all keep passing.

**Why this priority**: This module composes the newest additions (authenticated context + error pipeline); breaking any of them would ripple through the whole API.

**Independent Test**: Run the API gates and the 007/008/009 specs and confirm they still pass with the new module registered.

**Acceptance Scenarios**:

1. **Given** the API workspace, **When** `build` and `typecheck` run, **Then** they complete successfully.
2. **Given** the API workspace, **When** the automated suite runs, **Then** the existing 007, 008 and 009 specs pass alongside the new domain specs.
3. **Given** the workspace, **When** lint and regression gates run, **Then** nothing regresses.

---

### Edge Cases

- **No identity**: protected operations reject with `UNAUTHENTICATED` (008 guard).
- **Cross-tenant by ID**: reading/updating/deleting another organization's resource by identifier is treated as not-found (or forbidden) without disclosing existence.
- **Client-supplied tenant identifiers**: any tenant identifier provided by the client on protected operations is ignored — scope always comes from the authenticated identity.
- **Malformed input**: missing/invalid fields are rejected as `VALIDATION_ERROR` before any database write.
- **Duplicate identifiers**: creating a resource with an already-used unique value is rejected with a conflict code and persists nothing.
- **Deletion with relations**: deleting a core resource cleans up its owned relations without erroring.
- **Empty organization**: list queries return an empty collection, not an error.
- **Unknown resource**: any operation on a missing resource returns `NOT_FOUND`.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: The API MUST expose authenticated queries to list the core catalog resources of the caller's organization and to fetch a single one by identifier.
- **FR-002**: The API MUST expose authenticated mutations to create, update and delete core catalog resources.
- **FR-003**: Every protected operation MUST derive the organization scope exclusively from the authenticated identity in the request context — never from client-supplied identifiers.
- **FR-004**: Reads and writes MUST be automatically scoped to the caller's organization so that cross-tenant data is never returned, updated or deleted.
- **FR-005**: Operations on a resource that does not exist in the caller's organization MUST return a not-found error and reveal no existence information.
- **FR-006**: Malformed or incomplete input MUST be rejected as invalid input before any data is written.
- **FR-007**: Duplicate unique values on create MUST be rejected with a conflict-style code and MUST persist nothing.
- **FR-008**: Deleting a core resource MUST remove its owned relations without leaving dangling references.
- **FR-009**: All errors MUST flow through the standardized error envelope with stable codes (`UNAUTHENTICATED`, `FORBIDDEN`, `NOT_FOUND`, `VALIDATION_ERROR`, `CONFLICT`).
- **FR-010**: The module MUST reuse the shared data seam and the authenticated context established by 007/008 and the error pipeline of 009 without altering their behavior.
- **FR-011**: The API MUST include resolver unit tests and GraphQL integration tests covering the ownership-scoped CRUD round-trip and the isolation/error scenarios above.
- **FR-012**: All workspace gates MUST pass with zero regressions in specs 007, 008 and 009, under strict TypeScript rules.

### Key Entities _(include if feature involves data)_

- **Service**: an organization's bookable offering (name, description, price, duration, category, active) — the demonstrated core MVP resource, owned by its organization.
- **Specialist**: an organization's professional (name, role, bio, avatar, assigned services, active), owned by its organization.
- **Tenant boundary**: the authoritative organization filter derived from the authenticated identity — the scope for every operation.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: An authenticated user completes a create → list → fetch → update → delete round-trip on a core resource in under 2 seconds, and every response is scoped to their organization.
- **SC-002**: A second organization's identity observes **zero** resources and cannot read, update or delete the first organization's data — verified by automated isolation tests.
- **SC-003**: Unauthenticated, forbidden, not-found and invalid-input failures each return their stable code inside the standardized envelope, with no internal detail.
- **SC-004**: All mutations validate before persisting; duplicate and invalid cases persist nothing.
- **SC-005**: The 007, 008 and 009 suites plus the new domain specs all pass; build, typecheck, test and lint are green.

## Assumptions

- **Tenant scope source**: the authenticated identity (Supabase JWT via 008) carries the organization membership — a standard custom claim exposed as `ctx.user.tenantId` — and protected operations derive scope from it alone. (Alternatives considered and rejected for this increment: a users-to-tenant membership table — deferred, would add persistence; reusing the 006 HMAC session tenant — available but out of this module's seam.)
- **Core MVP resource set**: the Service and Specialist catalog entities demonstrate the full CRUD + isolation pattern; the remaining generated entities adopt the same pattern in later increments.
- **Additive posture**: the previously ratified tenant-input modules (003–005) are not migrated; this module is additional and clearly scoped, mirroring 007/008/009.
- **Deletion semantics**: hard delete with owned-relation cleanup, consistent with the existing modules.
- **Error contract**: reuse of the 009 pipeline and codes (`UNAUTHENTICATED`, `FORBIDDEN`, `NOT_FOUND`, `VALIDATION_ERROR`, `CONFLICT`); cross-tenant by-ID access returns not-found (no existence oracle).
- **Tests**: DB-free — mocked data seam over a deterministic in-memory model plus local JWKS (008 harness); no live database.
- **Respect for the governance hierarchy**: this spec follows `specs/business-model.md` and the authority order of `constitution.md`; per SDD it precedes implementation and introduces no pricing or entitlement behavior.