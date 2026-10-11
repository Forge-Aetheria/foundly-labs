# Data Model: Foundly Book — Staff Management

**Feature**: `specs/book/005-staff-management/` | **Date**: 2026-10-10

## Changes to existing entities

### Resource (Professional) — `apps/book/src/domain/appointments/types.ts`

Adds the services the professional performs:

```ts
export interface Resource {
  id: string;
  name: string;
  type: ResourceType;       // 'professional' | 'room' | 'asset'
  active: boolean;
  timezone: string;
  tenantId: string;
  role: string | null;
  avatar: string | null;
  bio: string | null;
  /** NEW — service catalog ids assigned to this professional (multi-select). */
  serviceIds?: string[];
}
```

Rules:

- `serviceIds` is optional (defaults to `[]` when absent) so existing fixtures/tests stay valid.
- Service ids must belong to services of the same `tenantId` (validated in the actions).
- Deactivation/removal never alters existing `Appointment`s (FR-014 remains).

### Service — unchanged

The tenant catalog (`/admin/services` → `listServices(tenantId)`) is both the source of the modal
multi-select and the resolver for public service badges.

## Derived / read surface

### Public specialist (`apps/book/src/features/public-booking/types.ts`)

```ts
export interface PublicSpecialist {
  id: string;
  name: string;
  role: string | null;
  avatar: string | null;
  bio: string | null;
  /** NEW — resolved service names for the assigned catalog services. */
  services?: string[];
}
```

`getPublicBusiness` maps `resource.serviceIds` → `Service.name` (same tenant) and exposes them on
the public team cards; inactive resources continue to be excluded.

## Relationships

A `Tenant` owns many `Resource`s and many `Service`s; a `Resource` references 0..n `Service`s via
`serviceIds`. The public portal resolves the roster from the tenant's active resources and the
service names from the tenant's own catalog.