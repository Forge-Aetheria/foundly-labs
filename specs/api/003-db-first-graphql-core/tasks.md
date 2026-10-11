---
description: 'Task list for the Foundly API DB-First core data & GraphQL domain feature'
---

# Tasks: Foundly API — DB-First Core Data & GraphQL Domain

**Input**: Design documents from `/specs/api/003-db-first-graphql-core/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/tenants-graphql.contract.md, contracts/database-schema.contract.md, quickstart.md

**Tests**: Tests ARE requested by the feature spec (FR-013 requires unit/integration coverage for the tenants module; US2 acceptance criteria require green resolver/service tests). Test tasks are included and written BEFORE implementation (TDD).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- Location of this feature's code: `packages/database/` (schema/client) and `apps/api/src/` (modules/shared). No new top-level project is created.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project scaffolding; the workspace and packages already exist (no new project).

- [x] T001 [P] Create the directory scaffolding for the tenants domain module and the Prisma seam: `apps/api/src/modules/tenants/` and `apps/api/src/shared/prisma/` (files are created in later phases).
- [x] T002 [P] Confirm the installed workspace resolves `@foundly/database` into `apps/api` (packages/database/package.json + apps/api/package.json) and the `generate` script exists (`npm run generate -w @foundly/database`).

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T003 [P] Create `apps/api/src/shared/prisma/prisma.service.ts` — an `@Injectable()` `PrismaService` wrapping the `@foundly/database` Prisma client (expose the typed client; single import of the shared seam, per contracts/database-schema.contract.md).
- [x] T004 [P] Create `apps/api/src/shared/prisma/prisma.module.ts` — a `@Global()` `SharedPrismaModule` that provides and exports `PrismaService`.
- [x] T005 Register `SharedPrismaModule` in `apps/api/src/app.module.ts` imports (available to every domain module, incl. the future TenantsModule).

**Checkpoint**: Prisma seam ready; any module can inject `PrismaService`. User story implementation can now begin.

---

## Phase 3: User Story 1 - Define the reservation data model (Priority: P1) 🎯 MVP

**Goal**: Evolve the DB-First schema so the seven booking entities (Tenant, BusinessProfile, Service, Specialist, Availability, Appointment, GalleryPhoto) exist with their relationships, and the generated client is reproducible in `@foundly/database`.

**Independent Test**: Inspect `packages/database/prisma/schema.prisma` for the seven booking entities + the `SpecialistService` join and the unique `BusinessProfile.slug`; run `npm run generate -w @foundly/database` and the database package `build|typecheck|test` — all green without a live DB.

### Tests for User Story 1 (requested, write FIRST — must FAIL before implementation) ⚠️

- [x] T006 [P] [US1] Extend `packages/database/test/schema.test.ts` to assert the evolved models exist (Tenant, BusinessProfile, Service, Specialist, Availability, Appointment, GalleryPhoto) and the `SpecialistService` join, plus unique `BusinessProfile.slug` per contracts/database-schema.contract.md. RUN BEFORE the schema rewrite — expected red.

### Implementation for User Story 1

- [x] T007 [US1] Evolve `packages/database/prisma/schema.prisma` per contracts/database-schema.contract.md + data-model.md: rename `Profile`→`BusinessProfile` (add `slug` UNIQUE, `logo`, `brandColors`; drop `businessHours`), `Staff`→`Specialist`, `Gallery`→`GalleryPhoto`; add the `SpecialistService` join model (composite PK `(specialistId, serviceId)`); move `appointment.staffId`→`specialistId`; remove `Tenant.slug`/`Tenant.businessHours`.
- [x] T008 [US1] Regenerate the Prisma client: run `npm run generate -w @foundly/database` (produces the client into the workspace `@prisma/client`).
- [x] T009 [US1] Verify the database package gates with the evolved types and green schema tests (T006): `npm run build|typecheck|test -w @foundly/database`.

**Checkpoint**: User Story 1 complete — the reservation data model and its generated client are green and independently testable.

---

## Phase 4: User Story 2 - Expose the first domain module over GraphQL (Priority: P2)

**Goal**: Deliver the `Tenants` module in `apps/api/src/modules/tenants/` (queries `tenants`, `tenant(slug)`; mutation `createTenant(input)` creating tenant + profile in one transaction) wired through `PrismaService`.

**Independent Test**: `npm run test -w @foundly/api` passes (incl. tenants unit + GraphQL e2e DB-free); manually run `tenant(slug)`/`tenants`/`createTenant` in the dev sandbox per quickstart.md.

### Tests for User Story 2 (requested, write FIRST — must FAIL before implementation) ⚠️

- [x] T010 [P] [US2] Unit tests in `apps/api/src/modules/tenants/tenants.service.spec.ts` (mocked `PrismaService`): `findAll`, `findBySlug` (found / null when missing), `create` nested tenant+profile in a single transaction, duplicate/invalid slug → `CONFLICT`/`VALIDATION_ERROR` (contracts/tenants-graphql.contract.md).
- [x] T011 [P] [US2] GraphQL e2e spec in `apps/api/src/modules/tenants/tenants.resolver.spec.ts` via supertest `POST /graphql` with a stubbed `PrismaService`: `tenants`, `tenant(slug)`, `createTenant` success, duplicate slug returns `errors[0].extensions.code == "CONFLICT"` (no persistence).

### Implementation for User Story 2

- [x] T012 [P] [US2] Define code-first GraphQL types in `apps/api/src/modules/tenants/tenants.types.ts`: `Tenant`, `BusinessProfile`, `Service`, `BusinessProfileInput`, `CreateTenantInput` per contracts/tenants-graphql.contract.md (JSON fields `brandColors`/`policies` exposed per the same contract).
- [x] T013 [US2] Implement `apps/api/src/modules/tenants/tenants.service.ts` using `PrismaService`: `findAll()`, `findBySlug(slug)` (resolve via `BusinessProfile.slug`), `create(input)` persisting tenant+profile in one transaction with conflict/validation mapping (depends on T012).
- [x] T014 [US2] Implement the resolver `apps/api/src/modules/tenants/tenants.resolver.ts`: `@Query tenants`, `@Query tenant(slug)`, `@Mutation createTenant(input)` (depends on T013).
- [x] T015 [US2] Wire `apps/api/src/modules/tenants/tenants.module.ts` (imports `SharedPrismaModule`, provides `TenantsService`, declares `TenantsResolver`).
- [x] T016 [US2] Register `TenantsModule` in `apps/api/src/app.module.ts`.
- [x] T017 [US2] Verify the API gates incl. new specs: `npm run build|typecheck|test -w @foundly/api` (existing `health` + tenants unit + tenants e2e).

**Checkpoint**: User Stories 1 AND 2 work independently — the tenants surface is queryable/mutable over GraphQL with DB-free green tests.

---

## Phase 5: User Story 3 - Keep the workspace gates green (Priority: P3)

**Goal**: Confirm the whole monorepo keeps building, type-checking and testing after the schema evolution and the new module.

**Independent Test**: The regression matrix in quickstart.md passes without a live database.

- [x] T018 [US3] Run the full regression matrix: `npm run build -w @foundly/book`, `npm run test -w @foundly/ui`, `npm run build|typecheck|test -w @foundly/database`, `npm run build|typecheck|test -w @foundly/api`.
- [x] T019 [US3] Execute the quickstart.md manual walkthrough (generate → build → `createTenant` → `tenant(slug)` / `tenants` in the dev sandbox) and confirm the expected payloads and the `CONFLICT` duplicate-slug case.

**Checkpoint**: All user stories independently functional and regression-free.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T020 [P] Verify the code-first `apps/api/src/schema.gql` regenerates with the tenants types and remains ephemeral/git-ignored per 002 (check `.gitignore`, do not commit generated output).
- [x] T021 [P] Run Prettier and ESLint over the changed files (`npx prettier --write apps/api/src packages/database`, `npm run lint`).
- [x] T022 Record the public-slug mapping note (resolve-by-`BusinessProfile.slug`) for the future `apps/book` integration in `specs/api/003-db-first-graphql-core/research.md` Risk section.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately.
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories.
- **User Stories (Phase 3+)**: All depend on Foundational completion.
  - US1 (Phase 3) → then US2 (Phase 4) → then US3 (Phase 5). Sequential by priority; US1 and US2 touch different layers (schema vs API surface), so they can be staffed sequentially or in parallel after Foundational T005.
- **Polish (Final Phase)**: Depends on all desired user stories being complete.

### User Story Dependencies

- **User Story 1 (P1)**: starts after Foundational (T002/T008/T009 surface); no dependency on other stories.
- **User Story 2 (P2)**: depends on Foundational `PrismaService` (T003–T005) and on the generated client (T008); integrates the tenants module with `AppModule`.
- **User Story 3 (P3)**: depends on US1 + US2 being complete (verifies the whole).

### Within Each User Story

- Tests are written FIRST and must FAIL before implementation.
- Schema before client → client before API service → resolver before module wiring.
- Story complete before moving to next priority.

### Parallel Opportunities

- T001/T002 (Setup) marked [P].
- T003/T004 (Foundational Prisma seam) marked [P].
- T006 (US1 schema test) runs alone before T007.
- T010/T011 (US2 tests) can run in parallel.
- T012 (types) is [P] and can run in parallel with tests T010/T011.
- T020/T021/T022 (Polish) marked [P].
- US1 and US2 can be worked in parallel by different developers once T005 is merged (schema vs API surface), but the repo convention favours sequential P1→P2.

---

## Parallel Example: User Story 2

```bash
# Launch all tests for User Story 2 together (write-first, expect red):
Task: "Unit tests in apps/api/src/modules/tenants/tenants.service.spec.ts"
Task: "GraphQL e2e spec in apps/api/src/modules/tenants/tenants.resolver.spec.ts"

