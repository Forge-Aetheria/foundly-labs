---
description: 'Task list for the Foundly API Foundly Pass auth module'
---

# Tasks: Foundly API — Tenant Auth, Sessions & Guards (Foundly Pass)

**Input**: Design documents from `/specs/api/006-foundly-pass-auth/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/foundly-pass-auth.contract.md, quickstart.md

**Tests**: Tests ARE requested by the feature spec (objective 3: TDD DB-free unit + e2e for guards and
unauthorized rejection). Test tasks are included and written BEFORE implementation.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of
each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

- Code lives in `apps/api/src/modules/auth/`; the Prisma seam, error helpers and swc/vitest tooling
  already exist from `003`–`005`.
- One persistence change: `Tenant.plan String?` in `packages/database/prisma/schema.prisma` + client regeneration.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project scaffolding; the seam and test tooling already exist.

- [x] T001 [P] Create the directory scaffolding `apps/api/src/modules/auth/` (files are created in later phases).
- [x] T002 [P] Confirm no new dependencies are needed (guards via `@nestjs/common`, `crypto` for signing) and the signing secret approach (`FOUNDLY_PASS_SECRET` env) per contracts/foundly-pass-auth.contract.md.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Additive schema change + regeneration that MUST precede any auth work.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T003 Add `plan String?` to the `Tenant` model in `packages/database/prisma/schema.prisma` (additive, nullable; per data-model.md).
- [x] T004 Extend `packages/database/test/schema.test.ts` to assert the `Tenant` model defines `plan String?`; RUN BEFORE T003 is applied — expected red.
- [x] T005 Run `npm run generate -w @foundly/database` to regenerate the Prisma client with the new field.
- [x] T006 Verify the database gates: `npm run build|typecheck|test -w @foundly/database` (schema test green).

**Checkpoint**: Foundation ready — `PrismaService.client.tenant` exposes `plan`; user stories can begin.

---

## Phase 3: User Story 1 - Validate sessions and resolve the tenant (Priority: P1) 🎯 MVP

**Goal**: `AuthService` signs/verifies opaque HMAC credentials (`signSession`/`verifySession`) carrying
`{ userId, tenantId, role, exp }`, plus a tenant-status check (`active`) — the session-validation core.

**Independent Test**: `npm run test -w @foundly/api` green incl. `auth.service.spec.ts`; a signed token
round-trips, and expired/tampered/malformed tokens are rejected.

### Tests for User Story 1 (requested, write FIRST — must FAIL before implementation) ⚠️

- [x] T007 [US1] Unit tests `apps/api/src/modules/auth/auth.service.spec.ts` (fixed secret): sign → verify round-trip returns the identity; expired token → `UNAUTHENTICATED`; tampered payload/signature → `UNAUTHENTICATED`; malformed input → `UNAUTHENTICATED`.

### Implementation for User Story 1

- [x] T008 [P] [US1] Define the auth context/types in `apps/api/src/modules/auth/auth.context.ts` — `SessionPayload { userId; tenantId; role; exp }`, `AuthContext { userId; tenantId; role; tenant: { id; status; plan } }` per data-model.md.
- [x] T009 [US1] Implement `apps/api/src/modules/auth/auth.service.ts` — `signSession({userId, tenantId, role}, ttlMs?)` and `verifySession(token)` using HMAC-SHA256 (`node:crypto`) with `FOUNDLY_PASS_SECRET` (fail-fast when absent); rejects malformed/tampered/expired with `UNAUTHENTICATED`.
- [x] T010 [US1] Create `apps/api/src/modules/auth/auth.module.ts` — `@Global()` module providing and exporting `AuthService`.
- [x] T011 [US1] Register `AuthModule` in `apps/api/src/app.module.ts`.

**Checkpoint**: User Story 1 complete — session validation is a working, tested service.

---

## Phase 4: User Story 2 - Guard protected operations and inject context (Priority: P2)

**Goal**: `GqlAuthGuard` (bearer verification + tenant-status check + `AuthContext` attach), `PlanGuard`
(read `@RequirePlan` metadata), and decorators (`@UseAuth`, `@CurrentTenant`, `@CurrentUser`,
`@RequirePlan`, with strict session-only isolation).

**Independent Test**: `npm run test -w @foundly/api` green incl. `auth.guards.spec.ts`; protected ops are
refused without a token and receive context with one.

### Tests for User Story 2 (requested, write FIRST — must FAIL before implementation) ⚠️

- [x] T012 [US2] Unit tests `apps/api/src/modules/auth/auth.guards.spec.ts` (mocked `AuthService` + `PrismaService`): allows valid token + `active` tenant and attaches `AuthContext`; rejects missing/invalid token → `UNAUTHENTICATED`; rejects inactive tenant → `FORBIDDEN`; `PlanGuard` rejects unmet `@RequirePlan` → `FORBIDDEN` and passes a matching plan.

### Implementation for User Story 2

- [x] T013 [P] [US2] Create decorators `apps/api/src/modules/auth/auth.decorators.ts` — `@UseAuth()` (applies `GqlAuthGuard`), `@CurrentTenant()`/`@CurrentUser()` (param injection from `AuthContext`), `@RequirePlan(...)` (sets `REQUIRED_PLANS` metadata and applies both guards).
- [x] T014 [US2] Implement `apps/api/src/modules/auth/auth.guards.ts` — `GqlAuthGuard implements CanActivate` (Bearer extraction, `AuthService.verifySession`, tenant lookup `status === 'active'`, attach `AuthContext`) and `PlanGuard` (Reflector reads `REQUIRED_PLANS` on handler then class; enforces `tenant.plan`); error codes `UNAUTHENTICATED`/`FORBIDDEN` via `extensions.code`.
- [x] T015 [US2] Add `GqlAuthGuard`/`PlanGuard` to `apps/api/src/modules/auth/auth.module.ts` providers + exports.

**Checkpoint**: User Stories 1 AND 2 work — guards enforce auth and inject session/tenant context.

---

## Phase 5: User Story 3 - Expose tenant account/subscription status (Priority: P3)

**Goal**: guarded `me`/`currentTenant` queries and a plan-gated `bookCapability` sample proving
entitlement readiness.

**Independent Test**: `npm run test -w @foundly/api` green incl. `auth.resolver.spec.ts`; protected
queries return identity + tenant status/plan, and `bookCapability` is `FORBIDDEN` without the `book` plan.

### Tests for User Story 3 (requested, write FIRST — must FAIL before implementation) ⚠️

- [x] T016 [US3] GraphQL e2e `apps/api/src/modules/auth/auth.resolver.spec.ts` via supertest `POST /graphql` (stubbed `AuthService`+`PrismaService`, signed token helper): `me`/`currentTenant` without token → `UNAUTHENTICATED`; with valid token → full payload (user + tenant status/plan); inactive tenant → `FORBIDDEN`; `bookCapability` without `book` plan → `FORBIDDEN`, with `book` plan → `{ tenantId, enabled: true }`.

### Implementation for User Story 3

- [x] T017 [P] [US3] Define code-first GraphQL types `apps/api/src/modules/auth/auth.types.ts` — `CurrentUser`, `CurrentTenant`, `BookCapability` per contracts/foundly-pass-auth.contract.md.
- [x] T018 [US3] Implement `apps/api/src/modules/auth/auth.resolver.ts` — `me` (`@UseAuth` + `@CurrentUser`), `currentTenant` (`@UseAuth` + `@CurrentTenant`), `bookCapability` (`@RequirePlan('book')`).

**Checkpoint**: All user stories function independently — auth surface and entitlement gating demo.

---

## Phase 6: User Story 4 - Keep the quality gates green (Priority: P3)

**Goal**: API and workspace gates stay green with DB-free coverage.

**Independent Test**: The quickstart.md verification matrix passes without a live database or external SSO.

- [x] T019 [US4] Run the API gates: `npm run build|typecheck|test -w @foundly/api` (existing health/tenants/services/specialists/availability/appointments + auth specs green).
- [x] T020 [US4] Run the regression gates: `npm run build -w @foundly/book`, `npm run test -w @foundly/ui`, `npm run build|typecheck|test -w @foundly/database`.
- [x] T021 [US4] Execute the quickstart.md verification matrix (generate → set `FOUNDLY_PASS_SECRET` → protected/plan-gated GraphQL scenarios with `UNAUTHENTICATED`/`FORBIDDEN` codes).

**Checkpoint**: Full workspace green with the auth module.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T022 [P] Verify the regenerated `apps/api/src/schema.gql` (code-first output incl. auth) stays ephemeral/git-ignored; do not commit it.
- [x] T023 [P] Run Prettier (`npx prettier --write apps/api/src`) and ESLint (`npm run lint`); resolve any findings.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately.
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories (schema field + client regeneration).
- **User Stories (Phase 3+)**: All depend on Foundational. US2 depends on US1 (guards use `AuthService`); US3 depends on US2 (guards + decorators); each ships with its tests.
- **Polish (Final Phase)**: Depends on all desired user stories being complete.

### User Story Dependencies

- **User Story 1 (P1)**: after Foundational; standalone (`AuthService`).
- **User Story 2 (P2)**: after US1 (guards inject `AuthService`).
- **User Story 3 (P3)**: after US2 (resolver uses guards/decorators).
- **User Story 4 (P3)**: depends on US1 + US2 + US3 complete.

### Within Each User Story

- Tests are written FIRST and must FAIL before implementation.
- Types/context before service; service before guards; guards before resolver; module before `app.module.ts` registration.

### Parallel Opportunities

- T001/T002 (Setup) are [P].
- T008 (US1 context types) is [P] parallel with T007.
- T013 (US2 decorators) is [P] parallel with T012.
- T017 (US3 types) is [P] parallel with T016.
- Polish T022/T023 are [P].
- Files within the auth module are sequential per story (US1 → US2 → US3 touch shared files).

---

## Parallel Example: User Story 3

```bash
# Launch the e2e tests while the GraphQL types are drafted (different files):
Task: "GraphQL e2e apps/api/src/modules/auth/auth.resolver.spec.ts"
Task: "Define GraphQL types apps/api/src/modules/auth/auth.types.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 (Setup): T001–T002.
2. Complete Phase 2 (Foundational): T003–T006 (Tenant.plan + client regenerate — CRITICAL).
3. Complete Phase 3 (US1): T007–T011 (session sign/verify + DB-free tests).
4. **STOP and VALIDATE**: `npm run build|typecheck|test -w @foundly/api` green; token round-trip works.
5. This is the MVP slice: session validation as the auth foundation.

### Incremental Delivery

1. Setup + Foundational → `Tenant.plan` + regenerated client ready.
2. Add User Story 1 → `AuthService` (MVP). Test independently.
3. Add User Story 2 → guards + decorators. Test independently.
4. Add User Story 3 → protected `me`/`currentTenant` + plan-gated sample. Test independently.
5. Add User Story 4 → full gate matrix.
6. Each story adds value without breaking previous stories (existing modules unaffected — opt-in).

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together (T001–T006).
2. Given the tight module coupling, US1 → US2 → US3 are best implemented sequentially by one
   developer; a second developer prepares the e2e spec fixtures (T016) once US2 merges.
3. Developer D: User Story 4 verification + Polish once all stories merge.

---

## Notes

- [P] tasks = different files, no dependencies.
- [Story] label maps the task to its user story for traceability.
- Each user story is independently completable and testable.
- Verify tests fail before implementing (T007, T012, T016).
- Commit after each task or logical group; keep `schema.gql` and generated Prisma output out of git; never commit `FOUNDLY_PASS_SECRET`.
- Reuse the `003`–`005` fakes/patterns; the fake must include `tenant.plan`.
