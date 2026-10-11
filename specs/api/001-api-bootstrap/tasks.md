---
description: "Task list for the Foundly API bootstrap feature"
---

# Tasks: Foundly — API Bootstrap (NestJS apps/api)

**Input**: Design documents from `/specs/api/001-api-bootstrap/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: INCLUDED — the spec requires TDD flow with tests at 100% in `@foundly/api`, plus regression gates over `apps/book` and `@foundly/ui`.

**Organization**: Tasks are grouped by user story (US1–US3) to enable independent implementation and testing.

**Persistence**: Not defined. The API bootstrap exposes only a health endpoint; no storage is introduced.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1–US3)
- Include exact file paths in descriptions

## Path Conventions

`apps/api/` (new service) + governance docs at repo root + `specs/api/`.

---

## Phase 1: Setup — scaffold configuration

**Purpose**: The workspace manifest and compiler/test configs for the new service.

- [x] T001 [P] Create `apps/api/package.json` (name `@foundly/api`, scripts `build`/`dev`/`start`/`test`/`lint`/`typecheck`, NestJS runtime deps `@nestjs/core`/`@nestjs/common`/`@nestjs/platform-express`/`reflect-metadata`/`rxjs` and dev deps `@nestjs/cli`/`@nestjs/testing`/`vitest`/`supertest`/types) per `data-model.md` (workspace graph).
- [x] T002 [P] Create `apps/api/tsconfig.json` (strict, target ES2022, moduleResolution Bundler, noUncheckedIndexedAccess, noEmit) and `apps/api/tsconfig.build.json` (emit to `dist/`) mirroring the `apps/book/tsconfig.json` pattern.
- [x] T003 [P] Create `apps/api/nest-cli.json` (compilerOptions → `tsconfig.build.json`) per research D2.
- [x] T004 [P] Create `apps/api/vitest.config.ts` (node environment, `@nestjs/testing` + `supertest`) per research D3.
- [x] T005 Run `npm install` at the repository root and verify `npm ls @foundly/api` resolves `apps/api` as a workspace (research D1; depends on T001).

**Checkpoint**: workspace and configs ready; no source yet.

---

## Phase 2: User Story 1 - Bootstrap the backend service (Priority: P1) 🎯 MVP

**Goal**: A minimal bootable NestJS app (`src/main.ts` + `src/app.module.ts`) exposing the health route.

**Independent Test**: `npm run build -w @foundly/api` compiles and the vitest suite (`GET /`) passes; booting the server answers `200`.

### Tests for User Story 1 (TDD — write FIRST, confirm they fail before implementation) ⚠️

- [x] T006 [P] [US1] Write `apps/api/src/app.controller.spec.ts`: via `@nestjs/testing` + `supertest`, assert `GET /` → `200` with the health payload `{ service: 'foundly-api', status: 'ok' }` (contract `api-bootstrap.contract.md`).

### Implementation for User Story 1

- [x] T007 [US1] Implement `apps/api/src/app.controller.ts` (request handler for `GET /`) per the health contract.
- [x] T008 [US1] Create `apps/api/src/app.module.ts` (root `@Module` registering the controller as its only provider/controller).
- [x] T009 [US1] Create `apps/api/src/main.ts` (`NestFactory.create`, `app.listen(PORT ?? 3002)`, bootstrap logging).

**Checkpoint**: US1 functional — build, test and boot are green (MVP).

---

## Phase 3: User Story 2 - Register the service and the API domain (Priority: P2)

**Goal**: Governance + README reflect `apps/api` and the `/specs/api/` domain rule.

**Independent Test**: Inspect the documents listed below; each contains the registered service or the domain rule consistent with the others.

### Implementation for User Story 2

- [x] T010 [US2] Register `apps/api` in the service inventory and add the `api` domain to the domain tables + gates in `constitution.md` (§1/§2/§3).
- [x] T011 [US2] Apply the same edits to the canonical mirror `.specify/memory/constitution.md` (must stay equal to the root).
- [x] T012 [P] [US2] Add `apps/api` to the topology/inventory in `specs/architecture.md`.
- [x] T013 [P] [US2] Update `README.md` (routes table with the API, commands incl. `npm run build|test -w @foundly/api`, and the `/specs/api/` reference).

**Checkpoint**: US1 AND US2 independently verifiable.

---

## Phase 4: User Story 3 - Verify integration without regressions (Priority: P3)

**Goal**: The workspace resolves `apps/api` and existing apps/packages stay green.

**Independent Test**: Run the gates below from the root; all complete successfully.

### Verification for User Story 3

- [x] T014 [US3] Run API gates: `npm run build -w @foundly/api`, `npm run test -w @foundly/api`, `npm run typecheck -w @foundly/api`.
- [x] T015 [P] [US3] Run regression gates: `npm run build -w @foundly/book` and `npm run test -w @foundly/ui`.

**Checkpoint**: integration safe.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Formatting, lint and doc finalization on top of the feature.

- [x] T016 [P] Lint and format the change set (`npm run lint` at root + `prettier` on `apps/api/**`) and fix any report.
- [x] T017 Update `contracts/api-bootstrap.contract.md` cross-reference (this `tasks.md`) and confirm `specs/api/001-api-bootstrap/` is consistent.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies; T005 depends on T001.
- **US1 (P1)**: after Setup — MVP.
- **US2 (P2)**: after Setup — governance docs.
- **US3 (P3)**: after US1 — integration gates (build/test must exist first).
- **Polish (Phase 5)**: after all stories.

### Within User Story 1

- Test written first (T006) and failing; then controller → module → main.

### Parallel Opportunities

- T001–T004 (different config files) run in parallel.
- T012/T013 (architecture.md, README) run in parallel with T010/T011 but must stay consistent.
- T015 regression gate runs in parallel with T014.

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1 (scaffold + `npm install`).
2. T006 test (fails) → T007–T009 implement.
3. **STOP and VALIDATE**: `npm run build -w @foundly/api` + `npm run test -w @foundly/api` green → demo `curl :3002/`.

### Incremental Delivery

1. US1 (bootable service) → validate → demo.
2. US2 (governance registration) → validate by inspection.
3. US3 (integration gates) → validate no regressions.

---

## Notes

- [P] tasks = different files, no incomplete dependencies.
- `apps/api` does not import from `packages/*` (dependency rule) nor introduce persistence.
- Root ESLint/Prettier configs apply to `apps/api` (no per-app config duplication).
- `package-lock.json` churn from `npm install` is kept out of feature commits per project practice.
- Commit after each task or logical group.