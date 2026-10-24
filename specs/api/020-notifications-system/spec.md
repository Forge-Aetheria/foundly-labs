# Feature Specification: Foundly API — Central Notification System (In-App Inbox)

**Feature Branch**: `020-notifications-system`

**Created**: 2026-10-24

**Status**: Draft

**Input**: User description: "Diseñar e implementar el sistema central de notificaciones end-to-end en `packages/database`, API NestJS y `@foundly/book`: modelo `Notification` (tenant, type, title, message, read, createdAt) con migración; CRUD por tenant (listar ordenado por `createdAt DESC` con filtro `read`, `unread-count`, marcar una como leída, marcar todas como leídas, eliminar); disparadores (reserva online → `NEW_BOOKING`; suscripción ≤ 3 días → `SUBSCRIPTION_EXPIRING`, vencida → `SUBSCRIPTION_EXPIRED`); campana con badge de no leídas y dropdown de vista rápida en el header del admin; y página dedicada `/admin/notificaciones` con filtros Todas/No leídas, marca de lectura al hacer clic, borrado, iconos temáticos y fecha relativa."

_This spec is governed by `constitution.md` v5.2.0, `specs/business-model.md` and `specs/architecture.md`. It lives in the `api` domain because the central system (data model, per-tenant CRUD, and automatic triggers) is owned by `apps/api`. It extends the appointment lifecycle of `specs/api/005-appointments` and the subscription model of `specs/api/017-subscription-plans`, and documents the consumer surface delivered by `@foundly/book` (admin shell header and `/admin/notificaciones`)._

## User Scenarios & Testing _(mandatory)_

### User Story 1 - See new activity at a glance from the admin header (Priority: P1)

As a business owner working anywhere in the admin panel, I want a notification bell in the header that shows how many unread notifications I have and lets me open a quick view of the latest ones, so I notice new bookings and account alerts without leaving what I am doing.

**Why this priority**: It is the entry point of the whole feature and the fastest way to surface high-value events (e.g., a new online booking) to the owner.

**Independent Test**: With unread notifications present, open any admin screen and confirm the bell shows a badge with the unread count; open the dropdown and confirm it lists the latest notifications, offers "Mark all as read" and links to the full inbox; perform an action and confirm the badge updates without a full page reload.

**Acceptance Scenarios**:

1. **Given** a tenant with unread notifications, **When** the owner is on any admin screen, **Then** the header shows a bell with a numeric badge equal to the unread count.
2. **Given** zero unread notifications, **When** the owner views the header, **Then** the bell is shown without a numeric badge (or with a zero state) and never a negative/stale count.
3. **Given** the dropdown is open, **When** it renders, **Then** it shows the latest 4–5 notifications with title, message and relative time, a "Mark all as read" action, and a "View all notifications" link to the dedicated page.
4. **Given** the dropdown is open, **When** the owner marks all as read, **Then** the badge disappears and the items reflect the read state without a full page reload.

---

### User Story 2 - Manage the full notification inbox (Priority: P1)

As a business owner, I want a dedicated notifications page where I can review all my notifications, filter to unread ones, mark them as read as I read them, and delete the ones I no longer need, so my inbox stays clear and trustworthy.

**Why this priority**: The quick-view dropdown is a teaser; the full inbox is where the owner actually manages and cleans up history.

**Independent Test**: Open `/admin/notificaciones`, confirm the header shows the unread count and a "Mark all as read" action, switch between "Todas" and "No leídas", click an item and confirm it becomes read, delete an item and confirm it disappears, and confirm the unread count in the header stays in sync.

**Acceptance Scenarios**:

1. **Given** the dedicated page, **When** it loads, **Then** it shows the title, the unread count and a "Mark all as read" button, plus quick filters "Todas" and "No leídas".
2. **Given** the "Todas" filter, **When** it is active, **Then** every notification is listed newest first; under "No leídas" only unread notifications are listed.
3. **Given** an unread item, **When** the owner clicks it, **Then** it is marked as read automatically and its visual unread indicator clears.
4. **Given** any item, **When** the owner uses the delete (trash) action, **Then** the notification is removed permanently and the list and unread count update immediately.
5. **Given** an empty inbox (or an empty unread filter), **When** the page renders, **Then** a clear empty state is shown instead of a broken list.
6. **Given** a notification item, **When** it renders, **Then** it shows a type-appropriate icon, the event title, the message, a readable relative date (e.g., "Hace 10 minutos", "Ayer a las 14:30"), and a clear read/unread indicator.

