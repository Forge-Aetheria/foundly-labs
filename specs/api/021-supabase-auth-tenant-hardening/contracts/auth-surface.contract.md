# Contract: Superficie de autenticación y workspace de la API

**Feature**: `specs/api/021-supabase-auth-tenant-hardening` | **Date**: 2026-11-09

## 1. Mecanismo de identidad

- **Credencial aceptada**: `Authorization: Bearer <supabase-access-token>`.
- **Verificación**: `SupabaseJwtService` contra el JWKS de `SUPABASE_AUTH_URL`; algoritmos `RS256`/`ES256`; issuer y audiencia de Supabase; tolerancia de reloj existente.
- **Alcance**: `AuthUser.tenantId` sale de `app_metadata.tenant_id` o del claim `tenant_id`. Nunca de argumentos GraphQL, URL, cabeceras personalizadas ni cuerpo de la petición.
- **Credencial rechazada**: cualquier token HMAC legado, token expirado, firma inválida, issuer/audiencia incorrectos o ausencia de credencial → `UNAUTHENTICATED`.

## 2. Operaciones retiradas

Las siguientes operaciones y sus tipos dejan de existir en el SDL:

| Operación | Tipo GraphQL retirado | Comportamiento esperado |
| --- | --- | --- |
| `me` | `CurrentUser` | Al consultarla, GraphQL responde con un error de validación de esquema (operación inexistente). No hay fallback HMAC. |
| `currentTenant` | `CurrentTenant` | Igual que `me`. |
| `bookCapability` | `BookCapability` | Igual que `me`; no se sustituye por otro gating en esta iteración. |

**Nota de alcance**: el campo `Tenant.plan` y el gating de suscripción Free/Pro (`SubscriptionGuard`) son ejes distintos y no se ven afectados. La licencia de módulo queda sin consumidor tras retirar `bookCapability`/`PlanGuard`.

## 3. Operaciones conservadas

### `viewer`

```graphql
query Viewer {
  viewer {
    sub
    email
    role
    aud
  }
}
```

- **Protección**: `@RequireAuth()`.
- **Uso**: comprobación de consistencia login ↔ API en `apps/book`.
- **Errores**: `UNAUTHENTICATED` si falta/expira/es inválido el token.

### `myBusiness`

```graphql
query MyBusiness {
  myBusiness {
    id
    name
    category
    tags
    status
    timezone
    currency
    isPublic
    profile {
      slug
      bio
      address
      phone
      instagram
      whatsapp
      logo
      cover
      policies { title body }
    }
    services {
      id
      name
      description
      durationMinutes
      priceCents
      currency
      category
      active
      requiresAdvance
      advanceKind
      advanceValue
    }
  }
}
```

- **Protección**: `@RequireAuth()`.
- **Alcance**: negocio derivado exclusivamente de `AuthUser.tenantId`.
- **Errores**:
  - Sin `tenant_id` en la identidad → `UNAUTHENTICATED`.
  - Negocio inexistente → `NOT_FOUND`.
  - Negocio con estado distinto de `active` → `FORBIDDEN`.
- **Invariante**: no acepta `tenantId`, `tenantSlug` ni ningún selector de negocio.

### `updateMyBusinessProfile`

- **Protección**: `@RequireAuth()`.
- **Alcance**: el negocio derivado del JWT, con la misma comprobación de estado que `myBusiness`.
- **Errores**: `UNAUTHENTICATED`, `NOT_FOUND`, `FORBIDDEN`, `VALIDATION_ERROR`, `CONFLICT`.

## 4. Operaciones públicas que no cambian

`tenant(slug)`, `tenants`, `searchBusinesses`, la disponibilidad pública, la reserva y las lecturas públicas de catálogo mantienen su contrato. No requieren credencial y no exponen datos privados del workspace.

## 5. Matriz de errores

| Condición | Código | Datos devueltos |
| --- | --- | --- |
| Sin credencial | `UNAUTHENTICATED` | Ninguno |
| Token HMAC legado | `UNAUTHENTICATED` | Ninguno |
| Token Supabase inválido/caducado | `UNAUTHENTICATED` | Ninguno |
| Identidad válida sin `tenant_id` | `UNAUTHENTICATED` | Ninguno |
| `tenant_id` apunta a negocio inexistente | `NOT_FOUND` | Ninguno |
| Negocio `draft`/`suspended` | `FORBIDDEN` | Ninguno |
| Negocio activo | — | `TenantObject` |
| Input inválido en actualización | `VALIDATION_ERROR` | Errores de campo |
| Slug duplicado en actualización | `CONFLICT` | Error inline |

## 6. Configuración

| Variable | Uso | Estado |
| --- | --- | --- |
| `SUPABASE_AUTH_URL` | Issuer + JWKS | Requerida por la API. |
| `DATABASE_URL` / `DIRECT_URL` | Persistencia | Sin cambios. |
| `FOUNDLY_PASS_SECRET` | HMAC legado | **Eliminada** de `.env`, `.env.example` y despliegue. |

## 7. Criterios de contrato verificables

1. El SDL generado no contiene `me`, `currentTenant` ni `bookCapability`.
2. Un token HMAC no autentica ninguna operación.
3. `myBusiness` con un token de A devuelve el negocio de A y nunca el de B, aunque la petición incluya un identificador de B.
4. `myBusiness` con un negocio inactivo devuelve `FORBIDDEN`.
5. `updateMyBusinessProfile` no permite cambiar el negocio objetivo.
6. Las operaciones públicas siguen respondiendo sin token.
