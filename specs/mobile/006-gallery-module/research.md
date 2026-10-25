# Research: Mobile Gallery Module

**Feature**: `specs/mobile/006-gallery-module/spec.md`
**Date**: 2026-10-25

## R1 — API surface

**Decision**: Reuse `gallery(tenantId)`, `addGalleryItem` and `removeGalleryItem`.

**Rationale**: `apps/api/src/modules/gallery` already exposes them and `apps/book` consumes the same operations. No NestJS DTO/controller work is required.

**Alternatives considered**: Creating edit/reorder mutations — rejected for this iteration; the API does not expose them and the spec scopes them out.

## R2 — Tenant scoping

**Decision**: Query `gallery` with the authenticated `tenantId`, matching the web module.

**Rationale**: The query accepts `tenantId` and returns only that tenant’s photos.

## R3 — Image source

**Decision**: Support both the shared image picker/upload helper and a manual URL field.

**Rationale**: Reuses `pickAndUploadTenantImage(tenantId, 'gallery')` and keeps a fallback for images already hosted elsewhere, matching the web flow.

## R4 — Categories

**Decision**: Mirror the closed category set from web: `local`, `trabajos`, `equipo`.

**Rationale**: The API stores category as a free string; the closed set keeps parity. The mobile app cannot value-import from `@foundly/database` due to lint rules, so a small local constants file is used.

## R5 — Loading, refresh and images

**Decision**: Use `LoadingState` (screen/overlay), `RefreshControl`, mutation pending flags and per-photo image error fallback.

**Rationale**: Consistent with Services/Team and avoids empty screens or broken layouts.

## R6 — Editing and reordering

**Decision**: Out of scope for this version.

**Rationale**: No API mutation exists for updating metadata or `sortOrder`. The spec documents this explicitly.