---

### User Story 3 - Be notified automatically about new online bookings (Priority: P1)

As a business owner, I want a notification created automatically whenever a client books through my public page, so I can react quickly (confirm, prepare or follow up) without manually refreshing my agenda.

**Why this priority**: It is the highest-value automatic event; missing a new booking directly costs the business.

**Independent Test**: Book an appointment through the public booking page and confirm exactly one "new booking" notification appears for that tenant (with a clear title/message) and the unread count increases by one; confirm a rejected/conflicting booking creates none.

**Acceptance Scenarios**:

1. **Given** a valid online booking is created successfully, **When** the booking completes, **Then** exactly one notification of type "new booking" is created for the booked tenant, referencing the service and appointment time in its title/message.
2. **Given** a booking that fails (invalid input, unknown service/specialist, or a taken slot), **When** it is rejected, **Then** no notification is created.
3. **Given** the same booking is retried idempotently, **When** it resolves, **Then** no duplicate notification is created.
4. **Given** a new booking notification, **When** the owner opens the header badge or the inbox, **Then** the notification is visible and unread until the owner reads it.

---

### User Story 4 - Be warned before and when a subscription lapses (Priority: P2)

As a business owner, I want automatic notifications when my subscription is close to expiring or has expired, so I can renew in time and avoid losing Pro benefits.

**Why this priority**: It protects revenue and avoids surprise downgrades; it is valuable but not the primary inbox driver.

**Independent Test**: With a subscription expiring within 3 days, confirm a "subscription expiring" notification exists; once expired, confirm a "subscription expired" notification exists; with a subscription far from expiry, confirm none is created; repeat the check and confirm no duplicates.

**Acceptance Scenarios**:

1. **Given** a subscription with an expiry within 3 days (not yet expired), **When** the notification check runs, **Then** a "subscription expiring" notification is available for that tenant.
2. **Given** a subscription whose expiry is in the past, **When** the check runs, **Then** a "subscription expired" notification is available for that tenant.
3. **Given** a subscription with more than 3 days remaining (or no expiry), **When** the check runs, **Then** no expiry-related notification is created.
4. **Given** the check runs repeatedly while the condition persists, **When** it runs, **Then** it does not create duplicate unread notifications of the same type for the same period.

---

### Edge Cases

