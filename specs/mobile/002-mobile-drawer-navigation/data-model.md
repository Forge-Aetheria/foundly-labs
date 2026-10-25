# Data Model: Mobile Drawer Navigation

**Feature**: `specs/mobile/002-mobile-drawer-navigation/spec.md`
**Date**: 2026-10-24

This feature introduces no persistent storage or backend entities. The model below describes the client-side structures used to render navigation and identity.

## NavigationModule

Represents one option in the drawer and its associated screen.

| Field         | Type                                      | Required | Source / rule |
| ------------- | ----------------------------------------- | -------- | ------------- |
| `id`          | `string`                                  | yes      | Stable key; same as route base (e.g. `agenda`). |
| `label`       | `string`                                  | yes      | Spanish label shown in the drawer. |
| `route`       | `string`                                  | yes      | Canonical Expo Router path (e.g. `/agenda`). |
| `icon`        | `IoniconsName`                            | yes      | Typed against `@expo/vector-icons` glyph map. |
| `group`       | `'primary' \| 'secondary'`                | yes      | Mirrors the Book admin sidebar grouping. |
| `description` | `string`                                  | no       | Used by placeholder screens. |

**Registry (canonical order)**:

| Order | id               | label              | route              | group     | icon |
| ----- | ---------------- | ------------------ | ------------------ | --------- | ---- |
| 1     | `agenda`         | Agenda             | `/agenda`          | primary   | `calendar-outline` |
| 2     | `servicios`      | Servicios          | `/servicios`       | primary   | `cut-outline` |
| 3     | `equipo`         | Equipo             | `/equipo`          | primary   | `people-outline` |
| 4     | `galeria`        | Galería            | `/galeria`         | primary   | `images-outline` |
| 5     | `resenas`        | Reseñas            | `/resenas`         | primary   | `star-outline` |
| 6     | `disponibilidad` | Disponibilidad     | `/disponibilidad`  | primary   | `time-outline` |
| 7     | `notificaciones` | Notificaciones     | `/notificaciones`  | secondary | `notifications-outline` |
| 8     | `configuracion`  | Configuración      | `/configuracion`   | secondary | `settings-outline` |
| 9     | `soporte`        | Ayuda y Soporte    | `/soporte`         | secondary | `help-circle-outline` |
| 10    | `about`          | Acerca de Foundly  | `/about`           | secondary | `information-circle-outline` |

**Validation rules**:

- Every `route` must have a matching file under `app/(drawer)/`.
- `id` values must be unique.
- All ten modules must exist; tests assert count, order and icon presence.
- Active state = `pathname === route` or `pathname.startsWith(`${route}/`)`.

## WorkspaceIdentity

Derived view model for the header avatar and drawer footer.

| Field        | Type              | Required | Derivation |
| ------------ | ----------------- | -------- | ---------- |
| `displayName`| `string`          | yes      | `full_name` → `name` → email local-part → `"Administrador"`. |
| `email`      | `string \| null`  | no       | `session.user.email`. |
| `avatarUrl`  | `string \| null`  | no       | `session.user.user_metadata.avatar_url`. |
| `initials`   | `string`          | yes      | First letters of the first two words of `displayName`, uppercased; `"AD"` fallback. |
| `tenantName` | `string \| null`  | no       | `useMyBusiness().data.name`; absent while loading or on error. |
| `tenantLogoUrl` | `string \| null` | no    | `useMyBusiness().data.profile.logo`; tenant initials fallback. |

**Validation rules**:

- Never throw when metadata is missing or not a string.
- Initials are 1–2 characters and never empty.
- No tenant data from another session is shown; identity comes from the active session only.

## PublicPageLink

Derived from the tenant profile and environment configuration.

| Field     | Type              | Required | Derivation |
| --------- | ----------------- | -------- | ---------- |
| `slug`    | `string \| null`  | no       | `useMyBusiness().data.profile.slug`. |
| `baseUrl` | `string \| null`  | no       | `env.bookUrl` (`EXPO_PUBLIC_BOOK_URL`, trailing slash trimmed). |
| `href`    | `string \| null`  | no       | `baseUrl` + `/` + `slug` when both exist; otherwise `null`. |
| `visible` | `boolean`         | yes      | `href !== null`. |

**Validation rules**:

- Only `http:` and `https:` URLs may be opened.
- If any input is missing, the action is hidden (FR-017).
- URL construction must not double slashes when the env value ends with `/`.

## HeaderState

| Field          | Type                        | Description |
| -------------- | --------------------------- | ----------- |
| `tenantIcon`   | `WorkspaceIdentity`         | Left slot; tenant logo or tenant initials. |
| `onOpenDrawer` | `() => void`                | Invoked by the tenant icon. |
| `onNotifications` | `() => void`             | Invoked by the right action. |
| `brandSource`  | image asset                 | `assets/branding-logo.png` bundled with the app. |

**State transitions**:

- Drawer closed → tap brand logo → drawer open.
- Drawer open → tap module → navigate to module → drawer closed.
- Drawer open → tap logout → session cleared → redirect to `/(auth)/login`.

## Screen route map

| Route              | Screen component            | Data source |
| ------------------ | --------------------------- | ----------- |
| `/agenda`          | `AgendaView` (existing)     | `useAgenda` |
| `/servicios`       | `ModulePlaceholderView`     | static registry |
| `/equipo`          | `ModulePlaceholderView`     | static registry |
| `/galeria`         | `ModulePlaceholderView`     | static registry |
| `/resenas`         | `ModulePlaceholderView`     | static registry |
| `/disponibilidad`  | `ModulePlaceholderView`     | static registry |
| `/notificaciones`  | `NotificationsView` (existing) | `useNotifications` |
| `/configuracion`   | `SettingsView` (existing)   | `useMyBusiness` |
| `/soporte`         | `ModulePlaceholderView`     | static registry |
| `/about`           | `ModulePlaceholderView`     | static registry |

## Removed model

- Bottom-tab route group `app/(tabs)` and the `TABS_ROUTE` constant are removed after the drawer migration. `DRAWER_HOME_ROUTE = '/agenda'` replaces them.
