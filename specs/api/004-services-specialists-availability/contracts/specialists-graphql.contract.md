# Contract: Specialists GraphQL module (`apps/api`)

**Feature**: `specs/api/004-services-specialists-availability/` | **Date**: 2026-10-11

## Endpoint posture (unchanged)

`POST /graphql` (Apollo/NestJS, code-first); playground/introspection only outside production.

## Types

```graphql
type ServiceRef {
  id: ID!
  name: String!
}

type Specialist {
  id: ID!
  tenantId: String!
  name: String!
  role: String
  avatar: String
  bio: String
  active: Boolean!
  services: [ServiceRef!]!
}

input CreateSpecialistInput {
  name: String!
  role: String
  avatar: String
  bio: String
  active: Boolean
}

input UpdateSpecialistInput {
  name: String
  role: String
  avatar: String
  bio: String
  active: Boolean
}
```

## Queries

| Query                | Arguments                                               | Returns          | Behaviour                                                   |
| -------------------- | ------------------------------------------------------- | ---------------- | ----------------------------------------------------------- |
| `specialists`        | `tenantId: String`, `tenantSlug: String` (at least one) | `[Specialist!]!` | tenant-scoped list; unknown slug → `[]`                     |
| `specialist`         | `id: ID!`                                               | `Specialist`     | full record incl. `services`; `null` when missing           |
| `serviceSpecialists` | `serviceId: ID!`                                        | `[Specialist!]!` | specialists performing the service (reverse direction read) |

## Mutations

| Mutation                        | Arguments                                | Returns       | Behaviour                                                                                                         |
| ------------------------------- | ---------------------------------------- | ------------- | ----------------------------------------------------------------------------------------------------------------- |
| `createSpecialist`              | `input: CreateSpecialistInput!`          | `Specialist!` | validates (name required); persists for the resolved tenant; returns record                                       |
| `updateSpecialist`              | `id: ID!, input: UpdateSpecialistInput!` | `Specialist!` | partial update; missing id → `NOT_FOUND`                                                                          |
| `removeSpecialist`              | `id: ID!`                                | `Boolean!`    | deletes the specialist and its assignment rows atomically; missing id → `NOT_FOUND`                               |
| `assignServiceToSpecialist`     | `specialistId: ID!, serviceId: ID!`      | `Specialist!` | creates the `SpecialistService` join; duplicate → `CONFLICT`; either target missing or cross-tenant → `NOT_FOUND` |
| `unassignServiceFromSpecialist` | `specialistId: ID!, serviceId: ID!`      | `Specialist!` | removes the join; absent → `NOT_FOUND`                                                                            |

`createSpecialist` resolves the tenant from `tenantId`/`tenantSlug` carried by the mutation input
(per spec Assumptions).

## Error semantics

| Condition                                   | Code               |
| ------------------------------------------- | ------------------ |
| missing/invalid name                        | `VALIDATION_ERROR` |
| missing `tenantId` AND `tenantSlug`         | `VALIDATION_ERROR` |
| specialist/service id not found (any write) | `NOT_FOUND`        |
| duplicate assignment                        | `CONFLICT`         |
| cross-tenant assignment target              | `NOT_FOUND`        |

## Tests (DB-free)

- Unit: `specialists.service.spec.ts` — list by tenant, detail with services, create/update/remove
  validation, assignment create/duplicate/unassign/absent, removal cleans joins.
- E2E: `specialists.resolver.spec.ts` — `specialists`, `specialist`, `serviceSpecialists`,
  `createSpecialist`, `updateSpecialist`, `removeSpecialist`, assign/unassign + error codes over
  `POST /graphql` with a stubbed `PrismaService`.
