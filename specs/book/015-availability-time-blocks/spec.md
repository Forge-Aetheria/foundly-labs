# Feature Specification: Foundly Book — Availability Time Blocks (Admin + Public Booking)

**Feature Branch**: `015-availability-time-blocks`

**Created**: 2026-10-13

**Status**: Draft

**Input**: User description: "Crear los documentos GraphQL necesarios para la gestión de bloqueos, regenerar los tipos con codegen, estructurar las acciones y hooks dentro del módulo de disponibilidad, y conectar la interfaz visual en `/admin/availability` para que deje de arrojar arrays vacíos y permita bloquear/desbloquear franjas horarias de forma real."

_This spec is governed by `constitution.md` v5.2.0, `specs/business-model.md` (Foundly Book, §2.3) and `specs/architecture.md`. It lives in the `book` domain. It supersedes the "time blocks have no backend" state of `specs/book/010-remove-local-store`/`011-module-data-layer`. Its backend counterpart is `specs/api/014-availability-time-blocks`. The admin layout and the "range / full-day" block model are amended by `specs/book/022-admin-payments-schedules-refactor`._

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Manage real time blocks (Priority: P1)

As a business owner, I want `/admin/availability` to list my real time blocks and let me add and remove them, so I can block out specific date/time ranges (holidays, breaks, personal time) and open them again.

**Why this priority**: The section currently always shows zero blocks because there is no persistence; showing and managing real blocks is the core value.

**Independent Test**: Open `/admin/availability`, see the current blocks; add a block (date + start/end + optional reason) and confirm it persists after a reload; remove it and confirm it disappears after a reload.

**Acceptance Scenarios**:

1. **Given** the availability section, **When** it loads, **Then** it shows the business's real time blocks (or a clean empty state), not a hardcoded zero.
2. **Given** the add-block form, **When** I submit a valid time range (or a full-day block) with an optional reason, **Then** the block is persisted and appears in the list.
3. **Given** the add-block form, **When** the end is not after the start (or required fields are missing), **Then** the save is blocked with an inline error.
4. **Given** a block, **When** I confirm removal, **Then** it is removed on the server and disappears from the list.
5. **Given** the server is unreachable or the session expired, **When** the section loads or a write runs, **Then** the failure is surfaced cleanly (no raw text, no false success).

---

### User Story 2 - Blocked slots stop being bookable (Priority: P2)

As a customer, I want blocked time ranges to be excluded from the public booking slots, so I cannot book a time the business is unavailable.

**Independent Test**: Add a block covering an otherwise-available slot, then open the public booking flow and confirm that slot is no longer offered; remove the block and confirm it becomes available again.

**Acceptance Scenarios**:

1. **Given** a business-wide block, **When** the public booking flow computes slots for a day covered by the block, **Then** the blocked interval is excluded.
2. **Given** a specialist-specific block, **When** slots are computed for that specialist, **Then** the blocked interval is excluded for that specialist.
3. **Given** no blocks, **When** slots are computed, **Then** the available slots are unchanged.

---

### User Story 3 - A session-safe, modular implementation (Priority: P2)

As a maintainer, I want the availability module to follow the canonical data layer and the session-aware transport, so it is consistent with the rest of the app.

**Independent Test**: Confirm the module has `actions.ts` and `hooks.ts`, that the UI never calls the transport or Server Actions directly, and that an expired session on a block read/write routes to the global sign-in flow.

**Acceptance Scenarios**:

1. **Given** the availability module, **When** inspected, **Then** block data access lives in `actions.ts` (server reads + add/remove Server Actions) and interactive mutations are exposed via `hooks.ts`.
2. **Given** GraphQL operations, **When** codegen runs, **Then** the client uses only generated documents/types (no hand-written API DTOs).
3. **Given** an expired session, **When** a block read/write runs, **Then** it routes through the global session-expiry handling (no raw error text).

---

### Edge Cases

- No blocks: the admin shows a clean empty state and the public slots are unchanged.
- Invalid range (end not after start) or missing date/time: blocked inline before saving.
- Optional reason empty or over the accepted length: empty allowed; over-length rejected inline.
- Block spanning a whole day or multiple days: allowed and excluded from the affected slots.
- Overlapping blocks: allowed; the union of blocked intervals is excluded.
- Server error on load/add/remove: surfaced cleanly; never a false success.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: `/admin/availability` MUST list the business's real time blocks (start, end, optional reason) read from the backend, with a clean empty state when there are none, replacing the previous hardcoded zero.
- **FR-002**: The section MUST allow adding a block — either a **time range** (required date + start/end times) or a **full day** (required date) — with an optional reason; the block MUST persist on the server and reflect the result.
- **FR-003**: Removing a block MUST require confirmation and MUST delete it on the server.
- **FR-004**: Invalid time ranges (end not after start, range mode) or missing required fields MUST be blocked with an inline error and MUST NOT persist.
- **FR-005**: Failures on load/add/remove MUST be surfaced cleanly (localized messages; no raw provider text, no false success).
- **FR-006**: The public booking flow MUST exclude time ranges covered by active blocks (business-wide and, when computing for a specialist, that specialist's blocks) when computing offered slots.
- **FR-007**: Block data access MUST live in the module's `actions.ts` (server reads + add/remove Server Actions) and interactive mutations MUST be exposed through `hooks.ts`; the UI MUST NOT call the transport or Server Actions directly.
- **FR-008**: Block data access MUST reuse the session-aware transport so session expiry is handled globally.
- **FR-009**: GraphQL operations and types MUST be produced by codegen (no hand-written API DTOs); the versioned schema snapshot MUST stay in sync.
- **FR-010**: The screens MUST use the shared design system and pass automated accessibility checks with zero critical violations.
- **FR-011**: All book gates (`build`, `typecheck`, `test`, lint) MUST pass with no regressions under strict TypeScript.

### Key Entities

- **Time block (admin + public view)**: a specific unavailability interval — start, end, optional reason, identity.
- **Public booking availability**: the computed offered slots, which now exclude blocked intervals.
- **Availability rule**: the weekly opening hours (existing); blocks are layered on top to remove specific slots.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: 100% of the admin availability content comes from the backend; the previous hardcoded zero is gone when blocks exist.
- **SC-002**: An owner can add a block and see it persisted (visible after reload) in under 1 minute.
- **SC-003**: 100% of invalid ranges / missing fields are blocked with a clear inline message and persist nothing.
- **SC-004**: A blocked interval is excluded from the public booking slots while the block exists, and becomes available again after removal.
- **SC-005**: Book gates pass with zero regressions; the module follows the `actions.ts`/`hooks.ts` structure and passes accessibility checks.

## Assumptions

- **Backend dependency**: relies on the time-block surface delivered by `specs/api/014-availability-time-blocks` (public read + authenticated add/remove, tenant-scoped).
- **Blocks are one-off intervals (v1)**: recurring blocks are out of scope; the domain `TimeBlock` maps a block to `kind: 'block'` / `recurrence: 'none'`.
- **Specialist-level blocks are supported** by the backend; the admin v1 UI manages business-wide blocks, while the public slot computation applies both business-wide and specialist blocks for the selected specialist.
- **Tenant scoping** for admin reads/writes comes from the session (never the URL); the public read uses the business's public reference.
- **Respect for the governance hierarchy**: follows `specs/business-model.md` and the authority order of `constitution.md`.
