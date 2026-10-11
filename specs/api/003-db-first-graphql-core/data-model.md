# Data Model: Foundly API — DB-First Core Data & GraphQL Domain

**Feature**: `specs/api/003-db-first-graphql-core/` | **Date**: 2026-10-11

## Storage strategy (evolved, ratified)

- Provider: **PostgreSQL**, DB-First via **Prisma** (`packages/database/prisma/schema.prisma`), ratified in
  `specs/architecture.md` / `002-persistence-graphql`. This feature **evolves the models** (naming +
  fields) under the same strategy; the generated client is reproducible via `npm run generate -w @foundly/database`.
- The schema mirrors the `apps/book` booking domain 1:1 (tenancy, profile, services, specialists,
  availability, appointments, gallery).

## Entities

### Tenant (business/operational)

| Field                   | Type     | Notes                    |
| ----------------------- | -------- | ------------------------ |
| `id`                    | cuid     | PK                       |
| `name`                  | String   | required                 |
| `category`              | String   | required                 |
| `status`                | String   | default `active`; `draft | active | suspended` |
| `timezone`              | String   | required (IANA)          |
| `currency`              | String   | default `EUR`            |
| `createdAt`/`updatedAt` | DateTime | audit                    |

Relations: 1:1 `profile`, 1:N `services`, `specialists`, `appointments`, `gallery`, `availability`.

> The **public slug** lives on `BusinessProfile` (public identity per the feature description), not on
> Tenant.

### BusinessProfile (public face)

| Field                  | Type    | Notes                                                            |
| ---------------------- | ------- | ---------------------------------------------------------------- |
| `id`                   | cuid    | PK                                                               |
| `tenantId`             | String  | UNIQUE (1:1 tenant)                                              |
| `slug`                 | String  | **UNIQUE** public identifier (kebab-case, format+reserved rules) |
| `bio`                  | String? |                                                                  |
| `address`              | String? |                                                                  |
| `phone`                | String? |                                                                  |
| `instagram`/`whatsapp` | String? | socials/contact                                                  |
| `logo`/`cover`         | String? | branding assets (URLs)                                           |
| `brandColors`          | Json?   | brand color set                                                  |
| `policies`             | Json?   | booking/cancellation policies                                    |

### Service

| Field             | Type    | Notes          |
| ----------------- | ------- | -------------- |
| `id`              | cuid    | PK             |
| `tenantId`        | String  | FK tenant      |
| `name`            | String  | required       |
| `description`     | String? |                |
| `durationMinutes` | Int     | > 0            |
| `bufferMinutes`   | Int     | ≥ 0, default 0 |
| `category`        | String? |                |
| `priceCents`      | Int     | ≥ 0            |
| `currency`        | String  | default `EUR`  |
| `active`          | Boolean | default true   |

Relations: N:1 tenant; M:N specialists (via `SpecialistService`); 1:N appointments.

### Specialist (staff/professional)

| Field      | Type    | Notes        |
| ---------- | ------- | ------------ |
| `id`       | cuid    | PK           |
| `tenantId` | String  | FK tenant    |
| `name`     | String  | required     |
| `role`     | String? |              |
| `avatar`   | String? |              |
| `bio`      | String? |              |
| `active`   | Boolean | default true |

Relations: N:1 tenant; M:N services (via `SpecialistService`); 1:N appointments.

### SpecialistService (join, explicit M:N)

| Field          | Type   | Notes        |
| -------------- | ------ | ------------ |
| `specialistId` | String | composite PK |
| `serviceId`    | String | composite PK |

Relations: N:1 specialist, N:1 service. Enforces referential integrity of "services a professional can perform".

### Availability

| Field                    | Type    | Notes                                |
| ------------------------ | ------- | ------------------------------------ |
| `id`                     | cuid    | PK                                   |
| `tenantId`               | String  | FK tenant                            |
| `specialistId`           | String? | optional — tenant-wide when null     |
| `weekday`                | Int     | 0=Sunday … 6=Saturday                |
| `startTime` / `endTime`  | String  | `HH:mm` local; `endTime > startTime` |
| `slotGranularityMinutes` | Int     | default 30                           |
| `minLeadTimeMinutes`     | Int     | default 0                            |
| `bookingHorizonDays`     | Int     | default 60                           |
| `breaks`                 | Json?   | break windows per day slot           |

Relations: N:1 tenant; N:1 specialist (optional).

### Appointment

| Field                    | Type     | Notes                             |
| ------------------------ | -------- | --------------------------------- |
| `id`                     | cuid     | PK                                |
| `tenantId`               | String   | FK tenant                         |
| `specialistId`           | String   | FK specialist                     |
| `serviceId`              | String   | FK service                        |
| `clientName`             | String   | required                          |
| `clientContact`          | String?  | phone/email                       |
| `startAt` / `endAt`      | DateTime | UTC; `endAt > startAt`            |
| `status`                 | String   | default `pending` (see lifecycle) |
| `appliedDurationMinutes` | Int      | snapshot at booking               |
| `appliedAmountCents`     | Int      | snapshot at booking               |
| `appliedCurrency`        | String   | default `EUR`                     |
| `origin`                 | String   | default `online`                  |
| `notes`                  | String?  |                                   |

Relations: N:1 tenant/specialist/service.

**Status lifecycle**: `pending → confirmed → checked-in → completed`; terminal `cancelled` and
`no-show` may be reached from `pending`/`confirmed` (atomic terminal states, mirroring `apps/book`).

### GalleryPhoto

| Field         | Type    | Notes     |
| ------------- | ------- | --------- |
| `id`          | cuid    | PK        |
| `tenantId`    | String  | FK tenant |
| `url`         | String  | required  |
| `title`       | String? |           |
| `description` | String? |           |
| `category`    | String? | `local    | trabajos | equipo` (from book) |
| `sortOrder`   | Int     | default 0 |

## Validation rules (shared)

- `BusinessProfile.slug` unique; format `^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])?$` (3–40), reserved list
  (`admin`, `onboarding`, `api`, `www`, `app`, `public`, `static`, `assets`).
- `Service.durationMinutes > 0`, `bufferMinutes >= 0`, `priceCents >= 0`.
- `Availability.weekday ∈ [0,6]`; `endTime` strictly after `startTime`.
- `Appointment.endAt > startAt`; status ∈ the lifecycle values.
- Times stored as UTC (`DateTime`); weekday schedules and JSON blobs (`policies`, `brandColors`,
  `breaks`, `businessHours`) kept as their schema types.
- Creates that violate uniqueness/validation fail with a machine-readable GraphQL error (see contract).

## GraphQL surface (this feature — tenants module)

| Operation             | Kind     | Notes                                                                        |
| --------------------- | -------- | ---------------------------------------------------------------------------- |
| `tenants`             | Query    | list [{ id, name, category, status, timezone, currency, profile, services }] |
| `tenant(slug)`        | Query    | resolve via `BusinessProfile.slug`; null when not found                      |
| `createTenant(input)` | Mutation | creates tenant + profile in one transaction; returns the aggregate           |

Object/input types (code-first) map 1:1 to Tenant/BusinessProfile/Service. JSON fields
(`policies`, `brandColors`) are exposed via the API's JSON scalar/string representation (payloads are
defined in `contracts/tenants-graphql.contract.md`).
