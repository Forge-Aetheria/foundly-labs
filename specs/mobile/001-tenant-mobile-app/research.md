# Research: Tenant Mobile App

**Feature**: `specs/mobile/001-tenant-mobile-app` | **Date**: 2026-10-24

## Decision 1 — Expo SDK and runtime baseline

**Decision**: Expo SDK 58 (React Native 0.88, React 19.3.0) with the Expo Router template and New Architecture enabled.

**Rationale**: SDK 58 is the current stable line (released October 2026) and matches the repository's Node 24.11 runtime (minimum Node 22.13). It keeps React aligned with the existing React 19.3 web apps and gives first-class Expo Router support. New Architecture is the default and is required by the current Expo module ecosystem.

**Alternatives considered**:

- Expo SDK 57 (RN 0.86): stable but one cycle behind; no benefit for a greenfield app.
- Bare React Native without Expo: loses Expo Router, config plugins, EAS and the notifications toolchain; contradicts the request and adds native maintenance.
- Expo SDK 59 pre-release: not stable, rejected for a production-bound app.

## Decision 2 — Monorepo package manager and task runner

**Decision**: Adopt pnpm 10 (via Corepack) with `pnpm-workspace.yaml`, `node-linker=hoisted` in `.npmrc`, and Turborepo 2.x at the root. Migrate local dependency specs to `workspace:*` and replace `package-lock.json` with `pnpm-lock.yaml`. Root `dev`, `build`, `typecheck`, `lint` and `test` scripts delegate to `turbo run`.

**Rationale**: The feature explicitly requires pnpm and Turborepo. `node-linker=hoisted` is the low-risk setting for React Native/Metro, which still assumes a flat `node_modules` for native modules. Turbo gives cached, dependency-aware tasks and a single `--filter @foundly/mobile` entry point. Node 24 satisfies both pnpm 10 and Expo SDK 58.

**Alternatives considered**:

- Keep npm workspaces and only use pnpm for the mobile app: violates the request and creates two lockfiles/sources of truth.
- pnpm isolated node_modules: faster/leaner but a known source of Metro resolution failures for RN native modules.
- Nx: heavier than needed and not requested; Turbo is the requested tool.

## Decision 3 — Metro configuration for the pnpm workspace

**Decision**: Use `expo/metro-config` with `watchFolders` pointing at the monorepo root and `nodeModulesPaths` covering both the app and root `node_modules`. Add `.npmrc` (`node-linker=hoisted`), and configure `unstable_enableSymlinks` only if Metro reports symlink resolution issues.

**Rationale**: Expo monorepos require Metro to watch shared workspace code and resolve hoisted dependencies. Keeping the root in `watchFolders` allows type-only imports from `@foundly/database` and any future shared package without breaking the bundler.

**Alternatives considered**:

- Duplicate shared types inside the app: violates the no-duplication rule and drifts from the API.
- Custom Metro resolver from scratch: unnecessary; Expo's monorepo support covers this case.

## Decision 4 — Navigation shell

**Decision**: Expo Router with a root stack, an `(auth)` group containing `login`, and a `(tabs)` group containing `index` (agenda), `notificaciones` and `configuracion`. Use protected-route guards (`Stack.Protected` / redirect) driven by the session provider. Index of the tabs is the agenda.

**Rationale**: Three primary admin destinations fit the bottom tab bar better than a drawer on phones; Expo Router's protected routes remove the flash of protected content before redirect. Thin route files re-export module views, preserving the constitution's route → module pattern.

**Alternatives considered**:

- Drawer navigation: heavier, less discoverable for three destinations, and awkward on phones.
- Manual `useEffect` redirects: race conditions and content flashes; protected routes are the supported pattern.

## Decision 5 — Authentication and session storage

**Decision**: Authenticate against the same Supabase project as `apps/book` with `@supabase/supabase-js` (`signInWithPassword`). Persist the session with a chunked `expo-secure-store` adapter, enable `autoRefreshToken` and refresh on `AppState` foreground. Inject the access token as a Bearer header per GraphQL request. The tenant is resolved from verified claims, never from client input.

**Rationale**: The API already verifies Supabase JWTs (`iss`, `aud=authenticated`, `ES256/RS256`, `tenant_id` claim) and the web admin uses the same identity provider. Secure storage avoids persisting refresh tokens in plaintext AsyncStorage. Per-request token injection prevents stale cross-tenant credentials.

**Alternatives considered**:

