# Phase 1 — Data Model (cliente y caché)

Este documento describe el modelo de datos **del cliente SPA**: sesión, claves de caché, contratos de servicio y entidades de dominio consumidas. No redefine el esquema de base de datos (propiedad de `apps/api` / `@foundly/database`).

## 1. Entidades de dominio (vista cliente)

Las entidades de dominio existentes en `apps/book/src/shared/types/` se conservan. Se listan con sus campos principales y reglas de validación relevantes.

### Session
- `userId: string`
- `role: 'admin' | 'professional'` (derivado de `tenant_id`; rol de plataforma aparte)
- `tenantId?: string`
- `status: 'loading' | 'anonymous' | 'authenticated' | 'missing-tenant'`
- **Reglas**: `tenantId` se lee de `app_metadata.tenant_id` (fallback `tenant_id`). Sin `tenantId`, el usuario no puede operar el panel (se le redirige a onboarding).

### Tenant / Business
- `id`, `name`, `slug`, `category`, `tags`, `status` (`active|suspended|draft`), `isPublic`, `currency`, `timezone`
- Perfil: `logo`, `cover`, `bio`, `address`, `phone`, `instagram`, `whatsapp`, `policies[]`
- **Reglas**: la resolución del tenant autenticado proviene de la sesión, nunca de la URL. El portal público resuelve por `slug`.

### Appointment
- `id`, `tenantId`, `serviceId`, `specialistId`, `clientName`, `clientContact`
- `startAt`, `endAt`, `status` (`pending|confirmed|cancelled|completed`)
- `appliedDurationMinutes`, `appliedAmountCents`, `appliedCurrency`, `origin` (`online|admin`)
- `notes`, `cancellationReason`, `payment*`, `notifications[]`
- **Reglas**: las transiciones de estado las valida la API; la UI solo ofrece transiciones soportadas.

### Service / Rate
- `id`, `name`, `description`, `durationMinutes`, `category`, `active`, `requiresAdvance`, `advanceKind`, `advanceValue`
- `Rate`: `amountCents`, `currency`, vigencia.
- **Reglas**: duración mínima y precio válidos según `services/utils/schemas.ts`.

### Resource (Staff)
- `id`, `name`, `active`, servicios asignados.
- **Reglas**: un profesional solo opera su propia agenda en la UI (el backend valida el alcance por tenant; el scoping por profesional es validación de UX).

### AvailabilityRule / TimeBlock
- Reglas semanales por día y franja; bloqueos con fecha/hora y motivo.
- **Reglas**: franjas válidas (inicio < fin), sin solapamientos dentro del mismo recurso (validación UI + API).

### PaymentMethod / PaymentProof
- `type`, `title`, `details[]`, `instructions`, `active`
- Proof: `methodType`, `amountCents`, `reference`, `proofUrl`, `submittedAt`
- **Reglas**: formato `PNG/JPG/WEBP`, tamaño máximo 5 MB.

### Review
- `id`, `author`, `rating` (1–5), `comment`, `state` (`pending|approved|rejected`), `createdAt`
- **Reglas**: rating entero en rango; comentario requerido según schema.

### Notification
- `id`, `kind`, `message`, `channel`, `read`, `createdAt`
- **Reglas**: la bandeja comparte estado entre cabecera y página; límite de 100 ítems.

### GalleryPhoto
- `id`, `url`, `category`, `caption?`
- **Reglas**: categoría válida; imagen validada antes de subir.

### OnboardingDraft
- `account { fullName, email, password }`, `business { name, category, slug }`
- **Reglas**: email válido; password mínima; slug normalizado y disponible; categoría de la lista canónica.

## 2. Resultado de servicio (transporte)

```ts
type ErrorCode =
  | 'UNAUTHENTICATED' | 'FORBIDDEN' | 'NOT_FOUND' | 'CONFLICT'
  | 'VALIDATION_ERROR' | 'STATE_ERROR' | 'EMAIL_TAKEN' | 'SLUG_TAKEN';

type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: ErrorCode; message: string; fields?: Record<string,string> } };
```

