# Tasks: Module Data Layer & Client Hooks

**Input**: Design documents from `/specs/book/011-module-data-layer/`

**Prerequisites**: plan.md, spec.md

**Gates**: `typecheck`, `lint`, `test`, `build` for `@foundly/book` — zero regressions.

**Organization**: primero codegen (base de tipos), luego `shared/infra` → destino, luego módulo a módulo.

## Phase 1: Codegen (foundational)

- [x] T001 `apps/book/codegen.ts`: `schema: '../api/src/schema.gql'`; `documents: ['src/shared/api/operations/**/*.graphql']`; output `src/shared/api/generated.ts`
- [x] T002 Crear `src/shared/api/operations/*.graphql` con TODAS las operaciones (services, specialists, availability, appointments, tenancy, auth)
- [x] T003 `npm run codegen -w @foundly/book`; quitar `generated.ts` de `.gitignore` y commitearlo (typecheck sin API)
- [x] T004 `src/shared/api/client.ts`: `apiRequest` acepta `TypedDocumentNode`; mover `result.ts` → `src/shared/types/result.ts`, `health.ts` → `src/shared/api/health.ts`

## Phase 2: shared/infra → destino

- [x] T005 Mover `auth.ts`, `authServer.ts`, `authConstants.ts`, `authGuard.ts`, `supabase/*` → `src/shared/auth/`
- [x] T006 Mover `sessionActions.ts`/`sessionSchemas.ts` → `src/modules/auth/{actions.ts,utils/}`; `securityActions.ts` → `src/modules/security/actions.ts`
- [x] T007 Mover transports a los módulos dueños (services, staff, availability, agenda, onboarding/shared-tenancy)

## Phase 3: Módulos con datos (actions + hooks + UI)

- [x] T008 services: `actions.ts` (codegen) + `hooks.ts`; `ServicesView`/`ServiceCatalog` consumen
- [x] T009 staff: `actions.ts` + `hooks.ts` (`useCreateStaff`/`useUpdateStaff`/`useSetStaffActive`/`useRemoveStaff`); `StaffManager` consume hooks
- [x] T010 availability: `actions.ts` + `hooks.ts` (`useSaveAvailability`); `AvailabilityEditor` consume hook
- [x] T011 agenda: `actions.ts` + `hooks.ts` (`useCreateAppointment`/`useCancelAppointment`/`useChangeAppointmentStatus`); `Agenda` consume hooks
- [x] T012 profile: `actions.ts` (lectura API); vista read-only (sin hooks)
- [x] T013 gallery: `actions.ts`/vista de estado vacío (sin backend)
- [x] T014 public-booking: `actions.ts` + `hooks.ts` (`useFetchOfferedSlots`/`useBookAppointment`); `BookingFlow`/`SlotStep` consumen hooks
- [x] T015 onboarding: `actions.ts` + `hooks.ts` (`useCreateBusiness`/`useValidateSlug`); `WizardShell`/`BusinessStep` consumen
- [x] T016 auth/security: `hooks.ts` (`useSignIn`/`useSignOut`/`useChangePassword`); `LoginForm`/`AdminShell`/`PasswordForm` consumen

## Phase 4: Cierre

- [x] T017 Eliminar `src/shared/infra/` (grep-verificado: cero imports)
- [x] T018 Actualizar tests a mocks de `apiRequest`/hooks; `grep` de DTOs manuales = 0
- [x] T019 Gates: `typecheck`, `lint`, `test`, `build` — cero regresiones

---

## Dependencies

- Phase 1 → Phase 2/3 (los tipos generados son prerequisito).
- T007 depende de T004/T005.
- Phase 3 por módulo; T017 al final (borrar `infra` cuando no queden imports).
