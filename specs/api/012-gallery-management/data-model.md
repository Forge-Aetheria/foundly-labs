# Phase 1 — Data Model: Foundly API — Gallery Management

**Feature**: `specs/api/012-gallery-management` · **Date**: 2026-10-13

## Persistence entity (Prisma — existing, unchanged)

### `GalleryPhoto` (table `GalleryPhoto`)

| Field | Type | Notes |
|---|---|---|
| `id` | `String` (cuid) | Primary key, stable identity |
| `tenantId` | `String` | Owner business (FK → `Tenant.id`) |
| `url` | `String` | Absolute image URL |
| `title` | `String?` | Optional short title |
| `description` | `String?` | Optional short description |
| `category` | `String?` | Optional tag: `local` \| `trabajos` \| `equipo` |
| `sortOrder` | `Int` | Display order (default `0`) |
| `createdAt` | `DateTime` | Creation timestamp |

**Relationship**: `Tenant 1 ── * GalleryPhoto` (already declared in `schema.prisma`). No new migration is required — the table exists from the init migration.

> Note: the requested "timestamps" are satisfied by `createdAt`; no `updatedAt` is added because photos are add/remove-only.

## GraphQL types (code-first)

### `GalleryItem` (ObjectType)

| Field | GraphQL type | Source |
|---|---|---|
| `id` | `ID!` | `GalleryPhoto.id` |
| `url` | `String!` | `GalleryPhoto.url` |
| `title` | `String` | `GalleryPhoto.title` |
| `description` | `String` | `GalleryPhoto.description` |
| `category` | `String` | `GalleryPhoto.category` |
| `order` | `Int!` | `GalleryPhoto.sortOrder` |

### `AddGalleryItemInput` (InputType)

| Field | GraphQL type | Required | Rule |
|---|---|---|---|
| `url` | `String!` | yes | absolute `http(s)` URL |
| `title` | `String` | no | ≤ 200 chars (trimmed; empty → null) |
| `description` | `String` | no | ≤ 2000 chars (trimmed; empty → null) |
| `category` | `String` | no | ∈ {`local`,`trabajos`,`equipo`} (normalized) or null |

`url` is initialized to `''` in the input constructor (code-first default, consistent with the catalog inputs).

## Validation rules (from requirements)

- **FR-006** — `url` must be a non-empty absolute `http`/`https` URL → else `VALIDATION_ERROR`, nothing persisted.
- **FR-007** — duplicate `url` within the same tenant → `CONFLICT`, nothing persisted.
- **FR-005** — the owning tenant is taken from the authenticated identity; a client-supplied tenant is ignored/rejected.
- **FR-008** — a photo owned by another tenant is invisible to by-id operations → `NOT_FOUND`.
- Title/description length bounds and the closed category set are enforced by the service.

## State transitions

None. The entity is **created** (add) or **deleted** (remove). There is no update/reorder in this feature (`order` is assigned on creation).

## Derived/served projections

- Read projection: `GalleryRow { id, tenantId, url, title, description, category, order }` (internal), mapped 1:1 to `GalleryItem` by the resolver (the extra `tenantId` is not exposed).
- Public mini-site projection (consumer side, Book `013`): `PublicGalleryPhoto { id, url, title?, description?, category? (display label) }`.
