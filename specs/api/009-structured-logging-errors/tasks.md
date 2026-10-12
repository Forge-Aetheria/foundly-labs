# Tasks: Foundly API — Structured Logging & Standardized GraphQL Errors

**Input**: Design documents from `/specs/api/009-structured-logging-errors/`

**Prerequisites**: plan.md (required), spec.md (user stories), research.md, data-model.md, contracts/graphql-errors.contract.md

**Tests**: Included — the spec mandates comprehensive coverage (spec.md FR-010: sanitization, masking
per environment, exception mapping, lifecycle logging). All specs are DB-free (mocked `PrismaService`,
local JWKS where `AppModule` boots).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

> **Context**: additive to `apps/api`. The 007 execution-layer context and 008 JWT flows are
> untouched; known `extensions.code` values (006/008 contract) are preserved. Test-first: the
> lifecycle/error specs reference the new modules before they exist (intended red state). New deps:
> `pino` (+ dev `pino-pretty`). No storage changes.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: declare the logging dependencies

- [X] T001 Add `pino` (runtime) and `pino-pretty` (dev) to `apps/api/package.json` (`npm install pino -w @foundly/api` and `npm install -D pino-pretty -w @foundly/api`); commit the updated `package-lock.json`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before any user story

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T002 Create `apps/api/src/shared/logger/logger.ts` — `createLogger(options?: { stream?, level? })` building pino: `pino-pretty` transport when `NODE_ENV !== 'production'`, JSON otherwise, `service: 'foundly-api'` base, and `redact` paths for `req.headers.authorization`, `*.password`, `*.token`, `*.secret`, `*.apiKey` plus PII `*.email`, `*.phone`, `*.fullName`; export `REDACT_PATHS`
- [X] T003 Wire Nest logging in `apps/api/src/main.ts` — `NestFactory.create(AppModule, { logger: createLogger() })` so the whole app logs through the structured sink

**Checkpoint**: Foundation ready — pino logger + redaction wired as the app logger

---

## Phase 3: User Story 1 - See what the API is doing without leaking secrets (Priority: P1) 🎯 MVP

**Goal**: Every request emits structured lifecycle records (operation, duration, outcome) through an
Apollo plugin, with credentials/tokens/PII never written.

**Independent Test**: `npm run test -w @foundly/api` — `pipeline.spec.ts` lifecycle e2e (capture-sink
logger) sees start + resolution records for a request; `logger.spec.ts` proves nested secrets never
reach output. Manual: `npm run dev -w @foundly/api` shows pretty request records.

### Tests for User Story 1 (write FIRST, expect FAIL)

- [X] T004 [P] [US1] Create `apps/api/src/graphql/pipeline.spec.ts` lifecycle part — a test-only GraphQL module wired with `requestLifecyclePlugin(logger)` (capture-sink pino via `createLogger({ stream })`); assert a request produces a start record (method/path/requestId) and a resolution record (operation/durationMs/errorCount); run and confirm it fails (plugin does not exist yet)
- [X] T005 [P] [US1] Create `apps/api/src/shared/logger/logger.spec.ts` — `createLogger({ stream })` unit: structured base fields; nested `password`/`token`/`authorization`/PII values redacted in objects; JSON default vs pretty when `NODE_ENV !== 'production'`

### Implementation for User Story 1

- [X] T006 [US1] Create `apps/api/src/graphql/logging.plugin.ts` — `requestLifecyclePlugin(logger = defaultLogger)` returning an `ApolloServerPlugin`: `requestDidStart` logs `{ level: 'info', requestId, method, path, operation }`; after response logs `{ operation, durationMs, errorCount }`; every error logged with **full stack** server-side at `error` level
- [X] T007 [US1] Wire `plugins: [requestLifecyclePlugin()]` into `GraphQLModule.forRoot` in `apps/api/src/app.module.ts` (alongside `context: createContext`)
- [X] T008 [US1] Run `npm run build -w @foundly/api && npm run typecheck -w @foundly/api && npm run test -w @foundly/api` and make all green

