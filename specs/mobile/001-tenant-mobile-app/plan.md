# Implementation Plan: Tenant Mobile App

**Branch**: `001-tenant-mobile-app` | **Date**: 2026-10-24 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/mobile/001-tenant-mobile-app/spec.md`

## Summary

Initialize `apps/mobile` as an Expo SDK 58 / React Native 0.88 workspace for tenant administrators, using Expo Router with a protected `(auth)/login` flow and a three-tab administration dashboard (agenda, notifications, configuration). Reuse Supabase Auth as the identity provider and the existing Foundly GraphQL API for tenant-scoped data. Add Expo push-notification infrastructure (permission flow, Expo push token capture, registration/unregistration against the API) and the minimal API contract extensions required to read the owner's business profile and persist device tokens. Normalize the monorepo to pnpm + Turborepo and prove the mobile gates (`typecheck`, `lint`) run clean.

## Technical Context

**Language/Version**: TypeScript 5.9 (strict), Node.js 24.11 (minimum 22.13), React 19.3, React Native 0.88, Expo SDK 58

**Primary Dependencies**: `expo`, `expo-router`, `expo-constants`, `expo-device`, `expo-notifications`, `expo-secure-store`, `expo-linking`, `expo-splash-screen`, `@supabase/supabase-js`, `@tanstack/react-query`, `graphql`, `graphql-request`, `react-native-safe-area-context`, `react-native-screens`, `@expo/vector-icons`; dev: `@graphql-codegen/cli`, `typescript`, `jest-expo`, `@testing-library/react-native`

**Storage**: Supabase session in chunked `expo-secure-store`; non-sensitive query cache in memory via React Query; API data in PostgreSQL through existing `@foundly/database` (server-side only, never bundled); new `PushDeviceToken` table

**Testing**: `jest-expo` + `@testing-library/react-native` for component/hook tests; `tsc --noEmit`; root flat ESLint; manual Expo development-build validation for push

**Target Platform**: iOS 15.1+ and Android minSdk 24 (Expo SDK 58 baseline), phones and tablets, portrait and landscape

**Project Type**: Mobile application inside an npm/pnpm monorepo, plus a contract extension to the existing NestJS GraphQL API

**Performance Goals**: cold start to interactive login ≤ 3 s on a mid-range device; agenda first render ≤ 3 s p95 on normal connectivity; 60 fps scrolling; bundle export succeeds for iOS and Android

**Constraints**: no cross-tenant data leakage; offline-tolerant read paths with cached data and retry; secrets never embedded in `EXPO_PUBLIC_*`; remote push requires a development build; Expo Go does not support remote push since SDK 53

**Scale/Scope**: tenant administrators; 3 primary tabs + login; agenda range up to 31 days and 100 notifications per page; device tokens per tenant in the low thousands

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| Gate                                                         | Source                                      | Status                                                                                                             |
| ------------------------------------------------------------ | ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Spec exists and references `specs/business-model.md`         | Constitution §5.I                           | PASS — spec cites business model and respects plan limits                                                          |
| Spec lives under `/specs/<domain>/<nnn>-feature`             | Constitution §2.III                         | PASS — `specs/mobile/001-tenant-mobile-app` (new `mobile` domain approved by the user)                             |
| Routes are thin and delegate to module views                 | Constitution §3.I, §7                       | PASS — `app/**` files only compose providers and render `<Module>View`                                             |
| Data access separated from UI; module `services`/`hooks`     | Constitution §5.VI (adapted to mobile)      | PASS — GraphQL only in `src/modules/*/services.ts`; UI consumes `hooks.ts`                                         |
| Shared code lives in `packages/`; packages never import apps | Constitution §3.II                          | PASS — no new shared package; `@foundly/database` is type-only; `packages/ui` is web-only and not imported         |
| Design tokens, no magic colors                               | Constitution §6 / `code-rules.md`           | PASS — local RN token module derived from the Clean Light palette; ESLint guard                                    |
| Strict TypeScript                                            | `code-rules.md`                             | PASS — `strict`, `noUncheckedIndexedAccess`, no `any` escape hatches                                               |
| Quality gates                                                | Constitution §8                             | PASS — `pnpm --filter @foundly/mobile typecheck` and `lint` are acceptance gates                                   |
| Documentation of the new app/domain                          | Constitution §2/§3, `specs/architecture.md` | CONDITIONAL — the `mobile` domain and Expo stack must be added to governance docs as the first implementation task |

**Justified deviations**

1. **New domain and stack**: the constitution lists only `shared-ui`, `landing`, `book`, `store`, `api` and a web-only stack. The user explicitly approved adding the `mobile` domain. Resolution: amend `constitution.md` §2/§3 and `specs/architecture.md` in the first task, before production code.
2. **Package manager/task runner change**: the repository currently uses npm workspaces with no `turbo.json`. The feature requires pnpm and Turborepo. This is an intentional, repo-wide tooling migration, tracked in Complexity Tracking and validated by running all existing app gates after migration.
3. **API contract extension inside a mobile spec**: `myBusiness` and push-token persistence are required by the mobile acceptance criteria but belong to the API surface. They are documented in `contracts/data-operations.graphql.md` and delivered as a small API workstream, reusing the notifications module rather than creating a parallel service.

**Post-Phase 1 re-check**: PASS, subject to the same conditional governance amendment. No design artifact violates the hierarchy of authority.

## Project Structure

### Documentation (this feature)

```text
specs/mobile/001-tenant-mobile-app/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── auth-session.contract.md
│   ├── data-operations.graphql.md
│   ├── navigation.contract.md
│   └── push-notifications.contract.md
├── checklists/
│   └── requirements.md
└── tasks.md              # created by /speckit.tasks
```

### Source Code (repository root)

```text
apps/mobile/
├── app/                              # Thin Expo Router routes only
│   ├── _layout.tsx                   # Providers, splash, protected stack
│   ├── index.tsx                     # Session bootstrap redirect
│   ├── (auth)/
│   │   ├── _layout.tsx
│   │   └── login.tsx                 # renders <LoginView />
│   └── (tabs)/
│       ├── _layout.tsx               # Agenda / Notificaciones / Configuración
│       ├── index.tsx                 # renders <AgendaView />
│       ├── notificaciones.tsx        # renders <NotificationsView />
│       └── configuracion.tsx         # renders <SettingsView />
├── src/
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── components/           # LoginForm, PasswordField
│   │   │   ├── hooks.ts              # useSignIn, useSignOut
│   │   │   ├── services.ts           # Supabase calls
│   │   │   ├── schemas.ts            # login validation
│   │   │   └── LoginView.tsx
│   │   ├── agenda/
│   │   │   ├── components/           # AppointmentCard, AgendaSkeleton, EmptyAgenda
│   │   │   ├── hooks.ts              # useAgenda
│   │   │   ├── services.ts           # myAppointments
│   │   │   ├── date-range.ts
│   │   │   └── AgendaView.tsx
│   │   ├── notifications/
│   │   │   ├── components/
│   │   │   ├── hooks.ts              # useNotifications, useMarkRead
│   │   │   ├── services.ts
│   │   │   └── NotificationsView.tsx
│   │   └── settings/
│   │       ├── components/
│   │       ├── hooks.ts              # useMyBusiness, useUpdatePublicPage
│   │       ├── services.ts
│   │       └── SettingsView.tsx
│   └── shared/
│       ├── api/
│       │   ├── client.ts             # graphql-request + bearer + timeout
│       │   ├── error-surface.ts
│       │   ├── generated.ts           # codegen output (gitignored)
│       │   └── result.ts
│       ├── auth/
│       │   ├── session-context.tsx
│       │   ├── supabase.ts
│       │   ├── secure-storage.ts
│       │   └── guards.ts
│       ├── notifications/
│       │   ├── push.ts               # permissions, channel, token capture
│       │   └── use-push-registration.ts
│       ├── theme/tokens.ts
│       ├── ui/                       # Button, TextField, Screen, EmptyState, ErrorState, Skeleton
│       └── config/env.ts
├── assets/
├── codegen.schema.gql                # versioned API SDL snapshot
├── codegen.ts
├── app.config.ts
├── eas.json
├── metro.config.js
├── tsconfig.json
├── package.json
├── .env.example
└── README.md

