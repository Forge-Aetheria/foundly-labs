# Data Model: Foundly API — GraphQL Modules for Services, Specialists & Availability

**Feature**: `specs/api/004-services-specialists-availability/` | **Date**: 2026-10-11

## Storage strategy

- Persistence: Prisma + PostgreSQL via `@foundly/database` (ratified `002`/`specs/architecture.md`).
- The relational entities used by this feature were **already modeled in `003`**
  (`contracts/database-schema.contract.md` under `003`): **Service**, **Specialist**,
  **SpecialistService**, **Availability**, plus **Tenant**/**BusinessProfile** for scoping.
- **No schema change** in this feature: this plan only adds GraphQL domain modules over those models.

## Entities (reused from 003)

| Entity                | Key fields                                                                                                                                                                             | Notes                                                |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| **Tenant**            | `id`, `name`, `category`, `status`, `timezone`, `currency`                                                                                                                             | scoping root                                         |
| **BusinessProfile**   | `tenantId` (1:1), `slug` (unique)                                                                                                                                                      | public identity; slug resolves the tenant for reads  |
| **Service**           | `tenantId`, `name`, `description?`, `durationMinutes`, `bufferMinutes`, `category?`, `priceCents`, `currency`, `active`                                                                | owned by a tenant; performed by specialists via join |
| **Specialist**        | `tenantId`, `name`, `role?`, `avatar?`, `bio?`, `active`                                                                                                                               | professional; assignments via join                   |
| **SpecialistService** | `specialistId`, `serviceId` (composite PK)                                                                                                                                             | M:N assignment                                       |
| **Availability**      | `tenantId`, `specialistId?`, `weekday` (0–6), `startTime`, `endTime` (`HH:mm`, `endTime > startTime`), `slotGranularityMinutes`, `minLeadTimeMinutes`, `bookingHorizonDays`, `breaks?` | business-wide when `specialistId` null               |

## Validation rules (this feature)

- **Service**: `name` required; `durationMinutes > 0`; `bufferMinutes >= 0`; `priceCents >= 0`;
  `currency` default `EUR`; `active` default true.
- **Specialist**: `name` required; `role`/`bio`/`avatar` optional strings.
- **Assignment**: both `specialistId` and `serviceId` must exist and belong to the same tenant;
  duplicate assignment → error `CONFLICT`; unassign of an absent row → `NOT_FOUND`.
- **Availability**: `weekday ∈ [0,6]`; `startTime`/`endTime` match `HH:mm`; `endTime > startTime`;
  granularity ≥ 1, lead time ≥ 0, horizon ≥ 0.
- Unknown `tenantSlug` on reads → empty lists (`[]`).

## State transitions

- **Service.active**: created `active` (default true); `updateService`/dedicated update can flip it
  (deactivate); `removeService`: deletes the service AND its `SpecialistService` rows atomically.
- **Specialist.active**: default true; can be flipped via update; `removeSpecialist`: deletes the
  specialist AND its assignment rows atomically.
- **Assignment**: `assign` (create join) ↔ `unassign` (delete join). No partial states.

## GraphQL surface (this feature)

| Module       | Queries                                                                                 | Mutations                                                                                                                |
| ------------ | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| services     | `services(tenantId?/tenantSlug?, category?, minDuration?, maxDuration?)`, `service(id)` | `createService`, `updateService`, `removeService`                                                                        |
| specialists  | `specialists(tenantId?/tenantSlug?)`, `specialist(id)`, `serviceSpecialists(serviceId)` | `createSpecialist`, `updateSpecialist`, `removeSpecialist`, `assignServiceToSpecialist`, `unassignServiceFromSpecialist` |
| availability | `availability(tenantId?/tenantSlug?, specialistId?)`                                    | `createAvailability`, `updateAvailability`, `removeAvailability`                                                         |

Detailed types/shapes live in `contracts/`. Object/input types are declared per module (ref types such
as `SpecialistRefObject`/`ServiceRefObject` are local to avoid circular type dependencies).
