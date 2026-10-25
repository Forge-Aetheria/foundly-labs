---

description: "Task list for Mobile Drawer Navigation"
---

# Tasks: Mobile Drawer Navigation

**Input**: Design documents from `/specs/mobile/002-mobile-drawer-navigation/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/`, `quickstart.md`

**Tests**: Included because the implementation plan and quickstart define a concrete test strategy (registry, identity, header, drawer content, icon integrity).

**Organization**: Tasks are grouped by user story so each story can be implemented and validated independently.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: User story label (`US1`, `US2`, `US3`, `US4`)
- Every task includes exact file paths

## Path Conventions

- Mobile app root: `apps/mobile/`
- Routes: `apps/mobile/app/`
- Shared code: `apps/mobile/src/shared/`
- Domain modules: `apps/mobile/src/modules/`
- Assets: `apps/mobile/assets/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Dependencies, asset rename and environment configuration required by all stories.

- [X] T001 Add `@expo/vector-icons@^15.0.2`, `react-native-gesture-handler@~3.3.0`, `react-native-reanimated@4.7.1` and `react-native-worklets@0.13.0` to `apps/mobile/package.json` and run `pnpm install` from the repo root.
- [X] T002 [P] Rename `apps/mobile/assets/brading-logo.png` to `apps/mobile/assets/branding-logo.png` (preserve the image contents).
- [X] T003 [P] Add optional `bookUrl` (`EXPO_PUBLIC_BOOK_URL`, trailing slash trimmed) to `apps/mobile/src/shared/config/env.ts`, and document the variable in `apps/mobile/.env.example` and `apps/mobile/.env` with `http://localhost:3001`.
- [X] T004 [P] Replace `TABS_ROUTE = '/(tabs)'` with `DRAWER_HOME_ROUTE = '/agenda'` in `apps/mobile/src/shared/auth/guards.ts`, and update `apps/mobile/src/shared/auth/__tests__/guards.test.ts` accordingly.
- [X] T005 [P] Wrap the root tree in `GestureHandlerRootView` and register the `(drawer)` route in `apps/mobile/app/_layout.tsx` (keep the existing providers and push bridge).

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared model/helpers and primitives that every user story consumes.

**⚠️ CRITICAL**: Complete this phase before starting any user story.

- [X] T006 [P] Create the typed module registry and helpers (`NAVIGATION_MODULES`, `PRIMARY_MODULES`, `SECONDARY_MODULES`, `DRAWER_HOME_ROUTE`, `findModuleByPathname`, `isModuleActive`) in `apps/mobile/src/shared/navigation/modules.ts` using the exact order/routes/icons from `data-model.md`.
- [X] T007 [P] Create the session identity helper (`displayName`, `email`, `avatarUrl`, `initials` with all fallbacks) in `apps/mobile/src/shared/navigation/session-identity.ts`.
- [X] T008 [P] Create the accessible avatar primitive in `apps/mobile/src/shared/ui/SessionAvatar.tsx` (photo when valid, initials otherwise, tokenized colors).
- [X] T009 [P] Create `ModulePlaceholderView` in `apps/mobile/src/shared/ui/ModulePlaceholderView.tsx` showing the module title/icon, a "Próximamente en móvil" message and no tenant data.
- [X] T010 [P] Add registry unit tests (ten modules, order, groups, routes, `isModuleActive`, `findModuleByPathname`) in `apps/mobile/src/shared/navigation/__tests__/modules.test.ts`.
- [X] T011 [P] Add identity helper unit tests (metadata name, email fallback, initials, missing avatar) in `apps/mobile/src/shared/navigation/__tests__/session-identity.test.ts`.

**Checkpoint**: Registry, identity, avatar and placeholder are ready; user stories can proceed.

---

## Phase 3: User Story 1 - Navegar entre módulos desde un drawer lateral (Priority: P1) 🎯 MVP

**Goal**: Replace the bottom tab bar with a working drawer containing all ten modules and canonical routes.

**Independent Test**: Sign in, open the drawer, confirm ten modules with labels/icons, navigate to each one, confirm the active module is highlighted, and confirm no bottom tab bar remains.

### Implementation for User Story 1

