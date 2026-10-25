# Research: Mobile Services Module

**Feature**: `specs/mobile/003-services-module/spec.md`
**Date**: 2026-10-25

## R1 — API surface

**Decision**: Reuse the existing `myServices`, `createMyService`, `updateMyService` and `deleteMyService` operations.

**Rationale**: `apps/api/src/modules/services` already exposes them and `apps/book` consumes the same contract. No NestJS DTO/controller work is needed.

**Alternatives considered**: Creating mobile-specific endpoints — rejected (duplication).

## R2 — Data access pattern

**Decision**: Keep operations in `apps/mobile/src/modules/services/services.graphql`, transport in `services.ts`, and TanStack Query in `hooks.ts`.

**Rationale**: Aligns with `constitution.md` §5.VI and the existing mobile modules.

## R3 — Money and advance conversion

**Decision**: Store euros in the form and convert to cents at the service boundary:
- Price: `Math.round(value * 100)`.
- Fixed advance: `Math.round(value * 100)`.
- Percentage advance: send the integer percentage unchanged.

**Rationale**: API fields are integer cents/percent values; the web module follows the same rule.

## R4 — Loading and refresh

**Decision**: Use `LoadingState` (screen/overlay variants), `RefreshControl` and mutation pending flags.

**Rationale**: Reuses the shared loading primitive introduced for the mobile app and satisfies the loading rule.

## R5 — Currency

**Decision**: Display prices in EUR using `Intl.NumberFormat('es-ES')`.

**Rationale**: Matches the Book admin local currency and current tenant defaults.
