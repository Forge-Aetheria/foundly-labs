# Contract: Services GraphQL module (`apps/api`)

**Feature**: `specs/api/004-services-specialists-availability/` | **Date**: 2026-10-11

## Endpoint posture (unchanged)

`POST /graphql` (Apollo/NestJS, code-first, `autoSchemaFile`); playground/introspection only when
`NODE_ENV !== 'production'`.

## Types

```graphql
type SpecialistRef {
  id: ID!
  name: String!
}

type Service {
  id: ID!
  tenantId: String!
  name: String!
  description: String
  durationMinutes: Int!
  bufferMinutes: Int!
  category: String
  priceCents: Int!
  currency: String!
  active: Boolean!
  specialists: [SpecialistRef!]!
}

input CreateServiceInput {
  name: String!
  description: String
  durationMinutes: Int!
  bufferMinutes: Int
  category: String
  priceCents: Int!
  currency: String
  active: Boolean
}

input UpdateServiceInput {
  name: String
  description: String
  durationMinutes: Int
  bufferMinutes: Int
  category: String
  priceCents: Int
  currency: String
  active: Boolean
}
```

## Queries

| Query      | Arguments                                                                                                           | Returns       | Behaviour                                                                                                                            |
| ---------- | ------------------------------------------------------------------------------------------------------------------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `services` | `tenantId: String`, `tenantSlug: String` (at least one), `category: String`, `minDuration: Int`, `maxDuration: Int` | `[Service!]!` | tenant-scoped list; `category` exact match; duration range inclusive on `durationMinutes`; filters AND-combined; unknown slug → `[]` |
| `service`  | `id: ID!`                                                                                                           | `Service`     | full record incl. `specialists` (via assignments); `null` when missing                                                               |

## Mutations

| Mutation        | Arguments                             | Returns    | Behaviour                                                                                           |
| --------------- | ------------------------------------- | ---------- | --------------------------------------------------------------------------------------------------- |
| `createService` | `input: CreateServiceInput!`          | `Service!` | validates (name, duration>0, buffer>=0, price>=0); persists for the resolved tenant; returns record |
| `updateService` | `id: ID!, input: UpdateServiceInput!` | `Service!` | partial update (`active` flips deactivate/activate); missing id → `NOT_FOUND`                       |
| `removeService` | `id: ID!`                             | `Boolean!` | deletes the service and its `SpecialistService` rows atomically; missing id → `NOT_FOUND`           |

For `createService`, tenant is resolved from `tenantId` or `tenantSlug` passed with the mutation input
(see Assumptions in the spec); the mutation input MAY carry `tenantId`/`tenantSlug`.

## Error semantics

| Condition                                    | Code               |
| -------------------------------------------- | ------------------ |
| invalid name / duration / price / buffer     | `VALIDATION_ERROR` |
| missing `tenantId` AND `tenantSlug`          | `VALIDATION_ERROR` |
| `updateService`/`removeService` id not found | `NOT_FOUND`        |
| duplicate assignment (see specialists)       | `CONFLICT`         |

Errors are returned as GraphQL `errors` entries with stable `extensions.code`.

## Tests (DB-free)

- Unit: `services.service.spec.ts` — list+filters, scoping by slug/id, create/update/remove validation,
  removal cleans joins (transactional), unknown slug → `[]`, NOT_FOUND.
- E2E: `services.resolver.spec.ts` — `services` (filters), `service`, `createService`, `updateService`,
  `removeService`, error codes over `POST /graphql` with a stubbed `PrismaService`.
