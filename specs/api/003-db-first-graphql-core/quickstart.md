# Quickstart: Foundly API — DB-First Core Data & GraphQL Domain

**Feature**: `specs/api/003-db-first-graphql-core/` | **Date**: 2026-10-11

## Onboarding

1. `npm install` at the repository root.
2. Regenerate the Prisma client from the evolved schema:
   `npm run generate -w @foundly/database`.
3. (Optional, DB-backed use) export `DATABASE_URL` pointing to a Postgres (Supabase or
   `docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=postgres postgres:16`). **Not required** for this
   feature's gates — the tenants specs run against a mocked `PrismaService`.

## Manual walkthrough

1. `npm run dev -w @foundly/api` (port 3002).
2. Open `http://localhost:3002/graphql` → Apollo sandbox loads (dev mode).
3. Create a business (mutation):

   ```graphql
   mutation {
     createTenant(
       input: {
         name: "Estudio Ana"
         category: "Salud & Belleza"
         timezone: "America/Liberia"
         profile: {
           slug: "estudio-ana"
           bio: "Reservas online"
           policies: "[\"cancelar 24h antes\"]"
         }
       }
     ) {
       id
       name
       profile {
         slug
       }
     }
   }
   ```

   → returns the new `Tenant` with its `id` and the `BusinessProfile.slug`.

4. Read it back (queries):

   ```graphql
   query {
     tenant(slug: "estudio-ana") {
       id
       name
       status
       timezone
       profile {
         slug
         bio
       }
       services {
         id
         name
       }
     }
   }
   query {
     tenants {
       id
       name
       profile {
         slug
       }
     }
   }
   ```

5. Duplicate slug check: rerunning the mutation with `slug: "estudio-ana"` returns a GraphQL error
   with `extensions.code == "CONFLICT"` and persists nothing.

## Verification matrix

| Scenario                                                        | Expected                                                          |
| --------------------------------------------------------------- | ----------------------------------------------------------------- |
| `npm run generate -w @foundly/database`                         | Prisma client regenerated (no errors)                             |
| `npm run build -w @foundly/database`                            | exit 0                                                            |
| `npm run typecheck -w @foundly/database`                        | `tsc --noEmit` clean                                              |
| `npm run test -w @foundly/database`                             | schema sanity suite green                                         |
| `npm run build -w @foundly/api`                                 | exit 0 (code-first GraphQL + tenants module compile)              |
| `npm run typecheck -w @foundly/api`                             | `tsc --noEmit` clean                                              |
| `npm run test -w @foundly/api`                                  | 100% pass: existing health + tenants unit + tenants e2e (DB-free) |
| `tenant(slug)` existing / missing                               | aggregate / `null`                                                |
| `createTenant` success / duplicate slug                         | returns aggregate / `errors[0].extensions.code == "CONFLICT"`     |
| `npm run build -w @foundly/book`, `npm run test -w @foundly/ui` | no regressions                                                    |

Refer to `contracts/tenants-graphql.contract.md` for the exact query/mutation types and
`contracts/database-schema.contract.md` for the model/constraint contract.

## Test commands

| Command                                                         | Scope                  |
| --------------------------------------------------------------- | ---------------------- |
| `npm run generate -w @foundly/database`                         | Prisma DB-First client |
| `npm run build                                                  | typecheck              | test -w @foundly/database` | DB package gates                |
| `npm run build                                                  | typecheck              | test -w @foundly/api`      | API gates (incl. tenants specs) |
| `npm run build -w @foundly/book`, `npm run test -w @foundly/ui` | Regression gates       |
