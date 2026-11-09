# Quickstart & Validation Guide

**Feature**: `specs/api/021-supabase-auth-tenant-hardening` | **Date**: 2026-11-09

Guía de ejecución y validación end-to-end. Los detalles de entidades y contrato viven en [`data-model.md`](./data-model.md) y [`contracts/`](./contracts/); este documento no los duplica.

## Prerequisites

- Node.js 20+, pnpm y dependencias instaladas en la raíz.
- `apps/api/.env` con `DATABASE_URL`, `DIRECT_URL`, `SUPABASE_AUTH_URL`, `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY`.
- `apps/book/.env` con `VITE_API_URL`, `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.
- Dos cuentas de prueba en Supabase vinculadas a negocios distintos (A y B), al menos una con negocio activo y otra con negocio inactivo para el caso negativo.
- `FOUNDLY_PASS_SECRET` **no** debe existir en el entorno de la API.

## 1. Limpieza de configuración

```bash
# No debe devolver coincidencias en configuración/entorno del backend
rg "FOUNDLY_PASS_SECRET" apps/api/.env apps/api/.env.example render.yaml
```

Resultado esperado: sin coincidencias. La API debe arrancar sin esa variable:

```bash
npm run dev -w @foundly/api
```

Resultado esperado: arranque correcto; si `SUPABASE_AUTH_URL` falta, la verificación falla de forma cerrada, no recurre a HMAC.

## 2. Actualizar SDL y codegen

```bash
# 1) Arrancar la API para regenerar apps/api/src/schema.gql
npm run dev -w @foundly/api

# 2) Sincronizar los snapshots de los consumidores
cp apps/api/src/schema.gql apps/book/codegen.schema.gql
cp apps/api/src/schema.gql apps/mobile/codegen.schema.gql

# 3) Regenerar tipos
npm run codegen -w @foundly/book
pnpm --filter @foundly/mobile codegen
```

Resultado esperado:
- El SDL ya no contiene `me`, `currentTenant`, `bookCapability`, `CurrentUser`, `CurrentTenant` ni `BookCapability`.
- El SDL mantiene `viewer`, `myBusiness`, `updateMyBusinessProfile`, `tenant(slug)` y `tenants`.
- `apps/book/src/shared/api/generated.ts` contiene `MyBusinessDocument` y ya no contiene `TenantsDocument`.
- `apps/mobile` compila sin la operación `Me` eliminada.

## 3. Gates de la API

```bash
npm run typecheck -w @foundly/api
npm run lint      -w @foundly/api
npm run test      -w @foundly/api
npm run build     -w @foundly/api
```

Resultado esperado: todo pasa. Los tests del auth legado ya no existen; los tests de `tenants` cubren el estado activo/inactivo/inexistente.

## 4. Validación manual de la API

Usar GraphQL Playground (`/graphql`) o `curl` con `Authorization: Bearer <access_token>`.

### 4.1 Operación retirada

```graphql
query { me { userId } }
```

Resultado esperado: error de validación de esquema (campo inexistente), sin respuesta HMAC ni fallback.

### 4.2 Identidad válida

```graphql
query { viewer { sub email role aud } }
```

Con un token de A: responde la identidad de A.

### 4.3 Workspace propio

```graphql
query {
  myBusiness {
    id
    name
    status
    profile { slug }
  }
}
```

Con un token de A: devuelve el negocio de A. Repetir con B: devuelve el negocio de B.

### 4.4 Aislamiento

Enviar cualquier intento de seleccionar otro negocio (por ejemplo, un `tenantId` inventado en un input) y confirmar que `myBusiness` sigue devolviendo el negocio del token. La consulta no acepta selectores de negocio.

### 4.5 Errores esperados

| Caso | Resultado |
| --- | --- |
| Sin cabecera `Authorization` | `UNAUTHENTICATED` |
| Token HMAC del sistema anterior | `UNAUTHENTICATED` |
| Token de Supabase caducado o manipulado | `UNAUTHENTICATED` |
| Token válido sin `tenant_id` | `UNAUTHENTICATED` |
| Token con `tenant_id` inexistente | `NOT_FOUND` |
| Token de un negocio `suspended`/`draft` | `FORBIDDEN` |
| `updateMyBusinessProfile` con negocio inactivo | `FORBIDDEN` |

## 5. Validación de Book

1. Arrancar Book (`npm run dev -w @foundly/book`).
2. Iniciar sesión con la cuenta A.
3. Abrir el panel: el workspace muestra el negocio A (nombre, slug, avatar, estado de publicación).
4. En la pestaña Network, confirmar que la carga del workspace usa `MyBusiness` y **no** `Tenants`.
5. Abrir `/admin/profile`: el perfil corresponde a A; editar un campo y guardar; recargar y confirmar la persistencia.
6. Cerrar sesión e iniciar con la cuenta B: el workspace muestra exclusivamente B; no queda ningún dato de A en la UI.
7. Simular negocio inactivo (cambiar `status` en la base de datos de prueba): el panel muestra un error de workspace y no datos parciales.
8. Abrir el portal público por slug sin sesión: sigue funcionando y muestra los datos públicos.

## 6. Validación de Mobile

```bash
pnpm --filter @foundly/mobile codegen
pnpm --filter @foundly/mobile typecheck
pnpm --filter @foundly/mobile test
```

Resultado esperado: sin referencias a `MeDocument`/`me` y sin fallos de codegen por la operación retirada.

## 7. Gates finales del monorepo afectado

```bash
npm run typecheck -w @foundly/api
npm run lint      -w @foundly/api
npm run test      -w @foundly/api
npm run build     -w @foundly/api

npm run typecheck -w @foundly/book
npm run lint      -w @foundly/book
npm run test      -w @foundly/book
npm run build     -w @foundly/book

pnpm --filter @foundly/mobile typecheck
pnpm --filter @foundly/mobile test
```

Resultado esperado: todos los gates pasan; no quedan referencias a `FOUNDLY_PASS_SECRET`, `me`, `currentTenant`, `bookCapability`, `GqlAuthGuard` ni `PlanGuard` en el código de producción o la configuración del backend. Las specs históricas (`006`, `008`) conservan sus referencias como registro, fuera de este criterio.

## 8. Evidencia para aceptación

- [ ] SDL y snapshots sin operaciones retiradas.
- [ ] `rg "FOUNDLY_PASS_SECRET" apps/api render.yaml` sin resultados.
- [ ] Cuenta A no puede leer ni actualizar el negocio de B.
- [ ] Negocio inactivo denegado con `FORBIDDEN`.
- [ ] Book usa `MyBusiness` y no `Tenants` para el workspace.
- [ ] Portal público, directorio y reserva siguen operativos sin sesión.
- [ ] Gates de API, Book y Mobile en verde.
