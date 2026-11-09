# Data Model: Cierre de Migración a Supabase Auth y Seguridad de Tenant

**Feature**: `specs/api/021-supabase-auth-tenant-hardening` | **Date**: 2026-11-09

## Scope

No hay cambios en `packages/database/prisma/schema.prisma`, ni migraciones, ni regeneración del cliente Prisma. El modelo describe las entidades de identidad y workspace que ya existen y las reglas que esta iteración hace explícitas. Las entidades marcadas como retiradas dejan de formar parte del contrato público.

## 1. Identidad autenticada (`AuthUser`)

Vista de la identidad resuelta por `SupabaseJwtService` tras verificar el access token.

| Campo | Tipo | Origen | Regla |
| --- | --- | --- | --- |
| `sub` | `string` | claim `sub` | Obligatorio y no vacío; identifica al usuario. |
| `email` | `string \| null` | claim `email` | Opcional; solo presentación. |
| `role` | `string` | claim `role` | Por defecto `authenticated`. |
| `aud` | `string` | claim `aud` | Debe validar contra la audiencia de Supabase. |
| `exp` / `iat` | `number` | claims | El token debe estar vigente; tolerancia de reloj existente. |
| `tenantId` | `string?` | `app_metadata.tenant_id` o claim `tenant_id` | Vínculo con el negocio; sin él no se accede al workspace. |
| `platformRole` | `string?` | `app_metadata.platform_role` o claim | Solo para operaciones de plataforma; no se usa en workspace. |

**Relación**: una identidad puede tener cero o un `tenantId`. El workspace exige exactamente uno válido y operable.

## 2. Negocio / workspace (`Tenant` + perfil)

Entidad persistida existente (sin cambios). El workspace expuesto por `myBusiness` incluye:

| Campo | Tipo | Regla |
| --- | --- | --- |
| `id` | `string` | Derivado del JWT; nunca del cliente. |
| `name`, `category`, `status`, `timezone`, `currency`, `isPublic`, `tags` | varios | Lectura del negocio autenticado. |
| `profile` | `BusinessProfileObject \| null` | Incluye `slug`, datos de contacto, redes, logo/cover y políticas. |
| `services` | `ServiceObject[]` | Catálogo del negocio, tal como lo expone `TenantObject`. |

**Estados relevantes**:

| Estado | Acceso al workspace | Error |
| --- | --- | --- |
| `active` | Permitido | — |
| `draft` | Denegado | `FORBIDDEN` |
| `suspended` | Denegado | `FORBIDDEN` |
| Inexistente | Denegado | `NOT_FOUND` |

**Regla de actualización**: `updateMyBusinessProfile` aplica los cambios solo al `tenantId` verificado y exige el mismo estado operable. Un `tenantId` enviado en el input, si existiera, se ignora o se rechaza; nunca cambia el alcance.

## 3. Superficie GraphQL de identidad y workspace

### Operaciones retiradas

| Operación | Tipo | Motivo |
| --- | --- | --- |
| `me` | Query | Dependía del token HMAC legado; sin consumidor tras la migración. |
| `currentTenant` | Query | Igual que `me`; el workspace se obtiene con `myBusiness`. |
| `bookCapability` | Query | Único consumidor de `PlanGuard`; el gating de licencia de módulo se retira con el mecanismo legado. |

Tipos retirados: `CurrentUser`, `CurrentTenant`, `BookCapability`.

### Operaciones conservadas

| Operación | Tipo | Protección | Resultado |
| --- | --- | --- | --- |
| `viewer` | Query | `@RequireAuth()` | `ViewerObject { sub, email, role, aud }`; valida que el token es aceptado por la API. |
| `myBusiness` | Query | `@RequireAuth()` | `TenantObject!` del negocio derivado del JWT; falla si no hay vínculo, no existe o no está activo. |
| `updateMyBusinessProfile` | Mutation | `@RequireAuth()` | `TenantObject!` actualizado, siempre sobre el negocio verificado. |

### Operaciones públicas que no cambian

`tenant(slug)`, `tenants`, `searchBusinesses`, el portal público, la reserva y las lecturas públicas de catálogo/disponibilidad conservan su comportamiento. `tenants` deja de ser consumida por Book, pero no se retira del contrato público en esta iteración.

## 4. Sesión legada (retirada)

| Elemento | Estado |
| --- | --- |
| `SessionPayload { u, t, r, exp }` | Eliminado. |
| `AuthContext` / `AuthTenant` | Eliminados. |
| `AuthService.signSession` / `verifySession` | Eliminados. |
| `GqlAuthGuard` / `PlanGuard` | Eliminados. |
| `@UseAuth` / `@CurrentUser` / `@CurrentTenant` / `@RequirePlan` | Eliminados. |
| `FOUNDLY_PASS_SECRET` | Eliminado de configuración y plantillas. |

## 5. Modelo de consumo en Book

| Concepto | Tipo de dominio | Origen |
| --- | --- | --- |
| `Tenant` (Book) | Interfaz de presentación existente | `mapTenant(myBusiness)` |
| `AdminWorkspaceData` | `{ tenantId, tenantName, tenantSlug, publicHref, isPublic, userName, userEmail, userAvatar }` | `myBusiness` + identidad de Supabase |
| Perfil editable | `Tenant` mapeado | `getProfile()` → `myBusiness`; `updateProfile()` → `updateMyBusinessProfile` |

**Reglas de estado en Book**:

1. Al iniciar sesión, `SessionProvider` obtiene la sesión de Supabase y deriva `tenantId` de `app_metadata` solo para UX/guards locales.
2. La carga del workspace llama a `myBusiness` sin enviar `tenantId`; lo que el servidor devuelve es la única fuente de verdad.
3. Si la API responde `UNAUTHENTICATED`, Book limpia la sesión y la caché y redirige a login.
4. Si responde `FORBIDDEN` o `NOT_FOUND`, muestra el error de workspace y no inventa un negocio a partir de la URL o de la caché.
5. Al cerrar sesión o cambiar de identidad, `queryClient.clear()` elimina el workspace anterior.

## 6. Invariantes

- Ninguna operación de workspace acepta un `tenantId` de cliente como fuente de alcance.
- Una identidad sin `tenant_id` no puede obtener ni actualizar un negocio.
- Un negocio inactivo no puede leerse ni actualizarse desde el workspace.
- Un token HMAC legado no puede autenticar ninguna operación.
- El portal público sigue siendo accesible sin token y no expone campos privados del workspace.
- No se modifica el esquema persistido; `Tenant.plan` permanece como dato sin consumidor de gating en esta iteración.
