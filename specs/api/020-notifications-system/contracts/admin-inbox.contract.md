# Contract: Admin Inbox (consumer surface — `@foundly/book`)

**Feature**: `specs/api/020-notifications-system` | **Date**: 2026-10-24

Defines the admin UI surface that consumes the notifications API. It lives in `apps/book/src/modules/notifications/` and is mounted by the admin shell. It follows the module data-layer rule (UI never calls actions/transport directly; interactions go through `hooks.ts`).

## Data layer

- `notifications.graphql` — GraphQL operations (list, unread count, mark one, mark all, delete) feeding `graphql-codegen`.
- `actions.ts` (`'use server'`) — `apiRequestAdmin` calls + DTO→domain mapping; returns `ActionResult`.
- `hooks.ts` (`'use client'`) — `useFetchNotifications`, `useUnreadNotificationCount`, `useMarkNotificationRead`, `useMarkAllNotificationsRead`, `useDeleteNotification`.
- `NotificationsProvider.tsx` (`'use client'`) — context holding `{ items, unreadCount, loading, error }` and actions `refresh/markRead/markAllRead/remove`; updates optimistically then refetches. Mounted once in `app/admin/layout.tsx` so the header bell and the page share state.

## Admin header (bell + dropdown)

- `AdminShell` gains a persistent top bar with a right-aligned `headerActions` slot (generic; shared layer does not import modules). The app layout injects `<NotificationBell />`.
- `NotificationBell`:
  - Shows a bell icon on all admin screens and viewports.
  - Shows a **dynamic unread badge** (accent color) from `unreadCount`; hidden/neutral at zero.
  - Click opens a dropdown with the **latest 5** notifications (title, message, relative time), a **"Marcar todas como leídas"** action, and a **"Ver todas las notificaciones"** link to `/admin/notificaciones`.
  - Clean empty state; dismissible; keyboard-accessible (opens/closes, focusable items).
- After mark-read/mark-all/delete, the badge and dropdown reflect the change immediately (no full reload).

## Dedicated page — `/admin/notificaciones`

- Route: `app/admin/notificaciones/page.tsx` → `NotificationsView` (thin route).
- Layout inside the authenticated admin shell.
- Header: page title, current unread count, and a **"Marcar todas como leídas"** button.
- Quick filters: **"Todas"** / **"No leídas"** (client-side or query-filtered; no full reload).
- Notification item:
  - Type-appropriate icon (calendar for bookings, alert for subscription, info for system).
  - Title, message, and a **relative date** (`Hace 10 minutos`, `Ayer a las 14:30`, older absolute dates).
  - Clear **read/unread** indicator (dot or soft background).
  - Clicking the item marks it read automatically.
  - A **delete** action (trash icon) removes it permanently.
- States: loading skeleton, empty ("no hay notificaciones"), and error (retry), all keyboard-accessible with zero critical axe violations.

## Navigation

- Add `/admin/notificaciones` to `SECONDARY_NAV` (icon: notifications) for direct access, in addition to the bell dropdown link.

## Rules

- `@foundly/ui` primitives + MUI (icons, `Badge`, `Menu`/`Popover`) only; colors via theme token paths (primary/brand, `surface.*`, `divider`, `warning.*`), no magic colors (code-rules §4).
- Client components hold handlers; no functions are passed from Server Components to Client Components (constitution §5.V).
- Relative-date and type→icon mappings are pure utilities with unit tests.