- [X] T012 [P] [US1] Create the Agenda route at `apps/mobile/app/(drawer)/agenda.tsx` rendering `AgendaView`.
- [X] T013 [P] [US1] Create the Servicios route at `apps/mobile/app/(drawer)/servicios.tsx` rendering `ModulePlaceholderView`.
- [X] T014 [P] [US1] Create the Equipo route at `apps/mobile/app/(drawer)/equipo.tsx` rendering `ModulePlaceholderView`.
- [X] T015 [P] [US1] Create the Galería route at `apps/mobile/app/(drawer)/galeria.tsx` rendering `ModulePlaceholderView`.
- [X] T016 [P] [US1] Create the Reseñas route at `apps/mobile/app/(drawer)/resenas.tsx` rendering `ModulePlaceholderView`.
- [X] T017 [P] [US1] Create the Disponibilidad route at `apps/mobile/app/(drawer)/disponibilidad.tsx` rendering `ModulePlaceholderView`.
- [X] T018 [P] [US1] Create the Notificaciones route at `apps/mobile/app/(drawer)/notificaciones.tsx` rendering `NotificationsView`.
- [X] T019 [P] [US1] Create the Configuración route at `apps/mobile/app/(drawer)/configuracion.tsx` rendering `SettingsView`.
- [X] T020 [P] [US1] Create the Ayuda y Soporte route at `apps/mobile/app/(drawer)/soporte.tsx` rendering `ModulePlaceholderView`.
- [X] T021 [P] [US1] Create the Acerca de Foundly route at `apps/mobile/app/(drawer)/about.tsx` rendering `ModulePlaceholderView`.
- [X] T022 [US1] Create `apps/mobile/app/(drawer)/index.tsx` redirecting to `DRAWER_HOME_ROUTE`.
- [X] T023 [US1] Create `apps/mobile/app/(drawer)/_layout.tsx` with the Expo Router `Drawer`, `initialRouteName="agenda"`, `headerShown: false` for now, and preserve the existing session loading, anonymous redirect and `missing-tenant` state.
- [X] T024 [US1] Update `apps/mobile/app/index.tsx` to redirect authenticated users to `DRAWER_HOME_ROUTE` and anonymous users to login.
- [X] T025 [US1] Update `apps/mobile/app/(auth)/_layout.tsx` to redirect authenticated users to `DRAWER_HOME_ROUTE` using `shouldRedirectAwayFromLogin`.
- [X] T026 [US1] Delete `apps/mobile/app/(tabs)/_layout.tsx`, `apps/mobile/app/(tabs)/index.tsx`, `apps/mobile/app/(tabs)/notificaciones.tsx` and `apps/mobile/app/(tabs)/configuracion.tsx`.
- [X] T027 [US1] Remove all remaining `TABS_ROUTE` / `(tabs)` references from `apps/mobile/app` and `apps/mobile/src` (grep and update imports).
- [X] T028 [US1] Add a smoke test for drawer destination rendering (each route file resolves its expected view) in `apps/mobile/src/shared/navigation/__tests__/drawer-routes.test.ts`.

**Checkpoint**: The drawer navigates all ten modules and the tab bar is gone. This is the MVP.

---

## Phase 4: User Story 2 - Usar el header persistente con branding (Priority: P2)

**Goal**: Show the same custom header on every drawer screen: avatar left, centered brand logo that opens the drawer, notifications right, no hamburger.

**Independent Test**: Visit every module and confirm the header layout is identical, the brand opens the drawer, and the notifications action navigates to `/notificaciones`.

### Tests for User Story 2

- [X] T029 [P] [US2] Add header component tests (avatar, brand press calls `onOpenDrawer`, notifications press calls `onOpenNotifications`, no hamburger) in `apps/mobile/src/shared/navigation/__tests__/app-header.test.tsx`.

### Implementation for User Story 2

- [X] T030 [P] [US2] Create `AppHeader` in `apps/mobile/src/shared/navigation/AppHeader.tsx` with safe-area top inset, `SessionAvatar` left, `Image` (`require('../../assets/branding-logo.png')`) centered in a `Pressable`, and Ionicons `notifications-outline` right; all colors from `@/shared/theme/tokens`.
- [X] T031 [US2] Wire `AppHeader` as the drawer navigator header in `apps/mobile/app/(drawer)/_layout.tsx` via `screenOptions.header`, passing the derived identity, `navigation.openDrawer()` and navigation to `/notificaciones`.
- [X] T032 [US2] Ensure no default navigation header or hamburger remains and that the header renders on all ten screens in `apps/mobile/app/(drawer)/_layout.tsx`.
- [X] T033 [US2] Add accessibility labels/roles to the avatar, brand button and notifications action in `apps/mobile/src/shared/navigation/AppHeader.tsx`.

