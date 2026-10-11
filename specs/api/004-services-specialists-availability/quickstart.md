# Quickstart: Foundly API — GraphQL Modules for Services, Specialists & Availability

**Feature**: `specs/api/004-services-specialists-availability/` | **Date**: 2026-10-11

## Onboarding

1. `npm install` at the repository root.
2. No schema/client regeneration needed — the entities used here were generated in `003`
   (`npm run generate -w @foundly/database` if the client was never generated).
3. (Optional, DB-backed uses) export `DATABASE_URL` to a Postgres (Supabase or docker). **Not required**
   for this feature's gates — specs run DB-free against a mocked `PrismaService`.

## Manual walkthrough

1. `npm run dev -w @foundly/api` (port 3002); open `http://localhost:3002/graphql`.
2. Create a service for a business:

   ```graphql
   mutation {
     createService(
       input: { tenantSlug: "estudio-ana", name: "Corte", durationMinutes: 30, priceCents: 2500 }
     ) {
       id
       name
       durationMinutes
       priceCents
       active
     }
   }
   ```

3. Query + filter the catalog:

   ```graphql
   query {
     services(tenantSlug: "estudio-ana", category: "Peluquería", minDuration: 30) {
       id
       name
       durationMinutes
     }
   }
   ```

4. Manage a specialist and its services:

   ```graphql
   mutation {
     createSpecialist(
       input: {
         tenantSlug: "estudio-ana"
         name: "Ana"
         role: "Estilista"
         bio: "10 años de experiencia"
       }
     ) {
       id
       name
     }
   }
   mutation {
     assignServiceToSpecialist(specialistId: "sp", serviceId: "srv") {
       id
       services {
         id
         name
       }
     }
   }
   query {
     serviceSpecialists(serviceId: "srv") {
       id
       name
     }
   }
   ```

5. Configure availability:

   ```graphql
   mutation {
     createAvailability(
       input: { tenantSlug: "estudio-ana", weekday: 1, startTime: "09:00", endTime: "17:00" }
     ) {
       id
       weekday
       startTime
       endTime
     }
   }
   query {
     availability(tenantSlug: "estudio-ana") {
       id
       weekday
       startTime
       endTime
     }
   }
   ```

6. Invalid inputs yield `VALIDATION_ERROR` / `NOT_FOUND` / `CONFLICT` codes via `errors[].extensions.code`.

## Verification matrix

| Scenario                                                        | Expected                                                                         |
| --------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `npm run build -w @foundly/api`                                 | exit 0 (code-first GraphQL adds the three modules)                               |
| `npm run typecheck -w @foundly/api`                             | `tsc --noEmit` clean                                                             |
| `npm run test -w @foundly/api`                                  | 100% pass (existing health/tenants + services/specialists/availability unit+e2e) |
| `npm run lint` (root)                                           | clean                                                                            |
| `services(...)` with filters                                    | tenant-scoped, filtered list                                                     |
| `service(id)` / `serviceSpecialists(serviceId)`                 | record incl. cross-references                                                    |
| `assignServiceToSpecialist` twice                               | second call → `CONFLICT`                                                         |
| `create/update/removeAvailability` validation                   | invalid weekday/range → `VALIDATION_ERROR`; missing id → `NOT_FOUND`             |
| `npm run build -w @foundly/book`, `npm run test -w @foundly/ui` | no regressions                                                                   |

Refer to `contracts/services-graphql.contract.md`, `contracts/specialists-graphql.contract.md` and
`contracts/availability-graphql.contract.md` for the exact types/behaviour and to
`data-model.md` for validation rules.

## Test commands

| Command                                                         | Scope            |
| --------------------------------------------------------------- | ---------------- |
| `npm run build                                                  | typecheck        | test -w @foundly/api` | API gates (incl. the three modules) |
| `npm run lint` (root)                                           | workspace lint   |
| `npm run build -w @foundly/book`, `npm run test -w @foundly/ui` | regression gates |
