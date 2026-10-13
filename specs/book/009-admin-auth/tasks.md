# Tasks: Admin Authentication, Session Protection & Account Security

**Input**: Design documents from `/specs/book/009-admin-auth/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/ (auth-session, route-guard, admin-account), quickstart.md

**Tests**: The repository gates run the existing Vitest suites (`npm run test -w @foundly/book`, `npm run typecheck -w @foundly/book`, `npm run build -w @foundly/book`, `npm run lint`). New tests are included where new pure logic must be covered (session resolution, auth guard, auth/security actions, login/password forms) and where existing tests must be updated to the new session model (no auto-session fallback) — per spec.md FR/SC-009.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1..US5 from spec.md)
- Include exact file paths in descriptions

## Path Conventions

- Web app (book): `apps/book/src/...`
- Docs: `specs/book/009-admin-auth/...`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Document the auth modes and lock the shared route/cookie constants used by every phase.

- [x] T001 [P] Document the two auth modes (live Supabase vs local seam), confirm the reused env vars (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) and note the seeded local dev owner (`ana@foundly.dev` / `mock-credential`) in `apps/book/.env.example` per [research.md](./research.md) R3
- [x] T002 [P] Add shared, **edge-safe** constants in `apps/book/src/shared/infra/authConstants.ts` (moved out of `session.ts` so the middleware can import them without pulling `next/headers`): `LOCAL_SESSION_COOKIE = 'foundly_book_session'`, `LOGIN_ROUTE = '/login'`, `POST_LOGIN_ROUTE = '/admin/agenda'`, `REGISTRATION_ROUTE = '/onboarding'` per [data-model.md](./data-model.md)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Session model, validation schemas, guard helpers and auth actions that EVERY user story depends on.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T003 Implement local session helpers in `apps/book/src/shared/infra/session.ts`: `resolveLocalSession(userId)` (pure `userId` → `store.users` → `Session | null`), `readLocalSession()` (cookie → `resolveLocalSession`), `writeLocalSession(userId)` and `clearLocalSession()`; cookie is `httpOnly`, `SameSite=Lax`, `Path=/`, `Secure` in production; only used when no live provider is configured (depends on T002) per [auth-session.contract.md](./contracts/auth-session.contract.md)
- [x] T004 [P] Create Zod schemas in `apps/book/src/shared/infra/sessionSchemas.ts`: `loginSchema` (`email` valid format, `password` non-empty) and `passwordChangeSchema` (`currentPassword` non-empty; `newPassword` ≥ 8 chars with letters and numbers; `confirmPassword` equals `newPassword`) per [data-model.md](./data-model.md)
- [x] T005 Update `apps/book/src/shared/infra/authServer.ts`: `getEffectiveSession()` = live Supabase verified claims (`getClaims()`) ?? `readLocalSession()`; **remove** the `store.sessions[0]` fallback from the guard path; keep `getLiveSession`, `getAccessToken`, `resolveTenantSession` (depends on T003)
- [x] T006 Update `apps/book/src/shared/infra/auth.ts`: document `getCurrentSession()` as the **client-store seam only** (still used by gallery/profile/staff client mutations); it no longer authenticates server requests. `requireRole` / `requireTenant` unchanged
- [x] T007 Keep the seeded `store.sessions` in `apps/book/src/shared/infra/store.ts` **only** for the client-side store seam (unmigrated domains: gallery/profile/staff). The server guard no longer consults it (T005), so it cannot authenticate a request
- [x] T008 [P] Create edge-safe guard helpers in `apps/book/src/shared/infra/authGuard.ts`: `isAdminPath(pathname)`, `isLoginPath(pathname)`, `hasLocalSessionCookie(request)` and `evaluateRedirect(pathname, authenticated)` → `/login` | `/admin/agenda` | `null`; imports only edge-safe modules (no store, no `next/headers`) per [route-guard.contract.md](./contracts/route-guard.contract.md)
- [x] T009 Implement `'use server'` auth actions in `apps/book/src/shared/infra/sessionActions.ts`: `signIn(input)` (Zod → live `signInWithPassword` / local store credential match → cookie) and `signOut()` (clear live + local session → `redirect('/login')`); both return the typed `ActionResult` (depends on T003, T004, T005) per [auth-session.contract.md](./contracts/auth-session.contract.md)
- [x] T010 Add `apps/book/src/shared/infra/sessionActions.test.ts` covering `signIn`/`signOut` in local mode (valid, invalid, malformed, sign-out redirect + cookie clear). `auth.test.ts` remains valid (the store seam is unchanged) (depends on T006, T009)

**Checkpoint**: Foundation ready — user story implementation can now begin in parallel.

---

## Phase 3: User Story 1 - Sign in and stay signed in (Priority: P1) 🎯 MVP

**Goal**: An existing owner signs in with email + password and reaches the admin panel; the session persists across reloads.

**Independent Test**: Signed out, open `/login`, submit valid credentials → admin panel loads; reload → still signed in; invalid credentials → inline error and no session.

### Implementation for User Story 1

- [x] T011 [US1] Create `apps/book/src/modules/auth/components/LoginForm.tsx` (`'use client'`): email/password `@foundly/ui` `TextField`s, submit calls the `signIn` Server Action, inline field errors, pending/disabled state, redirect on success
- [x] T012 [US1] Create `apps/book/src/modules/auth/LoginView.tsx` (server): compose the sign-in screen with `@foundly/ui` (`Container`, `Card`, `Stack`, `Typography`) + `LoginForm`; passes only serializable props (`code-rules.md` §8)
- [x] T013 [US1] Create `apps/book/src/app/login/page.tsx` (server): thin route rendering `LoginView`

### Tests for User Story 1

- [x] T014 [P] [US1] Component test `apps/book/src/modules/auth/tests/LoginForm.test.tsx`: invalid input shows inline errors; valid submit invokes `signIn` and redirects

**Checkpoint**: User Story 1 is functional and testable independently (MVP).

---

## Phase 4: User Story 2 - Protected admin and guarded auth pages (Priority: P1)

**Goal**: `/admin/*` requires a valid, business-bound session (redirect to `/login`); `/login` is hidden from signed-in users.

**Independent Test**: Signed out, open any `/admin/*` URL → redirect to `/login`; signed in, open `/login` → redirect to `/admin/agenda`; an unbound account → onboarding.

### Implementation for User Story 2

- [x] T015 [US2] Extend `apps/book/src/middleware.ts`: after the existing refresh, evaluate `authGuard.evaluateRedirect()` → `/admin/*` unauthenticated → `/login`; `/login` authenticated → `/admin/agenda`; propagate refreshed cookies (depends on T008)
- [x] T016 [US2] Update `apps/book/src/app/admin/layout.tsx`: unauthenticated → `redirect('/login')`; authenticated-but-unbound → onboarding (keep tenant resolution from the session)
- [x] T017 [US2] Update `apps/book/src/shared/tenancy/queries.ts`: `getAdminTenantId()` redirects to `/login` (unauthenticated) / onboarding (unbound) — was always `/onboarding`
- [x] T018 [US2] Add the signed-in guard to `apps/book/src/app/login/page.tsx`: if a session exists → `redirect(POST_LOGIN_ROUTE)` (depends on T013)

### Tests for User Story 2

- [x] T019 [P] [US2] Unit test `apps/book/src/shared/infra/authGuard.test.ts`: the redirect matrix (`/admin` unauth → `/login`; `/login` auth → `/admin/agenda`; public → none)
- [x] T020 [P] [US2] Update `apps/book/src/app/admin/layout.test.tsx`: unauthenticated → `UNAUTHENTICATED` (→ `/login`); local session → tenant-bound `ok`; unbound → `FORBIDDEN`

**Checkpoint**: User Stories 1 AND 2 work independently.

---

## Phase 5: User Story 3 - Sign out safely (Priority: P2)

**Goal**: An owner ends their session and is redirected to `/login`; admin routes become inaccessible.

**Independent Test**: Signed in, trigger sign-out → `/login`; `/admin/*` no longer accessible; Back button does not serve protected content.

### Implementation for User Story 3

- [x] T021 [US3] Add a sign-out affordance to `apps/book/src/shared/components/AdminShell.tsx` (`'use client'`) calling the `signOut` Server Action from `shared/infra/sessionActions.ts`; placed in the user footer

### Tests for User Story 3

- [x] T022 [US3] Test `apps/book/src/shared/components/AdminShell.test.tsx`: the sign-out control renders (depends on T021)

**Checkpoint**: User Stories 1–3 work independently.

---

## Phase 6: User Story 4 - Quick access to the public booking page (Priority: P2)

**Goal**: A prominent link in the admin shell opens the owner's public booking page built from their slug.

**Independent Test**: Signed in, the shell shows a clickable link to `/{slug}`; it opens the public booking page; hidden when no slug.

> **Note**: US3 and US4 both edit `AdminShell.tsx` and its test — run US4 after US3.

### Implementation for User Story 4

- [x] T023 [US4] Add `publicHref?: string | null` to `apps/book/src/shared/components/AdminShell.tsx` and render a prominent "Ver página pública" link (sidebar + mobile header) opening the public page in a new tab; hidden/non-actionable when `null` (depends on T021)
- [x] T024 [US4] Update `apps/book/src/app/admin/layout.tsx` to compute `publicHref = tenant.ok && tenant.data.slug ? `/${tenant.data.slug}` : null` and pass it to `AdminShell` (depends on T016)

### Tests for User Story 4

- [x] T025 [US4] Extend `apps/book/src/shared/components/AdminShell.test.tsx`: renders the public link with the correct `href`; hides it when `publicHref` is `null` (depends on T022)

**Checkpoint**: User Stories 1–4 work independently.

---

## Phase 7: User Story 5 - Change password (Priority: P3)

**Goal**: An owner updates their account password from a security/settings section; the new password authenticates and the old one does not.

**Independent Test**: In `/admin/seguridad`, wrong current password → rejected; weak/mismatched new → inline validation; valid change → sign out and in with the new password works.

### Implementation for User Story 5

- [x] T026 [US5] Implement `'use server'` `changePassword(input)` in `apps/book/src/shared/infra/securityActions.ts`: require session; Zod validate; live → re-auth `signInWithPassword` then `auth.updateUser({ password })`; local → verify + update the store credential; typed `ActionResult` per [auth-session.contract.md](./contracts/auth-session.contract.md)
- [x] T027 [US5] Create `apps/book/src/modules/security/components/PasswordForm.tsx` (`'use client'`): current/new/confirm `@foundly/ui` `TextField`s, inline errors + success confirmation, pending state, calls `changePassword`
- [x] T028 [US5] Create `apps/book/src/modules/security/SecurityView.tsx` (server): compose the security section with `@foundly/ui` + `PasswordForm`
- [x] T029 [US5] Create `apps/book/src/app/admin/seguridad/page.tsx` (server): thin route rendering `SecurityView`
- [x] T030 [US5] Add `{ href: '/admin/seguridad', label: 'Seguridad', icon: LockIcon }` to `SECONDARY_NAV` in `apps/book/src/shared/components/AdminNavigation.ts`

### Tests for User Story 5

- [x] T031 [P] [US5] Unit test `apps/book/src/shared/infra/securityActions.test.ts`: wrong current → `UNAUTHENTICATED` (unchanged); weak/mismatch → `VALIDATION_ERROR`; valid → credential updated; no session → `UNAUTHENTICATED`
- [x] T032 [P] [US5] Component test `apps/book/src/modules/security/tests/PasswordForm.test.tsx`: success confirmation + inline error

**Checkpoint**: All user stories are independently functional.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Quality gates, RSC-boundary compliance and zero-regression verification (SC-009).

- [x] T033 Run `npm run typecheck -w @foundly/book` ✅ and `npm run test -w @foundly/book` ✅ (32 files / 141 tests)
- [x] T034 Run `npm run build -w @foundly/book` ✅ (routes `/login` + `/admin/seguridad` emitted) and `npm run lint` (root) ✅
- [x] T035 [P] Audit RSC boundary compliance (`code-rules.md` §8): grep found **no** `sx`-function in `apps/book`; server views pass only serializable props; forms are `'use client'`
- [x] T036 Execute the scenarios in `specs/book/009-admin-auth/quickstart.md` against `next dev` — `/admin/*` without session → 307 `/login`; `/login` → 200; with the local session cookie → `/admin/agenda` 200 (renders the public link `href="/estudio-ana"`) and `/login` → 307 `/admin/agenda`
- [x] T037 [P] Update `apps/book/README.md` with the auth section (login/logout, guard, public link, password change, local vs live mode, dev credentials)
- [x] T038 Cleanup pass: no `any`/implicit casts in new code, no secrets tracked (`.env.example` only), `@foundly/ui` on new surfaces, no ad-hoc styling

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — T001/T002 parallel
- **Foundational (Phase 2)**: Depends on Setup — **BLOCKS all user stories**
- **User Stories (Phase 3+)**: All depend on Foundational; see per-story notes
- **Polish (Phase 8)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: After Foundational. No dependency on other stories.
- **User Story 2 (P1)**: After Foundational; its `/login` guard (T018) depends on US1's page (T013).
- **User Story 3 (P2)**: After Foundational. No dependency on other stories.
- **User Story 4 (P2)**: Edits `AdminShell.tsx` (T023) after US3 (T021), and the layout (T024) after US2 (T016).
- **User Story 5 (P3)**: After Foundational. Fully independent (new files).

### Within Each User Story

- Actions/services before the views that consume them
- Server views before thin routes
- Story complete before moving to the next priority

### Parallel Opportunities

- Setup: T001 and T002 in parallel
- Foundational: T004 and T008 in parallel; T003 → T005 → T009 on the critical path; T006/T007 alongside; T010 after T009
- US1: T014 in parallel with T011–T013
- US2: T019 and T020 in parallel; T015/T016/T017 in parallel after T008
- US5: T031 and T032 in parallel with T027–T030

---

## Parallel Example: Foundational

```bash
# Different files, no interdependencies:
Task: "Create sessionSchemas.ts (login + passwordChange) per data-model.md"
Task: "Create authGuard.ts edge-safe guard helpers per route-guard.contract.md"
```

## Parallel Example: User Story 5

```bash
Task: "Unit test securityActions.test.ts (wrong current, mismatch, success)"
Task: "Component test PasswordForm.test.tsx (validation + success)"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: sign-in + persistence work end to end
5. Deploy/demo if ready (US2, the P1 guard, should follow immediately for a safe release)

### Incremental Delivery

1. Setup + Foundational → session model ready
2. US1 → sign-in works (MVP)
3. US2 → admin protected + auth page guarded
4. US3 → safe sign-out
5. US4 → public-page quick link
6. US5 → password change

---

## Implementation Status (2026-10-12)

**Done**: T001–T038 (all tasks). Delivered on `apps/book`:

- **Session model**: `authConstants.ts` (edge-safe), `session.ts` (local cookie seam), `sessionSchemas.ts`, `authGuard.ts`, `sessionActions.ts` (`signIn`/`signOut`), `securityActions.ts` (`changePassword`). `getEffectiveSession()` = live Supabase ?? local cookie (the `store.sessions` fallback was removed from the guard path).
- **Surfaces**: `/login` (LoginView + LoginForm), `/admin/seguridad` (SecurityView + PasswordForm), admin shell public-page link + sign-out, `Seguridad` nav item.
- **Guards**: middleware redirects `/admin/*` → `/login` and `/login` → `/admin/agenda`; admin layout and `getAdminTenantId` redirect unauthenticated → `/login`, unbound → `/onboarding`.

**Deviation from plan (documented)**: T007 originally said "stop seeding `store.sessions`". During implementation it was found that `shared/utils/tenant-scope.ts` (`adminTenantId`) uses `getCurrentSession()` for the **client-side** store mutations of the unmigrated domains (gallery/profile/staff). The seed is therefore retained for that client seam only, while the server guard (T005) no longer consults it — satisfying the spec assumption without breaking those domains. T002's constants were placed in a dedicated edge-safe `authConstants.ts` so the middleware never imports `next/headers`.

**Verified green**: `typecheck` ✅ · `test` 32 files / **141 tests** ✅ · `build` ✅ · `lint` (root) ✅. Runtime (dev): `/admin/*` → 307 `/login`; `/login` → 200; with the local session cookie `/admin/agenda` → 200 with the public link, `/login` → 307 `/admin/agenda`.
