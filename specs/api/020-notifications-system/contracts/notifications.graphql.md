# Contract: Notifications API (GraphQL)

**Feature**: `specs/api/020-notifications-system` | **Date**: 2026-10-24

Defines the public GraphQL surface of the `notifications` module. All operations are **authenticated** (`@RequireAuth()`) and **tenant-scoped from the verified JWT claim** (`AuthUser.tenantId`) — never from an argument.

## SDL (shape)

```graphql
enum NotificationType {
  NEW_BOOKING
  RESCHEDULE_REQUEST
  SUBSCRIPTION_EXPIRING
  SUBSCRIPTION_EXPIRED
  SYSTEM_INFO
}

type NotificationObject {
  id: ID!
  type: NotificationType!
  title: String!
  message: String!
  read: Boolean!
  createdAt: String!
}

type Query {
  """Newest first; tenant-scoped. Default limit 50, max 100."""
  notifications(read: Boolean, limit: Int, offset: Int): [NotificationObject!]!
  """Number of unread notifications for the authenticated business."""
  unreadNotificationCount: Int!
}

type Mutation {
  """Idempotent. NOT_FOUND if the notification does not belong to the caller."""
  markNotificationRead(id: ID!): NotificationObject!
  """Marks every notification of the business as read; returns the count updated."""
  markAllNotificationsRead: Int!
  """Permanently deletes one notification. NOT_FOUND if unknown/foreign."""
  deleteNotification(id: ID!): Boolean!
}
```

## Behaviour

| Operation | Input | Success | Failure |
| --- | --- | --- | --- |
| `notifications` | optional `read`, `limit`, `offset` | array ordered by `createdAt DESC`, bounded | `UNAUTHENTICATED`; `VALIDATION_ERROR` on invalid paging |
| `unreadNotificationCount` | — | `Int` matching the unread list exactly | `UNAUTHENTICATED` |
| `markNotificationRead` | `id` | updated notification (`read: true`) | `UNAUTHENTICATED`; `NOT_FOUND` (unknown/foreign) |
| `markAllNotificationsRead` | — | number of rows updated (0 allowed) | `UNAUTHENTICATED` |
| `deleteNotification` | `id` | `true` | `UNAUTHENTICATED`; `NOT_FOUND` (unknown/foreign) |

## Side effects & triggers

- Reading `notifications` or `unreadNotificationCount` first runs the **lazy subscription check** for the caller's tenant (see data-model §4); it may create `SUBSCRIPTION_EXPIRING` / `SUBSCRIPTION_EXPIRED` notifications (deduped 24 h per type) but never mutates the subscription.
- A successful **public online booking** (`createAppointment`, origin `online`) creates exactly one `NEW_BOOKING` notification for the booked tenant. Admin-origin bookings and rejected/conflicting bookings create none. Notification creation is best-effort and never fails the booking.

## Tenant isolation & errors

- Every read/write filters by the tenant derived from the session; another tenant's ids behave as `NOT_FOUND`.
- Stable error codes: `UNAUTHENTICATED`, `FORBIDDEN`, `VALIDATION_ERROR`, `NOT_FOUND` (existing API error envelope).

## Consumers

- `@foundly/book` module `modules/notifications` (via `notifications.graphql` + `actions.ts`/`hooks.ts`, codegen-only types). See `contracts/admin-inbox.contract.md`.
