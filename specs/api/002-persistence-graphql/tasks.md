---
description: "Task list for the Foundly persistence & GraphQL feature"
---

# Tasks: Foundly — Persistence & GraphQL (Prisma + Apollo)

**Input**: Design documents from `/specs/api/002-persistence-graphql/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: INCLUDED — spec requires TDD flow with tests at 100% in `@foundly/database` and `@foundly/api`, plus no-regression gates.

**Organization**: Tasks are grouped by user story (US1–US3) to enable independent implementation and testing.

**Persistence**: Ratified as Prisma + PostgreSQL behind the `@foundly/database` seam (this feature).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1–US3)
- Include exact file paths in descriptions

## Path Conventions

`packages/database/` (new package) + `apps/api/src/` + governance docs.

---

## Phase 1: Setup — scaffold the database package

**Purpose**: The manifest and compiler/test configs for `@foundly/database`.

- [x] T001 [P] Create `packages/database/package.json` (name `@foundly/database`, main `./src/index.ts`, scripts `generate`/`build`/`typecheck`/`test`/`lint`, deps `@prisma/client`, devDeps `prisma`/`typescript`/`vitest`) per `data-model.md`/`research.md` D1.
- [x] T002 [P] Create `packages/database/tsconfig.json` (strict, bundler resolution, noEmit) and `packages/database/vitest.config.ts` (node env).
- [x] T003 Run `npm install` at the repository root to wire `@foundly/database` into the workspace.

**Checkpoint**: package scaffolded; no schema yet.

---

## Phase 2: User Story 1 - Seed the persistence layer (Priority: P1) 🎯 MVP

**Goal**: DB-First Prisma schema with the seven base models and a generated client importable by `apps/api`.

**Independent Test**: `prisma generate` succeeds, `packages/database` tests pass (schema sanity), and `apps/api` type-checks an import of `@foundly/database`.

### Tests for User Story 1 (TDD — write FIRST, confirm they fail before implementation) ⚠️

- [x] T004 [P] [US1] Write `packages/database/test/schema.test.ts` asserting the schema defines the seven base models (Tenant/Profile/Service/Staff/Appointment/Gallery/Availability) and the `Tenant.slug` uniqueness, per `data-model.md`.

### Implementation for User Story 1

- [x] T005 [US1] Create `packages/database/prisma/schema.prisma` (provider `postgresql`, datasource `DATABASE_URL`, the seven models + relations) per `data-model.md`.
- [x] T006 [US1] Create `packages/database/src/index.ts` exporting the `PrismaClient` and generated types.
- [x] T007 [US1] Run `npm run generate -w @foundly/database` (`prisma generate`) so the client is available to the workspace.

**Checkpoint**: US1 functional — client generated and package testable (MVP).

---

## Phase 3: User Story 2 - Expose the API over GraphQL (Priority: P2)

**Goal**: Apollo/GraphQL served by `apps/api` (code-first) with a `health` query and a dev playground.

**Independent Test**: The `health` supertest hits `POST /graphql` and returns the expected payload; the API build/typecheck passes.

### Tests for User Story 2 (TDD — write FIRST, confirm they fail before implementation) ⚠️

- [x] T008 [P] [US2] Write `apps/api/src/health/health.resolver.spec.ts`: via `@nestjs/testing` + supertest, run `query { health { service status } }` over `POST /graphql` and expect `200` with `service: 'foundly-api'` / `status: 'ok'` (contract `api-graphql.contract.md`).

### Implementation for User Story 2

- [x] T009 [US2] Add GraphQL + database deps to `apps/api/package.json` (`@foundly/database`, `@nestjs/graphql`, `@nestjs/apollo`, `@apollo/server`, `graphql`) and re-run root `npm install`.
- [x] T010 [US2] Create `apps/api/src/health/health.resolver.ts` (`@Resolver` + `@Query('health')` returning the payload; no Prisma dependency).
- [x] T011 [US2] Wire `GraphQLModule.forRoot` (code-first `autoSchemaFile`, playground when `NODE_ENV !== 'production'`) and register `HealthResolver` in `apps/api/src/app.module.ts`.

**Checkpoint**: US1 AND US2 independently testable.

---

## Phase 4: User Story 3 - Verify integration gates (Priority: P3)

**Goal**: The monorepo builds/tests/types cleanly with the new layers.

**Independent Test**: All gates below pass from the root.

### Verification for User Story 3

- [x] T012 [US3] Run gates: `npm run build -w @foundly/database`, `npm run test -w @foundly/database`, `npm run build -w @foundly/api`, `npm run test -w @foundly/api`, `npm run typecheck -w @foundly/api`.
- [x] T013 [P] [US3] Run regression gates: `npm run build -w @foundly/book` and `npm run test -w @foundly/ui`.

**Checkpoint**: integration safe.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Governance ratification, docs and formatting on top of the feature.

- [x] T014 Ratify the storage strategy (Prisma + PostgreSQL, seam `@foundly/database`) in `specs/architecture.md`, resolving the TODO(PERSISTENCE).
- [x] T015 [P] Lint and format the change set (`npm run lint` root + `prettier` on `packages/database/**` and `apps/api/**`) and fix any report.
- [x] T016 [P] Update `contracts/api-graphql.contract.md` cross-reference, `apps/book`-independent README touch (root README workspace table: add `packages/database`), and confirm this `tasks.md` + `specs/api/002-persistence-graphql/` are consistent.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies.
- **US1 (P1)**: after Setup — blocks the client generation for the API.
- **US2 (P2)**: after US1 (imports the DB package) — GraphQL wiring.
- **US3 (P3)**: after US1+US2 — full gates.
- **Polish (Phase 5)**: after all stories.

### Within Each User Story

- Test written first and failing (schema sanity T004 / GraphQL health T008), then implementation.
- Package → client → API integration ordering.

### Parallel Opportunities

- T001/T002 (different config files) run in parallel.
- T004 (database test) is independent of T009/T010 (API GraphQL) once the package exists.
- T013 regression gate runs in parallel with T012.

---

## Parallel Example: User Story 2

```text
# Write the failing test first (TDD):
Task: "health.resolver.spec.ts supertest /graphql"          (T008)

# Then implement (after test fails):
Task: "GraphQL + database deps in apps/api + npm install"   (T009)
Task: "HealthResolver"                                       (T010)
Task: "GraphQLModule.forRoot + register resolver"            (T011)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1 (scaffold + install).
2. T004 test (fails) → T005–T007 implement + generate.
3. **STOP and VALIDATE**: `prisma generate` + `npm run test -w @foundly/database` green → client importable.

### Incremental Delivery

1. US1 (persistence layer) → validate → demo.
2. US2 (GraphQL/hybrid API) → validate → demo `POST /graphql { health }`.
3. US3 (gates) → validate → polish (ratification + lint).

---

## Notes

- [P] tasks = different files, no incomplete dependencies.
- `packages/database` only depends on `@prisma/client`; it never imports from `apps/*`.
- Generated Prisma client/schema output stays out of git (generated at build time).
- `package-lock.json` churn from `npm install` is kept out of feature commits per project practice.
- Commit after each task or logical group.