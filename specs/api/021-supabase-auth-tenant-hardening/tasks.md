---
description: "Task list for closing the Supabase Auth migration and hardening tenant workspace security"
---

# Tasks: Cierre de Migración a Supabase Auth y Seguridad de Tenant

**Input**: Design documents from `specs/api/021-supabase-auth-tenant-hardening/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/`, `quickstart.md`

**Tests**: Incluidos porque el plan y el quickstart exigen validación automatizada de la retirada del auth legado y del aislamiento del workspace. No se adopta un mandato TDD separado: los tests se escriben antes de la implementación de cada historia cuando el orden lo permite.

**Organization**: Tareas agrupadas por historia de usuario para permitir implementación y validación independientes.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Puede ejecutarse en paralelo (archivos distintos, sin dependencias pendientes)
- **[Story]**: Historia de usuario a la que pertenece la tarea (US1, US2, US3)
- Todas las descripciones incluyen la ruta exacta del archivo o el workspace afectado

## Path Conventions

- API: `apps/api/src/`
- Book: `apps/book/src/`
- Mobile: `apps/mobile/src/`
- Specs: `specs/api/021-supabase-auth-tenant-hardening/`
- Sin cambios en `packages/database/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirmar el estado de partida y evitar cambios innecesarios de esquema o dependencias.

- [X] T001 Ejecutar los gates base de `apps/api` y `apps/book` (`npm run typecheck -w @foundly/api`, `npm run typecheck -w @foundly/book`) y registrar el estado inicial antes de tocar código.
- [X] T002 [P] Confirmar que `packages/database/prisma/schema.prisma` y `packages/database/prisma/migrations/` no requieren cambios; esta feature no añade entidades persistidas ni migraciones.
- [X] T003 [P] Auditar referencias actuales con `rg` sobre `apps/api`, `apps/book` y `apps/mobile` para `FOUNDLY_PASS_SECRET`, `GqlAuthGuard`, `PlanGuard`, `UseAuth`, `CurrentUser`, `CurrentTenant`, `RequirePlan`, `me`, `currentTenant`, `bookCapability` y `TenantsDocument`; usar la lista para cerrar las tareas de retirada.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Conservar los helpers de error que usan los guards vigentes antes de eliminar el módulo legado.

**CRITICAL**: Ninguna historia puede completar la retirada del auth legado sin esta fase.

- [X] T004 Crear `apps/api/src/modules/auth/auth.errors.ts` con `unauthError` y `forbiddenError`, preservando los códigos GraphQL `UNAUTHENTICATED` y `FORBIDDEN` actuales.
- [X] T005 [P] Actualizar los imports de `unauthError`/`forbiddenError` en `apps/api/src/modules/auth/jwt.guard.ts`, `apps/api/src/modules/subscription/subscription.guard.ts` y `apps/api/src/modules/platform/platform.service.ts` para que apunten a `auth.errors.ts` y no al futuro archivo eliminado `auth.guards.ts`.

**Checkpoint**: Los helpers compartidos ya no dependen del guard legado; la retirada puede ejecutarse sin romper guards vigentes.

---

## Phase 3: User Story 1 - Acceso al workspace solo con identidad Supabase (Priority: P1) — MVP

**Goal**: Book resuelve el negocio y el perfil exclusivamente con `myBusiness`, derivado del JWT, y la API deniega negocios inactivos o inexistentes.

**Independent Test**: Iniciar sesión con dos cuentas de negocios distintos y comprobar que cada una carga su propio workspace y perfil; una cuenta con negocio inactivo recibe un error explícito y ninguna cuenta puede seleccionar el negocio de otra.

### Tests for User Story 1

- [X] T006 [P] [US1] Actualizar `apps/book/src/shared/tenancy/tests/queries.test.ts` para mockear `MyBusiness` y verificar que `getCurrentTenant()` usa `MyBusinessDocument`, no envía un `tenantId` de resolución y no llama a `TenantsDocument`.
- [X] T007 [P] [US1] Actualizar `apps/book/src/modules/profile/tests/services.test.ts` para mockear `{ myBusiness: ... }`, eliminar la expectativa de `tenantId` de entrada y verificar el mapeo de perfil/políticas.
- [X] T008 [P] [US1] Ampliar `apps/api/src/modules/tenants/tenants.service.spec.ts` y `apps/api/src/modules/tenants/tenants.resolver.spec.ts` con casos de negocio `active`, `draft`/`suspended`, inexistente, identidad sin `tenant_id` y actualización de perfil sobre negocio inactivo; ajustar el cliente falso para incluir `status`.

### Implementation for User Story 1

- [X] T009 [P] [US1] Añadir el fragmento `TenantWorkspaceFields` y la query `MyBusiness` en `apps/book/src/shared/tenancy/tenancy.graphql`; eliminar la query `Tenants` y conservar `TenantBySlug` para el portal público.
- [X] T010 [US1] Ejecutar `npm run codegen -w @foundly/book` para generar `MyBusinessDocument`/`MyBusinessQuery` en `apps/book/src/shared/api/generated.ts`.
- [X] T011 [P] [US1] Implementar en `apps/api/src/modules/tenants/tenants.service.ts` la comprobación de negocio operable en `findForOwner` y `updateProfile`: inexistente → `NOT_FOUND`; estado distinto de `active` → `FORBIDDEN`; sin `tenant_id` → `UNAUTHENTICATED`.
- [X] T012 [P] [US1] Actualizar `apps/book/src/shared/tenancy/queries.ts`: `getCurrentTenant()` sin argumentos, llamada a `apiRequestAuthed(MyBusinessDocument, {})`, tipo `ApiTenant` desde `MyBusinessQuery['myBusiness']` y eliminación de `TenantsDocument`.
- [X] T013 [P] [US1] Actualizar `apps/book/src/shared/tenancy/adminWorkspace.ts` para llamar a `getCurrentTenant()` sin `tenantId` de resolución, conservando la comprobación local de sesión solo como guard de UX.
- [X] T014 [P] [US1] Actualizar `apps/book/src/modules/profile/services.ts`: `getProfile()` sin argumentos, `MyBusinessDocument` y mapeo de `myBusiness`; conservar `updateProfile()` y el mapeo de `CONFLICT` a error inline de `slug`.
- [X] T015 [US1] Ejecutar `npm run typecheck -w @foundly/book` y `npm run test -w @foundly/book`; corregir firmas, mocks y claves de caché afectadas por `getCurrentTenant()`/`getProfile()`.

**Checkpoint**: El workspace y el perfil se obtienen de `myBusiness`; la API deniega negocios inactivos/inexistentes; los tests de Book y API de US1 pasan.

---

## Phase 4: User Story 2 - Retirada completa del mecanismo de autenticación legado (Priority: P1)

**Goal**: Eliminar el auth HMAC, sus operaciones y su secreto; dejar el backend estandarizado sobre `SupabaseJwtGuard` y regenerar los contratos de los consumidores.

**Independent Test**: Auditar el SDL y el código: no existen `me`, `currentTenant`, `bookCapability`, `GqlAuthGuard`, `PlanGuard` ni `FOUNDLY_PASS_SECRET`; `viewer` y las operaciones protegidas siguen funcionando con un token Supabase válido.

### Tests for User Story 2

- [X] T016 [P] [US2] Ampliar `apps/api/src/modules/auth/jwt.resolver.spec.ts` para verificar que `viewer` sigue respondiendo con un token válido y que `me`, `currentTenant` y `bookCapability` ya no resuelven (error de validación de esquema).

### Implementation for User Story 2

- [X] T017 [US2] Actualizar `apps/api/src/modules/auth/auth.module.ts` para dejar solo `SupabaseJwtGuard`, `JwtResolver`, `JWT_JWKS` y `SupabaseJwtService`; eliminar providers/exports de `AuthService`, `GqlAuthGuard`, `PlanGuard` y `AuthResolver`.
- [X] T018 [P] [US2] Eliminar `apps/api/src/modules/auth/auth.context.ts`, `auth.service.ts` y `auth.service.spec.ts`.
- [X] T019 [P] [US2] Eliminar `apps/api/src/modules/auth/auth.guards.ts` y `auth.guards.spec.ts`.
- [X] T020 [P] [US2] Eliminar `apps/api/src/modules/auth/auth.decorators.ts`.
- [X] T021 [P] [US2] Eliminar `apps/api/src/modules/auth/auth.resolver.ts`, `auth.resolver.spec.ts` y `auth.types.ts`.
- [X] T022 [US2] Eliminar `FOUNDLY_PASS_SECRET` de `apps/api/.env.example` y `apps/api/.env`; verificar que `render.yaml` no lo declara y que ningún valor de ejemplo permanece.
- [X] T023 [P] [US2] Eliminar `apps/mobile/src/modules/auth/auth.graphql` (declaraba la query `Me` sin uso) para que el codegen móvil no dependa de una operación retirada.
- [X] T024 [US2] Regenerar `apps/api/src/schema.gql` arrancando/compilando la API; copiarlo a `apps/book/codegen.schema.gql` y `apps/mobile/codegen.schema.gql`.
- [X] T025 [US2] Ejecutar `npm run codegen -w @foundly/book` y `pnpm --filter @foundly/mobile codegen`; verificar que `generated.ts` ya no contiene `me`, `currentTenant`, `bookCapability`, `CurrentUser`, `CurrentTenant`, `BookCapability` ni `TenantsDocument`.
- [X] T026 [US2] Ejecutar `npm run typecheck -w @foundly/api` y corregir cualquier import residual de `auth.guards`, `auth.context`, `auth.service`, `auth.decorators`, `auth.types` o `auth.resolver` en `apps/api/src`.
- [X] T027 [US2] Ejecutar `npm run test -w @foundly/api` y corregir cualquier spec que todavía referencie el auth HMAC o los helpers movidos.

**Checkpoint**: El backend solo acepta Supabase Auth; el SDL y los tipos generados ya no publican operaciones ni tipos legados; la configuración no contiene el secreto HMAC.

---

## Phase 5: User Story 3 - Operación y diagnóstico sin ambigüedad de identidad (Priority: P2)

**Goal**: El panel distingue sesión expirada, identidad sin negocio y negocio no operable, y no conserva datos del workspace anterior.

**Independent Test**: Provocar `UNAUTHENTICATED`, `FORBIDDEN` y `NOT_FOUND` en la carga del workspace y comprobar que Book limpia la sesión/caché cuando corresponde y muestra un mensaje claro sin datos del negocio previo.

### Tests for User Story 3

- [X] T028 [P] [US3] Añadir `apps/book/src/shared/tenancy/tests/adminWorkspace.test.ts` para cubrir los códigos `FORBIDDEN` y `NOT_FOUND` y verificar que el mensaje mostrado no filtra texto técnico de la API.
- [X] T029 [P] [US3] Verificar/ampliar en `apps/book/src/shared/api/tests/client.test.ts` y `apps/book/src/shared/auth/tests/` que `UNAUTHENTICATED` emite el evento global y que el cierre de sesión limpia la caché del workspace anterior.

### Implementation for User Story 3

- [X] T030 [US3] Ajustar `apps/book/src/shared/tenancy/adminWorkspace.ts` para traducir `FORBIDDEN` y `NOT_FOUND` con `errorMessage` de `apps/book/src/shared/api/error-surface.ts`, manteniendo `UNAUTHENTICATED` en el flujo global de sesión.
- [X] T031 [US3] Revisar `apps/book/src/shared/components/AdminLayout.tsx` y `apps/book/src/shared/auth/session-context.tsx`: el error de workspace no debe mostrar datos parciales ni reutilizar caché de otro negocio; ajustar si la traducción de errores requiere un cambio.
- [X] T032 [US3] Ejecutar `npm run typecheck -w @foundly/book` y `npm run test -w @foundly/book`; confirmar los escenarios de sesión expirada, negocio inactivo y cambio de cuenta.

**Checkpoint**: Los estados de identidad y negocio son distinguibles y la caché no filtra datos entre sesiones.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Limpieza final, auditoría de referencias y validación end-to-end.

- [X] T033 [P] Actualizar comentarios obsoletos que mencionan el auth HMAC o `PlanGuard` en `apps/api/src/modules/platform/platform.guard.ts` y `apps/api/src/modules/subscription/subscription.guard.ts`, sin cambiar su comportamiento.
- [X] T034 Auditar con `rg` sobre `apps/api`, `apps/book`, `apps/mobile` y `render.yaml` que no quedan `FOUNDLY_PASS_SECRET`, `GqlAuthGuard`, `PlanGuard`, `UseAuth`, `CurrentUser`, `CurrentTenant`, `RequirePlan`, `\bme\b` (en queries GraphQL), `currentTenant`, `bookCapability` ni `TenantsDocument` en código de producción o configuración.
- [X] T035 Ejecutar los escenarios de `specs/api/021-supabase-auth-tenant-hardening/quickstart.md`: API sin secreto HMAC, operaciones retiradas ausentes, `myBusiness` con dos cuentas, negocio inactivo, Book sin `Tenants` y portal público operativo.
- [X] T036 Ejecutar los gates finales de `apps/api`, `apps/book` y `apps/mobile` (`typecheck`, `lint`, `test`, `build`) y corregir cualquier regresión.
- [X] T037 Revisar que `specs/api/021-supabase-auth-tenant-hardening/plan.md`, `data-model.md` y `contracts/` siguen describiendo el comportamiento implementado; actualizar solo si la implementación reveló una divergencia real.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: sin dependencias; puede empezar de inmediato.
- **Foundational (Phase 2)**: depende de Setup; bloquea la retirada de US2 y la limpieza de US3.
- **US1 (Phase 3)**: depende de Foundational; entrega el workspace seguro y es el MVP funcional.
- **US2 (Phase 4)**: depende de Foundational; puede ejecutarse después de US1 para regenerar el SDL una sola vez con `MyBusiness` ya incorporado.
- **US3 (Phase 5)**: depende de US1 y US2; valida los estados de error y la caché sobre el flujo final.
- **Polish (Phase 6)**: depende de todas las historias.

### User Story Dependencies

- **US1 (P1)**: no depende de US2; se puede validar con `myBusiness` aunque el SDL todavía contenga operaciones legadas.
- **US2 (P1)**: no depende funcionalmente de US1, pero debe ejecutarse después para que el SDL regenerado incluya `MyBusiness` y no obligue a regenerar dos veces.
- **US3 (P2)**: depende de US1 (workspace) y US2 (errores finales sin legado).

### Within Each User Story

- Tests antes de la implementación cuando el archivo generado ya existe.
- API/servicio antes de la integración de Book.
- `tenancy.graphql` y codegen antes de actualizar servicios que importan `MyBusinessDocument`.
- Validación de la historia antes de pasar a la siguiente.

### Parallel Opportunities

- T002/T003 en Setup.
- T006/T007/T008 (tests de US1) y T011 (servicio API) pueden ejecutarse en paralelo tras T004/T005.
- T009 debe preceder a T010.
- T012/T013/T014 (tres archivos distintos de Book) pueden ejecutarse en paralelo tras T010.
- T018/T019/T020/T021 (eliminación de archivos distintos) pueden ejecutarse en paralelo tras T017.
- T022/T023 (configuración y móvil) pueden ejecutarse en paralelo.
- T028/T029 (tests de US3) pueden ejecutarse en paralelo.
- T033 y la auditoría T034 no deben solaparse con cambios pendientes; T034 va al final.

---

## Parallel Example: User Story 1

```text
# Tras generar MyBusinessDocument (T010), lanzar en paralelo:
Task: "Actualizar getCurrentTenant en apps/book/src/shared/tenancy/queries.ts"
Task: "Actualizar fetchAdminWorkspace en apps/book/src/shared/tenancy/adminWorkspace.ts"
Task: "Actualizar getProfile en apps/book/src/modules/profile/services.ts"
```

## Parallel Example: User Story 2

```text
# Tras actualizar auth.module.ts (T017), eliminar en paralelo:
Task: "Eliminar auth.context.ts, auth.service.ts y auth.service.spec.ts"
Task: "Eliminar auth.guards.ts y auth.guards.spec.ts"
Task: "Eliminar auth.decorators.ts"
Task: "Eliminar auth.resolver.ts, auth.resolver.spec.ts y auth.types.ts"
```

---

## Implementation Strategy

### MVP First

El MVP operativo requiere **US1 + US2** porque ambos son P1 y la aceptación exige simultáneamente workspace seguro y retirada completa del auth legado. Orden recomendado:

1. Setup + Foundational.
2. US1: `myBusiness` activo y Book migrado.
3. Validar US1 de forma independiente.
4. US2: retirada del HMAC, regeneración del SDL y limpieza de configuración.
5. Validar US2 y continuar con US3 y Polish.

### Incremental Delivery

1. Setup + Foundational → helpers listos.
2. US1 → workspace seguro y aislado (demo funcional).
3. US2 → backend estandarizado y contratos limpios.
4. US3 → diagnóstico/caché consistente.
5. Polish → auditoría, quickstart y gates finales.

### Parallel Team Strategy

1. Equipo completa Setup + Foundational.
2. Developer A: US1 (API `tenants` + Book `myBusiness`).
3. Developer B: US2 (retirada del módulo auth, después de que US1 genere `MyBusiness`).
4. Developer C: US3 (tests de error/caché), tras US1/US2.
5. Polish se ejecuta de forma conjunta antes del cierre.

---

## Notes

- [P] = archivos distintos, sin dependencia pendiente.
- El label `[USn]` mapea cada tarea a la historia de usuario correspondiente.
- No se modifican `packages/database` ni migraciones.
- No se añaden dependencias nuevas.
- Las specs históricas `specs/api/006-foundly-pass-auth` y `specs/api/008-supabase-jwt-auth` se conservan como registro; la auditoría de T034 no las trata como configuración de producción.
- Evitar reintroducir aliases o fallbacks del auth HMAC: la retirada debe ser total.
