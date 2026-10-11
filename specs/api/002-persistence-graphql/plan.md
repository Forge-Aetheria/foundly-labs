# Implementation Plan: Foundly — Persistence & GraphQL (Prisma + Apollo)

**Branch**: `002-persistence-graphql` | **Date**: 2026-10-11 | **Spec**: `specs/api/002-persistence-graphql/spec.md`

**Input**: Feature specification from `/specs/api/002-persistence-graphql/spec.md`

## Summary

Add the persistence layer as a shared workspace `@foundly/database` (`packages/database`) with a
DB-First Prisma schema (seven base domain models) and a generated client consumed by `apps/api`, and
wire a GraphQL (Apollo) server into the NestJS API with a `health` resolver plus a dev-only
playground. This feature also ratifies the storage strategy (Prisma + PostgreSQL) in
`specs/architecture.md`, resolving the governance TODO(PERSISTENCE).

## Technical Context

**Language/Version**: TypeScript strict · Node 20+ · NestJS 11 · Prisma 6 · Apollo Server 4 · GraphQL 16

**Primary Dependencies**: `@prisma/client`, `prisma` (dev); `@nestjs/graphql`, `@nestjs/apollo`, `@apollo/server`, `graphql`

**Storage**: Prisma + PostgreSQL (Supabase or local docker). DB-First; the `health` query works with no live DB.

**Testing**: Vitest + `@nestjs/testing` + supertest (API); vitest for the database package (schema validation).

**Target Platform**: Node.js HTTP server (NestJS) + shared package

**Project Type**: Monorepo — new `packages/database` + API integration

**Performance Goals**: N/A

**Constraints**: C1/C2 — domain/package code stays framework-free where required; C3 — persistence lives behind the `@foundly/database` package (single seam); C4 — no regressions in `apps/book`/`@foundly/ui`.

**Scale/Scope**: one shared DB package (7 models) + GraphQL wiring + health resolver; CRUD resolvers and migrations seeding are out of scope.

## Constitution Check

*GATE: must pass before Phase 0 research. Re-check after Phase 1 design.*

- The storage strategy was explicitly **NO DEFINIDA** (constitution v5.0.1 → TODO(PERSISTENCE) en `specs/architecture.md`). This feature **ratifies** Prisma + PostgreSQL and MUST update `specs/architecture.md` (and reference it in the feature docs); the amendment stays the same change set.
- The `api` domain and `apps/api` were registered in `001-api-bootstrap`; new API work continues in `/specs/api/<nnn>-<feature>/`.
- `packages/*` never import from `apps/*` — `@foundly/database` only depends on `@prisma/client`; `apps/api` imports `@foundly/database`.

**Post-design re-check**: PASS — the DB package is a dedicated seam; no storage leak into `apps/api`; GraphQL is API-local; gates preserved.

## Project Structure

### Documentation (this feature)

```text
specs/api/002-persistence-graphql/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   └── api-graphql.contract.md
└── tasks.md             # Phase 2 output
```

### Source Code (repository root)

```text
packages/database/                       # NEW shared package (@foundly/database)
├── package.json                         # name @foundly/database; scripts generate/build/dev/typecheck/test/lint
├── tsconfig.json                        # strict, bundler resolution (mirrors ui/book)
├── prisma/
│   └── schema.prisma                    # DB-First: 7 base models + relations (postgres provider)
├── src/
│   └── index.ts                         # exports the Prisma client + generated types
└── vitest.config.ts                     # node env

apps/api/
├── package.json                         # + @foundly/database, @nestjs/graphql, @nestjs/apollo, @apollo/server, graphql
└── src/
    ├── app.module.ts                    # + GraphQLModule.forRoot (code-first, autoSchemaFile, playground dev-gated)
    ├── health/
    │   ├── health.resolver.ts           # Query health → { service, status }
    │   └── health.resolver.spec.ts      # supertest POST /graphql { health }
    └── main.ts                          # unchanged (GraphQL served at /graphql)

governance (same commit):
specs/architecture.md                    # ratify Prisma + PostgreSQL (resume TODO(PERSISTENCE))
```

**Structure Decision**: DB client + schema in a dedicated package (single persistence seam); the API
keeps the GraphQL layer thin (root module config + a resolver module).

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| New shared package `packages/database` | A single DB seam keeps Prisma accessible to `apps/api` (and future apps) without duplicating the client or schema | Embedding Prisma in apps/api would couple one app to storage and leak the seam rule |
| Storage ratification changes `specs/architecture.md` as part of the feature | The constitution explicitly leaves storage open (TODO(PERSISTENCE)); choosing Prisma+Postgres is the authorized ratification | Keeping the status quo would block all persistence-dependent backend work |
| Prisma client generation as a build step | The generated client (`@prisma/client`) must exist before `apps/api` typechecks | Committing generated code is unnecessary when a `generate` step is wired |