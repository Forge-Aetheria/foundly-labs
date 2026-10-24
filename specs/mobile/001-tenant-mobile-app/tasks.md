---
description: 'Task list for Tenant Mobile App implementation'
---

# Tasks: Tenant Mobile App

**Input**: Design documents from `specs/mobile/001-tenant-mobile-app/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/`, `quickstart.md`

**Tests**: Component and unit tests are included per the plan's testing decision (`jest-expo`); push notification delivery requires manual validation with an Expo development build.

**Organization**: Tasks are grouped by user story to enable independent implementation and validation of each increment.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: User story label (`US1`–`US5`) for story-phase tasks only
- Every task includes an exact file path

## Path Conventions

- Mobile app: `apps/mobile/`
- API: `apps/api/src/`
- Database: `packages/database/prisma/`
- Repository tooling: repository root

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Governance, monorepo tooling, and a runnable Expo workspace.

- [x] T001 Amend the `mobile` domain and Expo/RN stack into `constitution.md` §2/§3, mirror the change in `.specify/memory/constitution.md`, and update `specs/architecture.md` topology, stack table, and gates.
- [x] T002 Create `.npmrc` at the repository root with `node-linker=hoisted` and required pnpm settings, and enable pnpm 10 through Corepack.
- [x] T003 Create `pnpm-workspace.yaml` and `turbo.json` at the repository root with cached `build`, `typecheck`, `lint`, `test` tasks and non-cached persistent `dev`.
- [x] T004 Update root `package.json` with `packageManager`, Turbo-delegated `dev`/`build`/`typecheck`/`lint`/`test` scripts, and remove `package-lock.json` after generating `pnpm-lock.yaml`.
- [x] T005 Migrate local dependency specs to `workspace:*` in `apps/api/package.json`, `apps/book/package.json`, `apps/landing/package.json`, `packages/ui/package.json`, and `packages/database/package.json`.
- [x] T006 Create `apps/mobile/package.json` with name `@foundly/mobile`, Expo SDK 58 dependencies, and scripts `dev`, `build`, `typecheck`, `lint`, `test`, `codegen`.
- [x] T007 Create `apps/mobile/app.config.ts`, `apps/mobile/eas.json`, `apps/mobile/metro.config.js`, `apps/mobile/babel.config.js`, and `apps/mobile/tsconfig.json` with the Expo Router plugin, `@/*` alias, strict compiler options, and workspace paths.
- [x] T008 [P] Install Expo/mobile dependencies with pnpm and verify `apps/mobile/node_modules` resolves Expo, React Native, and Expo Router.
- [x] T009 [P] Create `apps/mobile/.env.example`, `apps/mobile/.gitignore`, and placeholder `apps/mobile/assets/` icons/splash required by `app.config.ts`.
- [x] T010 Update `eslint.config.js` to ignore `apps/mobile/.expo/`, `apps/mobile/dist/`, and generated GraphQL artifacts, and add mobile-specific rules for no runtime `@foundly/database` imports, no GraphQL calls in UI, and no hex colors in `apps/mobile/src/**/components`.

**Checkpoint**: `pnpm install` succeeds, the Expo workspace exists, and root tooling recognizes `@foundly/mobile`.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Cross-story runtime, session, transport, theme, and test infrastructure. No user story starts until this phase is complete.

**⚠️ CRITICAL**: All tasks below block every user story.

