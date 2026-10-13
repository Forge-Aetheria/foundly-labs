# Contract: Admin Catalog (Services & Team → API)

**Feature**: `specs/book/008-api-integration-catalog-sync` | **Date**: 2026-10-12

Guarded surface: every operation below requires `Authorization: Bearer <valid Supabase JWT>` and a
`tenant_id` scope derived from the token (`@RequireAuth()`). Full field mapping in
[data-model.md](../data-model.md).

## Operations

### Services

| Operation      | Type     | Variables                                                    | Returns            |
| -------------- | -------- | ------------------------------------------------------------ | ------------------ |
| `myServices`   | Query    | `{ active: Boolean }` (optional filter)                      | `[MyService!]!`    |
| `myService`    | Query    | `{ id: ID! }`                                                | `MyService` (null→NOT_FOUND) |
| `createMyService` | Mutation | `{ input: CreateMyServiceInput! }`                          | `MyService!`       |
| `updateMyService` | Mutation | `{ id: ID!, input: UpdateMyServiceInput! }`                | `MyService!`       |
| `deleteMyService` | Mutation | `{ id: ID! }`                                              | `Boolean!`         |

`CreateMyServiceInput`: `name: String!`, `priceCents: Int!`, `durationMinutes: Int!`,
`description: String?`, `category: String?`, `active: Boolean?` (default `true`).
`UpdateMyServiceInput`: same fields, all optional/nullable.

### Team (specialists)

| Operation        | Type     | Variables                                                  | Returns            |
| ---------------- | -------- | ---------------------------------------------------------- | ------------------ |
| `mySpecialists`  | Query    | `{ active: Boolean }` (optional filter)                    | `[MySpecialist!]!` |
| `mySpecialist`   | Query    | `{ id: ID! }`                                              | `MySpecialist`     |
| `createMySpecialist` | Mutation | `{ input: CreateMySpecialistInput! }`                   | `MySpecialist!`    |
| `updateMySpecialist` | Mutation | `{ id: ID!, input: UpdateMySpecialistInput! }`         | `MySpecialist!`    |
| `deleteMySpecialist` | Mutation | `{ id: ID! }`                                           | `Boolean!`         |

`CreateMySpecialistInput`: `name: String!`, `role: String?`, `bio: String?`, `avatar: String?`,
`active: Boolean?`. `UpdateMySpecialistInput`: same fields, all optional/nullable.

## Client-side mapping (book)

- Services read/write map book `Service` ↔ `MyService`; active `Rate` is derived from `priceCents`
  on read and `priceCents` from the entered price on write (see data-model §2.2).
- Team read/write map book `Resource` (type `professional`) ↔ `MySpecialist`.
- Tenant scoping: never sent by the client; derived server-side from the token.
- Local-only fields (`bufferMinutes`, `serviceIds`, `timezone`) are held locally and do not travel
  in these operations (known gaps; see data-model §5).

## Validation rules (server-enforced)

| Rule                            | Error code        |
| ------------------------------- | ----------------- |
| `name` required (services/specialists) | `VALIDATION_ERROR` |
| `priceCents` ≥ 0 integer               | `VALIDATION_ERROR` |
| `durationMinutes` > 0 integer          | `VALIDATION_ERROR` |
| duplicate service `name` in tenant     | `CONFLICT`         |
| missing id / not owned by tenant       | `NOT_FOUND`        |

## Error mapping (API envelope → book `ActionResult`)

| `extensions.code` (API) | Book `ErrorCode` | UI behaviour                          |
| ----------------------- | ---------------- | ------------------------------------- |
| `UNAUTHENTICATED`       | `UNAUTHENTICATED`| refresh/redirect to onboarding; action fails |
| `FORBIDDEN`             | `FORBIDDEN`      | permission message; no data shown     |
| `VALIDATION_ERROR`      | `VALIDATION_ERROR` (fields) | inline per-field errors        |
| `CONFLICT`              | `CONFLICT` / `SLUG_TAKEN` for tenancy | inline conflict message |
| `NOT_FOUND`             | `NOT_FOUND`      | empty-state / not-found view          |
| `INTERNAL_SERVER_ERROR` / `BAD_REQUEST` | `STATE_ERROR` (fallback) | generic error message |

> The book `ErrorCode` union already contains all mapped codes; no changes to `result.ts` required.