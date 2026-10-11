# Contract: Tenancy Types (Tenant, User, Session & slug rules)

**Feature**: `specs/book/002-onboarding-and-tenant-flow/` | **Date**: 2026-10-08

Defines the TypeScript type surface and invariants for the tenancy layer consumed by `apps/book`. Field-level definitions and validation rules live in `data-model.md`; this contract fixes the interfaces that other artifacts rely on. **No persistence technology is defined.**

## Interfaces

Exported from `apps/book/src/shared/types/tenancy.ts`:

| Interface       | Purpose                               | Key fields                                                                                                                                                                 |
| --------------- | ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Tenant`        | Registered business                   | `id`, `name`, `slug`, `category`, `status`, `ownerUserId`, `defaultAppointmentDurationMinutes`, `businessHours`, `currency`, `timezone`, `onlineBookingEnabled`, `license` |
| `User`          | Account able to administer a business | `id`, `fullName`, `email`, `credential`, `role`, `tenantId`, `status`, `createdAt`                                                                                         |
| `BusinessHours` | General opening schedule              | `weekday`, `isOpen`, `startTime`, `endTime`                                                                                                                                |
| `Session`       | Identity seam context                 | `userId`, `tenantId`, `role`                                                                                                                                               |
| `TenantStatus`  | Tenant lifecycle union                | `draft \| active \| suspended`                                                                                                                                             |
| `UserRole`      | Role union                            | `owner \| professional` (professional reserved for later)                                                                                                                  |
| `TenantLicense` | Foundly Pass license reference (fut.) | `module`, `status`, `validUntil`                                                                                                                                           |
| `BookingDraft`  | Local wizard draft (client seam)      | `step`, `account`, `business`, `setup`, `draftId`                                                                                                                          |

## Slug contract

Exported from `apps/book/src/shared/utils/slug.ts`:

- `normalizeSlug(input: string): string` — lowercase, strip accents, collapse separators.
- `validateSlug(input: string): SlugValidation` — returns `{ ok: true }` or `{ ok: false, reason: 'format' | 'reserved' | 'taken' }`.
- `RESERVED_SLUGS: readonly string[]` — `admin`, `onboarding`, `api`, `www`, `app`, `public`, `static`, `assets`.
- `suggestSlug(commercialName: string): string` — derives a candidate from the name.

Slug format MUST match `^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])?$` (3–40 chars).

## Required invariants

- `Tenant.slug` MUST be unique, valid and not reserved; `Tenant.ownerUserId` MUST reference the owning user.
- `User.email` MUST be unique and well-formed; a `User` MUST reference a `Tenant`.
- `Tenant.id` and `User.tenantId` MUST agree for the owner (the owner belongs to their own tenant).
- `BusinessHours.endTime` MUST be strictly after `startTime` when `isOpen` is true.
- `defaultAppointmentDurationMinutes` MUST be `> 0`.
- Admin reads/writes MUST derive `tenantId` from `Session`, never from the URL.

## Boundaries

- Tenancy types live in `apps/book/src/shared` and MUST NOT import React, Next.js, MUI or any storage client (C2).
- The in-memory store seam is the only module that reads/writes `Tenant`/`User`/`Session` collections (C3).
- Input validation for the wizard is performed by the Zod schemas in `apps/book/src/modules/onboarding/utils/schemas.ts` (see `onboarding.contract.md`).

## Verification

- Type-level: `tsc --noEmit` enforces the interfaces and unions.
- Behavior: tests assert slug format/reserved/uniqueness, email uniqueness, owner-tenant agreement and tenant status transitions.
