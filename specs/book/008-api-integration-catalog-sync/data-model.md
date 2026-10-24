# Data Model: Front-to-Back API Integration & Admin Catalog Sync

**Feature**: `specs/book/008-api-integration-catalog-sync` | **Date**: 2026-10-12

The canonical storage for migrated entities is the existing backend (Prisma/PostgreSQL behind the
GraphQL API). This document defines the **mapping** between the book domain types
(`apps/book/src/shared/types/`) and the API GraphQL surface, with validation rules, state
transitions and the explicit list of fields that remain local this iteration.

Mappings reference the actual API contracts: catalog
([admin-catalog.contract.md](./contracts/admin-catalog.contract.md)) and tenancy
([tenancy.contract.md](./contracts/tenancy.contract.md)).

---

## 1. Tenant (Business) — Tenancy surface

### 1.1 Book domain type → API mapping

| Book `Tenant` (shared/types/tenancy.ts) | API surface (TenantObject / BusinessProfileObject) | Sync this feature? |
| --------------------------------------- | --------------------------------------------------- | ------------------ |
| `id`                                    | `id` (TenantObject)                                 | ✅ read |
| `name`                                  | `name` (TenantObject)                               | ✅ write (create) |
| `category`                              | `category` (TenantObject)                           | ✅ write (create) |
| `slug`                                  | `profile.slug` (BusinessProfileObject)              | ✅ write (create) |
| `status`                                | `status` (TenantObject, default `"active"`)         | ✅ read |
| `timezone`                              | `timezone` (TenantObject)                           | ✅ write (create) |
| `currency`                              | `currency` (TenantObject, default `"EUR"`)          | ✅ write (create) |
| `bio`                                   | `profile.bio`                                       | ✅ (create) |
| `address`                               | `profile.address`                                   | ✅ (create) |
| `phone`                                 | `profile.phone`                                     | ✅ (create) |
| `social.instagram`                      | `profile.instagram`                                 | ✅ (create) |
| `social.whatsapp`                       | `profile.whatsapp`                                  | ✅ (create) |
| `avatar`                                | `profile.logo`                                      | ✅ (create, name mapping) |
| `cover`                                 | `profile.cover`                                     | ✅ (create) |
| `ownerUserId`                           | — (derived from identity `sub`)                     | ⛔ local / implicit |
| `defaultAppointmentDurationMinutes`     | —                                                    | ⛔ local (out of scope) |
| `businessHours` / `isPublic` | —                                                   | ⛔ local (out of scope) |
| `license`                               | —                                                    | ⛔ local (Foundly Pass future) |
| `gallery`                               | — (`GalleryPhoto` exists in DB, no GraphQL yet)      | ⛔ local (unmigrated domain) |
| `social` as object / `createdAt`/`updatedAt` | `profile.*` fields as listed; timestamps exist in DB | ✅/n/a |

### 1.2 Validation & rules

- `slug`: pattern `^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])?$`, reserved list enforced **server-side**
  (`RESERVED_SLUGS`); duplicates rejected with **CONFLICT** (`errors[].extensions.code`).
- `name`, `category`, `timezone` required; `currency` defaults to `EUR`.
- The tenant is created by the **onboarding flow** (owner) and is always bound to the authenticated
  user's `sub`; ownership is never read from the URL.

### 1.3 State transitions

```text
draft (local onboarding wizard, survives reload) → createTenant() → active (server)
   on CONFLICT (slug taken): stays draft, inline error, user picks another slug (local-first edit)
```

---

## 2. Service (Catalog — services) — Admin Catalog surface

### 2.1 Book domain type → API mapping

| Book `Service` (shared/types/appointments.ts) | API `MyService` (catalog) | Sync this feature? |
| --------------------------------------------- | ---------------------------- | ------------------ |
| `id`                                          | `id`                         | ✅ read |
| `name`                                        | `name` (required)            | ✅ write |
| `description`                                 | `description` (nullable)     | ✅ write |
| `durationMinutes`                             | `durationMinutes` (Int, >0)  | ✅ write |
| `category`                                    | `category` (nullable)        | ✅ write |
| `active`                                      | `active`                     | ✅ write |
| `priceCents` (via book `Rate.amountCents`)    | `priceCents` (Int, ≥0)       | ✅ write; read → derive active `Rate` |
| `bufferMinutes`                               | — (exists in DB, not exposed)  | ⛔ local hold (known gap) |
| `tenantId`                                    | — (derived from `tenant_id` claim) | ✅ implicit, server-side |

