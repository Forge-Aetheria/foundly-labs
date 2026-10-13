# Tasks: Remove Local Store & Go Server/DB-Only

**Input**: Design documents from `/specs/book/010-remove-local-store/`

**Prerequisites**: plan.md, spec.md, checklists/requirements.md

**Tests**: Update the store-dependent suites (they mock the API instead). Gates: `typecheck`, `test`, `build`, `lint` for `@foundly/book`.

**Organization**: Bottom-up so the build stays green until `store.ts` is deleted last.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: parallelizable (different files, no dependencies)
- **[Story]**: US1..US5 from spec.md

---

## Phase 1: Transport (Foundational)

- [ ] T001 [P] Add `apps/book/src/shared/infra/remoteAvailability.ts`: `listRemoteAvailability({tenantId?, tenantSlug?, specialistId?})`, `createRemoteAvailability`, `updateRemoteAvailability`, `removeRemoteAvailability` (public query + mutations per `availability.resolver.ts`)
- [ ] T002 [P] Add `apps/book/src/shared/infra/remoteAppointments.ts`: `listRemoteAppointments(filter)` (`appointments(...)`), `createRemoteAppointment`, `updateRemoteAppointmentStatus`, `cancelRemoteAppointment` (`appointments.resolver.ts`)
- [ ] T003 Extend `apps/book/src/shared/infra/remoteTenancy.ts`: `fetchTenantById(id)` (via `tenants`), keep `fetchTenantBySlug`/`createRemoteTenant`

## Phase 2: Auth/session server-only (US1/US3)

- [x] T004 `authServer.getEffectiveSession` = live claims only (remove local fallback); keep `getAccessToken`, `resolveTenantSession`
- [x] T005 `auth.ts`: remove `getCurrentSession` and the `store` import (keep `requireRole`/`requireTenant`)
- [x] T006 `sessionActions.ts` (`signIn`/`signOut`) live-only (remove local branch + store); `securityActions.ts` (`changePassword`) live-only
- [x] T007 Delete `shared/infra/session.ts` (local cookie seam) and `modules/onboarding/utils/provisionLocal.ts`; remove the local mirror call in `onboarding/utils/server.ts`
- [x] T008 `onboarding/utils/actions.ts`: server-only (`'use server'`); `createBusiness` → `provisionOnboardingRemote` only; remove `createBusinessLocal`; `validateSlug` server-side (no store)

## Phase 3: Backend-supported modules (US2/US4)

- [x] T009 `services/utils/queries.ts`: remote-only (no store); errors surface
- [x] T010 `staff/utils/{queries,actions}.ts`: remote-only reads; `'use server'` actions via `remoteCatalog`
- [x] T011 `availability/utils/{queries,actions}.ts`: rules via `remoteAvailability`; time blocks → empty (no backend)
- [x] T012 `agenda/utils/{queries,actions}.ts` + `AgendaView.tsx`: appointments via `remoteAppointments`; resources via `remoteCatalog` specialists
- [x] T013 `shared/tenancy/queries.ts` + `shared/utils/tenant-scope.ts`: tenant resolved from the API/session; no store

## Phase 4: No-backend sections → clean empty state (US5)

- [x] T014 `gallery/utils/{queries,actions}.ts`: empty reads; actions not available (no mocks); views show empty state
- [x] T015 `profile/utils/{queries,actions}.ts`: profile read via API where possible; policies empty (no backend); no mocks

## Phase 5: Public portal (US4)

- [x] T016 `public-booking/utils/{queries,actions}.ts`: business/services/specialists/availability from the API; gallery/policies/reviews empty; booking → `createRemoteAppointment`

## Phase 6: Remove the store & tests (US1)

- [x] T017 Delete `apps/book/src/shared/infra/store.ts` once no imports remain (grep-verified)
- [x] T018 Update the store-dependent tests to mock the API (auth, security, sessionActions, admin layout, onboarding, gallery, profile, staff, agenda, availability, public-booking)
- [x] T019 Gates: `typecheck`, `test`, `build`, `lint` — zero regressions

---

## Dependencies

- Phase 1 → Phase 2/3/4/5 → Phase 6 (delete store last).
- T001/T002/T003 parallel.
- US5 (empty states) independent of the API transports.