# Root additions / changes
pnpm-workspace.yaml
.npmrc                                # node-linker=hoisted
turbo.json
package.json                          # packageManager, turbo scripts, workspace:*
pnpm-lock.yaml                        # replaces package-lock.json
eslint.config.js                      # ignore .expo/dist; mobile rules

# API additions (small contract workstream)
apps/api/src/modules/tenants/         # myBusiness query
apps/api/src/modules/notifications/   # push token store, mutations, Expo delivery
packages/database/prisma/schema.prisma # PushDeviceToken model + migration
```

**Structure Decision**: Mobile app follows the constitution's thin-route + `modules/` + `shared/` pattern, adapted to Expo Router's `app/` directory. Root tooling moves to pnpm/Turbo without changing app-internal boundaries. No new shared package is created; RN primitives stay local until a second consumer exists.

## Complexity Tracking

| Violation                                               | Why Needed                                                                       | Simpler Alternative Rejected Because                                                         |
| ------------------------------------------------------- | -------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| New `mobile` domain + Expo/RN stack not in constitution | The feature explicitly creates `apps/mobile`; user approved the domain           | Forcing the app under `book` would misrepresent ownership and break the spec-per-domain rule |
| Repo-wide npm → pnpm migration and Turborepo adoption   | Explicit feature requirement; required for `pnpm --filter @foundly/mobile` gates | Keeping npm alongside pnpm creates two lockfiles and non-reproducible installs               |
| API changes inside the mobile spec                      | No owner-profile query and no device-token persistence exist today               | Mocking these on the client would break the end-to-end push and profile flows                |
| Local RN UI primitives instead of `packages/ui`         | `packages/ui` is MUI/web-only and cannot render in React Native                  | Forcing MUI into RN is technically impossible; a new shared RN package is premature          |
