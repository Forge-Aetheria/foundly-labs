# Implementation Plan: Mobile Support and About Pages

**Branch**: `009-support-about-pages` | **Date**: 2026-10-25 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/mobile/009-support-about-pages/spec.md`

## Summary

Replace the remaining mobile placeholders `/soporte` and `/about` with static informational screens. Support presents FAQ items and a contact channel; About presents Foundly branding, app version, product description and institutional/legal links.

No API, persistence or data loading is required. Both screens reuse existing UI primitives and design tokens, and external links open through the platform link handler with error handling.

## Technical Context

**Language/Version**: TypeScript 5.9 strict, React 19.3, React Native 0.88, Expo SDK 58.

**Primary Dependencies**: `expo-router`, `expo-constants` (app version), `expo-linking`/React Native `Linking`, `@expo/vector-icons`, existing UI primitives.

**Storage**: None.

**Testing**: Jest 30 + `jest-expo` + RNTL. Add tests for static content integrity and link validation.

**Target Platform**: iOS and Android.

**Project Type**: Mobile app inside the pnpm/Turborepo monorepo.

**Performance Goals**: Both pages render instantly from static content; no network dependency.

**Constraints**: Reuse `Screen`, `AppText`, `Button` and tokens; safe external links; Spanish content; no API calls.

**Scale/Scope**: Two static screens: Support FAQ/contact and About product/legal links.

## Constitution Check

| Gate | Status | Evidence |
| ---- | ------ | -------- |
| SDD and governance references | PASS | Spec exists and references required documents. |
| Mobile spec location | PASS | `specs/mobile/009-support-about-pages/`. |
| Module data layer | N/A | Static content only; no data access. |
| Codegen-only contracts | N/A | No GraphQL operations. |
| Reuse principle 5.VII | PASS | Reuses shared UI primitives and tokens. |
| Design tokens | PASS | Components use `@/shared/theme/tokens`. |
| Thin routes | PASS | `/soporte` and `/about` render their views only. |
| Verification | PASS | Typecheck, lint, tests and export planned. |

## Project Structure

```text
specs/mobile/009-support-about-pages/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/support-about-ui.contract.md
├── checklists/requirements.md
└── tasks.md

apps/mobile/
├── app/(drawer)/soporte.tsx
├── app/(drawer)/about.tsx
└── src/modules/
    ├── support/
    │   ├── support-content.ts
    │   └── SupportView.tsx
    └── about/
        ├── about-content.ts
        └── AboutView.tsx
```

## Risks and Mitigations

| Risk | Mitigation |
| ---- | ---------- |
| Invented/invalid support contact | Keep contact values in a single content file; validate `mailto:`/`https:` before opening. |
| Broken external links | Wrap `Linking.openURL` in try/catch and show an inline message. |
| Version missing | Use `Constants.expoConfig?.version ?? '0.1.0'` fallback. |
| Long FAQ content | ScrollView and expandable answer rows. |
| Content drift across apps | Static content is scoped to mobile; link to public Foundly resources for legal text. |

## Complexity Tracking

No violations. No new data layer or backend work.
