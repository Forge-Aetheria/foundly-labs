# Phase 0 — Research & Decisions

**Feature**: `specs/api/020-notifications-system` | **Date**: 2026-10-24

## R1. Persistence model & relation naming

- **Decision**: Add a new Prisma `model Notification` with `id`, `tenantId`, `type` (`NotificationType` enum), `title`, `message`, `read` (default `false`), `createdAt` (default `now()`), a `tenant` relation with `onDelete: Cascade`, and indexes `@@index([tenantId, createdAt])` + `@@index([tenantId, read])`. On `Tenant`, add the relation under the field name **`inbox Notification[]`** (the field `notifications` is already used by the existing `AppointmentNotification`).
- **Rationale**: A dedicated central inbox distinct from the per-appointment simulated notices; indexed by `(tenantId, createdAt)` and `(tenantId, read)` for the two hot queries (newest-first list and unread count).
- **Alternatives**: Reuse/extend `AppointmentNotification` (rejected — it is appointment-scoped and lacks a read flag/central type). Rename the existing relation (rejected — unnecessary churn/risk on an established model).

## R2. Subscription check trigger (no scheduler)

- **Decision**: Perform the subscription check **lazily** inside `NotificationsService` whenever the tenant reads notifications (list or unread count): read the tenant's `subscriptionPlan/subscriptionStatus/subscriptionExpiresAt` and materialise `SUBSCRIPTION_EXPIRING` (expiry within 3 days, not past) or `SUBSCRIPTION_EXPIRED` (expiry in the past). Deduplicate per type with a **24-hour window** (`latest createdAt` of the same type for the tenant).
- **Rationale**: The platform has no cron/scheduler; lazy on-demand checks require no new infrastructure and stay consistent with the subscription module's read-time effective-plan rule. The 24h dedupe window makes repeated reads quiet while still re-surfacing a persistent condition on a later day.
- **Alternatives**: A cron job / background worker (rejected — new infra out of scope). DB trigger (rejected — couples business copy to the DB). Deduplicate only on "unread" (rejected — re-notifies immediately after the owner reads while the condition persists).

## R3. New-booking trigger placement & resilience

- **Decision**: In `AppointmentsService.createForTenant`, after the appointment row is successfully created **and only when `origin === 'online'`**, call `NotificationsService.notifyNewOnlineBooking({ tenantId, serviceName, startAt, clientName })`. Wrap the call in `try/catch` and log a warning on failure without failing the booking. Add `name` to the service select used by the flow.
- **Rationale**: Booking creation is the critical path; the notification must never roll back a valid booking. Placing the trigger after persistence guarantees "no notification for rejected/conflicting bookings". `createMyAppointment` (admin origin) intentionally does not notify.
- **Alternatives**: Create the notification inside the same DB transaction as the appointment (rejected — a notification failure would fail the booking). Notify from the client after booking (rejected — untrusted, skippable).

## R4. API surface & tenant scoping

- **Decision**: Code-first GraphQL in a new `notifications` module, all operations `@RequireAuth()` and scoped from `AuthUser.tenantId` (never client input, mirroring `SubscriptionService.requireTenant`). Surface:
  - `notifications(read: Boolean, limit: Int, offset: Int): [NotificationObject!]!` (newest-first, default 50, max 100)
  - `unreadNotificationCount: Int!`
  - `markNotificationRead(id: ID!): NotificationObject!` (idempotent; `NOT_FOUND` for unknown/foreign)
  - `markAllNotificationsRead: Int!` (number updated)
  - `deleteNotification(id: ID!): Boolean!` (`NOT_FOUND` for unknown/foreign)
- **Rationale**: Matches the requested operations while conforming to the API's GraphQL-only convention; tenant scope from the verified claim prevents cross-tenant access.
- **Alternatives**: REST controllers (rejected — the API is code-first GraphQL only). Client-supplied tenant id (rejected — security).

## R5. Testable persistence seam

