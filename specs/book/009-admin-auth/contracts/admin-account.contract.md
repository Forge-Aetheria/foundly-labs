# Contract: Admin Account Surfaces (public slug link & security section)

**Feature**: `specs/book/009-admin-auth` | **Date**: 2026-10-12

## Scope

The user-visible additions inside the admin area: the **public booking page quick link** and the **security/settings (password change) section**. All UI uses `@foundly/ui` primitives and tokens only.

## Public slug quick link

- **Location**: the admin shell (`shared/components/AdminShell.tsx`) — persistent sidebar and mobile header.
- **Source**: the admin layout (server) resolves the tenant from the session and passes a serializable `publicHref: string | null` (e.g. `/{slug}`) to the shell.
- **Behaviour**:
  - Rendered as a prominent, clickable link (Next `Link`) with a "Ver página pública" label and the public URL.
  - Opens the owner's public booking page (`app/[tenantSlug]/page.tsx`), in a new tab.
  - Reflects the tenant's current `slug`.
  - When the tenant has no slug, the link is hidden/non-actionable (never points to a broken page).
- **Props rule**: only serializable props cross the server→client boundary (`publicHref`, `tenantName`); no callbacks.

## Security section — `/admin/seguridad`

- **Route**: `app/admin/seguridad/page.tsx` (server) → `modules/security/SecurityView.tsx`.
- **Navigation**: added to `SECONDARY_NAV` in `shared/components/AdminNavigation.ts` (`{ href: '/admin/seguridad', label: 'Seguridad' }`).
- **Form** (`modules/security/components/PasswordForm.tsx`, `'use client'`):
  - Fields: current password, new password, confirm new password.
  - Uses `@foundly/ui` `TextField` + `Button`; inline validation errors and a success confirmation.
  - Calls the `changePassword` Server Action; shows pending/disabled state while submitting.
- **Accessibility**: keyboard-operable, labelled fields; `vitest-axe` reports zero critical violations.

## Sign-out affordance

- **Location**: the admin shell footer/header.
- **Behaviour**: a `'use client'` button that calls the `signOut` Server Action; on completion the user is on `/login` and admin routes are no longer accessible.

## Rules

- `@foundly/ui` only; no ad-hoc brand styling or magic colors (constitution §6).
- Client components hold no secrets and receive no function props from server components.
- The public link and security form are independent slices (each testable on its own).
