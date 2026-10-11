# Phase 1 — Data Model: Foundly Book — Public Portal Mini-Site

**Feature**: `specs/book/003-public-portal-minisite/` | **Date**: 2026-10-09

Extends the tenancy/booking model from `002-onboarding-and-tenant-flow` with the portal-facing profile. Expressed as **plain TypeScript interfaces** held in the **in-memory store seam** (`apps/book/src/shared/infra/store.ts`). No persistence technology is defined or implied.

## Conventions

- Same as 002: ISO-8601 instants, `amountCents` money, minutes for durations, opaque `id` strings.
- Optional portal fields default to `null` when the tenant has not configured them.

## 1. Tenant — portal profile extension

| Field     | Type                                                | Rules                    |
| --------- | --------------------------------------------------- | ------------------------ |
| `bio`     | string \| null                                      | optional, max 2000 chars |
| `address` | string \| null                                      | optional, max 200 chars  |
| `phone`   | string \| null                                      | optional, max 30 chars   |
| `cover`   | string \| null                                      | optional image reference |
| `social`  | `{ instagram?: string; whatsapp?: string } \| null` | optional; https URLs     |

**Rules** (FR-003/FR-004): when a field is null the section is omitted or shows a tasteful placeholder; social links, when present, are https URLs.

## 2. PortalPolicy

| Field   | Type   | Rules                  |
| ------- | ------ | ---------------------- |
| `id`    | string | required, unique       |
| `title` | string | required, 1–120 chars  |
| `body`  | string | required, 1–2000 chars |

**Rule**: policies belong to a tenant (reference via `tenantId`).

## 3. Resource — specialist metadata (Equipo / Especialistas)

| Field    | Type           | Rules                             |
| -------- | -------------- | --------------------------------- |
| `name`   | (existing)     | required                          |
| `role`   | string \| null | optional, e.g. "Peluquera senior" |
| `avatar` | string \| null | optional image reference          |
| `bio`    | string \| null | optional, max 500 chars           |

**Rule (FR-007)**: only `active` resources are listed as specialists; the booking-flow specialist step applies when the tenant has more than one active resource (FR-010).

## 4. Service + Rate (Servicios tab)

- Existing `Service` and `Rate` are unchanged.
- The portal card shows: name, description (if any), `durationMinutes`, and the **current rate** (`resolveRate(serviceId, now)` — the effective-period rule already used by the booking snapshot).

## 5. BusinessHours (Información & Políticas)

- Existing `Tenant.businessHours` (7 entries) renders the weekly schedule per weekday (open/closed + start/end interval).

## 6. Appointment (booking flow)

- Unchanged from 002/001: created via the portal with `origin: 'online'`, `status: 'pending'`, and snapshot fields (`appliedDurationMinutes`, `appliedAmountCents`, …).
- Conflict re-check at write time per resource (specialist) returns `CONFLICT`.

## Relationships

```text
Tenant 1───* Resource (specialists)     Tenant 1───* PortalPolicy
Tenant 1───* Service                    Service 1───* Rate
Service *───* Resource (offered by)     Appointment *───1 Resource
```

## Collection rules (in-memory store)

- Seed extends the existing tenant (`ten-ana`) with bio, address, phone, socials + 2 specialists (to exercise the specialist step) + 2 example policies.
- Profile/specialist/policy reads go through `modules/public-booking/utils/queries.ts` and never bypass tenant status (`active` only, FR-016).
- When persistence is ratified, these fields map to the storage layer; the domain types and the portal logic remain unchanged.
