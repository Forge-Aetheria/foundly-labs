# Feature Specification: Foundly API — Availability Time Blocks

**Feature Branch**: `014-availability-time-blocks`

**Created**: 2026-10-13

**Status**: Draft

**Input**: User description: "Añadir el modelo de datos en Prisma para los bloqueos de tiempo específicos (fechas/horas en las que el negocio o un especialista no está disponible, asociados al tenant), y exponer las queries y mutaciones de GraphQL (`timeBlocks`, `addTimeBlock`, `removeTimeBlock`), con aislamiento por tenant."

_This spec is governed by `constitution.md` v5.2.0, `specs/business-model.md` and `specs/architecture.md`. It lives in the `api` domain because the affected application is `apps/api`. It extends the availability surface of `specs/api/004-services-specialists-availability` and depends on the identity layer of `specs/api/008-supabase-jwt-auth` (algorithm support: `specs/api/011-jwt-algorithm-support`). It is the backend counterpart of `specs/book/015-availability-time-blocks`._

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Read a business's time blocks (Priority: P1)

As a visitor or the business owner, I want to read the concrete time blocks of a business (or of one of its specialists), so that availability reflects the times the business is closed.

**Why this priority**: Blocks must be readable by both the admin panel and the public booking flow; today there is no store for them.

**Independent Test**: Query a business's time blocks by its public slug (and by a specialist) and confirm the blocks are returned; an empty business returns an empty list.

**Acceptance Scenarios**:

1. **Given** a business with time blocks, **When** its blocks are queried, **Then** the blocks are returned with their start/end and optional reason, scoped to that business.
2. **Given** a business with no blocks, **When** its blocks are queried, **Then** an empty list is returned (not an error).
3. **Given** a specialist filter, **When** blocks are queried, **Then** only that specialist's blocks (plus, where applicable, the business-wide ones) are considered.
4. **Given** an unknown business reference, **When** blocks are queried, **Then** an empty list is returned.

---

### User Story 2 - Add a time block (Priority: P1)

As an authenticated business owner, I want to block a specific date/time range (for the whole business or a specialist), so those slots stop being bookable.

**Why this priority**: Blocking is the core action; without it the section cannot leave empty arrays.

**Independent Test**: With a valid credential, add a block and confirm it appears in the business's blocks; an anonymous attempt is rejected; invalid ranges are rejected; another business cannot see it.

**Acceptance Scenarios**:

1. **Given** an authenticated, tenant-bound owner, **When** a valid block (start before end) is added, **Then** it is persisted for that owner's business and returned.
2. **Given** an anonymous request, **When** a block is added, **Then** it is rejected with the stable authentication error and nothing is persisted.
3. **Given** an end that is not after the start (or malformed dates), **When** a block is added, **Then** it is rejected with a validation error and nothing is persisted.
4. **Given** an optional specialist that does not belong to the caller's business, **When** a block is added, **Then** it is rejected and nothing is persisted.
5. **Given** a token bound to another business, **When** blocks are read, **Then** only that business's blocks are visible (no cross-tenant leakage).

---

### User Story 3 - Remove a time block (Priority: P2)

As an authenticated business owner, I want to remove a block I created, so availability opens up again.

**Independent Test**: Remove an owned block and confirm it disappears; attempt to remove a block of another business by id and confirm it is not found and the record is intact.

**Acceptance Scenarios**:

1. **Given** an authenticated owner, **When** they remove one of their blocks, **Then** it is deleted and the operation reports success.
2. **Given** a block belonging to another business, **When** it is removed by id, **Then** the operation fails with not-found and the record is intact.
3. **Given** an anonymous request, **When** a block is removed, **Then** it is rejected with the stable authentication error.

---

### Edge Cases

- Start not before end, equal bounds, or malformed datetime values: rejected with a validation error.
- Optional reason left empty or over the accepted length: empty is allowed; over-length is rejected.
- Optional specialist omitted: the block applies to the whole business.
- Specialist not belonging to the caller's business: rejected.
- Empty list: reads return an empty list; add/remove remain usable.
- Cross-tenant by-id access on remove: not-found (no existence oracle), record untouched.
- Overlapping blocks: allowed (each block is independent).

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: The system MUST persist time blocks per business (and optionally per specialist), each with a stable identity, a start and end instant, and an optional reason, plus a creation timestamp.
- **FR-002**: The system MUST expose a read operation that returns a business's time blocks, scoped by the business reference (public, no credential required), optionally filtered by specialist.
- **FR-003**: The system MUST expose an add operation that requires a valid identity and persists the block for the identity's own business (and, when given, a specialist of that business).
- **FR-004**: The system MUST expose a remove operation that requires a valid identity and removes only a block owned by the identity's business.
- **FR-005**: Write operations MUST derive the owning business from the authenticated identity and MUST NOT accept a client-supplied business identifier as the authority.
- **FR-006**: An add attempt whose end is not strictly after its start, or with malformed instants, MUST be rejected with a validation error and MUST NOT persist.
- **FR-007**: An add attempt that names a specialist not belonging to the caller's business MUST be rejected and MUST NOT persist.
- **FR-008**: Operations on a block owned by another business MUST fail as not-found and MUST NOT modify or reveal it.
- **FR-009**: Anonymous write attempts MUST be rejected with the stable authentication error and MUST NOT persist.
- **FR-010**: Reads MUST return blocks in a stable order (by start instant) and an empty list for a business/unknown reference with none (never an error).
- **FR-011**: Automated tests MUST cover: read (list/empty/unknown/specialist filter), add (valid, anonymous, invalid range, foreign specialist), remove (valid, foreign, anonymous) and cross-tenant isolation.
- **FR-012**: All API gates (`build`, `typecheck`, `test`, lint) MUST pass with no regressions under strict TypeScript.

### Key Entities

- **Time block**: a specific unavailability interval for a business (and optionally a specialist): start instant, end instant, optional reason, stable identity, creation timestamp.
- **Business (tenant)**: owns its time blocks; identified for public reads by its slug.
- **Specialist (resource)**: an optional owner of a time block, belonging to the business.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: A visitor reads a business's time blocks (including the empty case) successfully, in a stable order.
- **SC-002**: 100% of anonymous or cross-business write attempts are rejected with the stable error codes and persist nothing.
- **SC-003**: 100% of invalid ranges / malformed instants / foreign specialists are rejected with validation errors and persist nothing.
- **SC-004**: Removing a block of another business never deletes or mutates it (always not-found).
- **SC-005**: All API gates pass with zero regressions.

## Assumptions

- **New persistence entity**: the current schema has weekly availability rules but no time-block entity, so a new reviewed/travelled entity (business, optional specialist, start/end, reason, timestamp) with its migration is in scope.
- **One-off blocks (v1)**: blocks are concrete date/time intervals; recurring blocks are out of scope for this iteration (the domain model can map a block to `kind: 'block'` / `recurrence: 'none'`).
- **Public reads; authenticated writes**: blocks are needed by the public booking flow, so reads require no credential (consistent with availability/services/gallery reads); only writes require identity and are tenant-scoped.
- **Respect for the governance hierarchy**: follows `specs/business-model.md` (accurate availability underpins the Foundly Book value proposition) and the authority order of `constitution.md`.
