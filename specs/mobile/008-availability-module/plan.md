# Implementation Plan: Mobile Availability Module

**Branch**: `008-availability-module` | **Date**: 2026-10-25 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/mobile/008-availability-module/spec.md`

## Summary

Replace the mobile Disponibilidad placeholder with a weekly schedule editor and time-block manager backed by the existing GraphQL API. The view loads tenant availability rules and time blocks, allows opening/closing days and editing hours, saves the weekly schedule via create/update/remove reconciliation, and supports adding/deleting time blocks with confirmation.

No backend or database changes are required: `availability`, `timeBlocks`, availability mutations and time-block mutations already exist.

## Technical Context

**Language/Version**: TypeScript 5.9 strict, React 19.3, React Native 0.88, Expo SDK 58.

**Primary Dependencies**: `@tanstack/react-query`, `graphql-request`, generated GraphQL types.

**Storage**: No new persistence. Existing `Availability` and `TimeBlock` models.

**Testing**: Jest 30 + `jest-expo` + RNTL. Add helper tests for schedule mapping, time validation and block formatting.

**Target Platform**: iOS and Android.

**Project Type**: Mobile app inside the pnpm/Turborepo monorepo.

**Performance Goals**: Availability visible in under 2 seconds; schedule save reflected in under 2 seconds.

**Constraints**: Reuse `LoadingState`, `EmptyState`, `ErrorState`, `Button`, `TextField` and tokens; no direct data calls in UI; codegen-only types.

**Scale/Scope**: Seven-day weekly schedule + tenant time blocks; no specialist selector.

## Constitution Check

| Gate | Status | Evidence |
| ---- | ------ | -------- |
| SDD and governance references | PASS | Spec exists and references required documents. |
| Mobile spec location | PASS | `specs/mobile/008-availability-module/`. |
| Module data layer | PASS | `services.ts` + `hooks.ts`; UI uses hooks. |
| Codegen-only contracts | PASS | `availability.graphql` and generated types. |
| Reuse principle 5.VII | PASS | Reuses shared loading/empty/error/button/text primitives. |
| Design tokens | PASS | Components use `@/shared/theme/tokens`. |
| Thin routes | PASS | `app/(drawer)/disponibilidad.tsx` renders `AvailabilityView`. |
| Verification | PASS | Typecheck, lint, tests and export planned. |

## Project Structure

```text
specs/mobile/008-availability-module/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/availability-ui.contract.md
├── checklists/requirements.md
└── tasks.md

apps/mobile/
├── app/(drawer)/disponibilidad.tsx
└── src/modules/availability/
    ├── availability.graphql
    ├── services.ts
    ├── hooks.ts
    ├── availability-utils.ts
    ├── AvailabilityView.tsx
    ├── components/WeeklyScheduleCard.tsx
    ├── components/TimeBlockCard.tsx
    ├── components/TimeBlockFormModal.tsx
    └── __tests__/availability-utils.test.ts
```

## Risks and Mitigations

| Risk | Mitigation |
| ---- | ---------- |
| Invalid time ranges | Validate end > start before saving/adding. |
| Partial weekly save | Reconcile rules sequentially and stop on first error, preserving form state. |
| Time string formatting | Centralize `HH:mm`/`YYYY-MM-DD` helpers and test them. |
| Stale rules after save | Invalidate `['availability', tenantId]` and `['time-blocks', tenantId]`. |
| Duplicate mutations | Disable actions and show pending states. |
| Time block day-full semantics | Convert full-day to `00:00–23:59` explicitly. |

## Complexity Tracking

No violations. No new backend endpoints; the complexity is the weekly reconciliation already established in the web module.
