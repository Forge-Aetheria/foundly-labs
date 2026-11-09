# Research: Cierre de Migración a Supabase Auth y Seguridad de Tenant

**Feature**: `specs/api/021-supabase-auth-tenant-hardening` | **Date**: 2026-11-09

No quedan incógnitas de `NEEDS CLARIFICATION` en el contexto técnico. Las decisiones siguientes resuelven la retirada del auth legado, el contrato del workspace y la estrategia de migración de consumidores.

## R1. Retirada total del auth HMAC legado

- **Decision**: eliminar `AuthService` (firma/verificación HMAC), `GqlAuthGuard`, `PlanGuard`, los decoradores `@UseAuth`/`@CurrentUser`/`@CurrentTenant`/`@RequirePlan`, el `AuthContext` legado y las operaciones `me`, `currentTenant` y `bookCapability`. `AuthModule` queda con `SupabaseJwtGuard`, `JwtResolver`, `JWT_JWKS` y `SupabaseJwtService`.
- **Rationale**: Book y Mobile ya usan sesiones Supabase; el mecanismo HMAC no tiene emisor y sus operaciones protegidas son inalcanzables para los clientes reales. Mantenerlo amplía la superficie de ataque y contradice FR-001/FR-002.
- **Alternatives considered**: (a) mantenerlo como compatibilidad — rechazado: no existe emisor y la spec exige retirarlo; (b) reimplementar `me`/`currentTenant` sobre JWT — rechazado: Book ya resuelve identidad con `viewer` y workspace con `myBusiness`; conservar operaciones sin consumidor añade deuda.

## R2. Helpers de error compartidos sin el guard legado

- **Decision**: crear `apps/api/src/modules/auth/auth.errors.ts` con `unauthError` y `forbiddenError`; actualizar `jwt.guard.ts`, `subscription.guard.ts` y `platform.service.ts` para importarlos desde ahí. `jwt.service.ts` puede conservar su helper local o usar el compartido, sin cambiar su contrato.
- **Rationale**: `auth.guards.ts` desaparece, pero sus helpers son usados por guards y servicios vigentes. Un archivo de errores evita arrastrar el nombre y las dependencias del guard legado.
- **Alternatives considered**: dejar `auth.guards.ts` solo con helpers — rechazado: conserva un nombre engañoso y facilita reintroducir accidentalmente el guard; duplicar helpers en cada módulo — rechazado por la regla de reutilización.

## R3. Estado del negocio en el workspace

- **Decision**: `TenantsService.findForOwner` y `TenantsService.updateProfile` exigen que el negocio derivado del JWT exista y esté `active`. `findForOwner` mantiene `NOT_FOUND` para un negocio inexistente y usa `FORBIDDEN` para uno no operable; la ausencia de `tenant_id` en la identidad sigue siendo `UNAUTHENTICATED`.
- **Rationale**: el `GqlAuthGuard` legado comprobaba `status === 'active'`; al retirarlo, esa garantía se pierde si no se traslada. La comprobación en el servicio reutiliza la fila que ya se consulta y no añade una consulta por operación.
- **Alternatives considered**: añadir la comprobación al `SupabaseJwtGuard` global — rechazado: obligaría a consultar la base de datos en cada operación protegida, incluidas las que no son workspace, y mezclaría autenticación con autorización de negocio. Un guard dedicado de workspace — rechazado por ahora: el alcance es una sola consulta de workspace y su mutación de perfil.

## R4. Fuente autoritativa del workspace en Book

- **Decision**: Book deja de consultar la colección pública `tenants`. `shared/tenancy/tenancy.graphql` elimina `Tenants` y añade `MyBusiness`; `getCurrentTenant()` llama a `apiRequestAuthed(MyBusinessDocument, {})` y el perfil (`getProfile()`) usa la misma operación. `TenantBySlug` se mantiene para el portal público.
- **Rationale**: `myBusiness` ya existe, está protegida por `@RequireAuth` y deriva el negocio de `AuthUser.tenantId` en el servidor. Sustituye el filtrado cliente por aislamiento real y reduce la transferencia de datos.
- **Alternatives considered**: (a) mantener `tenants` y filtrar en cliente — rechazado: viola FR-007/FR-008 y expone la colección completa; (b) crear una nueva consulta `myWorkspace` — rechazado: duplica `myBusiness` y contradice la reutilización obligatoria.

