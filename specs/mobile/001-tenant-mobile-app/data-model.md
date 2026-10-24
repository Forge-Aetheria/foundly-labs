# Data Model: Tenant Mobile App

**Feature**: `specs/mobile/001-tenant-mobile-app` | **Date**: 2026-10-24

## Scope

The mobile app introduces no new business entities of its own. It consumes the existing tenant, appointment and notification domain, adds a device-token persistence entity to the API, and keeps session/UI state on the device.

## Client-side entities

### Session

| Field         | Type                          | Rules                                                                            |
| ------------- | ----------------------------- | -------------------------------------------------------------------------------- |
| `userId`      | string                        | From Supabase `sub`; required                                                    |
| `tenantId`    | string                        | From `app_metadata.tenant_id` or `tenant_id` claim; required for admin access    |
| `role`        | `'admin'` \| `'professional'` | Derived: tenant-bound → admin                                                    |
| `accessToken` | string                        | Held by the Supabase client only, injected per request, never rendered or logged |
| `expiresAt`   | number                        | Epoch from the JWT; refresh handled by the Supabase client                       |

**Transitions**: `anonymous → authenticating → authenticated → expired | signedOut`. Expired or rejected (`UNAUTHENTICATED`) sessions clear secure storage, the React Query cache and the push registration state, then return to `anonymous`.

### TenantProfile (view model)

| Field                                                      | Type           | Source                                    |
| ---------------------------------------------------------- | -------------- | ----------------------------------------- |
| `id`, `name`, `category`, `status`                         | string         | `myBusiness`                              |
| `timezone`, `currency`                                     | string         | `myBusiness`                              |
| `isPublic`                                                 | boolean        | `myBusiness`                              |
| `profile.slug`                                             | string         | `myBusiness.profile`; required to publish |
| `profile.bio`, `address`, `phone`, `instagram`, `whatsapp` | string \| null | `myBusiness.profile`                      |
| `profile.logo`, `cover`                                    | string \| null | `myBusiness.profile`                      |
| `services`                                                 | Service[]      | `myBusiness.services` (read-only summary) |

**Validation**: the public page can only be enabled when `profile.slug` is present and the tenant status is active. Missing required fields produce an explanatory message and the toggle reverts.

### AgendaEntry

Derived from the API `Appointment` object for the authenticated tenant.

| Field              | Type                                                   | Rules                          |
| ------------------ | ------------------------------------------------------ | ------------------------------ |
| `id`               | string                                                 | Required                       |
| `startAt`, `endAt` | ISO string                                             | Ordered by `startAt` ascending |
| `status`           | `PENDING` \| `CONFIRMED` \| `CANCELLED` \| `COMPLETED` | Required                       |
| `clientName`       | string                                                 | Required                       |
| `service.name`     | string                                                 | Required                       |
| `specialist.name`  | string                                                 | Required                       |
| `notes`            | string \| null                                         | Optional                       |

**Query rule**: the date range is computed on the device for the tenant's timezone; the server remains authoritative and always scopes by the JWT tenant.

### InboxNotification

| Field              | Type                                                                                                        | Rules                                        |
| ------------------ | ----------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| `id`               | string                                                                                                      | Required                                     |
| `type`             | `NEW_BOOKING` \| `RESCHEDULE_REQUEST` \| `SUBSCRIPTION_EXPIRING` \| `SUBSCRIPTION_EXPIRED` \| `SYSTEM_INFO` | Required                                     |
| `title`, `message` | string                                                                                                      | Required                                     |
| `read`             | boolean                                                                                                     | Default false; idempotent transition to true |
| `createdAt`        | ISO string                                                                                                  | Newest first                                 |

**Transitions**: `unread → read` (idempotent; server-confirmed). Optimistic UI rolls back on failure.

### PushRegistration (device state)

| Field      | Type                                                                                | Rules                                            |
| ---------- | ----------------------------------------------------------------------------------- | ------------------------------------------------ |
| `token`    | string                                                                              | Expo push token; never logged in full            |
| `platform` | `IOS` \| `ANDROID`                                                                  | Required                                         |
| `status`   | `unsupported` \| `undetermined` \| `denied` \| `granted` \| `registered` \| `error` | Permission and registration lifecycle            |
| `tenantId` | string                                                                              | Must match the active session before registering |

**Transitions**: `unsupported | undetermined → granted → registered`; `undetermined → denied` (app remains usable); `registered → unregistered` on logout; any error returns to `granted` for retry.

**Rules**: a token belongs to exactly one active tenant at a time. Logout unregisters best-effort before clearing the session; login always registers with the current tenant.

## Server-side entity added by this feature

### PushDeviceToken (Prisma)

| Field                    | Type                    | Rules                                   |
| ------------------------ | ----------------------- | --------------------------------------- |
| `id`                     | string (cuid)           | Primary key                             |
| `tenantId`               | string                  | FK to `Tenant`, cascade delete; indexed |
| `userId`                 | string                  | Auth `sub` of the registering admin     |
| `token`                  | string                  | Unique; Expo push token                 |
| `platform`               | enum `IOS` \| `ANDROID` | Required                                |
| `deviceId`               | string \| null          | Optional stable device identifier       |
| `createdAt`, `updatedAt` | datetime                | Managed by Prisma                       |
| `lastSeenAt`             | datetime                | Refreshed on each registration          |

**Relationships**: `Tenant 1—N PushDeviceToken`. No other entity changes are required.

**Validation**: token format (`ExponentPushToken[...]` or `ExpoPushToken[...]`); token is reassigned to the current tenant/user when re-registered from the same device; registration always derives tenant from the verified JWT, never from input.
