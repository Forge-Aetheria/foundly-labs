# Tasks: Foundly API — GraphQL Execution Layer & Data Integration

**Input**: Design documents from `/specs/api/007-graphql-api-layer/`

**Prerequisites**: plan.md (required), spec.md (user stories), research.md, data-model.md, contracts/graphql-execution-layer.contract.md

**Tests**: Included — the spec mandates automated coverage (spec.md FR-009: "MUST include automated tests"; contract defines DB-free unit + e2e). All tests run against a mocked `PrismaService`, never a live DB.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

> **Context**: the execution layer already exists (NestJS code-first Apollo, `@foundly/database`
> dependency, `SharedPrismaModule` + `PrismaService`, `health` resolver). This feature is **additive**:
> a typed request context + a DB-aware health probe. No schema/storage/framework changes.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm the baseline is green and the seam is where the plan expects it

- [X] T001 Verify baseline gates pass before any change: `npm run build -w @foundly/api && npm run typecheck -w @foundly/api && npm run test -w @foundly/api` (record output; expected all green)
- [X] T002 Confirm the single persistence seam: review `apps/api/src/shared/prisma/prisma.service.ts` exports the shared `prisma` from `@foundly/database` and `apps/api/src/health/health.resolver.ts` exposes `health: HealthPayload`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before any user story

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T003 [P] Create the typed GraphQL request context `apps/api/src/graphql/context.ts` — define `interface GraphQLContext { prisma: typeof import('@foundly/database').prisma }` and a `contextFactory` that returns `{ prisma }` from the **shared `@foundly/database` singleton** (do NOT construct a new `PrismaClient`; `packages/*` stays untouched)
- [X] T004 Wire `context: contextFactory` into `GraphQLModule.forRoot` in `apps/api/src/app.module.ts` (Apollo driver, `autoSchemaFile` unchanged)

**Checkpoint**: Foundation ready — the request context seam is typed and registered

---

## Phase 3: User Story 1 - Verify the service and its data layer are always reachable (Priority: P1) 🎯 MVP

**Goal**: The `health` query reports liveness (`status`) and data-layer readiness (`database: up|down`) via a read-only, bounded probe — without crashing when the store is down.

**Independent Test**: `npm run test -w @foundly/api` — `health` returns `database: "up"` when the mocked `$queryRaw` succeeds and `"down"` when it rejects/times out; e2e over `POST /graphql` returns HTTP 200 with no `errors`. Manually: `npm run dev -w @foundly/api` → query `{ health { service status database checkedAt } }`.

### Tests for User Story 1 (write FIRST, expect FAIL)

- [X] T005 [P] [US1] Rewrite `apps/api/src/health/health.resolver.spec.ts` — unit paths with mocked `PrismaService` (`$queryRaw` resolves → `database:"up"`; rejects → `"down"`; never-settles → `"down"` after 2 s bound) plus e2e over `POST /graphql` asserting payload shape and no `errors`; run and confirm the new assertions fail against the current resolver

### Implementation for User Story 1

- [X] T006 [P] [US1] Create `apps/api/src/health/health.types.ts` — `HealthPayload` `@ObjectType` with `service: String!`, `status: String!`, `database: String!`, `checkedAt: String!` (ISO-8601 UTC)
- [X] T007 [US1] Update `apps/api/src/health/health.resolver.ts` — inject `PrismaService`, run `client.$queryRaw\`SELECT 1\`` inside try/catch with a 2 s `Promise.race` timeout; map to `database: "up"|"down"`; `status: "ok"` whenever the resolver executes; **never throw a GraphQL error** for a down store
- [X] T008 [US1] Run `npm run build -w @foundly/api && npm run typecheck -w @foundly/api && npm run test -w @foundly/api` and make all green

**Checkpoint**: US1 fully functional and testable independently (MVP)

---

## Phase 4: User Story 2 - Execute every request through one shared data seam (Priority: P2)

**Goal**: Every GraphQL request resolves with access to the shared data seam via the typed context (plus the already-ratified `PrismaService` DI), with no dual client instances.

**Independent Test**: `npm run test -w @foundly/api` — `context.spec.ts` asserts `contextFactory` returns the `@foundly/database` singleton and matches `GraphQLContext`; e2e proves the wiring end-to-end.

### Tests for User Story 2 (write FIRST, expect FAIL)

- [X] T009 [P] [US2] Create `apps/api/src/graphql/context.spec.ts` — unit: `contextFactory({ ... })` returns `{ prisma }` that strict-equals `import('@foundly/database').prisma` and satisfies `GraphQLContext` (no new instance)
- [X] T010 [P] [US2] Add e2e coverage in `apps/api/src/health/health.resolver.spec.ts` (or a dedicated `apps/api/src/graphql/context.spec.ts` e2e via `Test.createTestingModule`) asserting a request resolves with the registered context seam (mocked `PrismaService`), no `errors`

### Implementation for User Story 2

