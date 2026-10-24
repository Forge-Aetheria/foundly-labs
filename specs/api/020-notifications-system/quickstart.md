# Quickstart & Validation Guide

**Feature**: `specs/api/020-notifications-system` | **Date**: 2026-10-24

Validation guide to prove the central notification system works end-to-end. It references `data-model.md` and `contracts/` instead of duplicating them.

## Prerequisites

- Node.js 20+, dependencies installed at the repo root.
- A DDL-capable database connection for the migration (see "Database" below).
- Environment variables present for `apps/api` and `apps/book` (`.env` files already configured for the project).

## Database

1. Apply the new model to the database:
   ```bash
   npm run db:generate -w @foundly/database   # regenerate Prisma client (always)
   npm run db:migrate  -w @foundly/database   # apply the notification migration
   ```
2. **Supabase pooler note**: if the environment only exposes the transaction pooler, `migrate` may fail/hang. Run the DDL through the **session/direct** connection, or execute the migration SQL (creating the enum, table, indexes and FK; idempotent where possible) in the Supabase SQL editor. The generated client and schema snapshot must still be updated locally.
3. Verify the table exists (`Notification` with the five-value enum, `read` default false, indexes on `(tenantId, createdAt)` and `(tenantId, read)`).

## API

1. Keep the SDL snapshot in sync and regenerate types:
   ```bash
   # after adding the module, the API rewrites apps/api/src/schema.gql on boot
   # sync the tracked snapshot apps/book/codegen.schema.gql, then:
   npm run codegen -w @foundly/book
   ```
2. Run the API and exercise the contract in the GraphQL playground (`/graphql`) with an authenticated token:
   - `unreadNotificationCount` returns `0` for a fresh tenant.
   - Create an online booking (public booking page) → `notifications` now shows a `NEW_BOOKING` item and `unreadNotificationCount` increments by one.
   - `markNotificationRead(id)` → item becomes `read: true`; count decrements; repeating the call is idempotent.
   - `markAllNotificationsRead` → count returns the number updated and `unreadNotificationCount` becomes `0`.
   - `deleteNotification(id)` → item disappears; deleting the same id again returns `NOT_FOUND`.
   - With an expired/≤3-days subscription, the first read materialises the corresponding subscription notification; repeated reads within 24 h do not duplicate it.
3. Confirm strict scope: a token for tenant B cannot read, mark or delete tenant A's notifications (ids behave as `NOT_FOUND`).

## Book (admin UI)

Run the book app (`npm run dev:book`) and, as an authenticated owner:

1. **Header bell**: the bell appears on every admin screen; with unread items it shows the accent badge equal to the unread count.
2. **Dropdown**: clicking the bell shows the latest notifications, a "Marcar todas como leídas" action and "Ver todas las notificaciones".
3. **Immediate sync**: marking one/all as read or deleting updates the badge/dropdown without a full page reload.
4. **Dedicated page** `/admin/notificaciones`:
   - Header shows title, unread count and "Marcar todas como leídas".
   - "Todas" / "No leídas" filters behave correctly.
   - Items show type icon, title, message, relative date and a read/unread indicator.
   - Clicking an item marks it read; the trash icon deletes it permanently.
   - Empty, loading and error states render cleanly.
5. **Triggers**: complete a public booking and confirm the new booking notification appears in the header; adjust the subscription expiry in the seed/DB and confirm the expiring/expired notification appears on the next read.

## Gates

```bash
npm run typecheck -w @foundly/book
npm run lint     -w @foundly/book
npm run test     -w @foundly/book

# affected workspaces
npm run typecheck -w @foundly/api
npm run lint      -w @foundly/api
npm run test      -w @foundly/api
npm run typecheck -w @foundly/database
```

Expected: all pass, zero regressions; new tests cover the API contract/triggers and the book bell/page interactions.

## Docs

- `data-model.md` — entity, enum, indexes, subscription sync rule.
- `contracts/notifications.graphql.md` — API surface and errors.
- `contracts/admin-inbox.contract.md` — UI consumer contract.
