# Tasks: Centralized API Error Handling & Session Expiry

**Input**: Design documents from `/specs/book/012-centralized-api-errors/`

**Prerequisites**: plan.md, spec.md

**Gates**: `typecheck`, `lint`, `test`, `build` for `@foundly/book` — zero regressions.

**Organization**: classification first (pure), then the session-aware transport + global handler, then the UI surfaces, then login consistency.

## Phase 1: Error classification & localization (foundational)

- [x] T001 Create `apps/book/src/shared/api/error-surface.ts`: `ErrorSurface` (`session | transient | inline`), `errorSurface(code)`, `errorMessage(code)` (localized, never the provider text).
- [x] T002 `apps/book/src/shared/api/client.ts`: `mapActionError` maps the code to a localized message instead of propagating `first.message`.
- [x] T003 Unit tests for the classifier (`shared/api/tests/error-surface.test.ts`): session/transient/inline mapping + no raw provider text.

## Phase 2: Session-aware transport & global handler

- [x] T004 `apps/book/src/shared/auth/authConstants.ts`: add `SESSION_EXPIRED_ROUTE` and the login reason flag.
- [x] T005 Create `apps/book/src/shared/api/admin-request.ts`: `apiRequestAdmin` injects the bearer token; `null` token or an API session error redirects to the session-expiry route.
- [x] T006 Create `apps/book/src/app/auth/session-expired/route.ts`: clears the Supabase session cookies and redirects to `/login?reason=session-expired` (avoids the guard redirect loop).
- [x] T007 Unit tests for the transport (`shared/api/tests/admin-request.test.ts`): token injection, missing token, session error redirect, transient passthrough.

## Phase 3: Modules use the session-aware transport

- [x] T008 `modules/services/actions.ts`: `listServices` via `apiRequestAdmin`.
- [x] T009 `modules/staff/actions.ts`: list + create/update/activate/remove via `apiRequestAdmin`.
- [x] T010 `modules/agenda/actions.ts`: the create flow's service lookup via `apiRequestAdmin`.

## Phase 4: Clean UI surfaces (no raw inline text)

- [x] T011 Create `shared/components/ApiErrorDialog.tsx` (dismissible modal alert).
- [x] T012 Replace inline error copy with `ApiErrorDialog` in `ServiceCatalog`, `StaffManager`, `Agenda`, `AvailabilityEditor`, `ProfileEditor`.
- [x] T013 Keep validation feedback inline (fields) and preserve precise, localized messages.

## Phase 5: Login ↔ API consistency

- [x] T014 Add `modules/auth/auth.graphql` (`Viewer`) and regenerate the client (`ViewerDocument`).
- [x] T015 `modules/auth/actions.ts` `signIn`: after the provider sign-in, verify the backend accepts the token; on rejection/unreachable, sign out and fail with a clear message.
- [x] T016 `LoginForm`/`LoginView`/`login/page.tsx`: show the session-expired notice when redirected by the global handler.
- [x] T017 `public-booking/actions.ts`: precise localized `CONFLICT` message (slot taken) instead of the provider's raw text.

## Phase 6: Verification

- [x] T018 Update affected tests (auth actions, LoginForm, ProfileEditor error) to the new contract.
- [x] T019 Gates: `test` (141 passed), `typecheck` (book + api), `lint`, `next build` (includes `/auth/session-expired`) — green.

---

## Dependencies

- T001 → T002/T005/T007.
- T004 → T005/T006.
- T005 → Phase 3.
- T011 → T012.
- T014 → T015.
