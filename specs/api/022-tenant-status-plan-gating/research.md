# Research: Tenant Status Enforcement & Subscription Plan Gating

**Feature**: `specs/api/022-tenant-status-plan-gating` | **Date**: 2026-11-09

## R1. Caché del estado del tenant

- **Decision**: caché en memoria por proceso, `Map<tenantId, { status, expiresAt }>`, TTL 30 s. En cada acierto se evita la consulta; en fallo o expiración se consulta `tenant.findUnique`.
- **Rationale**: el estado cambia con poca frecuencia y 30 s acota el desfase de una suspensión sin añadir Redis ni una dependencia. Es suficiente para el volumen actual y mantiene el guard barato.
- **Alternatives considered**: consultar en cada petición (rechazado por coste), Redis (rechazado por infraestructura innecesaria), caché sin TTL (rechazado por riesgo de suspensión indefinida).

## R2. Composición del guard

- **Decision**: `TenantStatusGuard` se aplica dentro de `@RequireAuth()` después de `SupabaseJwtGuard` y antes del resolver. `@RequiresSubscription()` compone `SupabaseJwtGuard → TenantStatusGuard → SubscriptionGuard`. Se añade `@AllowInactiveTenant()` como metadata de excepción.
- **Rationale**: un único punto de composición evita olvidar el guard en cada resolver y garantiza que un tenant suspendido reciba `FORBIDDEN` antes de cualquier lógica de plan.
- **Alternatives considered**: aplicar el guard manualmente en cada resolver (rechazado por fácil de olvidar), fusionarlo dentro de `SupabaseJwtGuard` (rechazado: mezcla autenticación con autorización y obliga a consultar la BD incluso en operaciones de plataforma).

## R3. Identidades sin tenant

- **Decision**: si `AuthUser.tenantId` no existe, el guard no bloquea; la operación decide. `viewer` y las operaciones de plataforma siguen funcionando. Las operaciones que requieren tenant fallan con su error existente.
- **Rationale**: hay identidades de plataforma y flujos de soporte sin tenant. Bloquearlas en el guard rompería `viewer` y el panel de Super Admin.
- **Alternatives considered**: exigir tenant a toda identidad (rechazado: rompe plataforma), bloquear solo si el tenant no existe (rechazado: deja pasar identidades sin vínculo a operaciones que asumen tenant).

## R4. Excepciones explícitas

- **Decision**: `viewer` y `mySubscription` se marcan con `@AllowInactiveTenant()`. El resto de operaciones protegidas quedan sujetas al estado.
- **Rationale**: un tenant suspendido debe poder validar su identidad y consultar/renovar su suscripción. El resto del panel no debe operar.
- **Alternatives considered**: excepción global por módulo (rechazado: demasiado amplia), sin excepciones (rechazado: impediría la renovación y el gate de login).

## R5. Gating por plan: eje único

- **Decision**: reutilizar `SubscriptionPlan` (`FREE`/`PRO`) y `SubscriptionGuard`/`@RequiresSubscription()`; no se reintroduce `Tenant.plan` como licencia de módulo. No se aplica a ningún resolver concreto en esta iteración sin política de producto.
- **Rationale**: el eje Free/Pro ya está ratificado en `017-subscription-plans`; duplicar con `Tenant.plan` confunde dos conceptos y reintroduce deuda del auth legado.
- **Alternatives considered**: nuevo `PlanGuard` sobre `Tenant.plan` (rechazado: dos ejes y campo sin semántica), aplicar Pro a endpoints por intuición (rechazado: decisión de producto no ratificada).

## R6. Limpieza documental

- **Decision**: actualizar `apps/book/README.md` a React 19 + Vite y `VITE_*`; verificar que `FOUNDLY_PASS_SECRET` solo permanece en specs históricas como deprecación.
- **Rationale**: evita instrucciones operativas falsas y configuración muerta.
- **Alternatives considered**: reescribir las specs 006/008 (rechazado: son registro histórico y no configuración activa).