**Reglas**:
- Los servicios nunca lanzan por errores de API; devuelven `ActionResult` con mensaje localizado.
- Los hooks convierten `ActionResult` fallido en un `Error` tipado (`AppQueryError`) para que TanStack Query lo gestione, o devuelven el `ActionResult` en mutaciones de formulario (decisión por hook, documentada en el contrato).
- `UNAUTHENTICATED` dispara el evento global de sesión expirada.

## 3. Claves de caché (TanStack Query)

Convención canónica centralizada en `shared/api/query-client.ts`.

| Dominio | Clave | Invalidada por |
|---|---|---|
| Sesión/workspace | `['workspace', tenantId]` | login/logout, cambio de identidad |
| Agenda | `['agenda', tenantId, from, to, resourceId]` | crear/editar/cancelar/reprogramar cita |
| Servicios | `['services', tenantId]` | CRUD servicio |
| Personal | `['staff', tenantId]` | CRUD/estado personal |
| Disponibilidad | `['availability', tenantId, resourceId]` | guardar reglas |
| Bloqueos | `['time-blocks', tenantId]` | añadir/quitar bloqueo |
| Galería | `['gallery', tenantId]` | añadir/quitar foto |
| Perfil | `['profile', tenantId]` | actualizar perfil |
| Pagos | `['payments', tenantId]` | upsert/delete método |
| Reseñas | `['reviews', tenantId, state]` | moderar/eliminar/reseña pública |
| Notificaciones | `['notifications', tenantId, filter]` | marcar leída/todas/eliminar |
| Directorio | `['directory', query, category]` | (sin mutaciones; invalidación manual) |
| Portal público | `['public-business', slug]` | reserva/reseña |
| Super admin | `['platform-metrics']`, `['managed-businesses', query, page]` | override suscripción |

**Reglas**:
- Toda clave incluye `tenantId` (o `slug` en público) para evitar fugas entre tenants.
- Tras `signOut` o sesión expirada: `queryClient.clear()`.
- Las mutaciones invalidan por prefijo del dominio afectado.

## 4. Estados y transiciones

### Session status

```text
loading ──(sesión válida con tenant)──► authenticated
   │                        │
   │                        └──(sin tenant)──► missing-tenant
   └──(sin sesión)──► anonymous
authenticated ──(signOut / UNAUTHENTICATED)──► anonymous
```

### Query state

```text
idle ──► loading ──► success
                 └─► error ──(retry/invalidate)──► loading
```

### Mutation state

```text
idle ──► pending ──► success ──(invalidar)──► refetch
                  └─► error ──(mostrar inline/transient)
```

**Reglas**:
- `pending` deshabilita el submit (anti doble envío).
- `error` se clasifica con `errorSurface(code)` en `session | transient | inline`.
- `session` → limpieza + redirección a login.

## 5. Modelo de rutas (resumen)

La tabla completa está en [`contracts/routes.contract.md`](./contracts/routes.contract.md).

- Públicas: `/`, `/negocios`, `/businesses`, `/:tenantSlug`, `/login`, `/register` (redirect), `/onboarding`, `/privacy`, `/terms`.
- Protegidas: `/admin`, `/admin/agenda`, `/admin/availability`, `/admin/services`, `/admin/staff`, `/admin/gallery`, `/admin/profile` (redirect), `/admin/configuracion`, `/admin/reviews`, `/admin/notificaciones`, `/admin/seguridad`, `/admin/soporte`, `/admin/acerca`.
- Plataforma: `/super-admin`.
- Fallback: `*` → 404.

## 6. Contrato de onboarding (nuevo)

Entrada de `registerBusiness` (ver contrato dedicado):

```ts
type RegisterBusinessInput = {
  account: { fullName: string; email: string; password: string };
  business: { name: string; category: TenantCategory; slug: string };
};
type RegisterBusinessResult = { tenantId: string };
```

**Reglas**:
- Email único → `EMAIL_TAKEN`.
- Slug único y normalizado → `SLUG_TAKEN` / `VALIDATION_ERROR`.
- La vinculación `tenant_id` ocurre solo en el backend.
- El cliente no recibe ni maneja `service role`.