**Checkpoint**: US1 fully functional and testable independently (MVP)

---

## Phase 4: User Story 2 - Predictable, safe error responses for clients (Priority: P2)

**Goal**: Every thrown error returns the normalized envelope `{ code, timestamp, path }`; known codes
are preserved; unknown/internal errors are masked to `INTERNAL_SERVER_ERROR` in production while the
full trace stays logged.

**Independent Test**: `npm run test -w @foundly/api` — `errors.spec.ts` unit mapping/masking (per
`NODE_ENV`) and `pipeline.spec.ts` e2e (`viewer` → `UNAUTHENTICATED` envelope; throwing resolver →
masked in production, detailed otherwise; no secret/PII in client response or logs).

### Tests for User Story 2 (write FIRST, expect FAIL)

- [X] T009 [P] [US2] Create `apps/api/src/graphql/errors.spec.ts` — unit on `formatGraphQLError`: known codes (`UNAUTHENTICATED`/`FORBIDDEN`/`NOT_FOUND`/`CONFLICT`/`VALIDATION_ERROR`) preserved + `timestamp` + `path` (default `[]`); parse/validation failures → `BAD_REQUEST` in production; unknown error → `INTERNAL_SERVER_ERROR` + `"Internal server error"` no stack in production vs real detail otherwise; rendered message never contains a secret; run and confirm it fails (module missing)
- [X] T010 [P] [US2] Extend `apps/api/src/graphql/pipeline.spec.ts` — e2e: `AppModule` `viewer` without token → envelope `code:'UNAUTHENTICATED'` with `timestamp` and `path` (mocked `PrismaService` + local JWKS); a test-only throwing resolver with `NODE_ENV='production'` → generic `INTERNAL_SERVER_ERROR` and no secret in the body; with `NODE_ENV` unset → real message shown; log-assay asserts no PII/secret in emitted records

### Implementation for User Story 2

- [X] T011 [US2] Create `apps/api/src/graphql/errors.ts` — `KNOWN_CODES`, `formatGraphQLError(error)` (master: preserve known code + timestamp + path; map `GRAPHQL_PARSE_FAILED`/`GRAPHQL_VALIDATION_FAILED` → `BAD_REQUEST` in production; mask everything else to `INTERNAL_SERVER_ERROR` + generic message when `NODE_ENV === 'production'`, keep detail otherwise; drop `stacktrace` when masked; message sanitized)
- [X] T012 [US2] Wire `formatError: formatGraphQLError` into `GraphQLModule.forRoot` in `apps/api/src/app.module.ts` (fulfills `BCRYPT`? no — additive Apollo option)
- [X] T013 [US2] Run `npm run build -w @foundly/api && npm run typecheck -w @foundly/api && npm run test -w @foundly/api` and make all green

**Checkpoint**: US1 AND US2 work independently

---

## Phase 5: User Story 3 - Keep the workspace healthy (Priority: P3)

**Goal**: The pipeline integrates without regressing the ratified modules (007 context/health, 008 JWT).

**Independent Test**: Root `npm run lint` plus `npm run build -w @foundly/book`, `npm run test -w
@foundly/ui`, and the full API suite (incl. 007/008 specs asserting the known `extensions.code`) all pass.

### Implementation for User Story 3

- [X] T014 [US3] Run full regression gates and fix any failure: root `npm run lint`, `npm run build -w @foundly/book`, `npm run test -w @foundly/ui`, and re-run `npm run build|typecheck|test -w @foundly/api` (007 health/context and 008 `viewer`/JWT specs must stay green — proves known codes are preserved by `formatError`)

**Checkpoint**: All user stories independently functional; workspace green