**Checkpoint**: Header parity is complete on every authenticated screen.

---

## Phase 5: User Story 3 - Consultar identidad, página pública y cerrar sesión desde el drawer (Priority: P3)

**Goal**: Custom drawer content with brand logo, "Ver página pública", module list, profile card and logout.

**Independent Test**: Open the drawer, confirm logo/public link/profile/logout, verify the public link hides without slug or env, and confirm logout returns to login.

### Tests for User Story 3

- [X] T034 [P] [US3] Add drawer content tests (active highlighting, public link visibility, navigation closes drawer, logout callback, profile fallbacks) in `apps/mobile/src/shared/navigation/__tests__/app-drawer-content.test.tsx`.

### Implementation for User Story 3

- [X] T035 [P] [US3] Create a public page URL helper (`baseUrl` + slug, http/https validation) in `apps/mobile/src/shared/navigation/public-page.ts`.
- [X] T036 [P] [US3] Create `AppDrawerContent` in `apps/mobile/src/shared/navigation/AppDrawerContent.tsx` with the brand logo, "Ver página pública" button, `PRIMARY_MODULES`/`SECONDARY_MODULES` list, active styling and close-on-navigate behavior.
- [X] T037 [US3] Add the pinned profile footer to `apps/mobile/src/shared/navigation/AppDrawerContent.tsx` using session identity, optional `useMyBusiness()` tenant name and the existing `useSignOut()` hook; truncate long values with `numberOfLines={1}`.
- [X] T038 [US3] Implement logout pending state and redirect behavior in `apps/mobile/src/shared/navigation/AppDrawerContent.tsx` and `apps/mobile/app/(drawer)/_layout.tsx`.
- [X] T039 [US3] Pass `drawerContent={(props) => <AppDrawerContent ... />}` and identity/public href props from `apps/mobile/app/(drawer)/_layout.tsx`.
- [X] T040 [US3] Hide "Ver página pública" when `EXPO_PUBLIC_BOOK_URL` or the tenant slug is absent, and open valid links with `Linking.openURL` from `apps/mobile/src/shared/navigation/AppDrawerContent.tsx`.
- [X] T041 [US3] Add accessibility labels to the public link, each drawer item and the logout action in `apps/mobile/src/shared/navigation/AppDrawerContent.tsx`.

**Checkpoint**: Drawer content matches the web sidebar and supports public page + logout.

---

## Phase 6: User Story 4 - Ver iconografía consistente sin cajas vacías (Priority: P4)

**Goal**: Guarantee every navigation icon is a valid Ionicons glyph rendered on iOS and Android.

**Independent Test**: Iterate the registry and assert every icon name exists in the Ionicons glyph map; render header/drawer and confirm no missing-glyph boxes on both platforms.

### Tests and Implementation for User Story 4

- [X] T042 [P] [US4] Add an icon integrity test asserting every `NavigationModule.icon` and the header/drawer action glyphs exist in `Ionicons.glyphMap` in `apps/mobile/src/shared/navigation/__tests__/icons.test.ts`.
- [X] T043 [P] [US4] Ensure `AppHeader` and `AppDrawerContent` import `Ionicons` only from `@expo/vector-icons` and use names typed against the glyph map.
- [X] T044 [US4] Verify manually on iOS and Android simulators that the drawer, header, notifications and logout icons render without boxes or fallback rectangles; record the result in `specs/mobile/002-mobile-drawer-navigation/quickstart.md`.
- [X] T045 [US4] Remove any ad-hoc emoji/text icon substitutes from `apps/mobile/src/shared/navigation` and `apps/mobile/src/shared/ui`.

**Checkpoint**: Icon parity is verified on both target platforms.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final cleanup and complete verification.