- AsyncStorage only: simpler but stores session tokens unencrypted; rejected for security.
- Custom credential login against the API: no such endpoint exists; Supabase is the current identity seam.
- Long-lived token in memory only: breaks session persistence across app restarts.

## Decision 6 — Data access and GraphQL client

**Decision**: Use `graphql-request` with `graphql-codegen` (`typescript`, `typescript-operations`, `typed-document-node`) against a versioned SDL snapshot in `apps/mobile/codegen.schema.gql`. Wrap calls in `@tanstack/react-query` hooks inside each module (`hooks.ts`/`services.ts`). Map GraphQL `extensions.code` to a typed `ActionResult`, as `apps/book` already does.

**Rationale**: Reuses the proven transport/error conventions of the web admin and keeps the UI free of data calls. React Query provides caching, retry, refresh, loading/empty/error states and tenant-scoped invalidation without bespoke state code. A schema snapshot keeps `typecheck` deterministic and offline.

**Alternatives considered**:

- Apollo Client for React Native: full-featured but heavier and duplicates the existing web transport choice.
- Hand-written fetch/SDK: loses generated types and multiplies drift risk.
- Server Actions: not available in React Native.

## Decision 7 — Push notifications

**Decision**: Use `expo-notifications`, `expo-device` and `expo-constants`. Request permission only after authentication, create an Android channel, resolve the Expo push token with the EAS `projectId`, and register/unregister it through new GraphQL mutations. Use an Expo development build for remote-push validation (Expo Go does not support remote push since SDK 53). Route notification taps to the notifications tab.

**Rationale**: Expo push is the requested provider and the only one that works uniformly with Expo-managed credentials. Deferring the permission prompt until after login improves acceptance and matches the spec. Dev builds are mandatory for realistic remote-push testing.

**Alternatives considered**:

- Request permission on first launch: worse acceptance and no tenant context.
- Native FCM/APNs directly: more setup, platform-specific code and credential management; unnecessary with Expo.
- Expo Go for push validation: not supported; would give false negatives.

## Decision 8 — Backend contract extension required by the app

**Decision**: Extend the Foundly API (not create a new service) with:

1. `myBusiness: TenantObject!` authenticated query returning the caller's full tenant/profile/publication state.
2. `registerPushToken(input: RegisterPushTokenInput!): PushTokenObject!` and `unregisterPushToken(token: String!): Boolean!` mutations, tenant-scoped from the JWT.
3. A persisted `PushDeviceToken` model (unique token, tenant, user, platform, timestamps).
4. Push delivery on notification creation using the Expo Push API, including cleanup of `DeviceNotRegistered` tokens.

**Rationale**: The current API has no way to read the owner's full profile (only `me`/`currentTenant` with id/status/plan) and no device-token storage, so the mobile flows cannot be completed against today's contract. Keeping the change inside the existing API preserves the domain boundary and reuses the notification module.

**Alternatives considered**:

- Reuse `tenant(slug)` with a locally cached slug: brittle, breaks on slug changes and first login.
- Store tokens only on the device: the backend could never target a tenant's devices.
- Email-only fallback: does not satisfy the push requirement.

## Decision 9 — Shared code boundaries

**Decision**: Do not reuse `packages/ui` (MUI/web-only) in React Native. Build a small local `src/shared/ui` primitive set and `src/shared/theme/tokens.ts` using the Clean Light palette. Link `@foundly/database` only through `import type` for domain enums/types, guarded by ESLint; all runtime contracts come from generated GraphQL types.

**Rationale**: Web MUI components cannot render in React Native, and importing the Prisma runtime into the mobile bundle would fail. Type-only imports keep a single source of truth for enums without shipping server code to the device.

**Alternatives considered**:

- Force `@foundly/ui` into RN: not technically viable.
- Duplicate enums: drift and no compile-time protection.
- New `packages/ui-native` now: valuable later, but out of scope for initialization.

## Decision 10 — Testing and quality gates

**Decision**: Use `jest-expo` with `@testing-library/react-native` for unit/component tests, plus `tsc --noEmit` and the root flat ESLint config. Add mobile-specific ESLint rules: no runtime import of `@foundly/database`, no GraphQL calls outside `services.ts`, no hex colors in mobile components.

**Rationale**: `jest-expo` is the maintained preset for Expo SDK 58 and supports the React Native transform. The lint rules mechanically enforce the module data-layer boundary required by the constitution.

**Alternatives considered**:

- Vitest: excellent for the web apps but lacks a first-class React Native preset.
- No component tests: the spec's empty/error/loading states are behaviorally important and cheap to cover.