- **Decision**: Add a `NotificationStore` interface (`list`, `countUnread`, `markRead`, `markAllRead`, `delete`, `create`, `latestByType`, `getSubscription`) with a `PrismaNotificationStore` implementation and a `NOTIFICATION_STORE` token, mirroring `subscription.store.ts`. Unit tests inject a fake store; resolver e2e overrides `PrismaService`.
- **Rationale**: Keeps API tests DB-free and deterministic, consistent with the codebase's established pattern.
- **Alternatives**: Prisma mocks scattered in tests (rejected — brittle/duplicated).

## R6. Header integration & "real-time" unread badge

- **Decision**: The admin shell currently has only a mobile top bar. Add a **persistent `AdminTopBar`** (sticky) across viewports, hosting the mobile menu button/brand and a right-aligned `headerActions` slot. The app layout injects the module's `NotificationBell`. A `NotificationsProvider` (client) mounted in `app/admin/layout.tsx` holds `{ items, unreadCount, loading, error }` and exposes `refresh`, `markRead`, `markAllRead`, `remove`, updating state optimistically then refetching. Bell and `/admin/notificaciones` share this context.
- **Rationale**: Keeps `AdminShell` generic (shared layer must not import modules); a shared provider gives immediate badge/list sync after actions without websockets, satisfying the in-session "real time" requirement.
- **Alternatives**: Polling every N seconds (rejected — unnecessary load; refetch-on-action is enough). Websockets/SSE (rejected — out of scope per spec assumption). Bell state local to the bell only (rejected — would desync with the page).

## R7. Relative date formatting

- **Decision**: Implement a small deterministic formatter `formatRelative(date, now)` in Spanish producing the required copy: seconds/minutes/hours ("Hace 10 minutos"), "Ayer a las 14:30", day-before-yesterday/older dates with explicit date, and "Ahora mismo" for < 1 minute.
- **Rationale**: The exact copy ("Hace…", "Ayer a las…") is product-specific; a pure function is trivially testable and avoids locale drift from `Intl.RelativeTimeFormat`.
- **Alternatives**: `Intl.RelativeTimeFormat` (rejected — phrasing differs from the requested copy and is harder to assert).

## R8. Applying the migration in the Supabase pooler environment

- **Decision**: Provide the migration SQL under `prisma/migrations/<ts>_add_notification/` and document applying it via `prisma migrate deploy`/`db push` through a **DDL-capable connection** (Supabase session pooler / direct), with a fallback to running the idempotent `CREATE TYPE/TABLE ... IF NOT EXISTS`-style SQL in the Supabase SQL editor if only the transaction pooler is reachable. `prisma generate` runs in CI/local regardless.
- **Rationale**: The deployed Supabase project may only expose the transaction pooler, which is not reliable for Prisma migrations; the schema snapshot and generated client still stay correct locally.
- **Alternatives**: Rely solely on `migrate dev` (rejected — fails/hangs through the transaction pooler). Skip migrations (rejected — violates durability requirement FR-003).

## R9. Type/codegen synchronization

- **Decision**: Add the new SDL to the API (auto-generated `apps/api/src/schema.gql`), sync the tracked snapshot `apps/book/codegen.schema.gql`, add `apps/book/src/modules/notifications/notifications.graphql`, then run `npm run codegen -w @foundly/book`. Actions/hooks use only generated documents/types.
- **Rationale**: Enforces the codegen-only typing rule (constitution §5.VI) and prevents hand-written DTOs.
- **Alternatives**: Manual DTOs (rejected — prohibited).

## R10. Testing strategy

- **Decision**: API — unit tests for `NotificationsService` (tenant scope, list mapping/order/paging/filter, unread count, mark-read idempotency, mark-all, delete not-found, subscription sync + dedupe window) and an appointments-trigger test (online creates one, failed/admin creates none, best-effort resilience). Book — `actions` mapping, `relativeTime`, `NotificationBell` (badge/dropdown/mark-all), and `NotificationsView` (filters, mark-read-on-click, delete, empty/error), plus an `AdminShell` test for the header slot. Gates: book typecheck/lint/test (required) plus api/database typecheck+test.
- **Rationale**: Covers the contract, triggers and UI interactions required by FR-029/FR-030 while staying DB-free and deterministic.
- **Alternatives**: E2E against a live DB (rejected — no DB in the unit gate; the resolver e2e uses an overridden Prisma client).
