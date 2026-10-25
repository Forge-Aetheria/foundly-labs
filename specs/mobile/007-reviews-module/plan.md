# Implementation Plan: Mobile Reviews Module

**Branch**: `007-reviews-module` | **Date**: 2026-10-25 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/mobile/007-reviews-module/spec.md`

## Summary

Replace the mobile Reseñas placeholder with a moderation surface backed by the existing GraphQL API. The module lists tenant reviews, filters them by moderation state, approves or rejects reviews, and deletes them with confirmation.

Only approved reviews are public. Review creation remains part of the public booking flow and is out of scope for the mobile admin module.

## Technical Context

**Language/Version**: TypeScript 5.9 strict, React 19.3, React Native 0.88, Expo SDK 58.

**Primary Dependencies**: `@tanstack/react-query`, `graphql-request`, `@expo/vector-icons`, generated GraphQL types.

**Storage**: No new persistence. Existing `Review` model and GraphQL API.

**Testing**: Jest 30 + `jest-expo` + RNTL. Add pure helper tests for filters, labels and validation.

**Target Platform**: iOS and Android.

**Project Type**: Mobile app inside the pnpm/Turborepo monorepo.

**Performance Goals**: Review list visible in under 2 seconds; moderation reflected in under 2 seconds.

**Constraints**: Reuse `LoadingState`, `EmptyState`, `ErrorState`, `Button` and tokens; no direct data calls in UI; codegen-only types.

**Scale/Scope**: One tenant review inbox; list/filter/approve/reject/delete.

## Constitution Check

| Gate | Status | Evidence |
| ---- | ------ | -------- |
| SDD and governance references | PASS | Spec exists and references required documents. |
| Mobile spec location | PASS | `specs/mobile/007-reviews-module/`. |
| Module data layer | PASS | `services.ts` + `hooks.ts`; UI uses hooks. |
| Codegen-only contracts | PASS | `reviews.graphql` and generated types. |
| Reuse principle 5.VII | PASS | Reuses shared UI and loading primitives. |
| Design tokens | PASS | Components use `@/shared/theme/tokens`. |
| Thin routes | PASS | `app/(drawer)/resenas.tsx` renders `ReviewsView`. |
| Verification | PASS | Typecheck, lint, tests and export planned. |

## Project Structure

```text
specs/mobile/007-reviews-module/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/reviews-ui.contract.md
├── checklists/requirements.md
└── tasks.md

apps/mobile/
├── app/(drawer)/resenas.tsx
└── src/modules/reviews/
    ├── reviews.graphql
    ├── services.ts
    ├── hooks.ts
    ├── review-utils.ts
    ├── ReviewsView.tsx
    ├── components/ReviewCard.tsx
    └── __tests__/review-utils.test.ts
```

## Risks and Mitigations

| Risk | Mitigation |
| ---- | ---------- |
| Invalid moderation transitions | Disable approve on approved and reject on rejected. |
| Duplicate submissions | Disable actions while mutations are pending. |
| Stale list after web/mobile changes | Invalidate `['reviews', tenantId]` on settle. |
| Long comments/poor readability | Card layout with line limits and clear typography. |
| Filter with no results | Dedicated empty message inside the filtered view. |
| API errors on moderation | Show inline error and keep the current list. |

## Complexity Tracking

No violations. No new backend endpoints or abstractions.
