# Tasks: Mobile Services Module

**Input**: `specs/mobile/003-services-module/`
**Status**: Implemented (retrospective task list)

## Phase 1: Setup

- [X] T001 Confirm `apps/api` exposes `myServices`, `createMyService`, `updateMyService`, `deleteMyService`.
- [X] T002 Confirm `packages/database` models `Service` with pricing, duration, active and advance fields.
- [X] T003 Create `apps/mobile/src/modules/services/services.graphql` with the four operations.

## Phase 2: Foundational

- [X] T004 Create `apps/mobile/src/modules/services/services.ts` with fetch/create/update/delete using generated documents.
- [X] T005 Create `apps/mobile/src/modules/services/hooks.ts` with `useServices`, `useCreateService`, `useUpdateService`, `useDeleteService`.
- [X] T006 Create `apps/mobile/src/modules/services/service-form.ts` with draft mapping, validation, cents conversion, price and advance formatting.
- [X] T007 Add unit tests in `apps/mobile/src/modules/services/__tests__/service-form.test.ts`.

## Phase 3: User Story 1 — Catalog list (P1)

- [X] T008 Create `ServicesView` with search, loading, empty, error, refresh and overlay states.
- [X] T009 Render service cards with duration, price, advance and active status.
- [X] T010 Connect `apps/mobile/app/(drawer)/servicios.tsx` to `ServicesView`.

## Phase 4: User Story 2 — Create service (P2)

- [X] T011 Create `ServiceFormModal` with name, category, description, duration, price and active fields.
- [X] T012 Add advance rule controls (fixed/percent/value) with validation.
- [X] T013 Wire create mutation, pending state and success close behavior.

## Phase 5: User Story 3 — Edit and delete (P3)

- [X] T014 Wire edit mode with draft initialization and update mutation.
- [X] T015 Add delete confirmation and mutation with pending state.
- [X] T016 Invalidate the services query after every mutation.

## Phase 6: Polish

- [X] T017 Run `typecheck`, `lint`, `test` and `expo export`.
- [X] T018 Verify no placeholder remains in `/servicios`.
