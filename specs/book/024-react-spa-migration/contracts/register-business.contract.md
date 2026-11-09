# Contract — `registerBusiness` (apps/api)

**Objetivo**: reemplazar la lógica de onboarding que hoy usa `SUPABASE_SERVICE_ROLE_KEY` dentro de `apps/book` (Server Action) por una operación server-side en `apps/api` (spec FR-019/FR-020).

## Ubicación

Nuevo módulo `apps/api/src/modules/onboarding/` registrado en `app.module.ts`.

## GraphQL SDL

```graphql
input RegisterBusinessAccountInput {
  fullName: String!
  email: String!
  password: String!
}

input RegisterBusinessBusinessInput {
  name: String!
  category: TenantCategory!
  slug: String!
}

input RegisterBusinessInput {
  account: RegisterBusinessAccountInput!
  business: RegisterBusinessBusinessInput!
}

type RegisterBusinessResult {
  tenantId: ID!
}

type Mutation {
  registerBusiness(input: RegisterBusinessInput!): RegisterBusinessResult!
}
```

## Flujo del servidor

1. Validar entrada (nombre, email, password, nombre de negocio, categoría, slug).
2. Normalizar y verificar disponibilidad del slug (reutilizar reglas de `slug` y `TenantsService`).
3. Crear usuario con Supabase Admin (`auth.admin.createUser`, `email_confirm: true`).
4. Crear el tenant (reutilizar `TenantsService.create`).
5. Vincular `tenant_id` en `app_metadata` con merge (`auth.admin.updateUserById`), sin sobrescribir `platform_role` ni otros metadatos.
6. Devolver `{ tenantId }`.

Si falla cualquier paso posterior a la creación del usuario, el servidor debe intentar compensación (borrar usuario creado) para no dejar cuentas huérfanas.

## Entrada / salida

**Request**
```json
{
  "input": {
    "account": { "fullName": "Ana Pérez", "email": "ana@example.com", "password": "•••" },
    "business": { "name": "Studio Ana", "category": "BARBERIAS_PELUQUERIAS", "slug": "studio-ana" }
  }
}
```

**Response**
```json
{ "data": { "registerBusiness": { "tenantId": "uuid" } } }
```

## Errores (extensiones `code`)

| Caso | Code |
|---|---|
| Entrada inválida | `VALIDATION_ERROR` |
| Email ya registrado | `EMAIL_TAKEN` |
| Slug ya en uso | `SLUG_TAKEN` |
| Fallo del proveedor/auth | `STATE_ERROR` |
| No configurado | `STATE_ERROR` |

Los mensajes no deben exponer detalles internos del proveedor.

## Seguridad

- `SUPABASE_SERVICE_ROLE_KEY` solo existe en el runtime de `apps/api`; nunca en el bundle ni en variables `VITE_*`.
- La mutación es la única puerta de alta; validar contra abuso (rate limiting/captcha heredado del proyecto Supabase o del API).
- No permitir que el cliente elija `tenant_id` ni metadatos.
- No registrar contraseñas ni tokens.

## Configuración de entorno (API)

| Variable | Uso |
|---|---|
| `SUPABASE_URL` | URL del proyecto Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Clave administrativa (secreta) |
| `SUPABASE_AUTH_URL` | Ya existente; verificación JWT |

## Cliente (book)

1. `registerBusiness(input)` vía `services.ts` (Zod + mapeo).
2. Si `ok`, `supabase.auth.signInWithPassword({ email, password })`.
3. Navegar a `/admin/agenda`.
4. Si falla, mostrar error localizado y no dejar datos parciales en el formulario.

## Criterios de aceptación

- Alta completa crea cuenta + negocio vinculado y permite entrar al panel.
- Email duplicado y slug en uso devuelven sus códigos y no crean datos.
- El navegador no contiene ni recibe el `service role`.
- Un fallo de vinculación no deja una cuenta utilizable sin negocio.
