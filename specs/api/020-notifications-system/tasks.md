---
description: "Task list for the central notification system (in-app inbox)"
---

# Tasks: Central Notification System (In-App Inbox)

**Input**: Design documents from `/specs/api/020-notifications-system/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Included — the spec requires automated coverage (FR-029/FR-030) and the user asked to run `typecheck`, `lint`, `test`.

**Organization**: Tasks are grouped by user story so each can be implemented and tested independently.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: US1–US4 (maps to spec.md)
- Every task includes an exact file path.

## Path Conventions

Monorepo:
- Database: `packages/database/prisma/`
- API: `apps/api/src/modules/<module>/`
- Book: `apps/book/src/modules/<module>/`, routes in `apps/book/src/app/`, shared chrome in `apps/book/src/shared/components/`

---

## Phase 1: Setup (Database foundation)

**Purpose**: Persist the notification entity before any module can use it.

- [X] T001 Add the `NotificationType` enum, the `Notification` model (id, tenantId, type, title, message, read default false, createdAt default now, indexes) and the distinct `Tenant.inbox Notification[]` relation in `packages/database/prisma/schema.prisma`
- [X] T002 Create the migration `packages/database/prisma/migrations/<timestamp>_add_notification/migration.sql` (create enum, table, `(tenantId, createdAt)` + `(tenantId, read)` indexes, FK with cascade)
- [X] T003 Run `npm run db:generate -w @foundly/database` and apply the migration to a DDL-capable connection per `quickstart.md` (session/direct or SQL editor fallback)

---

## Phase 2: Foundational (Blocking prerequisites)

**Purpose**: Shared API module + book data layer that every user story depends on.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T004 [P] Create the GraphQL types in `apps/api/src/modules/notifications/notifications.types.ts` (`registerEnumType(NotificationType)` + `NotificationObject`)
- [X] T005 [P] Create the store seam in `apps/api/src/modules/notifications/notifications.store.ts` (`NotificationStore` interface, `NOTIFICATION_STORE` token, `PrismaNotificationStore`)
- [X] T006 Implement `NotificationsService` core (requireTenant, `list`, `countUnread`, `markRead`, `markAllRead`, `delete`; no triggers yet) in `apps/api/src/modules/notifications/notifications.service.ts`
- [X] T007 Implement the resolver in `apps/api/src/modules/notifications/notifications.resolver.ts` (`notifications`, `unreadNotificationCount`, `markNotificationRead`, `markAllNotificationsRead`, `deleteNotification`, all `@RequireAuth`)
- [X] T008 Create `apps/api/src/modules/notifications/notifications.module.ts` (providers + export `NotificationsService`) and register it in `apps/api/src/app.module.ts`
- [X] T009 [P] Write API service unit tests in `apps/api/src/modules/notifications/notifications.service.spec.ts` (scope, list order/filter/paging, unread count, idempotent mark, mark-all, delete not-found, cross-tenant isolation)
- [X] T010 [P] Write resolver e2e tests in `apps/api/src/modules/notifications/notifications.resolver.spec.ts` (auth matrix + queries/mutations with an overridden Prisma client)
- [X] T011 [P] Add book GraphQL operations in `apps/book/src/modules/notifications/notifications.graphql` (list, unread count, mark one, mark all, delete)
- [X] T012 Sync `apps/book/codegen.schema.gql` from the API SDL and run `npm run codegen -w @foundly/book`
- [X] T013 [P] Create the book domain types and pure utilities in `apps/book/src/modules/notifications/utils/types.ts`, `apps/book/src/modules/notifications/utils/notificationMeta.ts` and `apps/book/src/modules/notifications/utils/relativeTime.ts`
- [X] T014 Create the book data layer `apps/book/src/modules/notifications/actions.ts` (`'use server'`, `apiRequestAdmin`, DTO→domain mapping) and `apps/book/src/modules/notifications/hooks.ts` (`useFetchNotifications`, `useUnreadNotificationCount`, `useMarkNotificationRead`, `useMarkAllNotificationsRead`, `useDeleteNotification`)
- [X] T015 Create the client context `apps/book/src/modules/notifications/NotificationsProvider.tsx` (items, unreadCount, loading, error + refresh/markRead/markAllRead/remove with optimistic update + refetch)
- [X] T016 [P] Write book data-layer tests `apps/book/src/modules/notifications/tests/actions.test.ts` and `apps/book/src/modules/notifications/tests/relativeTime.test.ts`

**Checkpoint**: Foundation ready — US1–US4 can proceed.

---

## Phase 3: User Story 1 — Header bell & quick-view (Priority: P1) 🎯 MVP

**Goal**: A bell in the admin header with a dynamic unread badge and a quick-view dropdown (latest 5, mark-all, link to the page), synced immediately with provider state.

**Independent Test**: With unread notifications present, the bell shows the count; opening it lists the latest notifications with mark-all and a link to `/admin/notificaciones`; marking all updates the badge without a reload.

- [X] T017 [US1] Add a persistent top bar with a right-aligned `headerActions` slot (and keep the mobile menu) in `apps/book/src/shared/components/AdminShell.tsx`
- [X] T018 [P] [US1] Create `apps/book/src/modules/notifications/components/NotificationBell.tsx` (bell icon, accent unread badge, dropdown with latest 5, "Marcar todas como leídas", "Ver todas las notificaciones" → `/admin/notificaciones`, empty state, keyboard access)
- [X] T019 [US1] Wire `NotificationsProvider` around the shell and inject `<NotificationBell />` via `headerActions` in `apps/book/src/app/admin/layout.tsx`
- [X] T020 [P] [US1] Write `apps/book/src/modules/notifications/tests/NotificationBell.test.tsx` (badge count, dropdown contents, mark-all, link href, empty state, immediate badge update)
- [X] T021 [P] [US1] Update `apps/book/src/shared/components/tests/AdminShell.test.tsx` to cover the top bar and `headerActions` slot

**Checkpoint**: US1 fully functional and independently testable (MVP).

---

## Phase 4: User Story 2 — Dedicated inbox page (Priority: P1)

**Goal**: `/admin/notificaciones` with header (title, unread count, mark-all), "Todas"/"No leídas" filters, themed items with relative dates and read/unread indicator, mark-read-on-click and permanent delete.

**Independent Test**: Open the page, switch filters, click an item to mark it read, delete an item, and confirm the header count stays in sync; empty/loading/error states render.

- [X] T022 [P] [US2] Create `apps/book/src/modules/notifications/components/NotificationItem.tsx` (type icon, title, message, relative date, read/unread indicator, click-to-read, delete/trash action)
- [X] T023 [P] [US2] Create `apps/book/src/modules/notifications/components/NotificationsList.tsx` (list + loading/empty/error states)
- [X] T024 [US2] Create `apps/book/src/modules/notifications/NotificationsView.tsx` (header with title/unread count/mark-all, "Todas"/"No leídas" quick filters, composes the list)
- [X] T025 [US2] Create the thin route `apps/book/src/app/admin/notificaciones/page.tsx` rendering `NotificationsView`
- [X] T026 [US2] Add `/admin/notificaciones` (notifications icon) to `SECONDARY_NAV` in `apps/book/src/shared/components/AdminNavigation.ts`
- [X] T027 [P] [US2] Write `apps/book/src/modules/notifications/tests/NotificationsView.test.tsx` (filters, mark-read-on-click, delete, empty/error/loading, mark-all)

**Checkpoint**: US1 and US2 both work independently.

---

## Phase 5: User Story 3 — Automatic new-booking notification (Priority: P1)

**Goal**: A successful public online booking creates exactly one `NEW_BOOKING` notification; rejected/admin bookings create none; the trigger never fails the booking.

**Independent Test**: Create an online booking and confirm one `NEW_BOOKING` notification exists for the tenant and the unread count increments; a conflicting booking and an admin booking create none.

- [X] T028 [US3] Add `notifyNewOnlineBooking` (store `create` + dedupe helper) to `apps/api/src/modules/notifications/notifications.service.ts` and `apps/api/src/modules/notifications/notifications.store.ts`
- [X] T029 [US3] Trigger it after a successful `origin: 'online'` creation (best-effort `try/catch` + log) and add `name` to the service select in `apps/api/src/modules/appointments/appointments.service.ts`
- [X] T030 [US3] Import `NotificationsModule` and inject `NotificationsService` in `apps/api/src/modules/appointments/appointments.module.ts`
- [X] T031 [P] [US3] Extend `apps/api/src/modules/appointments/appointments.service.spec.ts` (online → exactly 1 notification; failed/conflicting → 0; admin-origin → 0; notification failure does not fail the booking)

**Checkpoint**: US1–US3 work independently.

---

## Phase 6: User Story 4 — Subscription expiry warnings (Priority: P2)

**Goal**: On read, materialise `SUBSCRIPTION_EXPIRING` (≤ 3 days) or `SUBSCRIPTION_EXPIRED` (past) once per type per 24 h; no notification when not applicable; never mutate the subscription.

**Independent Test**: Set an expiry ≤ 3 days and read notifications → an expiring item appears; set it in the past → an expired item; far-future/absent → none; repeated reads do not duplicate.

- [X] T032 [US4] Add `syncSubscriptionNotifications` + store helpers (`getSubscription`, `latestByType`) in `apps/api/src/modules/notifications/notifications.service.ts` and `apps/api/src/modules/notifications/notifications.store.ts`
- [X] T033 [US4] Invoke the sync at the start of `list` and `countUnread` in `apps/api/src/modules/notifications/notifications.service.ts`
- [X] T034 [P] [US4] Add subscription-sync tests (expiring, expired, not-applicable, 24 h dedupe, no subscription mutation) in `apps/api/src/modules/notifications/notifications.service.spec.ts`

**Checkpoint**: All four user stories functional.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Accessibility, consistency and full gate verification.

- [X] T035 [P] Add `vitest-axe` accessibility assertions for the bell dropdown and the inbox page in `apps/book/src/modules/notifications/tests/NotificationBell.test.tsx` and `apps/book/src/modules/notifications/tests/NotificationsView.test.tsx`
- [X] T036 Run the validation scenarios in `specs/api/020-notifications-system/quickstart.md` (booking trigger, subscription warnings, badge sync, filters/delete)
- [X] T037 Run gates: `npm run typecheck -w @foundly/book`, `npm run lint -w @foundly/book`, `npm run test -w @foundly/book`, plus `typecheck`/`lint`/`test` for `@foundly/api` and `typecheck` for `@foundly/database`; fix any regressions

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: T001 → T002 → T003 (T003 blocks everything).
- **Foundational (Phase 2)**: After T003; blocks all user stories.
- **User Stories (Phase 3–6)**: After Phase 2. Priority order US1 → US2 → US3 → US4; they can run in parallel across developers.
- **Polish (Phase 7)**: After the desired stories are complete.

### User Story Dependencies

- **US1 (P1)**: needs Phase 2 (provider + API list/unread). No dependency on US2–US4.
- **US2 (P1)**: needs Phase 2; independent of US3/US4.
- **US3 (P1)**: needs Phase 2 service/store; independent of the UI stories.
- **US4 (P2)**: needs Phase 2 service/store; independent of the UI stories.

### Within Each Story

- Models/store before service; service before resolver/UI; tests alongside their unit.
- T012 (codegen) must complete before T014/T015 compile against generated docs.

### Parallel Opportunities

- T004, T005 can run together (different files).
- T009, T010, T011, T013 can run in parallel once the API module compiles.
- T016 with T014/T015 work.
- US1 (T017–T021), US2 (T022–T027), US3 (T028–T031), US4 (T032–T034) can be staffed in parallel after Phase 2.
- T020 & T021 (US1 tests) run in parallel; T022 & T023 (US2 components) run in parallel.

---

## Parallel Example: Foundational

```bash
# Different files, no inter-dependencies:
Task: "T004 GraphQL types in apps/api/src/modules/notifications/notifications.types.ts"
Task: "T005 Store seam in apps/api/src/modules/notifications/notifications.store.ts"
Task: "T013 Book domain types/utils in apps/book/src/modules/notifications/utils/*"
```

## Parallel Example: User Story 1

```bash
Task: "T018 NotificationBell.tsx (bell + badge + dropdown)"
Task: "T020 NotificationBell.test.tsx"
Task: "T021 AdminShell.test.tsx update"
```

---

## Implementation Strategy

### MVP First (User Story 1)

1. Phase 1 (DB) + Phase 2 (API module + book data layer + provider).
2. Phase 3 (US1: header bell + badge + quick-view dropdown).
3. **STOP and VALIDATE** US1 independently (seed notifications via the API CRUD / trigger), then demo.

### Incremental Delivery

1. Setup + Foundational → foundation ready.
2. US1 → validate → deploy (MVP).
3. US2 (full inbox page) → validate → deploy.
4. US3 (new booking trigger) → validate → deploy.
5. US4 (subscription warnings) → validate → deploy.
6. Polish → final gates.

### Notes

- [P] = different files, no incomplete dependency.
- Keep the existing `Notification`-vs-`AppointmentNotification` separation (new model uses `Tenant.inbox`).
- API tests stay DB-free via the store seam / overridden Prisma client (existing `*.spec.ts` convention; the api test-location migration is a separate gated TODO).
- Commit after each logical group; run the relevant gate per touched workspace.
