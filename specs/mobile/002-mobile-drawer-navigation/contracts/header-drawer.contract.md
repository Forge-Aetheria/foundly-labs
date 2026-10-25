# UI Contract: Header and Drawer Content

**Feature**: `specs/mobile/002-mobile-drawer-navigation`
**Consumers**: `app/(drawer)/_layout.tsx`, tests.

## AppHeader

```ts
export interface AppHeaderProps {
  identity: WorkspaceIdentity; // tenantName + tenantLogoUrl drive the left icon
  onOpenDrawer: () => void;
  onOpenNotifications: () => void;
}
```

### Rendering contract

- Root uses safe-area top inset and a fixed, tokenized height.
- Left slot: circular tenant icon (`SessionAvatar`). Shows the tenant `profile.logo` URL when valid; otherwise the tenant name initials on `colors.primarySoft` with `colors.primary` text.
- Left slot is a `Pressable` calling `onOpenDrawer`; minimum touch target 44×44.
- Center slot: static `Image` with the Foundly Book `branding-logo.png`, `resizeMode="contain"`, accessible label `"Foundly Book"`.
- Right slot: `Pressable` with Ionicons `notifications-outline`, accessible label `"Notificaciones"`, calling `onOpenNotifications`.
- No hamburger icon is rendered.
- All colors come from `@/shared/theme/tokens`; no hex literals in the component.
- Header appears on every drawer screen (set at navigator `screenOptions` level).

### Accessibility

- Tenant icon: `accessibilityLabel` `Avatar de <tenantName>` and the pressable label `Abrir menú de <tenantName>`.
- Brand: accessible label `"Foundly Book"`; it is decorative and does not open the drawer.
- Notifications: `accessibilityRole="button"` and label as above.

## AppDrawerContent

```ts
import type { DrawerContentComponentProps } from 'expo-router/drawer';

export interface AppDrawerContentProps extends DrawerContentComponentProps {
  identity: WorkspaceIdentity; // displayName, email, avatarUrl, initials, tenantName, tenantLogoUrl
  publicPageHref: string | null;
  onLogout: () => void;
  isLoggingOut?: boolean;
}
```

### Rendering contract

Top section:

1. Tenant icon (`SessionAvatar`, bordered per design system) + tenant name, in a `Pressable` that navigates to Agenda; accessible label `"<tenantName> — ir a Agenda"`.
2. When `publicPageHref` is non-null, an outlined `Button` labeled `"Ver página pública"` that calls `Linking.openURL(publicPageHref)` after `http(s)` validation.

Navigation list:

- Render `PRIMARY_MODULES` then a divider then `SECONDARY_MODULES`.
- Each item shows its Ionicons icon and label.
- Active item uses `colors.primarySoft` background and `colors.primary` text/icon.
- Tapping an item navigates to its route and closes the drawer.

Footer (pinned to bottom):

- Avatar (photo or initials), `displayName`, `email` (if present), `tenantName` (if present).
- Logout button labeled `"Cerrar sesión"` with Ionicons `log-out-outline`; calls `onLogout` and shows a pending state while `isLoggingOut`.

### Behavior

- The drawer closes after navigation and after tapping the public link.
- Loading or error on `useMyBusiness` must not block navigation; missing tenant data simply omits the tenant line and public link.
- Long names/emails truncate with `numberOfLines={1}`.

## Authentication and redirects

- `app/(auth)/_layout.tsx` redirects authenticated users to `DRAWER_HOME_ROUTE`.
- `app/index.tsx` redirects anonymous users to login and authenticated users to `DRAWER_HOME_ROUTE`.
- `app/(drawer)/_layout.tsx` keeps the existing loading, anonymous-redirect and `missing-tenant` handling.
- Logout uses the existing `useSignOut` hook from `@/modules/auth/hooks` and clears the session before redirecting.

## Error and empty states

- Public page missing: button hidden.
- Business query error: drawer still renders user identity; tenant line and public link are omitted.
- Module without mobile implementation: placeholder view with module title and `"Próximamente en móvil"` message.