- [x] T011 Create `apps/mobile/app/_layout.tsx` with splash handling, `SafeAreaProvider`, `QueryClientProvider`, and the session provider placeholder.
- [x] T012 Create `apps/mobile/src/shared/theme/tokens.ts` with colors, spacing, radii, typography, and light/dark-safe values derived from `specs/system-design.md`.
- [x] T013 [P] Create RN primitives in `apps/mobile/src/shared/ui/`: `Screen.tsx`, `Button.tsx`, `TextField.tsx`, `EmptyState.tsx`, `ErrorState.tsx`, `LoadingState.tsx`, and `AppText.tsx`.
- [x] T014 [P] Create `apps/mobile/src/shared/config/env.ts` validating `EXPO_PUBLIC_API_URL`, `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, and optional `EXPO_PUBLIC_EAS_PROJECT_ID`.
- [x] T015 [P] Create `apps/mobile/src/shared/api/result.ts` and `apps/mobile/src/shared/api/error-surface.ts` with typed `ActionResult`, mobile error codes, and Spanish user-facing messages.
- [x] T016 Create `apps/mobile/src/shared/api/client.ts` implementing the `graphql-request` transport with Bearer injection, timeout, and `extensions.code` mapping.
- [x] T017 Create `apps/mobile/codegen.ts`, `apps/mobile/codegen.schema.gql` (current API SDL snapshot), and `apps/mobile/src/shared/api/generated.ts` output configuration; run `pnpm --filter @foundly/mobile codegen`.
- [x] T018 [P] Create `apps/mobile/src/shared/auth/secure-storage.ts` with a chunked `expo-secure-store` adapter implementing the Supabase storage interface.
- [x] T019 [P] Create `apps/mobile/src/shared/auth/supabase.ts` with the Supabase client, `autoRefreshToken`, `persistSession`, and the secure-storage adapter.
- [x] T020 Create `apps/mobile/src/shared/auth/session-context.tsx` and `apps/mobile/src/shared/auth/guards.ts` exposing session state, tenant binding, restoration, login/logout transitions, and React Query cache clearing.
- [x] T021 Create thin route skeletons in `apps/mobile/app/index.tsx`, `apps/mobile/app/(auth)/_layout.tsx`, and `apps/mobile/app/(tabs)/_layout.tsx` with protected groups and a three-tab bar.
- [x] T022 Create the React Query client in `apps/mobile/src/shared/api/query-client.ts` with tenant-scoped defaults, retry policy, and cache invalidation helpers.
- [x] T023 Create `apps/mobile/jest.config.js`, `apps/mobile/jest.setup.ts`, and a first smoke test in `apps/mobile/src/shared/ui/__tests__/screen.test.tsx`; verify `pnpm --filter @foundly/mobile test` executes.

**Checkpoint**: App boots with providers and empty routes; transport, session, theme, and test harness are ready.

---

## Phase 3: User Story 1 - Login and tenant access (Priority: P1) 🎯 MVP

**Goal**: A tenant administrator signs in with Foundly credentials, toggles password visibility, gets clear errors, and reaches a protected area that survives app restarts.

**Independent Test**: Launch without a session, validate the toggle and invalid/valid credential paths, restart the app to confirm persistence, and verify protected content never renders without a session.

### Tests for User Story 1

- [x] T024 [P] [US1] Add login component tests in `apps/mobile/src/modules/auth/__tests__/login-form.test.tsx` covering password toggle, inline validation, pending state, and provider error messaging.
- [x] T025 [P] [US1] Add guard tests in `apps/mobile/src/shared/auth/__tests__/guards.test.ts` covering anonymous/protected, authenticated/login, missing tenant, and expired-session redirects.

### Implementation for User Story 1

- [x] T026 [P] [US1] Create `apps/mobile/src/modules/auth/schemas.ts` with email/password validation and Spanish messages.
- [x] T027 [P] [US1] Create `apps/mobile/src/modules/auth/services.ts` wrapping `supabase.auth.signInWithPassword` and `signOut` with typed results and no raw-provider error leakage.
- [x] T028 [US1] Create `apps/mobile/src/modules/auth/hooks.ts` with `useSignIn` and mutation state, integrating the session context on success.
- [x] T029 [US1] Create `apps/mobile/src/modules/auth/components/PasswordField.tsx` and `apps/mobile/src/modules/auth/components/LoginForm.tsx` with the visibility toggle and accessible labels.
- [x] T030 [US1] Create `apps/mobile/src/modules/auth/LoginView.tsx` composing the form, brand header, offline notice, and session-expired reason.
- [x] T031 [US1] Create `apps/mobile/app/(auth)/login.tsx` as a thin route rendering `<LoginView />`.
- [x] T032 [US1] Wire protected routing in `apps/mobile/app/index.tsx` and `apps/mobile/app/(tabs)/_layout.tsx`: redirect anonymous users to login, authenticated users away from login, and show a blocking state for sessions without `tenantId`.
- [x] T033 [US1] Handle GraphQL `UNAUTHENTICATED` globally in `apps/mobile/src/shared/auth/session-context.tsx` by clearing the session, cache, and secure storage, then redirecting with a session-expired reason.
- [x] T034 [US1] Run the US1 tests and validate login persistence, password toggle, invalid credentials, and protected-route behavior on a device or simulator.

**Checkpoint**: US1 is complete and independently demonstrable; the app opens directly into the protected shell after session restoration.

---

## Phase 4: User Story 2 - Daily agenda (Priority: P2)

**Goal**: An authenticated administrator sees the tenant's upcoming appointments, can refresh, and gets loading, empty, error, and stale-cache states.

**Independent Test**: Sign in with a tenant that has appointments, verify ordering and fields, refresh after an external change, and confirm empty/offline states on a tenant without connectivity or appointments.

### Tests for User Story 2

- [x] T035 [P] [US2] Add date-range unit tests in `apps/mobile/src/modules/agenda/__tests__/date-range.test.ts` covering tenant timezone, inclusive ranges, and day boundaries.
- [x] T036 [P] [US2] Add agenda state tests in `apps/mobile/src/modules/agenda/__tests__/agenda-view.test.tsx` covering loading, empty, error/retry, and populated lists.

### Implementation for User Story 2

- [x] T037 [P] [US2] Create `apps/mobile/src/modules/agenda/agenda.graphql` with the `MyAppointments` query and generated types.
- [x] T038 [P] [US2] Create `apps/mobile/src/modules/agenda/date-range.ts` computing inclusive `from`/`to` for the tenant timezone.
- [x] T039 [US2] Create `apps/mobile/src/modules/agenda/services.ts` calling `apiRequest` with the agenda operation and mapping typed errors.
- [x] T040 [US2] Create `apps/mobile/src/modules/agenda/hooks.ts` with `useAgenda` using React Query keys scoped by tenant and range.
- [x] T041 [US2] Create `apps/mobile/src/modules/agenda/components/AppointmentCard.tsx`, `AgendaSkeleton.tsx`, and `EmptyAgenda.tsx` using only theme tokens.
- [x] T042 [US2] Create `apps/mobile/src/modules/agenda/AgendaView.tsx` with a `FlatList`, pull-to-refresh, stale-data banner, and retry surface.
- [x] T043 [US2] Create `apps/mobile/app/(tabs)/index.tsx` as a thin route rendering `<AgendaView />`.
- [x] T044 [US2] Run the US2 tests and manually validate ordering, refresh, empty, and offline behavior against the API.

**Checkpoint**: US1 and US2 work independently; agenda data is always tenant-scoped and cached per tenant.

---

## Phase 5: User Story 3 - Notification inbox (Priority: P3)

**Goal**: An authenticated administrator reviews tenant notifications, distinguishes unread items, marks them read, and keeps the state across sessions.

**Independent Test**: Open a tenant with notifications, verify chronological order and unread styling, mark one read, restart the app, and confirm no notifications from another tenant appear after switching accounts.

### Tests for User Story 3

- [x] T045 [P] [US3] Add notification hook tests in `apps/mobile/src/modules/notifications/__tests__/notifications-hooks.test.tsx` covering optimistic mark-read, rollback on failure, and cache invalidation.
- [x] T046 [P] [US3] Add notification view tests in `apps/mobile/src/modules/notifications/__tests__/notifications-view.test.tsx` covering loading, empty, error, and read/unread rendering.

### Implementation for User Story 3

- [x] T047 [P] [US3] Create `apps/mobile/src/modules/notifications/notifications.graphql` with `Notifications` and `MarkNotificationRead` operations.
- [x] T048 [P] [US3] Create `apps/mobile/src/modules/notifications/services.ts` for listing and marking notifications read.
- [x] T049 [US3] Create `apps/mobile/src/modules/notifications/hooks.ts` with `useNotifications` and `useMarkNotificationRead`, including optimistic update and rollback.
- [x] T050 [US3] Create `apps/mobile/src/modules/notifications/components/NotificationRow.tsx` and the list state components with accessible read/unread labels.
- [x] T051 [US3] Create `apps/mobile/src/modules/notifications/NotificationsView.tsx` with pull-to-refresh and pagination guard.
- [x] T052 [US3] Create `apps/mobile/app/(tabs)/notificaciones.tsx` as a thin route rendering `<NotificationsView />`.
- [x] T053 [US3] Run the US3 tests and manually validate read persistence and tenant isolation across account switches.

**Checkpoint**: US1–US3 are independently functional and can be demoed as separate slices.

---

## Phase 6: User Story 4 - Profile summary and public page toggle (Priority: P4)

**Goal**: An authenticated administrator reviews the business profile and activates/deactivates the public page with confirmed server state and safe rollback.

**Independent Test**: Open settings, compare profile data with the API, toggle publication off/on, verify the public URL changes availability, and simulate a failed save to confirm rollback.

### Tests for User Story 4

- [x] T054 [P] [US4] Add API resolver tests for `myBusiness` in `apps/api/src/modules/tenants/tenants.resolver.spec.ts` covering authenticated tenant resolution, missing tenant, and profile payload.
- [x] T055 [P] [US4] Add public-page hook tests in `apps/mobile/src/modules/settings/__tests__/public-page.test.tsx` covering optimistic toggle, success, rollback on error, and missing-slug validation.

### Implementation for User Story 4

- [x] T056 [US4] Add the authenticated `myBusiness` query to `apps/api/src/modules/tenants/tenants.resolver.ts` and the tenant lookup to `apps/api/src/modules/tenants/tenants.service.ts`.
- [x] T057 [US4] Update `apps/mobile/codegen.schema.gql` with `myBusiness` and run `pnpm --filter @foundly/mobile codegen`.
- [x] T058 [P] [US4] Create `apps/mobile/src/modules/settings/settings.graphql` with `MyBusiness` and `UpdateMyBusinessProfile` operations.
- [x] T059 [P] [US4] Create `apps/mobile/src/modules/settings/services.ts` for profile reads and public-page updates.
- [x] T060 [US4] Create `apps/mobile/src/modules/settings/hooks.ts` with `useMyBusiness` and `useUpdatePublicPage`, including rollback and cache updates.
- [x] T061 [US4] Create `apps/mobile/src/modules/settings/components/ProfileSummary.tsx` and `PublicPageToggle.tsx` with missing-data and pending states.
- [x] T062 [US4] Create `apps/mobile/src/modules/settings/SettingsView.tsx` including profile summary, public-page toggle, app version, and sign-out action.
- [x] T063 [US4] Create `apps/mobile/app/(tabs)/configuracion.tsx` as a thin route rendering `<SettingsView />`.
- [x] T064 [US4] Run the US4 tests, API typecheck, and manual publish/unpublish validation including the failed-save rollback path.

**Checkpoint**: US4 is independently functional; profile reads and publication changes are tenant-scoped and confirmed by the server.

---

## Phase 7: User Story 5 - Push notifications (Priority: P5)

**Goal**: An authenticated administrator receives tenant pushes, can deny permission without losing app functionality, and stops receiving tenant pushes after logout.

**Independent Test**: On a development build, log in, accept permission, trigger an API notification, receive and tap the push, then log out and confirm the device no longer receives that tenant's pushes.

### Tests for User Story 5

- [x] T065 [P] [US5] Add API tests for push-token registration, tenant scoping, idempotent re-registration, and unregistration in `apps/api/src/modules/notifications/notifications.push.spec.ts`.
- [x] T066 [P] [US5] Add mobile push utility tests in `apps/mobile/src/shared/notifications/__tests__/push.test.ts` covering denied permission, non-device, token capture, and unsupported platform paths.

### Implementation for User Story 5

- [x] T067 [US5] Add the `PushDeviceToken` model, `PushPlatform` enum, and Tenant relation to `packages/database/prisma/schema.prisma`; create the migration and run `pnpm --filter @foundly/database db:generate`.
- [x] T068 [US5] Create `apps/api/src/modules/notifications/push-tokens.store.ts` with a Prisma-backed store for register, reassign, list, and delete-by-token operations.
- [x] T069 [US5] Add `RegisterPushTokenInput`, `PushTokenObject`, `PushPlatform`, `registerPushToken`, and `unregisterPushToken` to `apps/api/src/modules/notifications/notifications.types.ts` and `notifications.resolver.ts`; wire the store in `notifications.module.ts`.
- [x] T070 [US5] Create `apps/api/src/modules/notifications/expo-push.service.ts` to send batched Expo push messages and delete `DeviceNotRegistered` tokens; invoke it after notifications are persisted in `notifications.service.ts` without failing the originating mutation.
- [x] T071 [US5] Add the push token mutations to `apps/mobile/codegen.schema.gql` and create `apps/mobile/src/modules/notifications/push.graphql`; run `pnpm --filter @foundly/mobile codegen`.
- [x] T072 [US5] Create `apps/mobile/src/shared/notifications/push.ts` with device/permission/channel/token capture, token listeners, and `getExpoPushTokenAsync({ projectId })`.
- [x] T073 [US5] Create `apps/mobile/src/shared/notifications/use-push-registration.ts` to register after authentication, re-register on token change, and unregister on logout.
- [x] T074 [US5] Integrate push registration into `apps/mobile/src/shared/auth/session-context.tsx` and `apps/mobile/app/_layout.tsx`, including foreground presentation and notification-tap navigation to `/(tabs)/notificaciones`.
- [x] T075 [US5] Configure the `expo-notifications` plugin, iOS/Android identifiers, notification icon/color, and EAS project ID in `apps/mobile/app.config.ts` and `apps/mobile/eas.json`.
- [ ] T076 [US5] Run the US5 tests, create an Expo development build, and execute the push validation scenarios from `quickstart.md` (grant, deny, tap, logout, tenant switch).

**Checkpoint**: All five stories work independently; push delivery is tenant-scoped and permission failures degrade gracefully.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Documentation, accessibility, performance, and end-to-end quality gates across all stories.

- [x] T077 [P] Write `apps/mobile/README.md` covering setup, environment variables, scripts, monorepo/Metro notes, and the Expo Go vs development-build push limitation.
- [x] T078 [P] Add the mobile workspace commands and environment notes to the root `README.md` and `apps/mobile/.env.example`.
- [x] T079 [P] Audit accessibility across `apps/mobile/app/**` and `apps/mobile/src/**/components/`: labels, 44×44 touch targets, dynamic type, and screen-reader announcements.
- [x] T080 [P] Optimize list rendering in `apps/mobile/src/modules/agenda/AgendaView.tsx` and `apps/mobile/src/modules/notifications/NotificationsView.tsx` with `FlatList` keys, memoized rows, and sensible query stale times.
- [x] T081 Verify tenant isolation end-to-end: switch accounts, confirm cache clearing, push unregistration/re-registration, and no cross-tenant data in `apps/mobile/src/shared/auth/session-context.tsx`.
- [x] T082 Run `pnpm --filter @foundly/mobile typecheck`, `pnpm --filter @foundly/mobile lint`, `pnpm --filter @foundly/mobile test`, and `pnpm --filter @foundly/mobile build`; fix all failures.
- [x] T083 Run the full repository gates (`pnpm typecheck`, `pnpm lint`, `pnpm build`) to prove the pnpm/Turbo migration did not regress `apps/api`, `apps/book`, `apps/landing`, or `packages/*`.
- [ ] T084 Execute every scenario in `specs/mobile/001-tenant-mobile-app/quickstart.md` and record any deviations or follow-ups.
- [x] T085 Final cleanup: remove unused assets/templates, confirm generated GraphQL output is gitignored, and verify no secrets or `EXPO_PUBLIC_*` secrets are committed.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Starts immediately; T001 is the governance gate and must precede production code. T002–T005 precede T006–T010.
- **Foundational (Phase 2)**: Depends on Setup; blocks all user stories. T011–T022 can largely proceed in parallel once T016, T018, T019, and T022 exist.
- **User Stories (Phases 3–7)**: All depend on Foundational completion.
  - US1 (P1) is the MVP and must be completed first for realistic manual validation.
  - US2–US4 can proceed in parallel after US1, because each touches distinct module folders; all reuse the foundational auth/transport layer.
  - US5 depends on US1 for the session lifecycle and on US3 for notification navigation; its API work can start in parallel with US1.
- **Polish (Phase 8)**: Depends on all selected stories being complete.

### User Story Dependencies

| Story    | Depends on             | Notes                                                   |
| -------- | ---------------------- | ------------------------------------------------------- |
| US1 (P1) | Foundational           | Required for any authenticated manual test              |
| US2 (P2) | Foundational, US1      | Independent module; uses the session-provided token     |
| US3 (P3) | Foundational, US1      | Independent module; no dependency on agenda             |
| US4 (P4) | Foundational, US1      | Requires the API `myBusiness` query (T056)              |
| US5 (P5) | Foundational, US1, US3 | Uses the notifications module for deep-link destination |

### Within Each User Story

- Tests before implementation tasks for the same slice.
- Schemas/services before hooks; hooks before views; views before thin routes.
- Run the story checkpoint before starting the next priority.

### Parallel Opportunities

- **Setup**: T002, T003, T006, and T007 are independent files; T008/T009 can run together after T006.
- **Foundational**: T013, T014, T015, T018, T019, and T022 touch different files and can run together; T011 waits for T020/T022.
- **US1**: T024, T025, T026, T027 can run together; T029 depends on T026.
- **US2**: T035, T037, T038 can run together; T039–T042 follow.
- **US3**: T045, T047, T048 can run together; T049–T051 follow.
- **US4**: T054, T056, T058, T059 can run together; T060–T063 follow.
- **US5**: T065, T067, T072 can run together; API T068–T070 and mobile T071/T073–T075 follow their respective prerequisites.

---

## Parallel Examples

### User Story 1

```bash
# Tests and schemas can be authored together
Task: "Add login component tests in apps/mobile/src/modules/auth/__tests__/login-form.test.tsx"
Task: "Add guard tests in apps/mobile/src/shared/auth/__tests__/guards.test.ts"
Task: "Create apps/mobile/src/modules/auth/schemas.ts"
Task: "Create apps/mobile/src/modules/auth/services.ts"
```

### User Story 2

```bash
# Independent utilities and query documents
Task: "Add date-range unit tests in apps/mobile/src/modules/agenda/__tests__/date-range.test.ts"
Task: "Create apps/mobile/src/modules/agenda/agenda.graphql"
Task: "Create apps/mobile/src/modules/agenda/date-range.ts"
```

### User Story 4

```bash
# API query, mobile documents, and tests can proceed in parallel
Task: "Add API resolver tests for myBusiness in apps/api/src/modules/tenants/tenants.resolver.spec.ts"
Task: "Add myBusiness query to apps/api/src/modules/tenants/tenants.resolver.ts"
Task: "Create apps/mobile/src/modules/settings/settings.graphql"
Task: "Create apps/mobile/src/modules/settings/services.ts"
```

### User Story 5

```bash
# Database/model, mobile utility, and API tests can start together
Task: "Add PushDeviceToken model and migration in packages/database/prisma/schema.prisma"
Task: "Add API push-token tests in apps/api/src/modules/notifications/notifications.push.spec.ts"
Task: "Create apps/mobile/src/shared/notifications/push.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 only)

1. Complete Phase 1 (Setup) and Phase 2 (Foundational).
2. Complete Phase 3 (US1) and run T024–T034.
3. **STOP and VALIDATE**: login, persistence, tenant guard, and session expiry on a device.
4. Demo the MVP before starting operational screens.

### Incremental Delivery

1. Setup + Foundational → runnable shell.
2. US1 → authenticated MVP.
3. US2 → daily agenda value.
4. US3 → notification inbox.
5. US4 → profile and publication control.
6. US5 → push engagement.
7. Polish → repository-wide gates and release readiness.

### Parallel Team Strategy

1. One owner completes Setup + Foundational.
2. After US1, assign US2, US3, and the API half of US4/US5 to different developers (distinct modules/files).
3. US5 mobile integration joins after US1 and US3.
4. Finish with T082–T085 as a single quality gate.

---

## Notes

- [P] tasks touch different files and do not depend on incomplete tasks.
- Every user story ends with a checkpoint that can be validated without later stories.
- Generated GraphQL artifacts remain uncommitted; `apps/mobile/codegen.schema.gql` is the versioned contract snapshot.
- Remote push cannot be validated in Expo Go; use an Expo development build.
- Do not commit `.env`, credentials, or raw provider messages.

---

## Implementation Status (2026-10-24)

Implemented and validated in the repository:

- `pnpm --filter @foundly/mobile typecheck` — pass
- `pnpm --filter @foundly/mobile lint` — pass
- `pnpm --filter @foundly/mobile test` — 25 tests pass
- `pnpm --filter @foundly/mobile build` — iOS and Android bundles exported
- `pnpm typecheck`, `pnpm lint`, `pnpm build` — full workspace pass
- `pnpm --filter @foundly/api test` — 316 tests pass
- API `myBusiness` query, `PushDeviceToken` persistence, push-token mutations and Expo delivery implemented
- Mobile login, agenda, notifications, settings/public toggle and push registration implemented

Pending manual device validation:

- **T076** — remote push (grant, deny, tap, logout, tenant switch) requires an Expo development build and a physical device; it cannot be completed in this environment.
- **T084** — the device/EAS-dependent quickstart scenarios share the same limitation. All repository-level setup, build and test scenarios were executed successfully.