## R5. Reutilización del contrato GraphQL y codegen

- **Decision**: definir un fragmento `TenantWorkspaceFields` en `tenancy.graphql` compartido por `TenantBySlug` y `MyBusiness`; regenerar `apps/book/src/shared/api/generated.ts` y `apps/mobile/src/shared/api/generated.ts` desde los snapshots SDL actualizados. Eliminar `apps/mobile/src/modules/auth/auth.graphql` (declaraba un `Me` sin uso) para que su codegen no dependa de una operación retirada.
- **Rationale**: el fragmento evita triplicar la selección de campos; codegen es la única fuente de tipos del contrato (constitución §5.VI). El `Me` móvil es código muerto que rompería el codegen tras la retirada.
- **Alternatives considered**: declarar DTOs manuales — prohibido; duplicar la selección de campos — rechazado por mantenimiento; mantener `Me` — rechazado porque su operación deja de existir.

## R6. Limpieza de configuración y secretos

- **Decision**: eliminar `FOUNDLY_PASS_SECRET` de `apps/api/.env.example` y del `.env` local versionado; confirmar que `render.yaml` no lo declara. No se editan las specs históricas (`006`, `008`) porque son registro de decisiones pasadas.
- **Rationale**: el secreto deja de tener lector; su presencia en plantillas induce a configurarlo y contradice SC-002. `render.yaml` ya no lo contiene, así que la limpieza principal es local/plantilla.
- **Alternatives considered**: dejarlo vacío — rechazado: sigue sugiriendo que es necesario; borrar también las specs históricas — rechazado: destruye trazabilidad y no forma parte de la configuración del backend.

## R7. Alcance del gating por licencia de módulo

- **Decision**: retirar `bookCapability` y `PlanGuard` sin sustituto en esta iteración. El campo `Tenant.plan` permanece en la base de datos como dato, pero ninguna operación lo consume para autorizar.
- **Rationale**: la spec pide retirar el sistema legado y no define un reemplazo de licenciamiento; inventarlo ampliaría el alcance. El gating de suscripción Free/Pro (`SubscriptionGuard`) es un eje distinto y permanece intacto.
- **Alternatives considered**: migrar `bookCapability` a un guard Supabase — rechazado: no tiene consumidor y la spec no lo requiere; eliminar `Tenant.plan` — rechazado: cambio de esquema innecesario y destructivo.

## R8. Estrategia de pruebas

- **Decision**: eliminar los specs del auth legado (`auth.service.spec.ts`, `auth.guards.spec.ts`, `auth.resolver.spec.ts`); añadir cobertura en `tenants` para negocio activo, inactivo, inexistente y actualización de perfil inactiva; actualizar los tests de `shared/tenancy` y `profile` para responder con `myBusiness` y verificar que no se usa `TenantsDocument`; conservar los e2e de `viewer` y añadir una comprobación de que el SDL ya no publica las operaciones retiradas.
- **Rationale**: los tests existentes del mecanismo eliminado dejan de representar el sistema; la nueva cobertura prueba los criterios de aceptación y el aislamiento server-side.
- **Alternatives considered**: mantener los tests legados como históricos — rechazado: fallarían por imports eliminados y ruido de mantenimiento.

## R9. Compatibilidad y consumidores externos

- **Decision**: asumir que `apps/book` y `apps/mobile` son los únicos consumidores del monorepo; no se ofrece capa de compatibilidad para clientes que aún llamen a `me`/`currentTenant`/`bookCapability`.
- **Rationale**: el input de la spec así lo declara; una operación retirada debe fallar de forma clara en lugar de mantener un camino inseguro.
- **Alternatives considered**: aliases temporales o feature flag — rechazado: prolonga el mecanismo legado y contradice el criterio de aceptación de retirada completa.
