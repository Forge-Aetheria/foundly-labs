---
description: 'Task list for the Foundly Book admin panel feature'
---

# Tasks: Foundly Book — Admin Panel (Appointments, Services & Availability)

**Input**: Design documents from `specs/book/001-book-admin-panel/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: INCLUDED — the spec requires accessibility checks (SC-006) and the quickstart defines a Vitest/RTL suite.

**Organization**: Tasks are grouped by user story (US1–US4) to enable independent implementation and testing.

**Persistence**: **Not defined.** The panel uses an in-memory store seam with TypeScript interfaces; no storage technology may be introduced until ratified in `specs/architecture.md`.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1–US4)
- Include exact file paths in descriptions

## Path Conventions

Single location: `apps/book/`.

---

## Phase 1: Setup

**Purpose**: Scaffold the `apps/book` Next.js app.

- [x] T001 Create `apps/book/package.json` (name `@foundly/book`, deps `@foundly/ui`, Next, React 19, Zod; scripts dev/build/start/typecheck/test/lint).
- [x] T002 Create `apps/book/tsconfig.json` and `apps/book/next.config.mjs` with `transpilePackages: ['@foundly/ui']`.
- [x] T003 [P] Configure Vitest for `apps/book` in `apps/book/vitest.config.ts` and `apps/book/vitest.setup.ts`.
- [x] T004 Create the app root layout `apps/book/src/app/layout.tsx` (`AppRouterCacheProvider` + `FoundlyThemeProvider`).
- [x] T005 Create the admin shell `apps/book/src/app/(admin)/layout.tsx` (persistent sidebar + auth guard) and redirect `apps/book/src/app/page.tsx` → `/agenda`.
- [x] T006 Run `npm install` at the repository root to wire the workspace.

---

## Phase 2: Foundational

**Purpose**: Domain types, in-memory store, validation and the pure availability engine.

- [x] T007 Define domain interfaces in `apps/book/src/domain/appointments/types.ts` (`Resource`, `Service`, `Rate`, `AvailabilityRule`, `TimeBlock`, `Appointment`, `AppointmentAuditEntry`, `AppointmentStatus`).
- [x] T008 Implement the in-memory store seam in `apps/book/src/server/store.ts` (seeded mock collections + `getStore`/`resetStore`).
- [x] T009 [P] Create Zod input schemas in `apps/book/src/features/appointments/schemas.ts` (quote constraints: `durationMinutes > 0`, `bufferMinutes >= 0`, `endAt > startAt`).
- [x] T010 [P] Define availability engine types in `apps/book/src/domain/availability/types.ts` per `contracts/availability.contract.md`.
- [x] T011 Implement `computeAvailability` in `apps/book/src/domain/availability/computeAvailability.ts` (pure; working hours, granularity, breaks/blocks, active appointments, service fit, lead time, horizon, timezone/DST).
- [x] T012 [P] Write availability engine tests in `apps/book/src/domain/availability/computeAvailability.test.ts`.
- [x] T013 [P] Implement `apps/book/src/server/result.ts` (`ActionResult`, error codes) and `apps/book/src/server/auth.ts` (`requireRole`).

**Checkpoint**: Foundation ready.

---

## Phase 3: User Story 1 - Manage the appointment schedule (Priority: P1) 🎯 MVP

**Goal**: Create, reschedule, cancel and advance appointments without double-booking.

- [x] T014 [P] [US1] Lifecycle tests in `apps/book/src/features/appointments/lifecycle.test.ts` (data-model §7 transitions; atomic terminal states; cancel requires a reason).
- [x] T015 [P] [US1] Action tests in `apps/book/src/features/appointments/actions.test.ts` (overlap → `CONFLICT`; snapshot unchanged after catalog change; reschedule frees the old slot).
- [x] T016 [US1] Implement `listAgenda` in `apps/book/src/features/appointments/queries.ts` (date range + resource filter).
- [x] T017 [US1] Implement `createAppointment` / `rescheduleAppointment` / `cancelAppointment` / `changeAppointmentStatus` in `apps/book/src/features/appointments/actions.ts` (re-check conflicts, snapshot, audit).
- [x] T018 [US1] Implement the `Agenda` view (`Card` + `DataTable` + `Badge`) in `apps/book/src/features/appointments/components/Agenda.tsx` using `@foundly/ui` only.
- [x] T019 [P] [US1] Agenda component test `apps/book/src/features/appointments/components/Agenda.test.tsx` (renders appointments; `vitest-axe` clean).
- [x] T020 [US1] Build the Agenda page `apps/book/src/app/(admin)/agenda/page.tsx`.

**Checkpoint**: US1 functional and independently testable (MVP).

---

## Phase 4: User Story 2 - Manage the services and pricing catalog (Priority: P2)

**Goal**: Catalog of services and rates.

- [x] T021 [P] [US2] Implement the `ServiceCatalog` view (`Card` + `DataTable` + `Badge`) in `apps/book/src/features/services/components/ServiceCatalog.tsx`.
- [x] T022 [P] [US2] Catalog component test `apps/book/src/features/services/components/ServiceCatalog.test.tsx`.
- [x] T023 [US2] Build the Services page `apps/book/src/app/(admin)/services/page.tsx`.
- [ ] T024 [US2] Implement `createService` / `updateService` in `apps/book/src/features/services/actions.ts` (validate `durationMinutes > 0`, `bufferMinutes >= 0`).
- [ ] T025 [US2] Implement `setServiceActive` (deactivation must not alter existing appointments).
- [ ] T026 [US2] Implement `setRate` (reject overlapping periods for the same service).

**Checkpoint**: Catalog view functional; mutations pending.

---

## Phase 5: User Story 3 - Configure availability and time blocking (Priority: P3)

**Goal**: Working hours, breaks and blocks that drive bookable slots.

- [x] T027 [P] [US3] Implement the `AvailabilityEditor` view (`Card` + `DataTable` + `Chip`) in `apps/book/src/features/availability/components/AvailabilityEditor.tsx`.
- [x] T028 [P] [US3] Availability component test `apps/book/src/features/availability/components/AvailabilityEditor.test.tsx`.
- [x] T029 [US3] Implement `listAvailabilityRules` / `listTimeBlocks` in `apps/book/src/features/appointments/queries.ts`.
- [x] T030 [US3] Build the Availability page `apps/book/src/app/(admin)/availability/page.tsx`.
- [ ] T031 [US3] Implement `upsertAvailabilityRule` / `deleteAvailabilityRule` (validate `endTime > startTime`, `slotGranularityMinutes > 0`).
- [ ] T032 [US3] Implement `createTimeBlock` / `deleteTimeBlock` (surface `CONFLICT` on overlap with active appointments).
- [ ] T033 [US3] Implement `resolveBlockConflict` (`keep` | `move` | `cancel`).

**Checkpoint**: Availability view functional; mutations pending.

---

## Phase 6: User Story 4 - Consistent, accessible administration experience (Priority: P4)

**Goal**: Every screen shares the visual identity and is keyboard-accessible.

- [x] T034 [P] [US4] Accessibility tests for the agenda, services and availability views (`vitest-axe`, zero critical violations).
- [ ] T035 [P] [US4] Full keyboard traversal + focus-order audit for all three screens.
- [x] T036 [US4] Ensure the three views compose exclusively `@foundly/ui` components (no ad-hoc brand styling).

---

## Phase 7: Polish & Cross-Cutting Concerns

- [x] T037 [P] Seed mock data for the store (`apps/book/src/server/store.ts`).
- [ ] T038 [P] Document the module in `apps/book/README.md` (roles, screens, commands, persistence deferred).
- [ ] T039 [P] Add agenda pagination/windowing in `apps/book/src/features/appointments/queries.ts`.
- [x] T040 Run the `quickstart.md` validation: `npm run test -w @foundly/book`, `npm run lint`, `npm run build -w @foundly/book`.
- [ ] T041 [P] (Optional) Add a Playwright E2E spec `apps/book/e2e/agenda.spec.ts`.

---

## Phase 8: Admin navigation shell (US4 refinement)

**Goal**: Replace the flat top bar with a persistent left sidebar that carries the brand, module navigation and the active user profile.

- [x] T042 [US4] Refactor `apps/book/src/app/(admin)/components/AdminShell.tsx` into a persistent left `Drawer` (temporary on small viewports) with the brand logo header, primary/secondary navigation and the user profile footer.
- [x] T043 [US4] Add the navigation model `apps/book/src/app/(admin)/components/navigation.ts` (Agenda, Servicios, Disponibilidad + Configuración, Ayuda/Soporte, Acerca de Foundly) using `@mui/icons-material` icons.
- [x] T044 [US4] Add the Foundly Book branding assets (`apps/book/public/branding-logo.png`, `apps/book/public/icon.png`) and wire them with `next/image`.
- [x] T045 [US4] Add the placeholder pages `configuracion`, `soporte` and `acerca` using `@foundly/ui` (`Card`, `Typography`).
- [x] T046 [US4] Document the sidebar shell, iconography and branding in `spec.md`, `plan.md` and `research.md`.

---

## Phase 9: View refinements — Services catalog & Appointments agenda (US4 polish)

**Goal**: Surgically upgrade the Services catalog and the Appointments agenda views inside the existing shell, keeping the shared Clean Light UI identity. Mutations for services and appointments remain pending (T024–T026); the views expose their entry points with explicit "próximamente" feedback.

- [x] T047 [US4] Add the services-catalog header (right-aligned pill "+ Crear servicio" in primary `#6C5CE7`), a quick name-search bar over the table and a right-aligned 'Acciones' column (Editar/Eliminar pill buttons with Modal/AlertDialog feedback while the mutations are pending) to `apps/book/src/features/services/components/ServiceCatalog.tsx`; render the tariff as a `Badge` and use dense rows.
- [x] T048 [US4] Add the agenda header (pill "+ Nueva cita"), a day selector ("Hoy" + 6 days) and a status filter (Todas/Pendientes/Confirmadas/Completadas/Canceladas), token-mapped semantic status badges, an 'Acciones' column ("Detalles") and new-appointment/detail mock modals to `apps/book/src/features/appointments/components/Agenda.tsx`; enrich `apps/book/src/app/admin/agenda/page.tsx` to resolve service/resource names and client contact per appointment.
- [x] T049 [P] [US4] Extend `ServiceCatalog.test.tsx` and `Agenda.test.tsx` (search, status filters, modals, `vitest-axe`) and document the view experience in `spec.md`, `tasks.md` and `contracts/admin-views.contract.md`.

---

## Dependencies & Execution Order

- **Setup (Phase 1)** → **Foundational (Phase 2)** → user stories.
- **US1 (P1)**: after Foundational — MVP.
- **US2/US3 (P2/P3)**: after Foundational; views are independently testable, mutations pending.
- **US4 (P4)**: refines the finished views.

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phases 1–2, then Phase 3 (US1).
2. **STOP and VALIDATE**: `npm run test -w @foundly/book`.
3. Demo the working agenda.

### Incremental Delivery

1. Setup + Foundational → foundation.
2. US1 → validate → demo (MVP).
3. US2 → US3 views; then their mutations.
4. US4 → accessibility/consistency.
5. Polish → `quickstart.md` end-to-end.

## Notes

- [P] tasks touch different files and have no incomplete dependencies.
- Domain logic (`apps/book/src/domain`) stays free of React/Next/MUI/storage imports (constraint C2).
- All views use `@foundly/ui` exclusively (constraint C1).
- Persistence is **not defined** (constraint C3): only the store seam may be swapped.
- This feature lives in the `book` domain: `specs/book/001-book-admin-panel/`.
- Commit after each task or logical group.
