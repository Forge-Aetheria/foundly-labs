# Phase 1 — Data Model: Foundly Book — Business Onboarding & Tenant Flow

**Feature**: `specs/book/002-onboarding-and-tenant-flow/` | **Date**: 2026-10-08

Derived from the Key Entities in `spec.md`. The model is expressed as **plain TypeScript interfaces** (`apps/book/src/shared/types/tenancy.ts`) and held in the **existing in-memory store** (`apps/book/src/shared/infra/store.ts`, extended with `tenants`, `users` and `sessions`). No persistence technology is defined or implied.

## Conventions

- Instants (`*At`) are ISO-8601 UTC strings.
- Money amounts are integer minor units (`amountCents`) plus an ISO-4217 `currency`; new tenants default to `EUR`.
- Durations are minutes (`defaultAppointmentDurationMinutes`).
- `id` values are opaque strings (generated with `crypto.randomUUID()`).
- The model **extends** the 001 admin-panel model; `Service`, `Rate`, `Resource`, `AvailabilityRule`, `TimeBlock` and `Appointment` are unchanged but become **tenant-scoped** (they gain a `tenantId` reference — see "Relationship to 001").

## Entity Overview

```text
User  *───1 Tenant          (owner in v1; staff later)
Tenant 1───1 BusinessHours  (general opening schedule)
Tenant 1───* Service / Resource / AvailabilityRule / TimeBlock / Appointment   (existing 001 data, tenant-scoped)
Tenant 1───1 PublicSlug     (unique public address)
Session ──1 User            (Foundly Pass seam, in-memory)
```

## 1. Tenant (Negocio)

A registered business that owns an agenda and a public booking portal.

| Field                               | Type                    | Rules                                             |
| ----------------------------------- | ----------------------- | ------------------------------------------------- |
| `id`                                | string                  | required, unique                                  |
| `name`                              | string                  | required, 1–120 chars (commercial name)           |
| `slug`                              | string                  | required, unique, valid + non-reserved (see §5)   |
| `category`                          | string                  | required, from a predefined list or free-form     |
| `status`                            | `TenantStatus`          | required, default `draft`                         |
| `ownerUserId`                       | string                  | required, references the owning User              |
| `defaultAppointmentDurationMinutes` | number                  | required, `> 0`                                   |
| `businessHours`                     | `BusinessHours`         | required                                          |
| `currency`                          | string (ISO-4217)       | required, default `EUR`                           |
| `timezone`                          | string (IANA)           | required, default business timezone               |
| `isPublic`                          | boolean                 | default `true` (whether the public booking page is visible) |
| `license`                           | `TenantLicense` \| null | optional; Foundly Pass license reference (future) |
| `createdAt`                         | string                  | required                                          |
| `updatedAt`                         | string                  | required                                          |

**Rules**:

- `slug` is unique across all tenants and MUST NOT be a reserved word (FR-008, FR-014, SC-003).
- A tenant becomes `active` only after onboarding provisioning succeeds (FR-011); `suspended` tenants are hidden from the public portal (FR-017).
- The owner user referenced by `ownerUserId` MUST belong to this tenant.

## 2. User

An account able to sign in and administer a business.

| Field        | Type                     | Rules                                  |
| ------------ | ------------------------ | -------------------------------------- |
| `id`         | string                   | required, unique                       |
| `fullName`   | string                   | required, 1–120 chars                  |
| `email`      | string                   | required, unique, valid email (FR-007) |
| `credential` | string                   | required (opaque, mock; never exposed) |
| `role`       | `UserRole`               | required, default `owner`              |
| `tenantId`   | string                   | required, references a Tenant          |
| `status`     | `'active' \| 'disabled'` | required, default `active`             |
| `createdAt`  | string                   | required                               |

**Rules**:

- `email` is unique across all users (an already-registered email blocks onboarding — edge case).
- In v1 exactly one `owner` user exists per tenant; `professional` is reserved for a later story.
- The credential is stored only in the mock seam and is never returned by reads.

## 3. BusinessHours (Horario de atención general)

The tenant's general opening hours, used to seed availability at provisioning.

| Field       | Type             | Rules                                          |
| ----------- | ---------------- | ---------------------------------------------- |
| `weekday`   | number           | required, `0–6` (0 = Sunday)                   |
| `isOpen`    | boolean          | required                                       |
| `startTime` | string `"HH:mm"` | required when `isOpen`                         |
| `endTime`   | string `"HH:mm"` | required when `isOpen`, `> startTime` (FR-010) |

**Rule**: closed weekdays carry `isOpen=false` and no interval; open weekdays carry exactly one general interval (split shifts are configured later in the availability editor).

## 4. Session (Foundly Pass seam)

An authenticated context supplied by the identity seam (`apps/book/src/shared/infra/auth.ts`).

| Field      | Type       | Rules                                  |
| ---------- | ---------- | -------------------------------------- |
| `userId`   | string     | required, references a User            |
| `tenantId` | string     | required, references the User's Tenant |
| `role`     | `UserRole` | required                               |

**Rule**: admin queries/actions MUST derive `tenantId` from the session, never from the URL (C4, SC-008).

## 5. PublicSlug (URL pública)

The unique, human-readable address of a tenant's portal.

- **Format**: `^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])?$` (3–40 chars, lowercase, no leading/trailing hyphen).
- **Normalization**: lowercase, strip accents, collapse non-alphanumerics into single hyphens.
- **Reserved words**: `admin`, `onboarding`, `api`, `www`, `app`, `public`, `static`, `assets`.
- **Uniqueness**: compared case-insensitively against all existing tenants (FR-014).
- **Suggested**: derived from `Tenant.name` at step 2, editable by the owner (FR-009).

## 6. TenantStatus (lifecycle)

```text
draft ──▶ active ──▶ suspended
              ▲          │
              └──────────┘   (reactivate)
```

| State       | Meaning                                  | Portal visibility |
| ----------- | ---------------------------------------- | ----------------- |
| `draft`     | Onboarding started, not yet provisioned  | hidden            |
| `active`    | Provisioned and licensed                 | visible           |
| `suspended` | Temporarily unavailable (license/policy) | hidden            |

## 7. TenantLicense (Foundly Pass reference — future)

| Field        | Type                                   | Rules    |
| ------------ | -------------------------------------- | -------- |
| `module`     | `'book'`                               | required |
| `status`     | `'active' \| 'inactive' \| 'trialing'` | required |
| `validUntil` | string \| null                         | optional |

**Rule**: the portal only exposes tenants whose license is `active`/`trialing` (FR-017). Until Foundly Pass is integrated, `license` is `null` and treated as active for local development, documented as a deferred integration.

## Relationship to 001

- The 001 entities (`Service`, `Rate`, `Resource`, `AvailabilityRule`, `TimeBlock`, `Appointment`, `AppointmentAuditEntry`) gain a `tenantId` reference and are read/written scoped by the session's tenant.
- Provisioning (R7) creates: the `Tenant`, its owner `User`, a default `AvailabilityRule` set derived from `businessHours`, and one default `Service` using `defaultAppointmentDurationMinutes`.
- The availability engine is reused unchanged; it receives the tenant's rules, blocks and appointments.

## Collection rules (in-memory store)

- Collections: `tenants`, `users`, `sessions` are added alongside the existing `resources`, `services`, `rates`, `availabilityRules`, `timeBlocks`, `appointments`, `audit`.
- Slug and email uniqueness are enforced by the store seam at write time (and re-validated by the pure rules before the write).
- Referenced entities are deactivated rather than removed (consistent with 001).
- When persistence is ratified, these rules map to the storage layer; the domain types and logic remain unchanged.
