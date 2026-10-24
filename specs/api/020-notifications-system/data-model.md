# Phase 1 — Data Model

**Feature**: `specs/api/020-notifications-system` | **Date**: 2026-10-24

## 1. Notification (new entity)

A tenant-scoped inbox item shown in the admin header and on `/admin/notificaciones`.

| Field       | Type                            | Rules                                                                 |
| ----------- | ------------------------------- | --------------------------------------------------------------------- |
| `id`        | string (cuid)                   | required, unique, generated                                           |
| `tenantId`  | string                          | required, references `Tenant.id`, `onDelete: Cascade`                 |
| `type`      | `NotificationType` (enum)       | required, one of the five closed values                               |
| `title`     | string                          | required, non-empty (event headline)                                  |
| `message`   | string                          | required, non-empty (human-readable description)                      |
| `read`      | boolean                         | required, default `false` (unread)                                    |
| `createdAt` | datetime                        | required, default `now()`; ordering key (newest first)                |

**Indexes**

- `@@index([tenantId, createdAt])` — newest-first listing and pagination.
- `@@index([tenantId, read])` — unread count and unread filtering.

**Constraints / rules**

- Every notification belongs to exactly one business; a business has many notifications.
- Deleting a business cascades to its notifications.
- `read` is monotonic for a given notification (false → true); marking read is idempotent.
- Deletion is permanent (hard delete).
- `title`/`message` are stored already localised (Spanish) at creation time; no client rendering of enum keys.

## 2. NotificationType (new enum)

Closed set (uppercase canonical values; the UI maps them to labels/icons):

| Value                  | Meaning                                   | Automatic trigger in this phase |
| ---------------------- | ----------------------------------------- | ------------------------------- |
| `NEW_BOOKING`          | A client booked online                    | Yes (public booking)            |
| `RESCHEDULE_REQUEST`   | A reschedule was requested                | No (type supported only)        |
| `SUBSCRIPTION_EXPIRING`| Subscription expires within 3 days        | Yes (lazy, on read)             |
| `SUBSCRIPTION_EXPIRED` | Subscription has expired                  | Yes (lazy, on read)             |
| `SYSTEM_INFO`          | Informational/system message              | No (type supported only)        |

## 3. Tenant (existing entity — additive change)

A new relation is added under a **distinct field name** because `Tenant.notifications` is already used by `AppointmentNotification`:

```text
Tenant
  └── inbox Notification[]   (new; cascade delete with the tenant)
```

The `Notification.tenant` back-relation completes the link. No existing columns change.

## 4. Subscription sync (derived state, not stored)

When the tenant reads notifications, the service derives pending subscription notifications from the existing subscription fields:

| Condition (evaluated with `now`)                         | Result                                          |
| -------------------------------------------------------- | ----------------------------------------------- |
| `subscriptionExpiresAt` exists and is in the past        | ensure one `SUBSCRIPTION_EXPIRED` notification  |
| `subscriptionExpiresAt` exists and is ≤ 3 days in future | ensure one `SUBSCRIPTION_EXPIRING` notification |
| `subscriptionExpiresAt` far in the future or absent      | no expiry-related notification                  |

**Deduplication**: do not create a notification of a given type if one of the same type already exists for the tenant within the last **24 hours** (rolling window). The subscription itself is never mutated by this check.

## 5. Book domain type (consumer)

The `@foundly/book` module mirrors the API shape with an explicit domain type (mapped from generated codegen types only):

```text
type NotificationType =
  | 'NEW_BOOKING' | 'RESCHEDULE_REQUEST'
  | 'SUBSCRIPTION_EXPIRING' | 'SUBSCRIPTION_EXPIRED' | 'SYSTEM_INFO'

interface Notification {
  id: string
  type: NotificationType
  title: string
  message: string
  read: boolean
  createdAt: string   // ISO-8601
}
```

Client state (provider): `{ items: Notification[]; unreadCount: number; loading: boolean; error: string | null }` plus `refresh()`, `markRead(id)`, `markAllRead()`, `remove(id)`.

## 6. Validation & error rules

- All notification operations require an authenticated business session; the tenant scope comes from the token, never the request body.
- Unknown or foreign notification ids → `NOT_FOUND` (no reveal of existence across tenants).
- Marking an already-read notification → success (idempotent), no state change.
- `limit` must be a positive integer; values above the maximum are capped (default 50, max 100); invalid paging → `VALIDATION_ERROR`.
- `read` filter is optional: omitted = all notifications; `true`/`false` = read-only / unread-only.
