# Data Model: Foundly API — Tenant Auth, Sessions & Guards (Foundly Pass)

**Feature**: `specs/api/006-foundly-pass-auth/` | **Date**: 2026-10-11

## Storage strategy

- Persistence: Prisma + PostgreSQL via `@foundly/database` (ratified `002`/`specs/architecture.md`).
- One **additive** change: `Tenant.plan String?` (nullable), followed by
  `npm run generate -w @foundly/database`. No new tables.

## Entities

### Tenant (extended)

| Field      | Type        | Notes                                                       |
| ---------- | ----------- | ----------------------------------------------------------- |
| `id`       | cuid        | PK                                                          |
| `slug`     | String      | unique (public identity, 003)                               |
| `status`   | String      | `active                                                     | draft | suspended`—`active` required for protected ops |
| **`plan`** | **String?** | **ADDED** — entitlement (e.g. `book`, `pos`); `null` = none |

The plan field drives capability gating (`book`/`pos` readiness) while `status` drives availability.

### Session credential (conceptual — no table)

- Opaque string `payload.signature`.
- Payload (base64url JSON): `{ u: userId, t: tenantId, r: role, exp: epochMs }`.
- Signature: HMAC-SHA256 over the payload byte-string using `FOUNDLY_PASS_SECRET`.

### AuthContext (runtime, not persisted)

| Field      | Type                   | Source                     |
| ---------- | ---------------------- | -------------------------- |
| `userId`   | string                 | verified session           |
| `tenantId` | string                 | verified session           |
| `role`     | string                 | verified session           |
| `tenant`   | `{ id, status, plan }` | tenant lookup in the guard |

`CurrentTenant`/`CurrentUser` GraphQL views derive from `AuthContext`.

## Validation rules

- `verifySession` rejects: malformed format, bad signature (tampering), expired `exp`, or empty parts →
  `UNAUTHENTICATED`.
- Guard requires `tenant.status === 'active'` → else `FORBIDDEN`.
- `@RequirePlan(p)` requires `tenant.plan === p` → else `FORBIDDEN` (null plan grants nothing).
- Protected operations ignore client-supplied tenant scope (session only).

## GraphQL surface (this feature)

| Operation        | Kind  | Guards                 | Notes                                                            |
| ---------------- | ----- | ---------------------- | ---------------------------------------------------------------- |
| `me`             | Query | `@UseAuth()`           | `CurrentUser { userId, role, tenant { id, status, plan } }`      |
| `currentTenant`  | Query | `@UseAuth()`           | `CurrentTenant { id, status, plan }`                             |
| `bookCapability` | Query | `@RequirePlan('book')` | `BookCapability { tenantId, enabled }` (sample entitlement gate) |

Public (unguarded) operations remain unchanged.
