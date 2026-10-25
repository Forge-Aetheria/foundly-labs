# Research: Mobile Drawer Navigation

**Feature**: `specs/mobile/002-mobile-drawer-navigation/spec.md`
**Date**: 2026-10-24

## R1 — Drawer implementation in Expo Router SDK 58

**Decision**: Use the Drawer exported by `expo-router/drawer` (bundled React Navigation drawer) instead of adding `@react-navigation/drawer` directly.

**Rationale**:

- `expo-router@58.0.26` already ships `expo-router/drawer` (`build/layouts/Drawer.js`) and bundles `react-native-drawer-layout`.
- Using the router-integrated navigator keeps URL/deep-link behaviour consistent with the rest of Expo Router and avoids a second React Navigation installation.
- The package exposes `Drawer`, `DrawerContentScrollView`, `DrawerItem`, `DrawerItemList`, `useDrawerStatus`, and the content/header typings needed for a fully custom drawer and header.

**Alternatives considered**:

- **`@react-navigation/drawer` installed directly**: rejected — duplicates navigation primitives already vendored by Expo Router and risks version drift.
- **Hand-rolled animated panel**: rejected — reinvents gesture, accessibility and safe-area behaviour that the navigator already provides.

## R2 — Required native/runtime dependencies

**Decision**: Add the following to `apps/mobile/package.json` using the versions bundled for Expo SDK 58:

| Package                       | Version    | Purpose                                    |
| ----------------------------- | ---------- | ------------------------------------------ |
| `@expo/vector-icons`          | `^15.0.2`  | Module, header and action icons            |
| `react-native-gesture-handler`| `~3.3.0`   | Drawer swipe/gesture support               |
| `react-native-reanimated`     | `4.7.1`    | Drawer animations                          |
| `react-native-worklets`       | `0.13.0`   | Reanimated 4 worklet runtime               |

**Rationale**:

- Expo Router declares these as peer dependencies for navigation features; they are currently present only transitively in the pnpm store, not in the mobile manifest.
- `@expo/vector-icons` is not resolvable from `apps/mobile` today (`require.resolve` fails), which would produce missing icons.
- `babel-preset-expo` automatically adds `react-native-worklets/plugin` when Reanimated 4/worklets are installed, so no custom Babel change is required.
- Register `GestureHandlerRootView` at the root to guarantee drawer gestures work on both platforms.

**Alternatives considered**:

- **Lucide-react-native**: rejected — the user explicitly asked for `@expo/vector-icons` and Ionicons covers every required glyph.
- **No explicit native deps (rely on hoisting)**: rejected — fragile under pnpm and invisible to Expo prebuild/EAS.

## R3 — Route structure and deep links

**Decision**: Replace `app/(tabs)` with `app/(drawer)` and expose canonical paths without the group segment:

| Module                | File                                | URL            |
| --------------------- | ----------------------------------- | -------------- |
| Agenda (home)         | `app/(drawer)/agenda.tsx`           | `/agenda`      |
| Servicios             | `app/(drawer)/servicios.tsx`        | `/servicios`   |
| Equipo                | `app/(drawer)/equipo.tsx`           | `/equipo`      |
| Galería               | `app/(drawer)/galeria.tsx`          | `/galeria`     |
| Reseñas               | `app/(drawer)/resenas.tsx`          | `/resenas`     |
| Disponibilidad        | `app/(drawer)/disponibilidad.tsx`   | `/disponibilidad` |
| Notificaciones        | `app/(drawer)/notificaciones.tsx`   | `/notificaciones` |
| Configuración         | `app/(drawer)/configuracion.tsx`    | `/configuracion` |
| Ayuda y Soporte       | `app/(drawer)/soporte.tsx`          | `/soporte`     |
| Acerca de Foundly     | `app/(drawer)/about.tsx`            | `/about`       |

`app/(drawer)/index.tsx` redirects to `/agenda`; the root `app/index.tsx` and auth layout redirect to the same canonical home. Route-group segments do not affect the public URL.

**Rationale**: Matches the paths in the feature request and keeps the web-parity mental model. A single `DRAWER_HOME_ROUTE = '/agenda'` constant replaces `TABS_ROUTE`.

**Alternatives considered**:

- **Keep `index` as Agenda only**: rejected — the spec lists `/agenda` explicitly and deep links should be stable.
- **Use `(drawer)/index` plus duplicate `agenda.tsx`**: rejected — duplicate screens and ambiguous active state.

## R4 — Header composition and drawer trigger

**Decision**: Implement `AppHeader` as a custom header rendered by the drawer navigator on every screen (`header: (props) => <AppHeader ... />`). The layout is:

- Left: `SessionAvatar` derived from the Supabase session (photo, tenant logo fallback, or initials).
- Center: `branding-logo.png` rendered with React Native `Image`, wrapped in a `Pressable` that calls `navigation.openDrawer()`.
- Right: Ionicons notifications button that navigates to `/notificaciones`.

No hamburger button is rendered. The header respects safe-area insets and a fixed height.

