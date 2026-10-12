# Data Model: Foundly API — Domain MVP Module (Authenticated CRUD, Tenant-Isolated)

**Feature**: `specs/api/010-domain-mvp-module/` | **Date**: 2026-10-11

## Storage strategy

- **No persistence changes.** The module reads/writes the ratified Prisma schema (Service,
  Specialist, SpecialistService) via `@foundly/database`. Tenant membership is carried by the
  credential claim `tenant_id` (mapped to `AuthUser.tenantId`), **not** a DB column.

## Entities

### AuthUser (extended, additive)

| Field      | Type     | Source                                                            |
| ---------- | -------- | ----------------------------------------------------------------- |
| (existing) | —        | unchanged (sub, email, role, aud, exp, iat)                       |
| `tenantId` | String?  | **ADDED** — `app_metadata.tenant_id ?? claims.tenant_id` (JWT claim) |

`tenantId` is the authoritative organization scope for the whole module.

### MyService (GraphQL view of the ratified Service)

| Field         | Type     | Notes                                          |
| ------------- | -------- | ---------------------------------------------- |
| `id`          | ID       | PK                                             |
| `name`        | String   | required                                       |
| `description` | String   | optional                                       |
| `priceCents`  | Int      | non-negative                                   |
| `durationMin` | Int      | positive                                       |
| `category`    | String   | optional                                       |
| `active`      | Boolean  | default true                                   |

### MySpecialist (GraphQL view of the ratified Specialist)

| Field  | Type    | Notes          |
| ------ | ------- | -------------- |
| `id`   | ID      | PK             |
| `name` | String  | required       |
| `role` | String  | optional       |
| `bio`  | String  | optional       |
| `avatar`| String | optional       |
| `active` | Boolean | default true |

Inputs: `CreateMyServiceInput`, `UpdateMyServiceInput`, `CreateMySpecialistInput`,
`UpdateMySpecialistInput` (whitelisted, required fields enforced). Client `tenant*` args do not exist
on this surface — scope is context-only.

## Validation rules

- Every operation requires a verified identity with a `tenantId` claim; missing identity →
  `UNAUTHENTICATED`, missing claim → explicit auth/config-style error (no tenant scope).
- All queries/mutations filter by `tenantId`; ownership is `where: { id, tenantId }`.
- Zero-row / missing resource → `NOT_FOUND` (cross-tenant included — no existence oracle).
- Invalid/missing required fields → `VALIDATION_ERROR` before any write.
- Duplicate tenant-scoped unique value → `CONFLICT`, nothing persisted.
- Delete cascades owned `SpecialistService` rows inside a transaction.

## GraphQL surface (this feature)

| Operation               | Kind     | Returns        | Scope                |
| ----------------------- | -------- | -------------- | -------------------- |
| `myServices(active?)`   | Query    | `[MyService!]!`| tenant (ctx.user)    |
| `myService(id)`         | Query    | `MyService`    | tenant (ctx.user)    |
| `createMyService(input)`| Mutation | `MyService!`   | tenant (ctx.user)    |
| `updateMyService(id, input)` | Mutation | `MyService!` | tenant (ctx.user)  |
| `deleteMyService(id)`   | Mutation | `Boolean!`     | tenant (ctx.user)    |
| `mySpecialists(active?)`| Query    | `[MySpecialist!]!` | tenant (ctx.user) |
| `mySpecialist(id)`      | Query    | `MySpecialist` | tenant (ctx.user)    |
| `createMySpecialist(input)` | Mutation | `MySpecialist!` | tenant (ctx.user)  |
| `updateMySpecialist(id, input)` | Mutation | `MySpecialist!` | tenant (ctx.user) |
| `deleteMySpecialist(id)` | Mutation | `Boolean!`     | tenant (ctx.user)    |

All under `@RequireAuth()` (008); errors flow through the 009 envelope.