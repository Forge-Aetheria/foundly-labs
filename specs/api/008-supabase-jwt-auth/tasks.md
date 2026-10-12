# Tasks: Foundly API — Supabase Auth & JWT Identity for GraphQL

**Input**: Design documents from `/specs/api/008-supabase-jwt-auth/`

**Prerequisites**: plan.md (required), spec.md (user stories), research.md, data-model.md, contracts/graphql-auth.contract.md

**Tests**: Included — the spec mandates comprehensive coverage (spec.md FR-010). All tests run **offline and DB-free**: an ephemeral RSA key pair + local JWKS (`jose createLocalJWKSet`) is injected via the JWKS provider seam; no network, no Supabase, no live DB.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

> **Context**: additive to `apps/api`. The 006 HMAC auth (`UseAuth`/`CurrentUser`/`CurrentTenant`/
> `RequirePlan`) and all existing modules stay untouched. New: `jose` dependency, `SUPABASE_AUTH_URL`
> env, a JWT verifier service + guard + decorators inside the `@Global` `AuthModule`, and
> `GraphQLContext.user`. No storage/packages changes.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: declare the new dependency and the provider URL configuration

- [X] T001 Add the `jose` dependency to `apps/api/package.json` via `npm install jose -w @foundly/api`; commit the updated `package-lock.json`
- [X] T002 Add `SUPABASE_AUTH_URL=https://<project-ref>.supabase.co/auth/v1` to `apps/api/.env` (gitignored; project ref matches the workspace Supabase connection strings); fail-fast config documented in `jwt.service.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before any user story

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T003 [P] Create `apps/api/src/modules/auth/jwt.types.ts` — `AuthUser` interface (`sub`, `email?`, `role`, `aud`, `exp`, `iat?`) and the `ViewerObject` GraphQL `@ObjectType` (`sub: ID!`, `email: String`, `role: String!`, `aud: String!`)
- [X] T004 [P] Create JWKS provider seam in `apps/api/src/modules/auth/jwt.service.ts` providers — a Nest provider token (e.g. `JWT_JWKS`) with a factory returning `createRemoteJWKSet(new URL(`${SUPABASE_AUTH_URL}/.well-known/jwks.json`))`, fail-fast when `SUPABASE_AUTH_URL` is missing
- [X] T005 Create `apps/api/src/modules/auth/jwt.service.ts` — `SupabaseJwtService.verify(token)` using `jwtVerify(token, jwks, { issuer: SUPABASE_AUTH_URL, audience: "authenticated" })` with a 30 s `exp` leeway; returns `AuthUser` from `sub`/`email`/`role`/`aud`/`exp`/`iat`; throws `GraphQLError` `UNAUTHENTICATED` for any failure (signature, expired, missing `sub`, wrong `iss`/`aud`, provider error) — depends on T003/T004
- [X] T006 [P] Extend `apps/api/src/graphql/context.ts` — `GraphQLContext { prisma; user?: AuthUser }` (type-import from the auth module; factory unchanged) — depends on T003
- [X] T007 Wire the providers (`JWT_JWKS`, `SupabaseJwtService`) into `apps/api/src/modules/auth/auth.module.ts` `providers`/`exports` (module is `@Global`)

**Checkpoint**: Foundation ready — verifier service + context.user type + JWKS seam registered

---

## Phase 3: User Story 1 - Recognize who is calling a protected operation (Priority: P1) 🎯 MVP

**Goal**: A verifiable Supabase access token resolves to an `AuthUser` that is attached to `GraphQLContext.user` and serves the protected `viewer` sample.

**Independent Test**: `npm run test -w @foundly/api` — `jwt.service.spec` valid round-trip, `jwt.guard.spec` attaches `ctx.user`, `jwt.resolver.spec` e2e `viewer` with a valid token returns the payload (and without a token is rejected). Manual: `npm run dev -w @foundly/api` + `viewer` with/without a Supabase token.

### Tests for User Story 1 (write FIRST, expect FAIL)

- [X] T008 [P] [US1] Create `apps/api/src/modules/auth/jwt.service.spec.ts` — generate an ephemeral RSA key pair (`node:crypto`), build a local JWKS (`createLocalJWKSet`), sign a valid token with `jose SignJWT` (RS256, `iss`/`aud`/`sub`/`exp`), inject via the JWKS provider token; assert `verify` returns the expected `AuthUser`; run and confirm the current missing service fails the spec
- [X] T009 [P] [US1] Create `apps/api/src/modules/auth/jwt.guard.spec.ts` — `SupabaseJwtGuard` with a mocked `SupabaseJwtService`: valid `Bearer` token → `canActivate` true and `getContext().user` set; run and confirm it fails (guard not implemented yet)
- [X] T010 [P] [US1] Create `apps/api/src/modules/auth/jwt.resolver.spec.ts` — e2e over `POST /graphql` (AppModule, JWKS provider overridden with the local JWKS): `viewer` without token → `UNAUTHENTICATED`; with a valid signed token → `{ sub, email, role, aud }`; run and confirm it fails

### Implementation for User Story 1

- [X] T011 [P] [US1] Create `apps/api/src/modules/auth/jwt.guard.ts` — `SupabaseJwtGuard implements CanActivate`: parse `Authorization: Bearer <token>` via `GqlExecutionContext`, call `SupabaseJwtService.verify`, attach the resolved `AuthUser` to `graphqlContext.user`, throw `UNAUTHENTICATED` on missing/malformed/invalid token
- [X] T012 [P] [US1] Create `apps/api/src/modules/auth/jwt.decorators.ts` — `@RequireAuth()` (applies `UseGuards(SupabaseJwtGuard)`) and `@AuthUser()` (param decorator returning `graphqlContext.user`) — names distinct from the 006 decorators
- [X] T013 [P] [US1] Create `apps/api/src/modules/auth/jwt.resolver.ts` — `viewer` query under `@RequireAuth()` returning `ViewerObject` from `@AuthUser()`
- [X] T014 [US1] Register `SupabaseJwtGuard`, decorators' guard and `JwtResolver` in `apps/api/src/modules/auth/auth.module.ts` (`providers`/`exports`) — depends on T011–T013
- [X] T015 [US1] Run `npm run build -w @foundly/api && npm run typecheck -w @foundly/api && npm run test -w @foundly/api` and make all green

**Checkpoint**: US1 fully functional and testable independently (MVP)

---

## Phase 4: User Story 2 - Keep public surface open and degrade gracefully (Priority: P2)

**Goal**: Anonymous, malformed, expired, tampered and provider-unreachable requests reject fail-closed with `UNAUTHENTICATED` while the service stays up and public queries keep working.

**Independent Test**: `npm run test -w @foundly/api` — the rejection-path specs pass (expired/tampered/wrong-iss/wrong-aud/missing `sub`/key-fetch failure) and a public query (`health`) still succeeds without a token; the service keeps answering after rejections (e2e).

### Tests for User Story 2 (write FIRST, expect FAIL)

- [X] T016 [P] [US2] Extend `apps/api/src/modules/auth/jwt.service.spec.ts` — rejection cases: token expired beyond the 30 s leeway, tampered signature, wrong `iss`, wrong `aud`, missing `sub`, and a throwing JWKS provider (key-fetch failure) → each throws `UNAUTHENTICATED`
- [X] T017 [P] [US2] Extend `apps/api/src/modules/auth/jwt.guard.spec.ts` — malformed header (`Basic ...`, garbage), expired token → guard rejects; no context mutation on failure
- [X] T018 [P] [US2] Extend `apps/api/src/modules/auth/jwt.resolver.spec.ts` — e2e: expired token on `viewer` → `UNAUTHENTICATED`; JWKS provider overridden to throw → `UNAUTHENTICATED` and a subsequent public query (`health`) still returns 200 with no `errors`

### Implementation for User Story 2

- [X] T019 [US2] Harden `apps/api/src/modules/auth/jwt.service.ts` — ensure every failure path (including JWKS fetch error and missing `SUPABASE_AUTH_URL`) fails closed with `UNAUTHENTICATED` (or a clear config error) and never rejects the whole process — depends on T016
- [X] T020 [US2] Run `npm run build -w @foundly/api && npm run typecheck -w @foundly/api && npm run test -w @foundly/api` and make all green

**Checkpoint**: US1 AND US2 work independently

---

## Phase 5: User Story 3 - Keep the workspace healthy and protected modules opt-in (Priority: P3)

**Goal**: The additive identity layer leaves every existing module and password gate unchanged; all workspace gates stay green.

**Independent Test**: Root `npm run lint` plus `npm run build -w @foundly/book`, `npm run test -w @foundly/ui`, `apps/api` gates, and the 006 auth specs (`me`/`currentTenant`/`PlanGuard`) all pass — proving nothing regressed.

### Implementation for User Story 3

- [X] T021 [US3] Run full regression gates and fix any failure: root `npm run lint`, `npm run build -w @foundly/book`, `npm run test -w @foundly/ui`, and re-run `npm run build|typecheck|test -w @foundly/api` (existing 006 auth unit/e2e specs must still pass unchanged)

**Checkpoint**: All user stories independently functional; workspace green

---

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [X] T022 [P] Validate the live quickstart: run `npm run dev -w @foundly/api`, confirm `viewer` without token → `UNAUTHENTICATED` and (manually, with a real Supabase access token) `viewer` returns the identity; reconcile `specs/api/008-supabase-jwt-auth/quickstart.md` if behaviour differs; confirm a public query still works
- [X] T023 Final SDD/strict-typing review of `apps/api/src/modules/auth/jwt.types.ts`, `jwt.service.ts`, `jwt.guard.ts`, `jwt.decorators.ts`, `jwt.resolver.ts`, `jwt.*.spec.ts`, `apps/api/src/graphql/context.ts`, `apps/api/src/modules/auth/auth.module.ts`: no `any`, 006 decorators untouched, no `packages/*` changes, single prisma instance, `jose` pinned, no committed secrets
- [X] T024 Run the verification matrix in `specs/api/008-supabase-jwt-auth/quickstart.md` and confirm `contracts/graphql-auth.contract.md` matches the shipped claims and error codes (update docs on drift)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational completion
  - Doable sequentially in priority order (P1 → P2 → P3), or in parallel when staffed
- **Polish (Final Phase)**: Depends on all desired user stories

### User Story Dependencies

- **User Story 1 (P1)**: Start after Foundational — independent of US2
- **User Story 2 (P2)**: Start after Foundational — extends US1 specs/files but is independently testable
- **User Story 3 (P3)**: After US1/US2 — workspace-wide regression verification

### Within Each User Story

- Tests (where included) MUST be written and FAIL before implementation
- Types/service before guard before resolver (US1)
- Rejection paths before hardening (US2)
- Core implementation before gate verification
- Story complete before moving to next priority

### Parallel Opportunities

- Setup: T001, T002 independent files → parallel
- Foundational: T003, T004, T006 independent → parallel; T005 needs T003/T004; T007 needs T005
- US1: T008, T009, T010 (three spec files) → parallel; implementation T011, T012, T013 → parallel; T015 waits for all
- US2: T016, T017, T018 (separate spec files) → parallel; T019 waits for T016
- US3 + Polish: T022, T023 independent → parallel

---

## Parallel Example: User Story 1

```bash
# Launch the three US1 spec files together (independent files, all fail first):
Task: "Create apps/api/src/modules/auth/jwt.service.spec.ts (valid round-trip, local JWKS)"
Task: "Create apps/api/src/modules/auth/jwt.guard.spec.ts (attach ctx.user / reject)"
Task: "Create apps/api/src/modules/auth/jwt.resolver.spec.ts (e2e viewer, valid + no token)"

# Launch the three US1 implementation files together (independent files):
Task: "Create apps/api/src/modules/auth/jwt.guard.ts"
Task: "Create apps/api/src/modules/auth/jwt.decorators.ts"
Task: "Create apps/api/src/modules/auth/jwt.resolver.ts"
# Then (sequential): register in auth.module.ts (T014) and run gates (T015)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: `jose` + `SUPABASE_AUTH_URL`
2. Complete Phase 2: `AuthUser`, verifier, JWKS seam, `context.user`, registration
3. Complete Phase 3: US1 — `viewer` guarded end-to-end with offline specs
4. **STOP and VALIDATE**: `npm run test -w @foundly/api` — US1 specs green; manual `viewer` walkthrough
5. Deploy/demo the identity layer if ready (MVP)

### Incremental Delivery

1. Setup + Foundational → foundation ready (verifier + context.user)
2. US1 → verify identity on protected ops → Deploy/Demo (MVP)
3. US2 → graceful fail-closed + public surface verified → Deploy/Demo
4. US3 → full-workspace regression green → Deploy/Demo
5. Each story adds value without breaking previous ones

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (verifier + guard + viewer)
   - Developer B: User Story 2 (rejection paths) — extends A's specs, coordinates on `jwt.service.ts`
   - Developer C: runs US3 regression after both land
3. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to a user story for traceability
- Specs never touch the network or a live DB (ephemeral RSA + local JWKS, research.md Decision 5)
- No `schema.prisma`/storage change; `packages/*` untouched; 006 decorators/guards untouched
- Commit after each task or logical group; keep `apps/api/src/schema.gql` out of git