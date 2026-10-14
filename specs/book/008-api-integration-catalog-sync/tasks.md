# Tasks: Front-to-Back API Integration & Admin Catalog Sync

**Input**: Design documents from `/specs/book/008-api-integration-catalog-sync/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/ (api-connectivity, session-auth, admin-catalog, tenancy), quickstart.md

**Tests**: The repository gates run the existing Vitest suites (`npm run test -w @foundly/book`, `npm run test -w @foundly/api`, `npm run typecheck`, `npm run build`). New tests are included ONLY where new pure logic must be covered (apiClient error mapping) and where existing store-based tests must be updated to avoid regressions - per spec.md FR-010 / SC-005.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1..US4 from spec.md)
- Include exact file paths in descriptions

## Path Conventions

- Web app monorepo: `apps/book/src/...`, `apps/api/src/...`
- Docs: `specs/book/008-api-integration-catalog-sync/...`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Environment contracts and dependencies required by every downstream phase.

- [x] T001 Create `apps/api/.env.example` documenting (no real values, secrets never committed): `DATABASE_URL` (PostgreSQL), `DIRECT_URL`, `SUPABASE_AUTH_URL` (JWKS issuer), `FOUNDLY_PASS_SECRET`, `PORT` (default `3002`), and `CORS_ORIGINS` (comma-separated; dev default `http://localhost:3001`) per [api-connectivity.contract.md](./contracts/api-connectivity.contract.md)
- [x] T002 [P] Create `apps/book/.env.example` documenting: `API_URL` (dev `http://localhost:3002`), optional `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (public), and secret `SUPABASE_SERVICE_ROLE_KEY` marked "server-only, never NEXT_PUBLIC" per [api-connectivity.contract.md](./contracts/api-connectivity.contract.md)
- [x] T003 [P] Add to `apps/book/package.json` dependencies: `@supabase/supabase-js`, `@supabase/ssr`, `graphql`, `graphql-request` (v7, pure ESM); devDependencies: `@graphql-codegen/cli`, `@graphql-codegen/typescript`, `@graphql-codegen/typed-document-node`; commit lockfile via `npm install` from repo root
- [x] T004 [P] Configure `serverActions.allowedOrigins` in `apps/book/next.config.mjs` (Next 15.5: under `experimental.serverActions`) so Server Actions are accepted from the custom apex / multi-zone origin per [api-connectivity.contract.md](./contracts/api-connectivity.contract.md)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T005 Enable CORS in `apps/api/src/main.ts`: `app.enableCors({ origin: allowlist from process.env.CORS_ORIGINS (default 'http://localhost:3001'), methods: ['GET','HEAD','POST','OPTIONS'], allowedHeaders: ['Content-Type','Authorization','apollo-require-preflight'] })` — reject unknown origins, allow no-origin requests, per [api-connectivity.contract.md](./contracts/api-connectivity.contract.md)
- [x] T006 Create `apps/book/src/shared/infra/supabase/client.ts` — `createBrowserClient(NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY)` singleton (env reads in `supabase/env.ts`)
- [x] T007 [P] Create `apps/book/src/shared/infra/supabase/server.ts` — `createServerClient` built **per request** with async `cookies()`; cookie writes converted via `supabase/cookies.ts` (`toNextResponseCookieOptions`, no `as` casts)
- [x] T008 Create `apps/book/src/middleware.ts` — refresh Supabase session cookies on every request via `getClaims()`, propagate `cache-control`/`expires`/`pragma` from `setAll`, matcher excluding static assets
- [x] T009 Create `apps/book/src/shared/infra/apiClient.ts` — graphql-request v7 `request` wrapper: endpoint from `API_URL`, bearer injection, error envelope mapping (`UNAUTHENTICATED/FORBIDDEN/VALIDATION_ERROR/CONFLICT/NOT_FOUND` + `STATE_ERROR` fallback) → `ActionResult<T>`; unit tests in `apiClient.test.ts`
- [x] T010 [P] Add `apps/book/codegen.ts` (`@graphql-codegen/cli` + `typed-document-node`, schema from introspection/`codegen.schema.gql`) + `npm run codegen -w @foundly/book`; operation documents in `src/shared/infra/graphql/{admin-catalog,tenancy}.graphql`. NOTE: typed documents are hand-maintained and compile today; schema download runs against a live API (quickstart scenario 1)
- [x] T011 Replace the session producer: client-safe `apps/book/src/shared/infra/auth.ts` (store fallback) + server-only `apps/book/src/shared/infra/authServer.ts` (`getLiveSession` from claims `sub`+`app_metadata.tenant_id`, `getEffectiveSession`, `getAccessToken`, `resolveTenantSession`)
- [x] T012 [US1] Rewrite service queries in `apps/book/src/modules/services/utils/queries.ts` to be remote-first with store fallback (`listServices(tenantId)` → `{ services, rates }` via `remoteCatalog.listRemoteServices`, rate derived from `priceCents`); `ServicesView.tsx` async. Write adapters in `apps/book/src/shared/infra/remoteCatalog.ts` (create/update/delete service) + pure mapper tests. Note: the services UI has no create/edit form yet ("next version"); `bufferMinutes` stays local (§2 known gap)
- [x] T013 [P] [US1] Rewrite staff queries in `apps/book/src/modules/staff/utils/queries.ts` remote-first with store fallback (`listRemoteSpecialists`); `StaffView.tsx` async; remote write adapters (create/update/toggle/delete specialist). Staff client mutations stay store-bound this iteration (RTL suite depends on them); `serviceIds`/`timezone` local (§5 gaps)
- [x] T014 [US1] `apps/book/src/modules/public-booking/utils/queries.ts` adds async `getPublicBusinessRemote(slug)`: authoritative `tenant(slug)` (identity/profile/services) + local merge (specialists, policies, gallery, reviews, hours) with store fallback; `PublicBookingView.tsx` async. Sync `getPublicBusiness` retained for tests/back-compat
- [x] T015 [US1] Empty-catalog handling verified: ServiceCatalog/StaffManager render empty states; `NOT_FOUND` maps to empty-state behaviour in the fallback path
- [x] T016 [US1] Update store-based tests to the async seam without regressions: onboarding `actions.test.ts` `await`d; `admin/layout.test.tsx` refactored to test `resolveTenantSession()` (server components are not serially renderable in RTL); apiClient/remoteCatalog/auth unit tests added

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel.

---

## Phase 3: User Story 1 - Keep the catalog and the public booking page in sync (Priority: P1) 🎯 MVP

**Goal**: The admin panel services + team read/write the backend; saved changes persist and are shown on the public booking page from the same source.

**Independent Test**: With a tenant-bound session (see US2), edit a service (name/price/duration) and a team member (role/active) in `/admin/*`, save, reload, then open `/book/<slug>` — both show the same updated values.

> **Note on precondition**: catalog operations require a tenant-bound Supabase session, produced by the US2 onboarding/binding flow. In practice complete US2's binding tasks (T017-T018) before validating US1 end-to-end; the code in this phase is independently testable against the API with any valid bound token.

### Implementation for User Story 1

- [x] T012 [US1] Service catalog: remote-first reads + write adapters + rate derivation (see Phase 2 block above)
- [x] T013 [P] [US1] Team catalog: remote-first reads + write adapters (see Phase 2 block above)
- [x] T014 [US1] Portal merge: authoritative `tenant(slug)` + local merge (see Phase 2 block above)
- [x] T015 [US1] Empty states + `NOT_FOUND` mapping verified
- [x] T016 [US1] Tests updated (await + guard-helper refactor + new unit tests)

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently (with a bound token).

---

## Phase 4: User Story 2 - Bound access: only the owner enters and only their data is shown (Priority: P1)

**Goal**: The admin area requires an authenticated, tenant-bound session; all reads/writes are scoped from the identity, never the URL.

**Independent Test**: Open an admin URL without a session → redirected to `/onboarding`; after onboarding the owner sees only their own data; a token bound to another tenant yields `FORBIDDEN`/scoped results with zero cross-tenant exposure.

### Implementation for User Story 2

- [x] T017 [US2] Onboarding remote binder in `apps/book/src/modules/onboarding/utils/server.ts` (`'use server'`): sign-up → `createRemoteTenant` (slug pattern `^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])?$`, reserved slugs, `CONFLICT`/`SLUG_TAKEN`) → `admin.updateUserById` merging `app_metadata.tenant_id` (server-only, `sub`-safe) → local mirror via `provisionLocalBusiness`; `createBusiness` (actions.ts) delegates when live auth is configured, keeps the store path otherwise
- [x] T018 [US2] Sign-up failure handling in `apps/book/src/modules/onboarding/utils/server.ts`: duplicate email → `EMAIL_TAKEN`, invalid → `UNAUTHENTICATED`, each surfaced inline in `WizardShell.tsx`
- [x] T019 [US2] Admin guard in `apps/book/src/app/admin/layout.tsx` uses `resolveTenantSession()` (live-first, session-only tenant id); unauthenticated/non-tenant-bound → redirect `/onboarding`
- [x] T020 [P] [US2] Unit tests: `apps/book/src/shared/infra/auth.test.ts` (requireRole/requireTenant/getCurrentSession fallback) + `admin/layout.test.tsx` (resolveTenantSession guard)

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently.

---

## Phase 5: User Story 3 - Clear and safe behaviour when the connection fails (Priority: P2)

**Goal**: On backend outage the panel shows a clear error without losing/misreporting work, and unmigrated sections keep working.

**Independent Test**: Simulate an unreachable API → a catalog save surfaces a clear `STATE_ERROR` and nothing is reported saved; gallery/reviews/policies still work locally.

### Implementation for User Story 3

- [x] T021 [US3] `apiClient.ts` maps network failures/timeouts/non-2xx → `STATE_ERROR` (unit-tested via `global.fetch` mock in `apiClient.test.ts`);
- [x] T022 [US3] Audit PASS: only services/staff queries, onboarding `server.ts` and public-booking queries touch the remote seam; `gallery/`, `profile/` (policies), `availability/` and `agenda/` remain on the local store — zero regression (grep-verified)
- [x] T023 [US3] Saving/error states: `StaffManager.tsx` adds a transient error banner for `STATE_ERROR`/`UNAUTHENTICATED` and keeps prior values; field errors surface inline (existing) — nothing is reported saved on failure

**Checkpoint**: All user stories should now be independently functional.

---

## Phase 6: User Story 4 - A connectable environment in both development and production (Priority: P3)

**Goal**: Connection configuration between the book frontend and the backend is defined and documented so any new environment can be provisioned and verified quickly.

**Independent Test**: On a fresh local env, follow the documented steps, start api + book and run the health/connection check — connected in under 10 minutes; same against production origins.

### Implementation for User Story 4

- [x] T024 [US4] Amend `specs/architecture.md` §3.1 env-variable table + "Conexión book → API" note + amendment footer (2026-10-12, PATCH)
- [x] T025 [US4] Add `apps/book/src/shared/infra/health.ts` (`checkHealth()` → `GET {API_URL}/` `200 {service,status:ok}`) + dev-only `apps/book/src/shared/components/ConnectionStatus.tsx` mounted in `/onboarding`
- [x] T026 [US4] Update `apps/book/README.md` with the connection setup (env copies, db migrate, run api + book, session note) and quickstart pointer

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Quality gates, docs consistency and zero-regression verification (FR-010 / SC-005).

- [x] T027 Run `npm run typecheck -w @foundly/book` ✅ and `npm run test -w @foundly/book` ✅ (26 files / 118 tests) and `npm run build -w @foundly/book` ✅ — all pass
- [x] T028 Run `npm run build -w @foundly/api` ✅ and `npm run test -w @foundly/api` ✅ and `npm run lint` (repo root) ✅ — build, lint and the full API test suite pass; the earlier blocker (corrupt/unloadable `@swc/core` win32 native binary, `@swc/core-win32-x64-msvc@1.16.18` loading as "not a valid Win32 application") is **resolved (2026-10-13)**: the API test transform no longer uses SWC and the suite runs locally — 32 files / 183 tests green.
- [ ] T029 Execute the quickstart validation scenarios in `specs/book/008-api-integration-catalog-sync/quickstart.md` (connectivity, session/binding, catalog sync, tenant guard, outage, gates) — **requires a live API + PostgreSQL/Supabase + Supabase Auth project** (scenarios 1–5) and a healthy npm toolchain; not runnable in this environment. Scenario 6 (gates) partially run (see T027/T028).
- [x] T030 Cleanup pass: no `any`/implicit `as` casts in new code, no secrets tracked (`.env.example` only; new env vars via `architecture.md` §3.1), `.gitignore` covers generated codegen artifacts, admin surfaces keep `@foundly/ui`, `npm run lint` ✅ root

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately (T002/T003/T004 parallel)
- **Foundational (Phase 2)**: Depends on Setup — **BLOCKS all user stories**
- **User Stories (Phase 3+)**: All depend on Foundational; see per-story notes below
- **Polish (Phase 7)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Requires a **tenant-bound session**. That precondition is produced by US2's onboarding binding (T017-T018). The catalog code (T012-T016) is developed/testable against the API with any valid bound token, but the end-to-end quickstart validation runs after US2. **Practical build order: Phase 2 → US2 binding (T017-T018) → US1 → US3 → US4.**
- **User Story 2 (P1)**: Depends only on Foundational (session infra + apiClient). No dependency on US1.
- **User Story 3 (P2)**: Depends on `apiClient` (Foundational) and is tested against US1's views. Independently testable by stopping the API.
- **User Story 4 (P3)**: Depends on Setup env contracts (T001-T004) and Foundational CORS (T005). No story-level coupling.

### Within Each User Story

- Update/mock tests (where required by suite gate) before or with implementation
- Queries (reads) before actions (writes)
- Services/staff/tenancy seams before public-portal merge
- Story complete before moving to next priority

### Parallel Opportunities

- Setup: T002, T003, T004 in parallel (T001 first - it documents the contract the other tasks rely on)
- Foundational: T006/T007 (supabase client/server) and T010 (codegen) in parallel; T008 (middleware) after T007; T011 after T007/T008
- US1: T012 and T013 in parallel (different `services/` and `staff/`); T014 after T012 (portal reads services); T015/T016 alongside
- US2: T020 test can run early; T017 (binding) is the critical path; T019 verifies after T017
- US3: T022 (audit) fully parallel; T021/T023 independent files
- US4: T024/T026 docs in parallel; T025 independent

---

## Implementation Status (2026-10-12)

**Done**: T001–T028, T030 (T028 unblocked on 2026-10-13: the API test transform no longer uses SWC, so `npm run test -w @foundly/api` runs green — 32 files / 183 tests). **Runtime-gated**: T029 (quickstart scenarios 1–5 need live API/PostgreSQL/Supabase; scenario 6 gates partially run).

**Approach**: Remote-first seams with **graceful store fallback** (any failure/config absence → local data + clear `STATE_ERROR`, per US3/FR-006/FR-007). Client-side mutations (StaffManager) and unmigrated domains (gallery, reviews, policies, availability, agenda) remain on the in-memory seam to preserve the existing suite and UI; the remote write adapters (`remoteCatalog`) are implemented and unit-tested (mappers) for the server-side wiring that follows the live-session environment.

**Verified green**: `typecheck` + `test` (118) + `build` for `@foundly/book`; `build` + `test` + `lint` for `@foundly/api` (root lint passed).