### 2.2 Field derivation: rate → price

- On **write**: the book form edits a price; the action maps it to `priceCents` of the service
  (currency implied `EUR`, service-level).
- On **read**: `MyService.priceCents` is materialized as a book `Rate` entry
  `{ id: serviceId, serviceId, amountCents: priceCents, currency: 'EUR', effectiveFrom: now, effectiveTo: null }`
  so existing UI consumers (`Rate`-aware components) keep working.

### 2.3 Validation (server-enforced, surfaced inline)

- `name` required; `priceCents` ≥ 0 integer; `durationMinutes` > 0 integer.
- Duplicate `name` within the tenant → **CONFLICT**; empty/negative fields → **VALIDATION_ERROR**.

### 2.4 State transitions

```text
created (active=true default) → update() ↔ active=true|false   (soft-toggle, not deleted)
deleteService() → hard remove (only when no longer needed; catalog contract)
```

---

## 3. Specialist (Team — Catalog) — Admin Catalog surface

### 3.1 Book domain type → API mapping

| Book `Resource` (type `professional`) | API `MySpecialist` (catalog) | Sync this feature? |
| ------------------------------------- | ---------------------------- | ------------------ |
| `id`                                  | `id`                         | ✅ read |
| `name`                                | `name` (required)            | ✅ write |
| `role`                                | `role` (nullable)            | ✅ write |
| `avatar`                              | `avatar` (nullable)          | ✅ write |
| `bio`                                 | `bio` (nullable)             | ✅ write |
| `active`                              | `active`                     | ✅ write |
| `type` (`'professional'`)             | — (fixed semantics)          | ⛔ local (assumed `professional`) |
| `timezone`                            | —                             | ⛔ local hold (known gap) |
| `serviceIds` (assignments)            | — (`SpecialistService` in DB, not exposed) | ⛔ local hold (known gap) |
| `tenantId`                            | — (derived from `tenant_id` claim) | ✅ implicit, server-side |

### 3.2 Validation & state transitions

- `name` required (server enforces non-empty); duplicates allowed by domain rules except name-length.
- Same lifecycle as Service: create (active) → toggle active ↔ update → delete (hard remove in a
  transaction that also clears `SpecialistService` links — server-side).

---

## 4. Owner identity & session

| Concept (book `Session`) | Source (Supabase Auth / claims) |
| ------------------------ | ------------------------------- |
| `userId`                 | JWT `sub`                        |
| `tenantId`               | `app_metadata.tenant_id` (merged at onboarding; refreshed after bind) |
| `role`                   | `'admin'` when `tenantId` present (owner); `'professional'` otherwise (future) |

- The book keeps its existing `Role`/`Session` types and `requireRole`/`requireTenant` helpers; only
  the **producer** of the session changes (see [session-auth.contract.md](./contracts/session-auth.contract.md)).
- Admin layout guard: session must be present **and** tenant-bound, else `redirect('/onboarding')`
  (unchanged UI behaviour, real source).

---

## 5. Unmigrated entities (local hold — per FR-007)

These keep living in the in-memory seam (`store.ts`) and must not be touched by this feature:

- `GalleryPhoto` / `Tenant.gallery` (006) — DB model exists but no GraphQL surface yet.
- `PortalPolicy` (departed policies) —
- `Review` (portal reviews).
- `BusinessHours`, `TimeBlock`, `AvailabilityRule` (availability engine), `Appointment` (agenda).

The public portal (`getPublicBusiness(slug)`) merges: authoritative fields fetched via
`tenant(slug)` (name, category, profile) **+** local fields (gallery, reviews, policies, hours) from
the store, preserving current rendering with zero regression.