# Launch code-first types while the tests are drafted:
Task: "Define code-first GraphQL types in apps/api/src/modules/tenants/tenants.types.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 (Setup): T001–T002.
2. Complete Phase 2 (Foundational): T003–T005 (CRITICAL — unblocks all stories).
3. Complete Phase 3 (US1): T006–T009 (data model + generated client + DB package green).
4. **STOP and VALIDATE**: `npm run build|typecheck|test -w @foundly/database` green, schema shows the 7 booking entities.
5. This is the MVP slice: the persistence backbone for the backend.

### Incremental Delivery

1. Setup + Foundational → Prisma seam ready.
2. Add User Story 1 → data model + generated client (MVP). Test independently.
3. Add User Story 2 → tenants GraphQL module (queries + createTenant). Test independently.
4. Add User Story 3 → full regression matrix.
5. Each story adds value without breaking previous stories.

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together (T001–T005).
2. Once Foundational is done:
   - Developer A: User Story 1 (schema + client).
   - Developer B: User Story 2 (tenants module) — can start as soon as T008 (client) is available, since T003–T005 already landed.
3. Developer C: User Story 3 verification + Polish once both stories merge.

---

## Notes

- [P] tasks = different files, no dependencies.
- [Story] label maps the task to its user story for traceability.
- Each user story is independently completable and testable.
- Verify tests fail before implementing (T006, T010, T011).
- Commit after each task or logical group; keep generated files (`schema.gql`, Prisma client) out of git.
- Avoid vague tasks and same-file conflicts; the schema rewrite (T007) and the tenants module (T012–T016) touch different workspaces and can proceed independently after Foundational.