---

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [X] T015 [P] Validate the live quickstart: `npm run dev -w @foundly/api` → pretty request/result log lines with `requestId`/`operation`/`durationMs`; query `{ health { status database } }`; `viewer` without token → envelope with `code`+`timestamp`+`path`; optionals: run once with `NODE_ENV=production` and confirm internal-error masking; reconcile `specs/api/009-structured-logging-errors/quickstart.md` on drift
- [X] T016 [P] Final SDD/strict-typing review: `apps/api/src/shared/logger/logger.ts`, `logger.spec.ts`, `apps/api/src/graphql/errors.ts`, `logging.plugin.ts`, `errors.spec.ts`, `pipeline.spec.ts`, `apps/api/src/main.ts`, `apps/api/src/app.module.ts` — no `any`, redaction list documented, known codes preserved, 007/008 untouched, `pino`/`pino-pretty` pinned
- [X] T017 Run the verification matrix and confirm `contracts/graphql-errors.contract.md` matches the shipped envelope/masking/redaction behavior (update docs on drift)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational
  - Sequential in priority order (P1 → P2 → P3)
- **Polish (Final Phase)**: Depends on all desired user stories

### User Story Dependencies

- **User Story 1 (P1)**: after Foundational — independent of US2
- **User Story 2 (P2)**: after Foundational — touches `app.module.ts` (already wired for `plugins` in US1) and `pipeline.spec.ts` (extended) but is independently testable
- **User Story 3 (P3)**: after US1/US2 — workspace-wide regression

### Within Each User Story

- Tests (where included) MUST be written and FAIL before implementation
- Logger/plugin before wiring before gates (US1)
- Formatter tests before `errors.ts` before `formatError` wiring (US2)
- Core implementation before gate verification

### Parallel Opportunities

- Setup: T001 standalone
- US1: T004 (lifecycle e2e) and T005 (logger unit) are separate files → parallel; T006/T007 after; T008 waits
- US2: T009 and T010 are separate files → parallel; T011/T012 after; T013 waits
- Polish: T015, T016 independent files → parallel
- US1 and US2 could run in parallel by different developers after Foundational (only `app.module.ts`/`pipeline.spec.ts` need coordination — run sequentially)

---

## Parallel Example: User Story 1

```bash
# Launch the two US1 test files together (independent files, fail first):
Task: "Create apps/api/src/graphql/pipeline.spec.ts (lifecycle log-assay, capture-sink logger)"
Task: "Create apps/api/src/shared/logger/logger.spec.ts (redaction + format)"

# Launch US1 implementation (dependent order):
Task: "Create apps/api/src/graphql/logging.plugin.ts"
Task: "Wire plugins into GraphQLModule.forRoot in apps/api/src/app.module.ts"
# Then: run `npm run build|typecheck|test -w @foundly/api` and make green (T008)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: `pino` + `pino-pretty`
2. Complete Phase 2: logger seam + Nest logger injection
3. Complete Phase 3: US1 — lifecycle plugin + redaction-specs green
4. **STOP and VALIDATE**: structured request/result logs visible in dev; `logger.spec` + lifecycle e2e green
5. Deploy/demo observability if ready (MVP)

### Incremental Delivery

1. Setup + Foundational → structured logger active app-wide
2. US1 → lifecycle logging with redaction → Deploy/Demo (MVP)
3. US2 → error envelope + production masking → Deploy/Demo
4. US3 → full-workspace regression green → Deploy/Demo
5. Each story adds value without breaking previous ones

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (lifecycle plugin + redaction)
   - Developer B: User Story 2 (error envelope + masking) — coordinates on `app.module.ts`
   - Developer C: runs US3 regression after both land
3. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to a user story for traceability
- Specs never touch the network or a live DB (mocked `PrismaService`, local JWKS where `AppModule` boots)
- Known `extensions.code` values MUST stay identical for 006/008 specs (`formatError` only adds fields)
- No `schema.prisma`/storage change; `packages/*` untouched
- Commit after each task or logical group; keep `apps/api/src/schema.gql` out of git