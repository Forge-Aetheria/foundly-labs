# Phase 0 — Research: Foundly API — Availability Time Blocks

**Feature**: `specs/api/014-availability-time-blocks` · **Date**: 2026-10-13

All Technical Context unknowns are resolved below (no `NEEDS CLARIFICATION` remained).

## R1 — New entity: `TimeBlock` (not a reuse of weekly `Availability.breaks`)

- **Decision**: Add a dedicated `TimeBlock` model (business, optional specialist, `startAt`, `endAt`, optional `reason`, `createdAt`). Do not overload the existing weekly `Availability` rows or their `breaks` JSON.
- **Rationale**: Blocks are concrete date/time intervals (a holiday, a personal appointment), independent of the weekly schedule; the weekly `breaks` describe pauses inside a given weekday. Mixing them would corrupt the slot computation. A first-class row supports ordering, filtering and ownership.
- **Alternatives considered**: Store blocks in `Availability.breaks` — rejected (wrong granularity, no per-block identity/ownership). Recurring blocks — deferred (v1 is one-off).

## R2 — Read authorization: public query

- **Decision**: `timeBlocks(tenantId?, tenantSlug?, specialistId?)` is **public** (no `@RequireAuth`), scoped by `tenantId` or `tenantSlug`, returning blocks ordered by `startAt` asc; unknown slug → `[]`.
- **Rationale**: The public booking flow must read blocks to exclude them; this matches the existing public reads (`availability`, `services`, `gallery`).
- **Alternatives considered**: Authenticated read — rejected (the public flow has no credential).

## R3 — Write authorization & tenant isolation

- **Decision**: `addTimeBlock` / `removeTimeBlock` require `@RequireAuth` and derive the tenant from `ctx.user.tenantId`; a named `specialistId` is validated to belong to that tenant. Missing scope → `UNAUTHENTICATED`; foreign id on remove → `NOT_FOUND`.
- **Rationale**: Mirrors the ratified `catalog`/`gallery` write posture; prevents cross-tenant writes and foreign-specialist references.
- **Alternatives considered**: Client-supplied `tenantId` — rejected (spoofable).

## R4 — Persistence seam (testability)

- **Decision**: A narrow `TimeBlockStore` interface behind a `TIME_BLOCK_STORE` token, with a `PrismaTimeBlockStore` and an in-memory `createMemoryTimeBlockStore()`.
- **Rationale**: Consistent with `CATALOG_STORE`/`GALLERY_STORE`; enables DB-free specs.
- **Alternatives considered**: Direct Prisma in the service — rejected (harder to test, diverges).

## R5 — Validation rules

- **Decision**: `startAt`/`endAt` must be valid ISO-8601 instants with `endAt > startAt` → else `VALIDATION_ERROR`; optional `reason` ≤ 200 chars (trimmed; empty → null); optional `specialistId` must exist and belong to the tenant → else `NOT_FOUND`/`VALIDATION_ERROR`.
- **Rationale**: Prevents inverted/garbage intervals and cross-tenant references; bounded reason keeps data clean.
- **Alternatives considered**: Allow `endAt == startAt` — rejected (zero-length block is meaningless).

## R6 — Ordering & filtering

- **Decision**: Reads order by `startAt asc`. With a `specialistId`, return that specialist's blocks **plus** business-wide blocks (`specialistId = null`); without it, return all of the tenant's blocks (admin view).
- **Rationale**: The public slot computation for a specialist must account for both the specialist's own blocks and business-wide closures; the admin needs the full set.
- **Alternatives considered**: Only exact-specialist blocks — rejected (would hide business-wide closures from the public flow).

## R7 — Error envelope

- **Decision**: Reuse `validationError` / `notFoundError` from `shared/tenant-scope` and the `UNAUTHENTICATED` scope error used by the catalog/gallery modules.
- **Rationale**: Single, stable, already-normalized error contract.
- **Alternatives considered**: New error codes — rejected (would break the standardized envelope).

## R8 — Migration

- **Decision**: Generate the migration with `prisma migrate diff` (live DB → schema) and apply with `prisma migrate deploy`; regenerate the Prisma client.
- **Rationale**: Avoids needing a shadow database (Supabase) and keeps a versioned migration file, consistent with the `013` review migration.
- **Alternatives considered**: `prisma migrate dev` — rejected (requires a shadow DB that is not guaranteed on the managed Postgres).
