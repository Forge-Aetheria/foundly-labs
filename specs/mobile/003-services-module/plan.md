# Implementation Plan: Mobile Services Module

**Branch**: `003-services-module` | **Date**: 2026-10-25 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/mobile/003-services-module/spec.md`

## Summary

Replace the mobile Services placeholder with a functional catalog backed by the existing GraphQL API. The module lists tenant services, supports create/edit/delete, handles advance rules, and reuses the established mobile patterns for queries, mutations, loading overlays, empty states, errors and destructive confirmations.

No backend or database changes are required: `apps/api` already exposes the service operations and `packages/database` already models `Service`.

## Technical Context

**Language/Version**: TypeScript 5.9 strict, React 19.3, React Native 0.88, Expo SDK 58, Expo Router 58.

**Primary Dependencies**: `@tanstack/react-query`, `graphql-request`, `@expo/vector-icons`, generated GraphQL documents/types.

**Storage**: No new persistence. Existing Supabase session + GraphQL API.

**Testing**: Jest 30 + `jest-expo` + `@testing-library/react-native`.

**Target Platform**: iOS and Android.

**Project Type**: Mobile app inside the pnpm/Turborepo monorepo.

**Performance Goals**: Service list visible in under 2 seconds; mutations reflected in under 2 seconds under normal connectivity.

**Constraints**: No direct data calls in UI; no manual GraphQL DTOs; tokenized colors; Spanish UI; EUR currency in mobile forms.

**Scale/Scope**: One tenant catalog; create/edit/delete/list; advance rule support.

## Constitution Check

| Gate | Status | Evidence |
| ---- | ------ | -------- |
| `business-model.md` authority and SDD | PASS | Spec exists and references governance documents. |
| Mobile domain spec location | PASS | `specs/mobile/003-services-module/`. |
| Module data layer | PASS | `services.ts` + `hooks.ts`; UI consumes hooks only. |
| Codegen-only contracts | PASS | Operations in `services.graphql`; generated types used. |
| Design tokens | PASS | Components use `@/shared/theme/tokens`. |
| Thin routes | PASS | `app/(drawer)/servicios.tsx` renders `ServicesView` only. |
| Verification | PASS | `typecheck`, `lint`, `test`, `expo export` executed. |

## Project Structure

### Documentation

```text
specs/mobile/003-services-module/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/services-ui.contract.md
├── checklists/requirements.md
└── tasks.md
```

### Source Code

```text
apps/mobile/
├── app/(drawer)/servicios.tsx
└── src/modules/services/
    ├── services.graphql
    ├── services.ts
    ├── hooks.ts
    ├── service-form.ts
    ├── ServicesView.tsx
    ├── components/ServiceFormModal.tsx
    └── __tests__/service-form.test.ts
```

**Structure Decision**: Domain module under `src/modules/services`, thin route under `app/(drawer)`, shared UI primitives reused.

## Risks and Mitigations

| Risk | Mitigation |
| ---- | ---------- |
| Currency conversion errors | Centralize euro/cents conversion in `service-form.ts` and unit-test it. |
| Invalid advance rules | Validate fixed > 0 and percent ≤ 100 before mutation. |
| Duplicate submissions | Disable actions and show loading while mutations are pending. |
| Stale list after mutations | Invalidate the `['services', tenantId]` query on settle. |
| Empty flashes | Full loading state, overlay on refresh and explicit empty state. |

## Complexity Tracking

No constitution violations. No new abstractions beyond the established module pattern.
