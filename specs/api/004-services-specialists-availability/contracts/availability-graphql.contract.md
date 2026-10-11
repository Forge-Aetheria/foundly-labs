# Contract: Availability GraphQL module (`apps/api`)

**Feature**: `specs/api/004-services-specialists-availability/` | **Date**: 2026-10-11

## Endpoint posture (unchanged)

`POST /graphql` (Apollo/NestJS, code-first); playground/introspection only outside production.

## Types

```graphql
type Availability {
  id: ID!
  tenantId: String!
  specialistId: String
  weekday: Int! # 0 = Sunday … 6 = Saturday
  startTime: String! # HH:mm
  endTime: String! # HH:mm (strictly after startTime)
  slotGranularityMinutes: Int!
  minLeadTimeMinutes: Int!
  bookingHorizonDays: Int!
  breaks: String # JSON-encoded break windows (optional)
}

input CreateAvailabilityInput {
  tenantId: String
  tenantSlug: String
  specialistId: String
  weekday: Int!
  startTime: String!
  endTime: String!
  slotGranularityMinutes: Int
  minLeadTimeMinutes: Int
  bookingHorizonDays: Int
  breaks: String
}

input UpdateAvailabilityInput {
  specialistId: String
  weekday: Int
  startTime: String
  endTime: String
  slotGranularityMinutes: Int
  minLeadTimeMinutes: Int
  bookingHorizonDays: Int
  breaks: String
}
```

## Queries

| Query          | Arguments                                                                       | Returns            | Behaviour                                                                                                                        |
| -------------- | ------------------------------------------------------------------------------- | ------------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| `availability` | `tenantId: String`, `tenantSlug: String` (at least one), `specialistId: String` | `[Availability!]!` | business-wide entries (specialistId null) plus, when `specialistId` given, that specialist's scoped entries; unknown slug → `[]` |

## Mutations

| Mutation             | Arguments                                  | Returns         | Behaviour                                                       |
| -------------------- | ------------------------------------------ | --------------- | --------------------------------------------------------------- |
| `createAvailability` | `input: CreateAvailabilityInput!`          | `Availability!` | validates weekday/range; persists; unknown tenant → `NOT_FOUND` |
| `updateAvailability` | `id: ID!, input: UpdateAvailabilityInput!` | `Availability!` | partial update (re-validates range); missing id → `NOT_FOUND`   |
| `removeAvailability` | `id: ID!`                                  | `Boolean!`      | deletes the entry; missing id → `NOT_FOUND`                     |

## Validation

- `weekday ∈ [0,6]`; `startTime`/`endTime` match `HH:mm` (`/^([01]\d|2[0-3]):[0-5]\d$/`); `endTime > startTime`.
- `slotGranularityMinutes >= 1`; `minLeadTimeMinutes >= 0`; `bookingHorizonDays >= 0`.
- `breaks` is an optional JSON-encoded payload from the client.

## Error semantics

| Condition                           | Code               |
| ----------------------------------- | ------------------ |
| missing `tenantId` AND `tenantSlug` | `VALIDATION_ERROR` |
| invalid weekday / range / values    | `VALIDATION_ERROR` |
| write target id not found           | `NOT_FOUND`        |

## Tests (DB-free)

- Unit: `availability.service.spec.ts` — read by tenant and by specialist (business-wide + scoped),
  create/update/remove validation (weekday, `HH:mm`, `endTime > startTime`), empty lists, `NOT_FOUND`.
- E2E: `availability.resolver.spec.ts` — `availability`, `createAvailability`, `updateAvailability`,
  `removeAvailability` + error codes over `POST /graphql` with a stubbed `PrismaService`.
