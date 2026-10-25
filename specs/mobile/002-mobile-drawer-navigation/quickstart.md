# Quickstart Validation: Mobile Drawer Navigation

**Feature**: `specs/mobile/002-mobile-drawer-navigation/spec.md`
**Date**: 2026-10-24

## Prerequisites

- Node.js and pnpm installed at the versions used by the monorepo.
- `apps/mobile/.env` configured with the existing API/Supabase values.
- Add `EXPO_PUBLIC_BOOK_URL` to `apps/mobile/.env` (local example: `http://localhost:3001`).
- An Expo development build or simulator with a valid tenant account.
- The asset `apps/mobile/assets/branding-logo.png` present (renamed from `brading-logo.png`).

## Install

```bash
pnpm install
```

This must add to `apps/mobile/package.json`:

- `@expo/vector-icons`
- `react-native-gesture-handler`
- `react-native-reanimated`
- `react-native-worklets`

## Automated verification

```bash
pnpm --filter @foundly/mobile typecheck
pnpm --filter @foundly/mobile lint
pnpm --filter @foundly/mobile test
```

Expected:

- Typecheck finishes with 0 errors.
- Lint finishes with 0 errors (no hex literals in components, no direct data calls in UI).
- Jest passes the new registry/identity/header/drawer tests plus the existing suite.

## Manual validation

Start the app:

```bash
pnpm --filter @foundly/mobile dev
```

Then verify:

1. **Login and entry** — sign in; the app lands on `/agenda`, not on a tab bar.
2. **Tabs removed** — no bottom tab bar appears on any screen.
3. **Header everywhere** — every module shows the tenant logo/avatar on the left, the Foundly brand logo centered, and the notifications icon on the right; no hamburger exists.
4. **Drawer trigger** — tapping the tenant icon on the left opens the drawer; the current module stays visible underneath.
5. **Module parity** — the drawer lists the ten modules in the specified order with icons and labels.
6. **Active state** — the current module is highlighted in the drawer.
7. **Navigation** — selecting each module opens its route and closes the drawer.
8. **Existing views** — Agenda, Notificaciones and Configuración keep their current data and interactions.
9. **Placeholders** — Servicios, Equipo, Galería, Reseñas, Disponibilidad, Soporte and Acerca de Foundly show an informative placeholder, never a blank/error screen.
10. **Drawer header and public page** — the drawer top shows the bordered tenant icon and tenant name; with a slug and `EXPO_PUBLIC_BOOK_URL` set, "Ver página pública" opens `{bookUrl}/{slug}` in the external browser. Remove the env var or use a tenant without slug and confirm the button is hidden.
11. **Profile card** — the drawer footer shows avatar/initials, name, email and tenant name when available; long values truncate.
12. **Logout** — the footer logout button clears the session and returns to login.
13. **Icons** — on iOS and Android, no empty boxes/rectangles appear in the drawer or header.
14. **Accessibility** — screen reader labels announce the brand as the drawer trigger, the avatar, the notifications action and each module.
15. **Small screen** — the drawer remains scrollable and the footer reachable in portrait and landscape.

## Expected failure handling

- Without `EXPO_PUBLIC_BOOK_URL`, the public page action is hidden; everything else works.
- Without a business/profile query response, the drawer still shows user identity and navigation.
- Expired session while the drawer is open: the next navigation/redirect returns to login.