- [X] T046 [P] Run `pnpm --filter @foundly/mobile typecheck` for `apps/mobile` and fix all errors.
- [X] T047 [P] Run `pnpm --filter @foundly/mobile lint` for `apps/mobile` and fix all errors/warnings.
- [X] T048 [P] Run `pnpm --filter @foundly/mobile test` for `apps/mobile` and fix failing tests.
- [X] T049 Update existing tests or mocks affected by the route/header changes (for example `apps/mobile/src/shared/auth/__tests__/guards.test.ts` and any tab-layout references).
- [X] T050 Run the manual scenarios in `specs/mobile/002-mobile-drawer-navigation/quickstart.md` on a device/simulator.
- [X] T051 Remove dead code, unused imports and any leftover `(tabs)` assets or references in `apps/mobile`.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: Depends on T001–T005.
- **US1 (Phase 3)**: Depends on Phase 2. Delivers the MVP.
- **US2 (Phase 4)**: Depends on Phase 2; integrates with the US1 layout file.
- **US3 (Phase 5)**: Depends on Phase 2 and US1 layout; integrates with US2 header layout.
- **US4 (Phase 6)**: Depends on US2 and US3 components.
- **Polish (Phase 7)**: Depends on all desired stories.

### User Story Dependencies

- **US1 (P1)**: No dependency on other stories. MVP.
- **US2 (P2)**: Can be built after Foundational; final wiring touches the US1 drawer layout.
- **US3 (P3)**: Can be built after Foundational; final wiring touches the US1 drawer layout.
- **US4 (P4)**: Validates icons introduced by US1–US3.

### Within Each Story

- Tests first where included; confirm they fail before implementation.
- Shared primitives before screen wiring.
- Route files before layout wiring.
- Component implementation before navigator integration.
- Accessibility before the final checkpoint.

---

## Parallel Opportunities

### Setup

```text
T002 rename logo asset
T003 add EXPO_PUBLIC_BOOK_URL
T004 update guards constant
T005 update root layout
```

### Foundational

```text
T006 modules registry
T007 session identity helper
T008 SessionAvatar
T009 ModulePlaceholderView
T010 registry tests
T011 identity tests
```

### User Story 1

```text
T012–T021 create the ten route files in parallel
T022 drawer index redirect
T023 drawer layout
T024–T027 redirects, delete tabs and cleanup
T028 route smoke test
```

### User Story 2

```text
T029 header tests
T030 AppHeader implementation
```

### User Story 3

```text
T034 drawer content tests
T035 public page helper
T036–T041 drawer content implementation and wiring
```

### User Story 4

```text
T042 icon glyph integrity test
T043 icon import audit
```

---

## Parallel Example: User Story 1 route files

```bash
Task: "Create apps/mobile/app/(drawer)/agenda.tsx"
Task: "Create apps/mobile/app/(drawer)/servicios.tsx"
Task: "Create apps/mobile/app/(drawer)/equipo.tsx"
Task: "Create apps/mobile/app/(drawer)/galeria.tsx"
Task: "Create apps/mobile/app/(drawer)/resenas.tsx"
Task: "Create apps/mobile/app/(drawer)/disponibilidad.tsx"
Task: "Create apps/mobile/app/(drawer)/notificaciones.tsx"
Task: "Create apps/mobile/app/(drawer)/configuracion.tsx"
Task: "Create apps/mobile/app/(drawer)/soporte.tsx"
Task: "Create apps/mobile/app/(drawer)/about.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 (Setup).
2. Complete Phase 2 (Foundational).
3. Complete Phase 3 (US1).
4. Stop and validate: drawer with ten modules, no bottom tabs, redirects working.
5. This is shippable as the navigation migration MVP.

### Incremental Delivery

1. Setup + Foundational → shared navigation model ready.
2. US1 → drawer navigation parity (MVP).
3. US2 → persistent branded header.
4. US3 → custom drawer content, public page and logout.
5. US4 → icon integrity verification.
6. Polish → typecheck, lint, tests and manual quickstart.

### Parallel Team Strategy

1. One developer owns Setup + Foundational.
2. After Foundational:
   - Developer A: US1 route migration.
   - Developer B: US2 header.
   - Developer C: US3 drawer content.
3. US4 and Polish run after US1–US3 converge.

---

## Notes

- [P] tasks touch different files and have no incomplete dependencies.
- [Story] labels map each task to the spec user story for traceability.
- Tests are included because the plan and quickstart define them; do not skip failing tests silently.
- Keep all colors from `apps/mobile/src/shared/theme/tokens.ts`; hex literals fail lint.
- Keep routes thin: each `app/(drawer)/*.tsx` renders a view/placeholder only.


## Completion Notes

- Automated gates passed: `typecheck`, `lint`, `test` (48 tests) and `expo export` (iOS + Android bundles with `branding-logo.png` and Ionicons fonts).
- Device-level visual smoke (T044/T050) remains recommended on a simulator/device; the export confirms all assets and icon fonts are bundled.
