# Contract: Consumo del workspace autenticado en Book

**Feature**: `specs/api/021-supabase-auth-tenant-hardening` | **Date**: 2026-11-09

## 1. Objetivo

`apps/book` debe obtener el negocio activo y su perfil exclusivamente desde la operación autenticada `myBusiness`. Queda prohibido resolver el workspace descargando la colección pública `tenants` y filtrándola en el cliente.

## 2. Capa de datos

### Operaciones GraphQL

| Documento | Uso | Sustituye a |
| --- | --- | --- |
| `MyBusiness` | Workspace del administrador y perfil editable | `Tenants` + filtro por `tenantId` |
| `TenantBySlug` | Portal público por slug | Sin cambios |
| `UpdateBusinessProfile` | Guardado del perfil | Sin cambios |

`tenancy.graphql` elimina la query `Tenants` y declara `MyBusiness`. Ambas consultas de negocio (`TenantBySlug`, `MyBusiness`) comparten el fragmento `TenantWorkspaceFields` para no duplicar la selección de campos.

### Funciones de servicio

| Función | Firma | Comportamiento |
| --- | --- | --- |
| `getCurrentTenant()` | sin argumentos | Llama a `apiRequestAuthed(MyBusinessDocument, {})`; mapea la respuesta con `mapTenant`. |
| `getProfile()` | sin argumentos | Llama a `apiRequestAuthed(MyBusinessDocument, {})`; mapea la respuesta con `mapTenant`. |
| `updateProfile(input)` | `input` validado con Zod | Llama a `UpdateBusinessProfileDocument`; el servidor decide el negocio. |

**Prohibido**: construir la consulta con un `tenantId` de cliente, filtrar arrays de negocios, o usar `TenantsDocument` para resolver el workspace.

## 3. Workspace de administración

`fetchAdminWorkspace(session)` mantiene la comprobación local de que existe sesión con `tenantId` (solo para UX/guards), pero la resolución del negocio llama a `getCurrentTenant()` sin enviar ese identificador. El resultado del servidor es la única fuente de verdad para nombre, slug, estado de publicación y avatar.

## 4. Perfil

`getProfile()` no recibe `tenantId`. La vista puede seguir usando `useAdminResource(workspace?.tenantId, getProfile)` porque el `tenantId` solo actúa como clave de caché/local enabled; la función de servicio no lo usa para consultar ni filtrar. `updateProfile` envía solo el input editable; el alcance lo impone la API.

## 5. Manejo de errores y caché

| Situación | Comportamiento en Book |
| --- | --- |
| `UNAUTHENTICATED` | Limpieza de sesión y caché; redirección global a `/login` con motivo de expiración. |
| `FORBIDDEN` (negocio inactivo) | Estado de error del workspace; no se muestran datos de otro negocio. |
| `NOT_FOUND` (negocio inexistente) | Error de workspace; no se infiere un negocio desde la URL. |
| `CONFLICT` (slug duplicado) | Error inline en el campo `slug` del perfil. |
| Logout o cambio de identidad | `queryClient.clear()`; el workspace anterior no se reutiliza. |

## 6. Criterios de aceptación del consumidor

1. `getCurrentTenant` y `getProfile` invocan `MyBusinessDocument`; ninguna llamada a `TenantsDocument` permanece en Book.
2. El panel carga el negocio correcto para dos cuentas distintas sin que el cliente envíe un `tenantId` de resolución.
3. El perfil se edita y persiste en el negocio autenticado; un identificador manipulado no cambia el objetivo.
4. Un negocio inactivo no muestra el workspace y presenta un error explícito.
5. El portal público (`TenantBySlug`) sigue funcionando sin sesión.
6. `npm run codegen`, `typecheck`, `lint`, `test` y `build` de Book pasan sin referencias a `Tenants`, `CurrentUser`, `CurrentTenant` o `BookCapability`.
