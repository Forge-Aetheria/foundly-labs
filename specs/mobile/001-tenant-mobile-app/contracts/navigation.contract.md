# Contract: Navigation and Screens

**Feature**: `specs/mobile/001-tenant-mobile-app` | **Date**: 2026-10-24

## Route map

| Route                    | File                            | Purpose                                          | Access              |
| ------------------------ | ------------------------------- | ------------------------------------------------ | ------------------- |
| `/`                      | `app/index.tsx`                 | Session bootstrap and redirect                   | Public              |
| `/(auth)/login`          | `app/(auth)/login.tsx`          | Email/password login, password visibility toggle | Anonymous only      |
| `/(tabs)`                | `app/(tabs)/index.tsx`          | Agenda summary (default tab)                     | Authenticated admin |
| `/(tabs)/notificaciones` | `app/(tabs)/notificaciones.tsx` | Tenant notification inbox                        | Authenticated admin |
| `/(tabs)/configuracion`  | `app/(tabs)/configuracion.tsx`  | Profile summary and public-page toggle           | Authenticated admin |

The tab layout exposes exactly three destinations: **Agenda**, **Notificaciones**, **Configuración**. Each route file is thin and renders a module view from `src/modules/**/<Module>View.tsx`.

## Guards

- Root layout wraps the app in `SessionProvider` and `QueryClientProvider`, shows a splash while the session is restored, then renders `Stack.Protected` groups.
- Unauthenticated users cannot render `(tabs)` content.
- Authenticated users visiting `login` are redirected to `(tabs)`.
- Missing tenant claim shows a blocking explanatory screen with sign-out.

## Screen states

Every data screen implements: loading skeleton, empty state with explanation, error state with retry, and stale-data banner when serving cache offline.

## Deep links

- Scheme: `foundly-mobile`.
- Notification tap → `/(tabs)/notificaciones`.
- Optional `foundly-mobile://agenda` → agenda tab.

## Accessibility

- All interactive elements have accessible labels and minimum 44×44 pt touch targets.
- Dynamic type supported; layouts reflow in portrait and landscape on phones and tablets.
- Loading and error states are announced to screen readers.
