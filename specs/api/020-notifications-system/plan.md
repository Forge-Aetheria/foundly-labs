# Implementation Plan: Central Notification System (In-App Inbox)

**Branch**: `020-notifications-system` | **Date**: 2026-10-24 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/api/020-notifications-system/spec.md`

## Summary

Introduce a first-class, tenant-scoped **notification inbox** end-to-end. In `packages/database` add a `Notification` model (type enum, title, message, read flag, created-at) and a migration. In `apps/api` add a `notifications` module (GraphQL queries/mutations) that is strictly tenant-scoped from the verified JWT, plus two automatic triggers: a `NEW_BOOKING` notification on successful public online booking (created inside the appointments flow) and a lazy subscription check that materialises `SUBSCRIPTION_EXPIRING` (≤ 3 days) / `SUBSCRIPTION_EXPIRED` notifications on read. In `@foundly/book` add a notifications module (data layer + client provider), a header bell with unread badge and quick-view dropdown in the admin shell, and a dedicated `/admin/notificaciones` page with filters, mark-read-on-click and delete. The unread badge and lists update immediately in-session after every action.

## Technical Context

**Language/Version**: TypeScript 5.9 (strict) on Node.js 20+ (NestJS 11, Next.js 15 / React 19)

**Primary Dependencies**: NestJS `@nestjs/graphql` (code-first SDL), `@prisma/client` 6.x, GraphQL; Next.js App Router, `@foundly/ui` (Clean Light UI), MUI v6 primitives/icons, `graphql-codegen` (`typed-document-node`)

**Storage**: PostgreSQL via Prisma (`packages/database/prisma/schema.prisma`); Supabase behind a pgbouncer pooler in deployed environments

**Testing**: Vitest (`npm run test -w @foundly/api`, `npm run test -w @foundly/book`, `npm run test -w @foundly/database`); DB-free API tests via a store seam / overridden Prisma client; React Testing Library + `vitest-axe` for book

**Target Platform**: Node.js server (API), modern web browsers (admin SPA)

**Project Type**: Monorepo — backend web service (`apps/api`) + web app (`apps/book`) + shared package (`packages/database`)

**Performance Goals**: List/unread reads are indexed and bounded (default page 50, max 100); a mutation's effect on the header badge is perceived as immediate (< 1 s, in-session) with a single refetch after each action

**Constraints**: Strict typing (no `any`/unchecked casts); server/client boundary respected (functions never cross from Server to Client Components); notifications are strictly tenant-scoped from the session claim; DB changes must be deployable to existing environments without data loss; no background scheduler (subscription check is lazy/on-demand)

**Scale/Scope**: Per-tenant inboxes of unbounded lifetime (list bounded/paginated); one new API module, one new book module, one admin page, one DB model + migration; the five closed notification types

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Gate | Status |
| --- | --- | --- |
| §1 Authority hierarchy / §2.III | Spec lives under `specs/api/…`, references `specs/business-model.md`, subordinated to global docs | PASS |
| §5.I SDD | Approved spec exists before code | PASS |
| §5.IV Strict typing | Explicit interfaces/store seams; Zod not needed for read-only list but inputs validated; no `any`/unsafe casts | PASS |
| §5.V RSC boundary | Bell/dropdown/provider are `'use client'`; `@foundly/ui` primitives remain server-safe (no functions passed from server) | PASS |
| §5.VI Module data layer | Book module has `actions.ts`/`hooks.ts`/`notifications.graphql`/`components`/`utils`/`tests`; UI uses only hooks; types via codegen | PASS |
| §6 Design tokens | Bell/badge/page use `@foundly/ui` + theme token paths (primary/brand, `surface.*`, `divider`); no magic colors | PASS |
| §3 / §5 | Shared code stays in `packages/*`; no `packages/* → apps/*` imports; no duplicated logic | PASS |
| code-rules §10 | Book tests live in `tests/` dirs; API keeps existing colocated `*.spec.ts` convention (migration of api tests is a separate, explicitly-gated TODO) | PASS (note) |

No violations requiring justification. See **Complexity Tracking** (empty).

**Post-design re-check (Phase 1)**: PASS — the data model keeps the inbox distinct from the existing appointment notices (no duplication), the API store seam preserves strict typing and DB-free tests, and the book design uses the module data layer with a client provider while keeping `AdminShell` generic (no shared→module import). No new violations introduced.

## Project Structure

### Documentation (this feature)

```text
specs/api/020-notifications-system/
├── plan.md              # This file
├── research.md          # Phase 0 — decisions & rationale
├── data-model.md        # Phase 1 — entities, enum, indexes, rules
├── contracts/
│   ├── notifications.graphql.md   # API contract (queries/mutations/errors)
│   └── admin-inbox.contract.md    # Book consumer surface (bell, dropdown, page)
├── quickstart.md        # Phase 1 — run & validate end-to-end
├── checklists/requirements.md
└── spec.md
```

### Source Code (repository root)

```text
packages/database/
├── prisma/schema.prisma                       # + enum NotificationType, model Notification, Tenant.inbox relation
└── prisma/migrations/<ts>_add_notification/
    └── migration.sql                          # CREATE TYPE + TABLE + indexes + FK

apps/api/src/
├── app.module.ts                              # register NotificationsModule
└── modules/
    ├── notifications/
    │   ├── notifications.module.ts            # providers + exports NotificationsService
    │   ├── notifications.types.ts             # registerEnumType + NotificationObject
    │   ├── notifications.resolver.ts          # queries + mutations (@RequireAuth)
    │   ├── notifications.service.ts           # tenant scope, subscription sync, triggers
    │   ├── notifications.store.ts             # NotificationStore seam + PrismaNotificationStore
    │   ├── notifications.service.spec.ts
    │   └── notifications.resolver.spec.ts
    └── appointments/
        ├── appointments.module.ts             # imports NotificationsModule
        └── appointments.service.ts            # on online create → notifyNewOnlineBooking (best-effort)

apps/book/src/
├── app/admin/
│   ├── layout.tsx                             # wrap shell with NotificationsProvider; pass bell slot
│   └── notificaciones/page.tsx                # thin route → NotificationsView
├── modules/notifications/
│   ├── notifications.graphql                  # queries + mutations (codegen input)
│   ├── actions.ts                             # 'use server' — apiRequestAdmin + mappers
│   ├── hooks.ts                               # 'use client' — use<Action><Entity>
│   ├── NotificationsProvider.tsx              # 'use client' context (items/unreadCount/actions)
│   ├── NotificationsView.tsx                  # page view (header, filters, list)
│   ├── components/
│   │   ├── NotificationBell.tsx               # bell + badge + dropdown
│   │   ├── NotificationItem.tsx               # icon, title, message, relative time, read/delete
│   │   └── NotificationsList.tsx              # list/empty/loading/error states
│   ├── utils/
│   │   ├── types.ts                           # Notification domain type, NotificationType
│   │   ├── relativeTime.ts                    # "Hace 10 minutos" / "Ayer a las 14:30"
│   │   └── notificationMeta.ts                # type → icon + label
│   └── tests/
│       ├── actions.test.ts
│       ├── relativeTime.test.ts
│       ├── NotificationBell.test.tsx
│       └── NotificationsView.test.tsx
└── shared/components/
    ├── AdminShell.tsx                         # + persistent top bar + headerActions slot
    └── AdminNavigation.ts                     # + /admin/notificaciones entry
```

**Structure Decision**: Follows the monorepo module pattern. The API owns the central system (data model, tenant-scoped CRUD, triggers) as a new NestJS module mirroring `subscription` (store seam for DB-free tests). The book side is a new module using the canonical `actions.ts`/`hooks.ts`/`notifications.graphql`/`tests` layout, with a client `NotificationsProvider` mounted at the admin layout so the header bell and the `/admin/notificaciones` view share one live state (immediate badge sync). The `AdminShell` stays generic via a `headerActions` slot; the app layer injects the module's bell.

## Complexity Tracking

> No constitution violations. No extra projects, no repository layer beyond the established per-module store seam.

| Violation | Why Needed | Simpler Alternative Rejected Because |
| --- | --- | --- |
| — | — | — |
