# Research: Mobile Team Module

**Feature**: `specs/mobile/004-team-module/spec.md`
**Date**: 2026-10-25

## R1 — API surface and the services gap

**Decision**: Use `specialists(tenantId)` for the list and `mySpecialists`-based mutations for writes.

**Rationale**: `MySpecialist` omits assigned services, while `SpecialistObject` from `specialists` includes them. Mutation endpoints `createMySpecialist`, `updateMySpecialist`, `deleteMySpecialist`, `assignServiceToSpecialist` and `unassignServiceFromSpecialist` already exist. No backend change is required.

**Alternatives considered**: Extending `MySpecialist` with services — rejected for this iteration because it requires an API deployment; the public query already provides the data.

## R2 — Service assignment synchronization

**Decision**: Diff the member’s current service ids against the selected ids and call unassign/assign only for the differences.

**Rationale**: Avoids unnecessary mutations and handles both additions and removals in one save flow.

## R3 — Avatar management

**Decision**: Reuse the shared `pickAndUploadTenantImage(tenantId, 'avatar')` helper and preview with `SessionAvatar`.

**Rationale**: Satisfies the reuse principle and avoids duplicating image-picker/storage logic from Settings.

## R4 — Identity and initials

**Decision**: Reuse `initialsFrom` from `shared/navigation/session-identity`.

**Rationale**: One implementation for avatar fallbacks across header, drawer, settings and team.

## R5 — Loading, refresh and errors

**Decision**: Use `LoadingState` (screen/overlay), `RefreshControl`, mutation pending flags and inline alert messages.

**Rationale**: Consistent with Services and the global mobile loading policy.
