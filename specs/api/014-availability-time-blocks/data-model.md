# Phase 1 — Data Model: Foundly API — Availability Time Blocks

**Feature**: `specs/api/014-availability-time-blocks` · **Date**: 2026-10-13

## Persistence entity (Prisma — NEW)

### `TimeBlock` (table `TimeBlock`)

| Field | Type | Notes |
|---|---|---|
| `id` | `String @id @default(cuid())` | Primary key, stable identity |
| `tenantId` | `String` | Owner business (FK → `Tenant.id`) |
| `specialistId` | `String?` | Optional specialist (FK → `Specialist.id`); null = business-wide |
| `startAt` | `DateTime` | Block start instant |
| `endAt` | `DateTime` | Block end instant (must be > `startAt`) |
| `reason` | `String?` | Optional short reason |
| `createdAt` | `DateTime @default(now())` | Creation timestamp |

**Relations**: `Tenant 1 ── * TimeBlock` (**new relation**); `Specialist 1 ── * TimeBlock` (**new optional relation**).
**Index**: `@@index([tenantId, startAt])` for scoped, ordered reads.
**Migration**: one new migration creating `TimeBlock` + FKs to `Tenant` and `Specialist`.

## GraphQL types (code-first)

### `TimeBlockObject` (ObjectType)

| Field | GraphQL type | Source |
|---|---|---|
| `id` | `ID!` | `TimeBlock.id` |
| `tenantId` | `String!` | `TimeBlock.tenantId` |
| `specialistId` | `String` | `TimeBlock.specialistId` (null = business-wide) |
| `startAt` | `String!` | ISO-8601 (`TimeBlock.startAt`) |
| `endAt` | `String!` | ISO-8601 (`TimeBlock.endAt`) |
| `reason` | `String` | `TimeBlock.reason` |

### `AddTimeBlockInput` (InputType)

| Field | GraphQL type | Required | Rule |
|---|---|---|---|
| `tenantId` / `tenantSlug` | `ID` / `String` | no | accepted for symmetry; **ignored** for authorization (tenant comes from the token) |
| `specialistId` | `ID` | no | must belong to the caller's business |
| `startAt` | `String!` | yes | valid ISO-8601 instant |
| `endAt` | `String!` | yes | valid ISO-8601 instant, strictly after `startAt` |
| `reason` | `String` | no | ≤ 200 chars (trimmed; empty → null) |

`startAt`/`endAt` default to `''` in the input constructor (code-first default).

## Validation rules (from requirements)

- **FR-006** — invalid/missing instants or `endAt <= startAt` → `VALIDATION_ERROR`; nothing persisted.
- **FR-007** — `specialistId` not belonging to the caller's tenant → `VALIDATION_ERROR`/`NOT_FOUND`; nothing persisted.
- **FR-005** — the owning tenant is taken from the authenticated identity; a client-supplied tenant is never the authority.
- **FR-008** — a block owned by another tenant is invisible to by-id operations → `NOT_FOUND`.
- `reason` bounded to 200 chars.

## State transitions

None. A block is **created** or **deleted** (add/remove only). No edit/recurrence in this feature.

## Ordering & filtering

- Read order: `startAt asc`.
- `specialistId` provided → that specialist's blocks **plus** business-wide (`specialistId = null`).
- `specialistId` omitted → all blocks of the tenant (admin view).

## Derived/served projections

- Read row: `TimeBlockRow { id, tenantId, specialistId, startAt (ISO), endAt (ISO), reason }` (internal), mapped 1:1 to `TimeBlockObject`.
- Consumer side (Book `015`): domain `TimeBlock { id, resourceId, startAt, endAt, kind: 'block', recurrence: 'none', recurrenceUntil: null, reason }`, and the `computeAvailability` block input for the public slot computation.