- [X] T011 [US2] Run `npm run build -w @foundly/api && npm run typecheck -w @foundly/api && npm run test -w @foundly/api` and make all green (wiring was landed in T004; this story adds the verification that no second persistence path exists)

**Checkpoint**: US1 AND US2 work independently

---

## Phase 5: User Story 3 - Keep the workspace healthy and SDD-compliant (Priority: P3)

**Goal**: The increment integrates cleanly with the monorepo and the ratified Supabase posture; no regressions.

**Independent Test**: Root `npm run lint` plus `npm run build -w @foundly/book`, `npm run test -w @foundly/ui`, and `apps/api` gates all exit 0.

### Implementation for User Story 3

- [X] T012 [US3] Run full regression gates and fix any failure: root `npm run lint`, `npm run build -w @foundly/book`, `npm run test -w @foundly/ui`, and re-run `npm run build|typecheck|test -w @foundly/api`

**Checkpoint**: All user stories independently functional; workspace green

---

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [X] T013 [P] Validate the live quickstart: run `npm run dev -w @foundly/api`, execute `{ health { service status database checkedAt } }` with the data store up (expect `up`) and down/stopped (expect `down`, no `errors`), and reconcile `specs/api/007-graphql-api-layer/quickstart.md` if behaviour differs
- [X] T014 Final SDD/strict-typing review of the changed files (`apps/api/src/graphql/context.ts`, `apps/api/src/health/health.types.ts`, `apps/api/src/health/health.resolver.ts`, `apps/api/src/health/health.resolver.spec.ts`, `apps/api/src/app.module.ts`): no `any`, single `@foundly/database` instance, no `packages/*` changes, no schema/`db:*` changes
- [X] T015 Run quickstart.md's verification matrix end-to-end (mock seams in CI-able commands, live checks documented as manual) and confirm `contracts/graphql-execution-layer.contract.md` matches the shipped payload

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately (baseline verification)
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational completion
  - User stories can then proceed sequentially in priority order (P1 → P2 → P3)
- **Polish (Final Phase)**: Depends on all desired user stories

### User Story Dependencies

- **User Story 1 (P1)**: Start after Foundational (T004) — independent of US2 (health probe uses `PrismaService` DI, not the context factory)
- **User Story 2 (P2)**: Start after Foundational — leans on T003/T004 wiring; no runtime dependence on US1
- **User Story 3 (P3)**: After US1/US2 — full-workspace regression verification

### Within Each User Story

- Tests (where included) MUST be written and FAIL before implementation
- Types before resolver (US1); unit before e2e within a story
- Core implementation before gate verification
- Story complete before moving to next priority

### Parallel Opportunities

- T003, T004 (foundational) are sequential-ish (T004 depends on T003) — T003 can run parallel with T001/T002
- Within US1: T005 (tests first), T006 (types), T007 (resolver) — T006/T007 can run parallel with T005 once authored; gate task T008 waits for all
- Within US2: T009 and T010 are independent files → parallel
- US2 tests can be written while US1 gates run (different files)
- Polish: T013, T014 are independent files → parallel

---

## Parallel Example: User Story 1

```bash
# Launch the US1 test authoring and the two implementation files together (independent files):
Task: "Rewrite the [P] health.resolver.spec.ts (mocked PrismaService up/down/timeout + e2e)"
Task: "Create [P] apps/api/src/health/health.types.ts (HealthPayload ObjectType)"
Task: "Update apps/api/src/health/health.resolver.ts (bounded $queryRaw readiness probe)"
# Then (sequential): run `npm run build|typecheck|test -w @foundly/api` and make green (T008)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: baseline gates + seam confirmation
2. Complete Phase 2: `graphql/context.ts` (T003) + wiring (T004)
3. Complete Phase 3: US1 health probe + DB-free specs
4. **STOP and VALIDATE**: `npm run test -w @foundly/api` — health up/down/timeout described in T005 green; manual walkthrough in quickstart
5. Deploy/demo the readiness-aware `health` if ready (MVP)

### Incremental Delivery

1. Setup + Foundational → foundation ready (context seam registered)
2. US1 → test independently → Deploy/Demo (MVP: health readiness)
3. US2 → context tests prove single seam → Deploy/Demo
4. US3 → full-workspace regression green → Deploy/Demo
5. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (health probe)
   - Developer B: User Story 2 (context verification) — independent file set
3. Developer C owns User Story 3 regression pass after both land
4. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to a user story for traceability
- Tests run against mocked `PrismaService` — no live DB, no Supavisor dependency in CI (research.md Decision 5)
- No `schema.prisma`/storage change; `npm run db:generate` is a no-op delta (research.md Decision 6)
- Commit after each task or logical group; keep `apps/api/src/schema.gql` out of git
- **Flake fix (pre-existing)**: `apps/api/src/modules/auth/auth.service.spec.ts` "rejects a tampered
  payload/signature" flaked intermittently when the tampered **last** base64url character decoded to
  the same byte value (trailing unused bits). Changed to tamper the **first** character (always
  changes decoded bytes), keeping the 006 behaviour and making the workspace gate deterministic.