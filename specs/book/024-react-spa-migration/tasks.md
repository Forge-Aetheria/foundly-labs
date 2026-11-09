---
description: 'Task list for migrating Foundly Book from Next.js to a React SPA'
---

# Tasks: Migración de Foundly Book a una SPA React

**Input**: Design documents from `/specs/book/024-react-spa-migration/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/`, `quickstart.md`

**Tests**: Incluidos porque la spec exige paridad y migración de pruebas (FR-030, FR-031) y el quickstart define escenarios de validación (V1–V6).

**Organization**: Tareas agrupadas por historia de usuario para permitir implementación y prueba independientes.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Puede ejecutarse en paralelo (archivos distintos, sin dependencias pendientes)
- **[Story]**: Historia de usuario a la que pertenece (US1…US5)
- Rutas de archivo relativas al repositorio.

## Path Conventions

- App objetivo: `apps/book/`
- Extensión backend: `apps/api/`
- Paquetes compartidos: `packages/ui/`, `packages/database/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Preparar el proyecto SPA y desbloquear la gobernanza.

- [x] T001 Ratificar enmiendas de gobernanza (BLOQUEANTE) en `specs/business-model.md`, `constitution.md`, `specs/architecture.md` y `code-rules.md`
- [x] T002 Actualizar `apps/book/package.json`: añadir `react-router-dom`, `@tanstack/react-query`, `react-helmet-async`, `vite`, `@vitejs/plugin-react`; quitar `next`, `@mui/material-nextjs`, `@supabase/ssr`; actualizar scripts `dev/build/start/test/typecheck/lint`
- [x] T003 [P] Crear `apps/book/vite.config.ts` con `@vitejs/plugin-react`, alias `@`, y `resolve.dedupe` para React/Emotion/MUI
- [x] T004 [P] Actualizar `apps/book/tsconfig.json`: quitar plugin/include de Next, conservar `strict`, `noImplicitAny`, `paths`
- [x] T005 [P] Crear `apps/book/index.html` (shell, `<div id="root">`, manifest, favicons)
- [x] T006 [P] Crear `apps/book/src/env.ts` con tipado de `import.meta.env` (`VITE_API_URL`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, timeout)
- [x] T007 [P] Crear `apps/book/public/manifest.webmanifest` y verificar iconos en `apps/book/public/`
- [x] T008 [P] Configurar Playwright en `apps/book/playwright.config.ts` y ajustar `apps/book/vitest.config.ts` para SPA
- [x] T009 [P] Crear `apps/book/src/main.tsx` (QueryClient, Auth, Theme, Helmet, Router) y `apps/book/src/App.tsx`
- [x] T010 [P] Crear esqueleto de router en `apps/book/src/router.tsx`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Infraestructura compartida que deben usar todas las historias.

**⚠️ CRITICAL**: Ninguna historia puede comenzar hasta completar esta fase (y T001).

- [x] T011 Adaptar `apps/book/src/shared/api/client.ts` a `import.meta.env.VITE_API_URL` y timeout configurable
- [x] T012 Crear `apps/book/src/shared/api/notify-unauthenticated.ts` y emitir `UNAUTHENTICATED` desde `client.ts`
- [x] T013 Crear `apps/book/src/shared/api/query-client.ts` (QueryClient, claves canónicas, `clearTenantCache`)
- [x] T014 [P] Crear `apps/book/src/providers/AppProviders.tsx` (QueryClientProvider + SessionProvider + FoundlyThemeProvider + HelmetProvider)
- [x] T015 [P] Revisar/ajustar `apps/book/src/shared/api/error-surface.ts` para códigos SPA
- [x] T016 [P] Crear `apps/book/src/shared/components/PageMeta.tsx` con `react-helmet-async`
- [x] T017 [P] Crear estados de ruta en `apps/book/src/shared/components/RouteStates.tsx` (loading, error, not-found genérico)
- [x] T018 Crear harness de tests `apps/book/src/test-utils/renderWithProviders.tsx` (QueryClient, sesión mock, tema, router)
- [x] T019 [P] Ajustar `eslint.config.js` raíz para ignorar salida `dist/` y permitir patrones Vite
- [x] T020 Actualizar `apps/book/src/shared/api/tests/client.test.ts` para `import.meta.env` y `emitUnauthenticated`

**Checkpoint**: Infraestructura lista; las historias pueden empezar.

---

## Phase 3: User Story 1 - Autenticación y sesión en la SPA (Priority: P1) 🎯 MVP base

**Goal**: Login, logout, restauración de sesión, guards y manejo global de expiración.

**Independent Test**: Recorrer V1 del `quickstart.md` (sin sesión → login → recarga → logout → expiración).

### Implementation for User Story 1

- [x] T021 [P] [US1] Crear `apps/book/src/shared/auth/supabase.ts` con `createClient` browser y `localStorage`
- [x] T022 [P] [US1] Crear `apps/book/src/shared/auth/guards.ts` reutilizando la lógica de `shared/auth/authGuard.ts` y tipos de estado
- [x] T023 [US1] Crear `apps/book/src/shared/auth/session-context.tsx` (`SessionProvider`/`useSession`, `onAuthStateChange`, `onUnauthenticated`, `clearTenantCache`)
- [x] T024 [US1] Migrar `apps/book/src/modules/auth/actions.ts` a `apps/book/src/modules/auth/services.ts` (signIn/signOut/changePassword)
- [x] T025 [US1] Reescribir `apps/book/src/modules/auth/hooks.ts` con `useSignIn`, `useSignOut`, `useChangePassword`
- [x] T026 [US1] Migrar `apps/book/src/modules/auth/components/LoginForm.tsx` y `LoginView.tsx` a `useNavigate` + hooks
- [x] T027 [P] [US1] Migrar `apps/book/src/modules/security/actions.ts` a `services.ts` y `hooks.ts`
- [x] T028 [US1] Crear guards de ruta en `apps/book/src/shared/components/guards/RequireAuth.tsx`, `RequireTenant.tsx`, `RequireAnonymous.tsx`
- [x] T029 [P] [US1] Migrar `apps/book/src/shared/tenancy/adminWorkspace.ts` (server action) a servicio cliente + `useAdminWorkspace` hook
- [x] T030 [P] [US1] Migrar `apps/book/src/shared/tenancy/queries.ts` a servicio cliente (`getCurrentTenant`, `getTenantBySlug`) + hooks
- [x] T031 [P] [US1] Reemplazar `apps/book/src/shared/utils/tenant-scope.ts` por derivación desde `useSession`
- [x] T032 [P] [US1] Migrar `apps/book/src/shared/auth/tests/*` y `apps/book/src/modules/auth/tests/*` a la nueva arquitectura
- [x] T033 [P] [US1] Migrar `apps/book/src/modules/security/tests/actions.test.ts` a `services.test.ts`
- [x] T034 [US1] Verificar V1 del quickstart: guards, recarga, multi-pestaña, logout y sesión expirada

**Checkpoint**: Autenticación SPA operativa y testeable de forma independiente.

---

## Phase 4: User Story 2 - Operación completa del panel de administración (Priority: P1)

**Goal**: Todos los módulos del panel funcionan con `services.ts` + TanStack Query.

**Independent Test**: Recorrer V2 del `quickstart.md`; cada módulo con al menos una lectura y una escritura.

### Implementation for User Story 2

- [x] T035 [P] [US2] Migrar agenda a `apps/book/src/modules/agenda/services.ts` + `hooks.ts`
- [x] T036 [P] [US2] Migrar `apps/book/src/modules/availability/actions.ts` a `services.ts` + `hooks.ts`
- [x] T037 [P] [US2] Migrar `apps/book/src/modules/services/actions.ts` a `services.ts` + `hooks.ts`
- [x] T038 [P] [US2] Migrar `apps/book/src/modules/staff/actions.ts` a `services.ts` + `hooks.ts`
- [x] T039 [P] [US2] Migrar `apps/book/src/modules/gallery/actions.ts` a `services.ts` + `hooks.ts`
- [x] T040 [P] [US2] Migrar `apps/book/src/modules/profile/actions.ts` a `services.ts` + `hooks.ts`
- [x] T041 [P] [US2] Migrar `apps/book/src/modules/configuration/actions.ts` a `services.ts` + `hooks.ts`
- [x] T042 [P] [US2] Migrar `apps/book/src/modules/reviews/actions.ts` a `services.ts` + `hooks.ts` (sustituir `revalidatePath` por invalidación)
- [x] T043 [P] [US2] Migrar `apps/book/src/modules/notifications/actions.ts` a `services.ts` + `hooks.ts`
- [x] T044 [P] [US2] Migrar `apps/book/src/modules/super-admin/actions.ts` a `services.ts` + `hooks.ts`
- [x] T045 [US2] Reemplazar `useAdminResource` en `apps/book/src/modules/agenda/AgendaView.tsx`, `availability/AvailabilityView.tsx`, `configuration/PaymentsView.tsx`, `gallery/GalleryView.tsx`, `profile/ProfileView.tsx`, `reviews/ModerationView.tsx`, `services/ServicesView.tsx`, `staff/StaffView.tsx` por `useQuery`
- [x] T046 [US2] Reemplazar `useAsyncAction` en `apps/book/src/modules/agenda/components/Agenda.tsx`, `configuration/components/PaymentsConfig.tsx`, `gallery/components/GalleryManager.tsx`, `reviews/components/ReviewModerationList.tsx`, `services/components/ServiceCatalog.tsx`, `staff/components/StaffManager.tsx` por `useMutation`
- [x] T047 [US2] Refactorizar `apps/book/src/modules/notifications/NotificationsProvider.tsx` para usar la caché de TanStack y sincronizar cabecera y página
- [x] T048 [US2] Migrar `apps/book/src/app/admin/layout.tsx` a `apps/book/src/shared/components/AdminLayout.tsx` con `useAdminWorkspace` y `useNavigate`
- [x] T049 [US2] Migrar `apps/book/src/shared/components/AdminShell.tsx` de `next/link`, `next/image` y `next/navigation` a React Router y `<img>`
- [x] T050 [P] [US2] Migrar `apps/book/src/modules/super-admin/SuperAdminView.tsx` y componentes a cliente + React Router
- [x] T051 [P] [US2] Migrar `apps/book/src/modules/support/SupportView.tsx` y `apps/book/src/modules/about/AboutView.tsx` (quitar `next/image`)
- [x] T052 [P] [US2] Migrar tests de acciones de panel a `services.test.ts` en `apps/book/src/modules/{agenda,availability,configuration,gallery,notifications,profile,reviews,services,staff,super-admin}/tests/`
- [x] T053 [P] [US2] Actualizar tests de componentes que mockean `next/navigation` a mocks de React Router en `apps/book/src/modules/**/tests/`
- [x] T054 [US2] Eliminar `apps/book/src/shared/hooks/useAdminResource.ts` y `apps/book/src/shared/hooks/useAsyncAction.ts`
- [x] T055 [US2] Verificar V2 del quickstart: mutaciones, invalidación, doble envío, errores y notificaciones

**Checkpoint**: Panel completo funcional sobre SPA.

---

## Phase 5: User Story 3 - Portal público, directorio y reserva de citas (Priority: P1)

**Goal**: Rutas públicas y flujo de reserva sin autenticación.

**Independent Test**: Recorrer V3 del `quickstart.md` (directorio → portal → reserva → comprobante → reseña).

### Implementation for User Story 3

- [x] T056 [P] [US3] Migrar `apps/book/src/modules/directory/actions.ts` a `services.ts` + `hooks.ts`
- [x] T057 [P] [US3] Migrar `apps/book/src/modules/directory/DirectoryView.tsx` y componentes (`DirectoryStates`, `BusinessCard`, `BusinessCardGrid`) a React Router
- [x] T058 [P] [US3] Migrar `apps/book/src/modules/public-booking/actions.ts` a `services.ts` + `hooks.ts`
- [x] T059 [P] [US3] Migrar `apps/book/src/modules/public-booking/PublicBookingView.tsx` a cliente + `useQuery`
- [x] T060 [P] [US3] Migrar componentes y diálogos de `apps/book/src/modules/public-booking/{components,dialogs}/` (sin Next)
- [x] T061 [P] [US3] Migrar `apps/book/src/modules/landing/LandingView.tsx` y componentes (`HeroBand`, `IndustriesSection`) a React Router
- [x] T062 [P] [US3] Migrar `apps/book/src/shared/components/PublicHeader.tsx` y `PublicFooter.tsx` de `next/link`/`next/image`
- [x] T063 [US3] Ajustar flujo de reseña pública (`reviews/services.ts`) para invalidar `['public-business']` en lugar de `revalidatePath`
- [x] T064 [P] [US3] Adaptar `apps/book/src/shared/utils/uploadImage.ts` y `public-booking/utils/uploadProof.ts` al cliente Supabase browser
- [x] T065 [P] [US3] Migrar tests de `directory`, `public-booking` y `reviews` (públicos) a `services.test.ts`
- [x] T066 [P] [US3] Actualizar tests de `PublicPortal`, `BookingFlow`, `CalendarStep`, `ProviderNav` y directorio a React Router
- [x] T067 [US3] Verificar V3 del quickstart: estados de negocio, reserva, comprobante y reseña

**Checkpoint**: Portal público y reserva operativos sin sesión.

---

## Phase 6: User Story 4 - Alta de negocio con vinculación segura (Priority: P2)

**Goal**: Onboarding sin credenciales administrativas en el navegador.

**Independent Test**: Recorrer V4 del `quickstart.md` (alta, email duplicado, slug en uso, fallo de vinculación, inspección del bundle).

### Implementation for User Story 4

- [x] T068 [P] [US4] Crear cliente admin Supabase en `apps/api/src/shared/supabase/admin-client.ts`
- [x] T069 [P] [US4] Crear tipos GraphQL en `apps/api/src/modules/onboarding/onboarding.types.ts`
- [x] T070 [US4] Implementar `apps/api/src/modules/onboarding/onboarding.service.ts` (crear usuario, crear tenant, vincular `tenant_id`, compensación)
- [x] T071 [US4] Implementar `apps/api/src/modules/onboarding/onboarding.resolver.ts` y `onboarding.module.ts`, registrando el módulo en `apps/api/src/app.module.ts`
- [x] T072 [P] [US4] Añadir pruebas `apps/api/src/modules/onboarding/onboarding.service.spec.ts` y `onboarding.resolver.spec.ts`
- [x] T073 [US4] Regenerar snapshot `apps/book/codegen.schema.gql` desde el SDL de `apps/api` y ejecutar `pnpm --filter @foundly/book codegen`
- [x] T074 [US4] Crear `apps/book/src/modules/onboarding/services.ts` con `RegisterBusinessDocument` + `signInWithPassword`
- [x] T075 [US4] Reescribir `apps/book/src/modules/onboarding/hooks.ts` con `useMutation`
- [x] T076 [US4] Migrar `apps/book/src/modules/onboarding/OnboardingView.tsx` y componentes (`WizardShell`, `AccountStep`, `BusinessStep`, `SetupStep`) a React Router
- [x] T077 [P] [US4] Migrar tests de onboarding (`draft`, `schemas`, `actions`→`services`) en `apps/book/src/modules/onboarding/tests/`
- [x] T078 [US4] Configurar `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` en `apps/api` (render/env docs) y CORS
- [x] T079 [US4] Eliminar `SUPABASE_SERVICE_ROLE_KEY` y la lógica server-side de `apps/book/.env.example` y `modules/onboarding/actions.ts`
- [x] T080 [US4] Verificar V4 del quickstart y que el bundle no contiene credenciales

**Checkpoint**: Alta segura operativa sin secretos en cliente.

---

## Phase 7: User Story 5 - Paridad de navegación, enlaces y presentación (Priority: P3)

**Goal**: Rutas, redirecciones, deep links, 404 y metadatos equivalentes.

**Independent Test**: Recorrer V5 del `quickstart.md`.

### Implementation for User Story 5

- [x] T081 [US5] Implementar la tabla completa de rutas en `apps/book/src/router.tsx`
- [x] T082 [US5] Implementar redirecciones heredadas (`/directorio`, `/register`, `/admin`, `/admin/profile`) en `apps/book/src/router.tsx`
- [x] T083 [US5] Implementar retorno a la ruta solicitada tras login en `apps/book/src/modules/auth/services.ts` y guards
- [x] T084 [US5] Añadir `PageMeta` a todas las rutas en `apps/book/src/router.tsx` o vistas
- [x] T085 [US5] Crear página 404 en `apps/book/src/shared/components/NotFoundPage.tsx` y registrarla
- [x] T086 [US5] Actualizar `apps/book/index.html` con metadatos base y enlace al manifest
- [x] T087 [US5] Añadir carga diferida por ruta (`React.lazy` + `Suspense`) en `apps/book/src/router.tsx`
- [x] T088 [P] [US5] Añadir pruebas de rutas/guards/redirecciones en `apps/book/src/tests/router.test.tsx`
- [x] T089 [US5] Verificar V5 del quickstart: URLs directas, recargas, query params, 404 y atrás/adelante

**Checkpoint**: Navegación y presentación con paridad.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Limpieza de Next.js, despliegue, seguridad y validación final.

- [x] T090 Eliminar artefactos Next en `apps/book/`: `next.config.mjs`, `next-env.d.ts`, `.next/`, `src/middleware.ts`, `src/app/**`, `src/app/manifest.ts` y `src/app/auth/session-expired/route.ts`
- [x] T091 Eliminar módulos server-only obsoletos: `apps/book/src/shared/auth/authServer.ts`, `shared/auth/supabase/server.ts`, `shared/auth/supabase/cookies.ts`, `shared/api/admin-request.ts`, `shared/api/health.ts` y `shared/components/ConnectionStatus.tsx`
- [x] T092 Actualizar scripts raíz (`package.json`, `turbo.json`) para `@foundly/book` basados en Vite
- [x] T093 Actualizar `vercel.json` con fallback SPA y reescritura de zona `/book`; añadir orígenes a `CORS_ORIGINS` en `render.yaml`/env del API
- [x] T094 Actualizar `apps/book/.env.example` con `VITE_API_URL`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` y timeout
- [x] T095 [P] Revisión de seguridad: ausencia de secretos en `dist/`, CSP, sanitización y manejo de `localStorage`
- [x] T096 [P] Limpiar mocks de `next/*` restantes y consolidar el harness de pruebas en `apps/book/src/test-utils/`
- [x] T097 Ejecutar quickstart V1–V6 completo y registrar resultados
- [x] T098 [P] Revisar rendimiento/bundle y carga diferida; documentar presupuesto
- [x] T099 Grep final de imports prohibidos (`next`, `@supabase/ssr`, `@foundly/database` raíz) en `apps/book/src` y `dist/`
- [x] T100 Actualizar documentación de despliegue y enlaces internos afectados por la migración

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: depende solo de T001 (ratificación de gobernanza).
- **Foundational (Phase 2)**: depende de Setup (T001–T010).
- **User Stories (Phase 3–7)**: dependen de Foundational.
- **Polish (Phase 8)**: depende de las historias que se quieran entregar; la eliminación de Next (T090–T091) solo tras completar US1–US5.

### User Story Dependencies

- **US1 (P1)**: base de autenticación; sin dependencia de otras historias.
- **US2 (P1)**: depende de US1 (sesión/guards/workspace).
- **US3 (P1)**: independiente de US1/US2; solo requiere Foundational (transporte y caché).
- **US4 (P2)**: independiente de US1/US2/US3; requiere Foundational + cambios en `apps/api`.
- **US5 (P3)**: integra las rutas de US1–US4; ejecutar al final de las historias deseadas.

### Within Each User Story

- Servicios antes que hooks.
- Hooks antes que vistas/componentes.
- Pruebas de la historia antes de la validación del checkpoint.
- Cada historia termina con su verificación del quickstart.

### Parallel Opportunities

- Setup: T003–T010 pueden ir en paralelo (archivos distintos).
- Foundational: T014–T017 y T019 en paralelo.
- US1: T021–T022, T027, T029–T033 en paralelo tras T023.
- US2: T035–T044 (módulos) en paralelo; luego T045–T046; T050–T053 en paralelo.
- US3: T056–T062, T064–T066 en paralelo.
- US4: T068–T069 en paralelo; T072 y T077 en paralelo.
- US5: T088 en paralelo.
- Polish: T095, T096, T098 en paralelo.

---

## Parallel Example: User Story 2

```bash
# Migrar servicios y hooks por módulo (archivos distintos):
Task: "Migrar agenda a services.ts + hooks.ts"
Task: "Migrar availability a services.ts + hooks.ts"
Task: "Migrar services a services.ts + hooks.ts"
Task: "Migrar staff a services.ts + hooks.ts"
Task: "Migrar gallery a services.ts + hooks.ts"

# Migrar tests de acciones en paralelo:
Task: "Migrar tests de actions a services en módulos admin"
Task: "Actualizar mocks de next/navigation a React Router"
```

## Parallel Example: User Story 3

```bash
Task: "Migrar directory a services.ts + hooks.ts"
Task: "Migrar public-booking a services.ts + hooks.ts"
Task: "Migrar landing y componentes a React Router"
Task: "Migrar PublicHeader/PublicFooter"
```

---

## Implementation Strategy

### MVP First

1. Fase 1 (Setup) + Fase 2 (Foundational).
2. US1 (autenticación) + US2 (panel admin).
3. **STOP y VALIDAR** V1–V2 del quickstart.
4. Desplegar/demostrar el panel SPA.

> US1 por sí sola no aporta producto; el primer incremento demostrable es **US1 + US2**.

### Incremental Delivery

1. Setup + Foundational → base lista.
2. US1 → autenticación SPA.
3. US2 → panel completo (demostrable).
4. US3 → portal público y reservas.
5. US4 → onboarding seguro.
6. US5 → paridad de rutas/metadatos.
7. Polish → eliminar Next.js y validar todo.

### Parallel Team Strategy

1. Equipo completa Setup + Foundational.
2. Tras Foundational:
   - Dev A: US1 → US2.
   - Dev B: US3 (público).
   - Dev C: US4 (API + onboarding).
3. US5 y Polish se integran al final.

---

## Notes

- [P] = archivos distintos, sin dependencias pendientes.
- La Fase 1 es bloqueante: sin T001 no se implementa (gobernanza).
- No reintroducir capas de servidor ni cookies SSR.
- Verificar que los tests fallan/actualizan antes de validar cada checkpoint.
- Commit tras cada tarea o grupo lógico; usar `spec(book)` y `feat(book)` según convención.