- **Tenant isolation**: a notification, its read state and deletion MUST always be scoped to the session's business; no tenant can see, read or delete another tenant's notifications.
- **Marking an already-read notification as read** is idempotent and succeeds without error.
- **Deleting a non-existent (or another tenant's) notification** fails as not-found and changes nothing.
- **Unread count stays consistent** with the unread list: after any read/delete/mark-all action they agree (no drift), including when the last unread notification is removed.
- **Read notifications remain visible** under "Todas"; only "No leídas" excludes them.
- **Empty states**: no notifications at all, and no unread while some read exist, both render clean states.
- **Large inbox**: the list is bounded/paginated and always ordered newest first.
- **New booking trigger and a failed transaction**: if the booking is not persisted, no notification persists either.
- **Subscription notifications are not noisy**: repeated checks under the same condition do not pile up duplicates.
- **Header on small viewports**: the bell and badge remain usable and accessible on mobile.
- **"Real time" scope**: read/delete/mark-all changes are reflected immediately in the current session's header counter and lists without a full page reload; cross-device/background push is out of scope.
- **System/info notifications**: an informational (`SYSTEM_INFO`) and a reschedule-request (`RESCHEDULE_REQUEST`) type are supported by the model and rendering even if no automatic trigger is delivered in this phase.

## Requirements _(mandatory)_

### Functional Requirements

**Data model & persistence**

- **FR-001**: The system MUST persist a per-tenant **notification** with: a unique identifier, the owning business, a **type** from the closed set {new booking, reschedule request, subscription expiring, subscription expired, system info}, a **title**, a **message**, a **read** flag (default unread) and a **created-at** timestamp (default now).
- **FR-002**: Notifications MUST be associated with a business and MUST be removable; every business MAY have many notifications.
- **FR-003**: Notification data MUST be persisted durably and the capability MUST be applied to existing environments before use, without losing or disrupting existing business data.

**Per-tenant notification contract**

- **FR-004**: The system MUST expose a **list** of the authenticated business's notifications, ordered **newest first** (created-at descending), **bounded/paginated**, and optionally filtered by **read state** (all vs unread).
- **FR-005**: The system MUST expose an **unread count** for the authenticated business that returns only that integer and matches the unread list exactly.
- **FR-006**: The system MUST allow marking a **single** notification as read; the operation is **idempotent** and MUST fail as **not-found** for unknown or foreign notifications without side effects.
- **FR-007**: The system MUST allow **marking all** of the business's notifications as read in one operation.
- **FR-008**: The system MUST allow **deleting** a single notification permanently; the operation MUST fail as **not-found** for unknown or foreign notifications without side effects.
- **FR-009**: Every notification operation MUST require an authenticated business session and MUST derive the business scope from the session, never from a client-supplied identifier; cross-tenant access MUST be impossible.
- **FR-010**: Failures MUST use stable, non-revealing domain errors (unauthenticated, forbidden, not found, validation) consistent with the product's existing error behavior.

**Automatic triggers & rules**

- **FR-011**: When a client successfully creates an **online booking** on a business's public page, the system MUST create **exactly one** "new booking" notification for that business, with a title/message that identifies the service and the appointment date/time; the trigger MUST NOT create a notification when the booking is rejected or not persisted, and MUST NOT duplicate on retries.
- **FR-012**: For subscriptions whose expiry is **within 3 days** (not yet expired), the system MUST make a "subscription expiring" notification available for the business.
- **FR-013**: For subscriptions whose expiry is **in the past**, the system MUST make a "subscription expired" notification available for the business.
- **FR-014**: When a subscription is far from expiry, has no expiry, or the condition otherwise does not apply, the system MUST NOT create an expiry-related notification.
- **FR-015**: Repeated subscription checks MUST NOT create duplicate unread notifications of the same type for the same subscription period/condition.
- **FR-016**: Subscription notifications MUST NOT alter the subscription itself (plan, status or expiry); they are informational only.

**Admin header (consumer surface — `@foundly/book`)**

- **FR-017**: The admin shell header MUST show a **notification bell** on every admin screen and on both desktop and mobile viewports.
- **FR-018**: The bell MUST display a **dynamic unread-count badge** driven by the unread-count data (hidden or neutral when zero; never negative or stale).
- **FR-019**: Activating the bell MUST open a **quick-view dropdown** listing the latest **4–5** notifications (with title, message and relative time), a **"Mark all as read"** action, and a **"View all notifications"** link that navigates to `/admin/notificaciones`.
- **FR-020**: The dropdown MUST show a clean empty state when there are no notifications and MUST be dismissible and keyboard-accessible.

**Dedicated notifications page (consumer surface — `@foundly/book`)**

- **FR-021**: The system MUST provide a dedicated page at `/admin/notificaciones` inside the authenticated admin shell.
- **FR-022**: The page MUST present a header with the page title, the current unread count and a **"Mark all as read"** action.
- **FR-023**: The page MUST provide quick filters to toggle between **"Todas"** and **"No leídas"** without a full page reload.
- **FR-024**: Each notification item MUST show a **type-appropriate icon** (e.g., calendar for bookings, alert for subscription), the event **title**, the **message**, and a **relative date** (e.g., "Hace 10 minutos", "Ayer a las 14:30").
- **FR-025**: Each item MUST show a clear **read vs unread** visual indicator (e.g., a dot or a soft background highlight).
- **FR-026**: Clicking an item MUST **mark it as read automatically**; each item MUST provide a **delete** action (trash icon) that permanently removes it.
- **FR-027**: The page MUST define **loading, empty and error** states, and remain keyboard-operable and accessible.

**Consistency & quality**

- **FR-028**: After any read, mark-all or delete action, the header unread badge and the lists MUST update **immediately in the current session** without a full page reload.
- **FR-029**: Automated tests MUST cover: the per-tenant CRUD contract (list ordering/filter/paging, unread count, mark-one idempotency, mark-all, delete, not-found and cross-tenant isolation), the new-booking trigger (including rejected/idempotent paths), the subscription rules (expiring/expired/not-applicable/dedupe), and the UI interactions (badge updates, dropdown, filters, mark-read-on-click, delete, empty/error/loading).
- **FR-030**: All relevant gates (`typecheck`, `lint`, `test` for the affected workspaces) MUST pass with no regressions under strict TypeScript.

### Key Entities

- **Notification**: a tenant-scoped inbox item with a unique id, the owning business, a type from the closed set, a title, a message, a read flag and a created-at timestamp.
- **Notification type**: closed set — new booking, reschedule request, subscription expiring, subscription expired, system info.
- **Business (Tenant)**: the owner of notifications; all reads/writes are scoped to it.
- **Subscription state**: the plan/status/expiry that determines whether expiry notifications apply (see `specs/api/017-subscription-plans`).
- **Booking (Appointment)**: the successful online appointment that raises a "new booking" notification (see `specs/api/005-appointments`).

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: 100% of successfully created online bookings produce exactly one "new booking" notification for the correct business, with zero notifications from rejected or conflicting bookings.
- **SC-002**: The unread count always equals the number of unread notifications for the business (0 drift) across create, read, mark-all and delete actions.
- **SC-003**: Marking read, marking all read and deleting are reflected in the header badge and lists within the current session without a full page reload (target: immediate, < 1 second perceived).
- **SC-004**: A subscription expiring within 3 days yields an "expiring" notification and an expired subscription yields an "expired" notification, each at most once per condition (0 duplicate unread notifications on repeated checks).
- **SC-005**: 0% of notification reads or mutations cross business boundaries; another tenant's notifications are never visible or actionable.
- **SC-006**: The owner can reach and manage the full inbox (filter, mark-read-on-click, delete) from the header in at most two actions (open bell → "View all notifications").
- **SC-007**: Inputs that do not apply (subscription far from expiry/no expiry, failed bookings) produce 0 notifications.
- **SC-008**: All relevant gates pass with zero regressions.

## Assumptions

- **Governance & domain**: Governed by `specs/business-model.md` (Foundly Book capabilities §2.3 — including the appointment lifecycle "reserva, confirmación, recordatorio, historial" — and the Foundly Pass licensing/subscription model §3), plus `constitution.md`, `specs/architecture.md`, `specs/system-design.md` and `code-rules.md`. It lives in the `api` domain; the admin UI is the consumer surface delivered by `@foundly/book`.
- **Audience**: Notifications are for the authenticated business account (owner/administrator of the tenant); end clients do not see this inbox.
- **Closed type set**: The notification type is a closed set of exactly the five types listed; adding types later requires a spec change.
- **Subscription check is on-demand**: Because no background scheduler exists in the current platform, the subscription check is performed opportunistically when the tenant's notification/subscription surfaces are read; it does not require a cron job. Deduplication ensures repeated on-demand checks stay quiet.
- **"Real time" means in-session immediacy**: The header badge and lists reflect changes immediately after an action in the same session (client cache refresh/optimistic update); server-push/websockets and multi-device live sync are out of scope for this phase.
- **Badge styling**: The unread badge uses the product's accent color (primary/brand) rather than introducing a new alert palette; exact tone is a design decision consistent with `specs/system-design.md`.
- **Retention**: Notifications persist until the owner deletes them; there is no automatic archival in this phase.
- **Relative dates** are rendered in the product language (Spanish), matching the rest of `apps/book`.
- **Relationship to existing appointment notices**: The existing appointment-scoped notification records (simulated per-appointment notices) are **distinct** from this central per-tenant inbox and are not replaced by it; this feature introduces a separate, first-class notification entity.
- **Companion consumer surface**: This spec documents the `@foundly/book` surfaces (admin header bell/dropdown and `/admin/notificaciones`) as the consumer of the API contract; its implementation is planned together with this feature.
- **Respect for the governance hierarchy**: Follows the authority order of `constitution.md` and the value proposition of `specs/business-model.md` (trustworthy schedule management and monetization via subscription).
