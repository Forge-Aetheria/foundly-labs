---
description: "Task list for the Foundly Book staff management feature"
---

# Tasks: Foundly Book — Staff Management (Equipo y Especialistas)

**Input**: Design documents from `specs/book/005-staff-management/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: INCLUDED — spec requires validation (SC-002/SC-004) and the quickstart defines Vitest/RTL suite.

**Organization**: Tasks are grouped by user story (US1–US3) to enable independent implementation and testing.

**Persistence**: Not defined. Panel uses the in-memory store seam; no storage technology may be introduced until ratified in `specs/architecture.md`.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1–US3)
- Include exact file paths in descriptions

## Path Conventions

Single location: `apps/book/` (+ `packages/ui/` for shared primitives).

---

## Phase 1: Shared primitives & data model

**Purpose**: Enablers that all user stories depend on.

- [x] T001 [P] Add `Switch` primitive to `packages/ui/src/components/Switch/` (`@foundly/ui` wrapper of MUI `Switch`; token-consistent, `checked`/`onChange(checked)` API) and export it from `packages/ui/src/components/index.ts`.
- [x] T002 [P] Add `Checkbox` primitive to `packages/ui/src/components/Checkbox/` (thin MUI wrapper with optional `label` and `checked`/`onChange(checked)`) and export it.
- [x] T003 [P] Extend `packages/ui/src/components/TextField/TextField.tsx` with `multiline`, `rows` and `maxLength` (inputProps) for the bio field.
- [x] T004 [P] Extend `Resource` in `apps/book/src/domain/appointments/types.ts` with optional `serviceIds?: string[]` and seed assignments in `apps/book/src/server/store.ts`.
- [x] T005 [P] Extend `PublicSpecialist` (`apps/book/src/features/public-booking/types.ts`) with `services?: string[]` and resolve names in `getPublicBusiness`.

**Checkpoint**: primitives + model ready; no feature behavior yet.

---

## Phase 2: US1 — View and add the roster

**Goal**: Glassmorphism card grid + add modal with validation and state sync.

- [x] T006 [US1] Extend `apps/book/src/features/storefront/schemas.ts` and `actions.ts` so `createStaff`/`updateStaff` accept and validate `serviceIds` (same tenant catalog).
- [x] T007 [US1] Rewrite `apps/book/src/features/storefront/components/StaffManager.tsx`: header "Equipo y Especialistas" + pill "+ Añadir Profesional", glass card grid (avatar/initials, name + role, service badges, status badge, per-card actions) and the create modal (nombre/cargo required, bio ≤250, avatar URL + preview, services checkboxes, active switch, "Guardar profesional"/"Cancelar").
- [x] T008 [US1] Wire `/admin/staff/page.tsx` to pass the tenant services to `StaffManager`.
- [x] T009 [P] [US1] Component tests `StaffManager.test.tsx`: render grid, add member (with services), required-field errors, zero-services warning; `vitest-axe` clean.
- [x] T010 [P] [US1] Action tests `storefront/actions.test.ts`: serviceIds assignment + public-portal reflection.

**Checkpoint**: US1 functional and independently testable.

---

## Phase 3: US2 — Edit, deactivate and remove

**Goal**: Keep the roster accurate and the public team in sync.

- [x] T011 [US2] Ensure edit modal re-opens with existing values (services pre-checked, switch state) and toggling/removal update local + store state.
- [x] T012 [US2] Update public `ProviderSections#TeamSection` to render the assigned service badges.
- [x] T013 [P] [US2] Tests for toggle (badge change + public drop) and removal (card + public roster).

**Checkpoint**: US2 functional.

---

## Phase 4: US3 — Accessibility & documents

**Goal**: Consistency, accessibility and documentation.

- [x] T014 [US3] Confirm the staff views compose `@foundly/ui` only and pass `vitest-axe` (SC-004).
- [x] T015 [US3] Add primitive tests for `Switch`/`Checkbox` in `packages/ui`.
- [x] T016 [US3] Document the surface in `contracts/admin-staff.contract.md`, this `tasks.md`, and cross-reference from `apps/book/README.md`.
- [x] T017 Run the `quickstart.md` validation: `npm run test -w @foundly/book`, `npm run build -w @foundly/book`.

---

## Notes

- Domain logic (`apps/book/src/domain`) stays free of React/Next/MUI/storage imports (C2).
- All views use `@foundly/ui` exclusively (C1); pill accent `#6C5CE7` is expressed as `primary.main`.
- Persistence not defined (C3): only the store seam may be swapped.
- Commit after each task or logical group.