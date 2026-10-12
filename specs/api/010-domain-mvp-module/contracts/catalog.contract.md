# Contract: Domain MVP catalog module (`apps/api`)

**Feature**: `specs/api/010-domain-mvp-module/` | **Date**: 2026-10-11

## Endpoint posture (unchanged)

`POST /graphql` (Apollo/NestJS, code-first); playground/introspection only when
`NODE_ENV !== 'production'`. 008 error envelope (`code`, `timestamp`, `path`) applies to every error.

## Credential & scope

- Header: `Authorization: Bearer <Supabase access token>` (008 guard).
- The token MUST carry the organization membership claim: `app_metadata.tenant_id` (or top-level
  `tenant_id`); it is mapped to `ctx.user.tenantId`.
- Every operation derives its tenant scope from `ctx.user.tenantId`; client-supplied tenant
  identifiers are ignored.

## Types

```graphql
type MyService {
  id: ID!
  name: String!
  description: String
  priceCents: Int!
  durationMin: Int!
  category: String
  active: Boolean!
}
input CreateMyServiceInput {
  name: String!
  description: String
  priceCents: Int!
  durationMin: Int!
  category: String
  active: Boolean
}
input UpdateMyServiceInput {
  name: String
  description: String
  priceCents: Int
  durationMin: Int
  category: String
  active: Boolean
}

type MySpecialist {
  id: ID!
  name: String!
  role: String
  bio: String
  avatar: String
  active: Boolean!
}
input CreateMySpecialistInput {
  name: String!
  role: String
  bio: String
  avatar: String
  active: Boolean
}
input UpdateMySpecialistInput {
  name: String
  role: String
  bio: String
  avatar: String
  active: Boolean
}
```

## Operations

| Operation                  | Returns              | Behaviour                                                        |
| -------------------------- | -------------------- | ---------------------------------------------------------------- |
| `myServices(active?)`      | `[MyService!]!`      | tenant-scoped list; empty when none                              |
| `myService(id)`            | `MyService`          | tenant-scoped fetch; missing/foreign → `null`-ish NOT_FOUND path |
| `createMyService(input)`   | `MyService!`         | validates input, persists under constant tenant scope            |
| `updateMyService(id, input)` | `MyService!`       | tenant-scoped update; foreign/missing id → `NOT_FOUND`           |
| `deleteMyService(id)`      | `Boolean!`           | tenant-scoped delete; foreign/missing id → `NOT_FOUND`           |
| `mySpecialists(active?)`   | `[MySpecialist!]!`   | tenant-scoped list                                                |
| `mySpecialist(id)`         | `MySpecialist`       | tenant-scoped fetch                                               |
| `createMySpecialist(input)`| `MySpecialist!`      | validates input, persists under tenant scope                      |
| `updateMySpecialist(id, input)` | `MySpecialist!`    | tenant-scoped update; foreign/missing → `NOT_FOUND`               |
| `deleteMySpecialist(id)`   | `Boolean!`           | removes owned SpecialistService rows + specialist (transaction)   |

All under `@RequireAuth()`.

## Error semantics

| Condition                                                     | Code              |
| ------------------------------------------------------------- | ----------------- |
| missing/invalid/expired token (008 guard)                     | `UNAUTHENTICATED` |
| token without the `tenant_id` claim                           | auth/config error |
| fetch/update/delete with an id not owned by the caller tenant | `NOT_FOUND`       |
| malformed/missing required input fields                       | `VALIDATION_ERROR`     |
| duplicate tenant-scoped unique value on create                | `CONFLICT`        |
| internal/unhandled                                           | masked per 009    |

Cross-tenant by-ID access returns `NOT_FOUND` (no existence oracle).

## Data changes

None — schema/storage unchanged; only the additive `AuthUser.tenantId` claim mapping in 008.

## Tests (DB-free)

- Unit `catalog.service.spec.ts`: list/fetch scoped to tenant; cross-tenant id → `NOT_FOUND`;
  validation → `VALIDATION_ERROR`; duplicate → `CONFLICT`; delete cascades.
- Unit `catalog.resolver.spec.ts`: guard preset, delegation to service, scope from `@AuthUser()`.
- E2E `catalog.e2e.spec.ts`: `POST /graphql` with local-JWKS tokens (008) for tenants T1/T2 —
  ownership round-trip green; T2 cannot read/update/delete T1 resources (`NOT_FOUND`);
  anonymous → `UNAUTHENTICATED`; malformed input → `VALIDATION_ERROR`; empty list for new tenants.