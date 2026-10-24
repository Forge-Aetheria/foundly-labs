# Quickstart: Tenant Mobile App

**Feature**: `specs/mobile/001-tenant-mobile-app` | **Date**: 2026-10-24

## Prerequisites

- Node.js ≥ 22.13 (repository currently runs Node 24.11).
- Corepack enabled; pnpm 10 available (`corepack enable && corepack prepare pnpm@latest --activate`).
- Expo Go for UI-only validation, or an Expo development build for push notifications.
- A Supabase account with `app_metadata.tenant_id` set and a tenant with profile, services and appointments.
- Foundly API running locally on port 3002 with a valid `DATABASE_URL`/`SUPABASE_AUTH_URL`.

## Environment

Create `apps/mobile/.env` (never commit it) from `.env.example`:

```dotenv
EXPO_PUBLIC_API_URL=http://localhost:3002
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_EAS_PROJECT_ID=
```

Set `CORS_ORIGINS` in the API to include the Expo dev origin if testing on web; native requests are not subject to browser CORS.

## Setup and run

```bash
corepack enable
pnpm install
pnpm --filter @foundly/api dev          # terminal 1
pnpm --filter @foundly/mobile dev       # terminal 2 (Expo dev server)
```

For remote push:

```bash
pnpm --filter @foundly/mobile exec eas build --profile development --platform ios
pnpm --filter @foundly/mobile exec eas build --profile development --platform android
```

## Quality gates

```bash
pnpm --filter @foundly/mobile typecheck
pnpm --filter @foundly/mobile lint
pnpm --filter @foundly/mobile test
pnpm --filter @foundly/mobile build
```

Expected: every command exits 0. `build` validates the native bundle export without publishing.

## Validation scenarios

### 1. Login and session (US1)

1. Launch without a session → login screen, no tab bar visible.
2. Toggle password visibility → text alternates, value preserved.
3. Submit invalid credentials → inline error, no crash, no token logged.
4. Submit valid credentials → agenda tab opens.
5. Kill and reopen the app → session restored without re-entering credentials.
6. Sign out → login screen and no protected content.

### 2. Agenda (US2)

1. With upcoming appointments → list ordered by start time with date, service, specialist and client.
2. Empty tenant → informative empty state.
3. Pull to refresh after creating an appointment from the web admin → new appointment appears.
4. Disable the network and refresh → cached data plus an offline/error indicator with retry.

### 3. Notifications (US3)

1. Generate a new online booking → a notification appears at the top.
2. Mark it read → visual state changes immediately and persists after restarting the app.
3. Filter/empty tenant → informative empty state.
4. Switch accounts → no notifications from the previous tenant are visible.

### 4. Profile and public page (US4)

1. Open configuration → business name, contact data and publication state match the API.
2. Toggle public off → server confirms and the public URL stops resolving.
3. Toggle public on → server confirms and the public URL resolves again.
4. Simulate a failed mutation → toggle reverts to its previous state with an error message.

### 5. Push notifications (US5)

1. Log in on a development build and accept permission → device registers.
2. Trigger an API notification for the tenant → the device receives the push.
3. Tap the push → app opens the notifications tab.
4. Deny permission on a fresh install → all other flows still work and a settings hint is shown.
5. Log out → token is unregistered; a new tenant notification does not reach the device.
6. Log in as another tenant on the same device → new pushes target the new tenant only.

## Troubleshooting

- **Metro cannot resolve a workspace package**: confirm `.npmrc` has `node-linker=hoisted`, rerun `pnpm install`, and clear the Expo cache (`pnpm --filter @foundly/mobile exec expo start -c`).
- **No push token**: Expo Go cannot receive remote push; use a development build and confirm `EXPO_PUBLIC_EAS_PROJECT_ID`.
- **`UNAUTHENTICATED` immediately after login**: verify the Supabase project is the same one configured in the API (`SUPABASE_AUTH_URL`) and that the user has `app_metadata.tenant_id`.
- **Empty agenda**: verify the tenant has appointments in the requested range and the device timezone matches the tenant timezone.