**Rationale**: Matches the user's explicit header decision and keeps the drawer discoverable through the brand logo. A navigator-level header avoids duplicating header markup in each screen.

**Alternatives considered**:

- **Header inside each screen**: rejected — duplicated logic and inconsistent safe-area handling.
- **Default navigator header + hamburger**: rejected — the user removed the hamburger and wants the centered brand.

## R5 — Workspace identity for header and drawer footer

**Decision**: Derive user identity from the existing Supabase session (`session.user.email`, `user_metadata.full_name | name | avatar_url`) through a pure helper plus the existing session context. Resolve the tenant display name from the existing `useMyBusiness()` query (already used by Configuración and cached by tenant).

- Name precedence: `user_metadata.full_name` → `user_metadata.name` → email local-part → `"Administrador"`.
- Avatar precedence: `user_metadata.avatar_url` → first letter(s) of the name (initials).
- Tenant name is shown as secondary context when available; absence never blocks the drawer.
- No new backend query or API change is required.

**Rationale**: Avoids expanding the GraphQL `Me` contract (which exposes only `userId`, `role` and tenant id/status/plan) and reuses data already fetched by the app. Keeps the data layer inside the existing settings module hook.

**Alternatives considered**:

- **Extend `Me` to return user profile/tenant name**: rejected — backend change outside this navigation feature.
- **Add a new shared GraphQL query**: rejected — duplicate of `MyBusiness` and extra cold-start request.

## R6 — Public page link

**Decision**: Add an optional `EXPO_PUBLIC_BOOK_URL` environment variable (example value `http://localhost:3001`) representing the Foundly Book web origin. The drawer builds `${bookUrl}/${tenantSlug}` from `useMyBusiness().profile.slug`. If the env var or the slug is missing, the "Ver página pública" button is hidden.

Open the URL with React Native `Linking.openURL`, after validating it is an `http(s)` URL. Update `.env.example` and the local `.env` with the new key.

**Rationale**: The mobile app cannot infer the web origin reliably across local, preview and production. The public portal lives under Book at `/{tenantSlug}` (`specs/architecture.md`, `apps/book/src/shared/tenancy/adminWorkspace.ts`). Hiding the action when configuration is absent matches FR-017 and avoids broken links.

**Alternatives considered**:

- **Hardcode `https://book.foundlylabs.com`**: rejected — breaks local development and previews.
- **Reuse `EXPO_PUBLIC_API_URL`**: rejected — API and web origins are different services.

## R7 — Icons

**Decision**: Use `Ionicons` from `@expo/vector-icons` with a single registry of icon names:

| Module             | Ionicons name             |
| ------------------ | ------------------------- |
| Agenda             | `calendar-outline`        |
| Servicios          | `cut-outline`             |
| Equipo             | `people-outline`          |
| Galería            | `images-outline`          |
| Reseñas            | `star-outline`            |
| Disponibilidad     | `time-outline`            |
| Notificaciones     | `notifications-outline`   |
| Configuración      | `settings-outline`        |
| Ayuda y Soporte    | `help-circle-outline`     |
| Acerca de Foundly  | `information-circle-outline` |
| Header notifications | `notifications-outline` |
| Avatar fallback    | text initials (no icon)   |

**Rationale**: Ionicons is bundled with `@expo/vector-icons`, has outline variants that match the Clean Light UI, and avoids font-loading gaps. Icon names are typed against the Ionicons glyph map, so invalid names fail at typecheck.

**Alternatives considered**:

- **Lucide-react-native**: rejected — extra dependency and contrary to the explicit icon-library requirement.
- **Remote images/SVGs per module**: rejected — unnecessary network dependency and inconsistent rendering.

## R8 — Placeholder modules

**Decision**: Add a shared `ModulePlaceholderView` for modules without mobile functionality. It receives the module label/description/icon, shows the module name and a clear "Próximamente en móvil" state, and offers a link to open the web admin when configured. No fake data and no tenant data are displayed.

**Rationale**: Satisfies navigation parity without inventing business behaviour, keeps FR-021 honest, and prevents blank screens.

**Alternatives considered**:

- **Deep-link directly to the web admin**: rejected — leaves the app and breaks the native experience for core navigation.
- **Omit the modules until implemented**: rejected — violates the requested parity.

## R9 — Testing strategy

**Decision**:

- Unit-test the pure module registry (all 10 modules, order, icons, routes, primary/secondary grouping).
- Unit-test the identity helper (name/avatar/initials fallbacks).
- Component-test `AppHeader` with a mocked navigation object: avatar, brand press opens drawer, notifications press navigates.
- Component-test `AppDrawerContent` with a mocked navigation/state: active highlighting, public link visibility, logout invocation.
- Keep existing agenda/notifications/settings tests unchanged.
- Use `jest-expo` + `@testing-library/react-native`; mock `expo-router` navigation helpers and `expo-linking` where needed.

**Rationale**: The highest-risk logic is the registry, identity derivation and navigation callbacks; full navigator integration tests add little confidence and are slow.

**Alternatives considered**:

- **End-to-end Detox tests**: rejected — not part of the current toolchain and outside this feature's scope.
