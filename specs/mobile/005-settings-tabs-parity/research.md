# Research: Mobile Settings Tabs Parity

**Feature**: `specs/mobile/005-settings-tabs-parity/spec.md`
**Date**: 2026-10-25

## R1 — API surface

**Decision**: Reuse `MyBusiness`, `UpdateMyBusinessProfile`, `MyPaymentMethods`, `UpsertPaymentMethod` and `DeletePaymentMethod`.

**Rationale**: The web admin already consumes the same contracts; no API changes are needed.

## R2 — Password change

**Decision**: Implement password change directly against Supabase Auth: `getUser`, `signInWithPassword` with the current password, then `updateUser({ password })`.

**Rationale**: Mirrors the Book security flow without introducing API endpoints.

## R3 — Logo and image uploads

**Decision**: Use the shared `pickAndUploadTenantImage(tenantId, 'logo')` helper and keep a manual URL field.

**Rationale**: Reuse principle 5.VII; web also supports upload + URL fallback.

## R4 — Payment method details

**Decision**: Store structured details as a JSON string in `details`, with parse/serialize helpers and per-type field lists.

**Rationale**: The API field is a string; the web module applies the same serialization.

## R5 — Tabs and loading

**Decision**: Local tab state with three panels, each managing its own scroll and loading. Use `LoadingState` overlay for refetches and button pending states for mutations.

**Rationale**: Keeps state independent and avoids a navigation-level tab dependency.
