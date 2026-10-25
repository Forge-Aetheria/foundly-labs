# Implementation Plan: Mobile Drawer Navigation

**Branch**: `002-mobile-drawer-navigation` | **Date**: 2026-10-24 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/mobile/002-mobile-drawer-navigation/spec.md`

## Summary

Replace the mobile bottom-tab navigator with an Expo Router drawer that mirrors the Foundly Book admin sidebar. The drawer lists ten modules in web order (Agenda, Servicios, Equipo, Galería, Reseñas, Disponibilidad, Notificaciones, Configuración, Ayuda y Soporte, Acerca de Foundly), highlights the active module and closes after navigation.

A persistent custom header appears on every authenticated screen: user avatar left, centered `branding-logo.png` that opens the drawer, and a notifications action right (no hamburger). The custom drawer adds the brand logo, a "Ver página pública" link, and a pinned profile card with avatar/initials, name, email, tenant name and logout.

Existing Agenda, Notificaciones and Configuración views are reused unchanged. Modules without mobile functionality render an informative placeholder. All icons use `@expo/vector-icons` (Ionicons), and the feature is verified with typecheck, lint and tests.

## Technical Context

**Language/Version**: TypeScript 5.9 (strict, `noUncheckedIndexedAccess`), React 19.3, React Native 0.88, Expo SDK 58, Expo Router 58.0.26.

**Primary Dependencies**: `expo-router/drawer`; add `@expo/vector-icons@^15.0.2`, `react-native-gesture-handler@~3.3.0`, `react-native-reanimated@4.7.1`, `react-native-worklets@0.13.0`. Existing: `@tanstack/react-query`, `@supabase/supabase-js`, `react-native-safe-area-context`, `react-native-screens`.

**Storage**: No new persistence. Identity comes from the existing Supabase session; tenant name/slug comes from the existing cached `useMyBusiness()` query.

**Testing**: Jest 30 + `jest-expo` + `@testing-library/react-native`. New unit tests for the module registry, identity helper, `AppHeader` and `AppDrawerContent`; existing module tests remain.

**Target Platform**: iOS and Android (Expo development builds / simulators).

**Project Type**: Mobile app inside a pnpm/Turborepo monorepo.

**Performance Goals**: Drawer opens within 300 ms perceived latency and animates at 60 fps; any module is reachable in under 3 seconds (SC-002).

**Constraints**: No backend or GraphQL API changes; no direct data calls in UI components; all colors from `@/shared/theme/tokens` (no hex literals); tenant isolation preserved; Spanish UI.

**Scale/Scope**: One authenticated tenant-admin app, 10 drawer destinations, 7 placeholder screens, 4 new shared navigation components/utilities.

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| Gate | Status | Evidence / plan |
| ---- | ------ | --------------- |
| §5.I Spec-Driven Development ("No spec, no code") | PASS | Spec exists at `specs/mobile/002-mobile-drawer-navigation/spec.md` and references `specs/business-model.md`. |
| §2 Specs live under `/specs/<dominio>/` | PASS | Feature directory is `specs/mobile/002-mobile-drawer-navigation/`. |
| §5.IV Strict typing, no `any` | PASS | Types derived from `DrawerContentComponentProps`, `Ionicons` glyph map and existing session/generated types. |
| §5.VI Module data layer / no direct data calls in UI | PASS | UI keeps consuming module hooks (`useAgenda`, `useNotifications`, `useMyBusiness`, `useSignOut`); no `useQuery`/`useMutation`/GraphQL calls in components. |
| §6 Design tokens (Clean Light UI) | PASS | Header/drawer use `colors`, `spacing`, `radii`, `typography`, `shadows` from `src/shared/theme/tokens.ts`; lint forbids hex literals. |
| §7 Thin routes + `modules/` + `shared/` | PASS | Route files render views only; navigation UI lives in `src/shared/navigation`; placeholders in `src/shared/ui`. |
| §8 Pre-commit verification | PASS | `typecheck`, `lint` and `test` are part of the task plan. |
| Constitution §7 `TODO(monorepo)` tests rollout | OUT OF SCOPE | This feature does not touch `packages/*` or `apps/api` test placement; the pending rollout requires separate user approval. |

**Gate result**: PASS. No unjustified violations.

## Project Structure

### Documentation (this feature)

```text
specs/mobile/002-mobile-drawer-navigation/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── navigation-registry.contract.md
│   └── header-drawer.contract.md
├── checklists/
│   └── requirements.md
├── spec.md
└── tasks.md              # /speckit.tasks (not created here)
```

### Source Code (repository root)

```text
apps/mobile/
├── app/
│   ├── _layout.tsx                     # add GestureHandlerRootView; register (drawer)
│   ├── index.tsx                       # redirect to DRAWER_HOME_ROUTE (/agenda)
│   ├── (auth)/
│   │   ├── _layout.tsx                 # redirect authenticated users to /agenda
│   │   └── login.tsx
│   ├── (drawer)/
│   │   ├── _layout.tsx                 # Drawer + custom header + custom content
│   │   ├── index.tsx                   # redirect to /agenda
│   │   ├── agenda.tsx                  # AgendaView
│   │   ├── servicios.tsx               # ModulePlaceholderView
│   │   ├── equipo.tsx                  # ModulePlaceholderView
│   │   ├── galeria.tsx                 # ModulePlaceholderView
│   │   ├── resenas.tsx                 # ModulePlaceholderView
│   │   ├── disponibilidad.tsx          # ModulePlaceholderView
│   │   ├── notificaciones.tsx          # NotificationsView
│   │   ├── configuracion.tsx           # SettingsView
│   │   ├── soporte.tsx                 # ModulePlaceholderView
│   │   └── about.tsx                   # ModulePlaceholderView
│   └── (tabs)/                         # DELETE
│       ├── _layout.tsx
│       ├── index.tsx
│       ├── notificaciones.tsx
│       └── configuracion.tsx
├── assets/
│   └── branding-logo.png               # rename from brading-logo.png
├── src/
│   ├── shared/
│   │   ├── auth/guards.ts              # TABS_ROUTE → DRAWER_HOME_ROUTE
│   │   ├── config/env.ts               # add optional bookUrl
│   │   ├── navigation/
│   │   │   ├── modules.ts              # module registry + helpers
│   │   │   ├── AppHeader.tsx           # avatar / brand trigger / notifications
│   │   │   ├── AppDrawerContent.tsx    # brand, public link, nav list, profile footer
│   │   │   ├── session-identity.ts     # displayName / email / avatar / initials
│   │   │   └── __tests__/
│   │   │       ├── modules.test.ts
│   │   │       ├── session-identity.test.ts
│   │   │       ├── app-header.test.tsx
│   │   │       └── app-drawer-content.test.tsx
│   │   ├── ui/
│   │   │   ├── SessionAvatar.tsx       # accessible avatar/initials
│   │   │   └── ModulePlaceholderView.tsx
│   │   └── theme/tokens.ts             # unchanged; consumed only
│   └── modules/                        # existing agenda/auth/notifications/settings
├── .env.example                        # add EXPO_PUBLIC_BOOK_URL
├── package.json                        # add drawer runtime deps
└── jest.setup.ts                       # optional mocks for native/icon modules
```

**Structure Decision**: Mobile app (Expo Router). Routes stay thin and render module views; all cross-screen navigation UI lives under `src/shared/navigation`, reusable primitives under `src/shared/ui`. Existing domain modules are untouched except for route wiring.

## Implementation Strategy

1. **Dependencies and asset** — add the drawer runtime packages and rename the logo asset to `branding-logo.png`.
2. **Registry and identity** — implement the typed module registry, route helpers, identity derivation and env `bookUrl`.
3. **Navigation UI** — implement `SessionAvatar`, `AppHeader`, `AppDrawerContent` and `ModulePlaceholderView`.
4. **Route migration** — create `app/(drawer)` routes, delete `app/(tabs)`, update root/auth redirects and guards, add `GestureHandlerRootView`.
5. **Verification** — add unit/component tests; run typecheck, lint and test; manual smoke on simulator per `quickstart.md`.

## Risks and Mitigations

| Risk | Mitigation |
| ---- | ---------- |
| Drawer gesture/animation fails at runtime because native deps were only transitive | Declare `gesture-handler`, `reanimated` and `worklets` in `apps/mobile/package.json` and wrap the root in `GestureHandlerRootView`. |
| Icons render as empty boxes | Use only typed Ionicons names and `@expo/vector-icons`; test header and drawer rendering. |
| Public page URL missing in environments | `EXPO_PUBLIC_BOOK_URL` is optional; hide the action when absent and document it in `.env.example`. |
| Existing screen headers duplicate the new persistent header | Turn off native navigator headers and remove per-screen `title` text only where it duplicates the persistent header; keep content headers/subtitles that add context. |
| `useMyBusiness` failing blocks the drawer | Treat tenant data as optional; navigation and user identity render regardless. |
| Active-route detection with Expo Router groups | Use canonical paths (`/agenda`) and prefix matching; route-group segments do not appear in `usePathname()`. |

## Post-Design Constitution Re-check

| Gate | Status | Evidence |
| ---- | ------ | -------- |
| Strict typing | PASS | Registry uses `Ionicons` glyph names; drawer/header props typed; no `any`. |
| Module data layer | PASS | `AppDrawerContent` consumes `useMyBusiness` and `useSignOut` hooks only. |
| Design tokens | PASS | No raw color values planned in components. |
| Thin routes | PASS | Each `app/(drawer)/*.tsx` is a one-component route. |
| Verification | PASS | `typecheck`, `lint`, `test` included in quickstart and tasks. |

**Gate result**: PASS.

## Complexity Tracking

No constitution violations. No additional projects, repositories or abstractions introduced.
