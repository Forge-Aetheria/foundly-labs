# Phase 0 — Research: Foundly API — Gallery Management

**Feature**: `specs/api/012-gallery-management` · **Date**: 2026-10-13

All Technical Context unknowns are resolved below (no `NEEDS CLARIFICATION` remained).

## R1 — Persistence entity: reuse `GalleryPhoto` (do not create a new model)

- **Decision**: Reuse the existing Prisma `GalleryPhoto` model (already related to `Tenant`, table created by `20261012002831_init_foundly_schema`). Expose it as the GraphQL type **`GalleryItem`**; map the GraphQL `order` field to the persisted `sortOrder`.
- **Rationale**: The entity and its table already exist but are not exposed. Creating a second gallery model would duplicate state and require a migration for a feature that has no data yet. `createdAt` already covers the "timestamps" requirement; there is no `updatedAt` because photos are add/remove-only in this feature.
- **Alternatives considered**: (a) Create a new `GalleryItem` table — rejected: duplicate/competing source of truth, unnecessary migration. (b) Rename `GalleryPhoto` → `GalleryItem` — rejected: a destructive migration with no functional gain; the GraphQL name can differ from the table name.

## R2 — Read authorization: public query

- **Decision**: `gallery(tenantId?, tenantSlug?)` is **public** (no `@RequireAuth`), scoping by `tenantId` or `tenantSlug`, returning `[]` for an unknown slug.
- **Rationale**: The gallery is public content shown on the business's mini-site; anonymous visitors must read it. This matches the existing public reads (`services`, `specialists`, `availability`), which also accept `tenantId`/`tenantSlug`.
- **Alternatives considered**: (a) Authenticated "my" read like `catalog` — rejected: the public page has no credential. (b) Embed `gallery` as a field on `TenantObject` — rejected: the admin needs a tenant-scoped read independent of a slug lookup; a standalone query is simpler and consistent.

## R3 — Write authorization & tenant isolation

- **Decision**: `addGalleryItem` / `removeGalleryItem` require `@RequireAuth` and derive the tenant from `ctx.user.tenantId`; a client-supplied tenant is never accepted. Missing scope → `UNAUTHENTICATED`; foreign id on remove → `NOT_FOUND` (no existence oracle).
- **Rationale**: Mirrors the ratified `catalog` module's `requireTenant(user)` and cross-tenant posture.
- **Alternatives considered**: Accept `tenantId` in the input — rejected (spoofable, violates the tenant-scope rule).

## R4 — Persistence seam (testability)

- **Decision**: A narrow `GalleryStore` interface behind a `GALLERY_STORE` injection token, with `PrismaGalleryStore` for production and `createMemoryGalleryStore()` for tests.
- **Rationale**: Matches the `CATALOG_STORE` pattern; lets the API unit/e2e suites run without a database.
- **Alternatives considered**: Direct `PrismaService` in the service — rejected (harder to test, diverges from the established seam).

## R5 — Duplicate handling

- **Decision**: Application-level dedupe via `findByUrl(tenantId, url)` → `CONFLICT` on a repeated URL **within a tenant**; the same URL in another tenant is allowed.
- **Rationale**: The schema has no unique constraint on `(tenantId, url)`; the check is simple and matches the spec's conflict requirement. The same URL across businesses is legitimate.
- **Alternatives considered**: Add a DB unique constraint + migration — rejected as unnecessary for this iteration and a heavier change.

## R6 — Display order

- **Decision**: On add, compute `order = max(sortOrder) + 1` for the tenant; read ordered by `sortOrder asc, createdAt asc`.
- **Rationale**: Stable, append-only ordering without a reorder UI in this scope.
- **Alternatives considered**: Client-supplied order — rejected (needs validation and a reorder feature that is out of scope).

## R7 — Validation rules

- **Decision**: Required absolute `http(s)` URL; optional title ≤ 200 chars; optional description ≤ 2000 chars; optional category restricted to the closed set `local | trabajos | equipo` (normalized to lower-case).
- **Rationale**: Consistent with the `006` UI spec and prevents garbage data; mirrors existing `validationError` usage.
- **Alternatives considered**: Free-form category — rejected (the UI models a closed set; the public badge maps labels).

## R8 — Error envelope

- **Decision**: Reuse `validationError` / `conflictError` / `notFoundError` from `shared/tenant-scope`, and the `UNAUTHENTICATED` scope error used by the catalog module.
- **Rationale**: Single, stable, already-normalized error contract (`VALIDATION_ERROR`, `CONFLICT`, `NOT_FOUND`, `UNAUTHENTICATED`).
- **Alternatives considered**: New error codes — rejected (would break the standardized envelope).
