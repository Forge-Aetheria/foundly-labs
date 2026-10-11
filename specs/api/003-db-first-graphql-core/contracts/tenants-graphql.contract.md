# Contract: Tenants GraphQL module (`apps/api`)

**Feature**: `specs/api/003-db-first-graphql-core/` | **Date**: 2026-10-11

## Endpoint posture (unchanged from 002)

| Method | Path       | Engine          | Playground/introspection                 |
| ------ | ---------- | --------------- | ---------------------------------------- |
| POST   | `/graphql` | Apollo (NestJS) | enabled when `NODE_ENV !== 'production'` |
| GET    | `/graphql` | Apollo          | introspection in dev                     |

GraphQL mode: **code-first** (`autoSchemaFile` → `schema.gql`); the file is ephemeral/generated.

## Types

```graphql
type BusinessProfile {
  id: ID!
  slug: String!
  bio: String
  address: String
  phone: String
  instagram: String
  whatsapp: String
  logo: String
  cover: String
  brandColors: JSON # or String; semantic: brand color set
  policies: JSON # or String; semantic: booking/cancellation policies
}

type Service {
  id: ID!
  name: String!
  description: String
  durationMinutes: Int!
  priceCents: Int!
  currency: String!
  category: String
  active: Boolean!
}

type Tenant {
  id: ID!
  name: String!
  category: String!
  status: String!
  timezone: String!
  currency: String!
  profile: BusinessProfile
  services: [Service!]!
}

input BusinessProfileInput {
  slug: String!
  bio: String
  address: String
  phone: String
  instagram: String
  whatsapp: String
  logo: String
  cover: String
  brandColors: JSON
  policies: JSON
}

input CreateTenantInput {
  name: String!
  category: String!
  timezone: String!
  currency: String # default "EUR"
  profile: BusinessProfileInput!
}
```

## Queries

| Query     | Arguments       | Returns      | Behaviour                                                   |
| --------- | --------------- | ------------ | ----------------------------------------------------------- |
| `tenants` | —               | `[Tenant!]!` | all businesses (empty list when none).                      |
| `tenant`  | `slug: String!` | `Tenant`     | resolves via `BusinessProfile.slug`; `null` when not found. |

## Mutations

| Mutation       | Arguments                   | Returns   | Behaviour                                                                                                              |
| -------------- | --------------------------- | --------- | ---------------------------------------------------------------------------------------------------------------------- |
| `createTenant` | `input: CreateTenantInput!` | `Tenant!` | persists Tenant + BusinessProfile in one transaction; returns the aggregate (client, clientContact/avatar/cover etc.). |

## Error semantics

| Condition                       | Behaviour                                                                                        |
| ------------------------------- | ------------------------------------------------------------------------------------------------ |
| duplicate/invalid `slug`        | GraphQL error, code `CONFLICT` (taken) / `VALIDATION_ERROR` (format/reserved); nothing persisted |
| missing required input fields   | `VALIDATION_ERROR`; nothing persisted                                                            |
| `tenant(slug)` not found        | returns `null` (no error)                                                                        |
| malformed query / unknown field | GraphQL validation/serving error, server healthy                                                 |

Errors MUST be returned as GraphQL `errors` entries with a stable `extensions.code` so clients branch
machine-readably; successful writes return the created resource and its identifier.

## Persistence seam & testability

- Reads/writes go through the shared client via an injectable `PrismaService`
  (`apps/api/src/shared/prisma/prisma.service.ts`).
- `createTenant` MUST run tenant + profile creation atomically (nested create in a single transaction).
- Mocks used by tests MUST emulate the nested-create and slug-uniqueness behaviour so the suite is
  deterministic without a live database.

## Gates (this feature)

- `npm run generate -w @foundly/database` then `npm run build|typecheck|test -w @foundly/database`.
- `npm run build|typecheck|test -w @foundly/api` green, including the tenants unit/e2e specs.
- No regressions: `npm run build -w @foundly/book`, `npm run test -w @foundly/ui`.
