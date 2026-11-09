# Feature Specification: Tenant Status Enforcement & Subscription Plan Gating

**Feature Branch**: `022-tenant-status-plan-gating`

**Created**: 2026-11-09

**Status**: Draft

**Input**: Cerrar los cabos sueltos de auth/licencias tras la migración a Supabase Auth: bloquear globalmente tenants suspendidos/draft, dejar operativo el gating por tier reutilizando `SubscriptionGuard` y limpiar documentación/configuración residual.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Un negocio suspendido no puede operar el panel (Priority: P1)

Un administrador con una sesión válida pero cuyo negocio está `suspended` o `draft` intenta usar cualquier operación privada del panel. La API rechaza la operación con `FORBIDDEN`, salvo las operaciones necesarias para consultar la suscripción o validar la identidad.

**Why this priority**: Es el hueco de seguridad más relevante: hoy el token es válido y el workspace se bloquea, pero agenda, catálogo, notificaciones y pagos siguen respondiendo para un negocio no operable.

**Independent Test**: Autenticarse con un negocio `active` y comprobar acceso normal; cambiar el negocio a `suspended` y verificar que las operaciones privadas devuelven `FORBIDDEN`, mientras `viewer` y `mySubscription` siguen disponibles.

**Acceptance Scenarios**:

1. **Given** un tenant `active`, **When** su administrador ejecuta una operación protegida, **Then** la operación continúa con normalidad.
2. **Given** un tenant `suspended` o `draft`, **When** su administrador ejecuta cualquier operación protegida que no esté exceptuada, **Then** recibe `FORBIDDEN` y no se ejecuta la lógica del resolver.
3. **Given** un tenant `suspended`, **When** su administrador consulta `viewer` o `mySubscription`, **Then** la operación sigue disponible para que pueda validar su identidad y gestionar la renovación.
4. **Given** una operación pública, **When** se invoca sin sesión, **Then** no se aplica el guard de estado y el comportamiento público no cambia.

---

### User Story 2 - Gating por tier de suscripción reutilizable (Priority: P2)

El equipo de producto puede restringir una operación a un tier de suscripción (`FREE`/`PRO`) usando el eje ya existente de `subscriptionPlan`, sin reintroducir el antiguo `Tenant.plan` ni un segundo concepto de plan.

**Why this priority**: La infraestructura de tiers existe (`SubscriptionGuard`) pero no se usa en ningún resolver; sin una composición clara y probada, el gating por plan vuelve a quedar como código muerto.

**Independent Test**: Aplicar `@RequiresSubscription(SubscriptionPlan.PRO)` a una operación de prueba/resolver existente y comprobar que Free → `PLAN_LIMIT_REACHED`, Pro → permite, y un tenant suspendido → `FORBIDDEN` antes del chequeo de plan.

**Acceptance Scenarios**:

1. **Given** un tenant Free efectivo, **When** invoca una operación marcada como Pro, **Then** recibe `PLAN_LIMIT_REACHED` y no se ejecuta el resolver.
2. **Given** un tenant Pro efectivo, **When** invoca la misma operación, **Then** se ejecuta normalmente.
3. **Given** un tenant suspendido, **When** invoca una operación Pro, **Then** el estado del tenant se evalúa antes y devuelve `FORBIDDEN`.
4. **Given** una operación sin decorador de plan, **When** se invoca, **Then** no se aplica ningún gating por tier.

---

### User Story 3 - Configuración y documentación sin restos del auth legado (Priority: P3)

El equipo de operaciones revisa la configuración y la documentación y no encuentra secretos HMAC activos ni instrucciones de Next.js obsoletas en Book.

**Why this priority**: Evita que un operador configure variables muertas o siga instrucciones que ya no corresponden a la SPA actual.

**Independent Test**: Buscar `FOUNDLY_PASS_SECRET` en la configuración activa y `next`/`NEXT_PUBLIC_*` en `apps/book/README.md`; el resultado debe ser cero referencias activas.

**Acceptance Scenarios**:

1. **Given** el repositorio, **When** se audita la configuración del backend, **Then** no hay `FOUNDLY_PASS_SECRET` en `.env.example`, `render.yaml` ni código de producción; solo puede aparecer en specs históricas como deprecación.
2. **Given** `apps/book/README.md`, **When** se revisa, **Then** describe React 19 + Vite, variables `VITE_*` y el flujo de sesión Supabase, sin instrucciones de Next.js.

---

### Edge Cases

- Usuario con identidad válida pero sin `tenant_id`: el guard de estado no debe romper operaciones de plataforma ni `viewer`; las operaciones que requieren tenant fallan con el error existente.
- Tenant eliminado entre la validación del token y la consulta de estado: se trata como no operable y se deniega.
- Caché de estado obsoleta: un cambio de `suspended` a `active` (o viceversa) debe reflejarse en un plazo corto y acotado.
- Operación exceptuada (`viewer`, `mySubscription`) sobre tenant inexistente: mantiene el comportamiento actual de su servicio.
- Super Admin sin tenant: las operaciones de plataforma no deben quedar bloqueadas por el guard de estado.
- `RequiresSubscription` y `TenantStatusGuard` juntos: el orden produce `FORBIDDEN` antes que `PLAN_LIMIT_REACHED` cuando el tenant no está activo.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El backend MUST comprobar el estado del tenant en toda operación protegida que derive su alcance de `AuthUser.tenantId`.
- **FR-002**: El estado aceptado MUST ser únicamente `active`; `draft`, `suspended`, inexistente o no resoluble MUST devolver `FORBIDDEN`.
- **FR-003**: La comprobación MUST ejecutarse después de verificar el JWT y antes de la lógica del resolver.
- **FR-004**: La comprobación MUST usar un caché de corta duración por `tenantId` para evitar una consulta a base de datos en cada petición.
- **FR-005**: MUST existir una vía explícita de excepción para operaciones de identidad y gestión de suscripción (`viewer`, `mySubscription`) y para operaciones de plataforma sin tenant.
- **FR-006**: Las operaciones públicas MUST permanecer sin autenticación y sin comprobación de estado.
- **FR-007**: El gating por plan MUST reutilizar el eje `subscriptionPlan` (`FREE`/`PRO`) y `SubscriptionGuard`; no se reintroduce `Tenant.plan` como licencia de módulo.
- **FR-008**: El decorador de plan MUST componer la verificación JWT, el estado del tenant y el tier en ese orden.
- **FR-009**: Una operación sin decorador de plan MUST seguir funcionando sin gating de tier.
- **FR-010**: La infraestructura de plan MUST quedar documentada y probada para que producto pueda aplicarla a operaciones concretas sin modificar el mecanismo.
- **FR-011**: `FOUNDLY_PASS_SECRET` MUST NOT aparecer en configuración activa del backend; las specs históricas pueden conservarlo como registro de deprecación.
- **FR-012**: `apps/book/README.md` MUST describir la arquitectura SPA React/Vite y las variables `VITE_*`, sin referencias operativas a Next.js.

### Key Entities

- **Tenant status**: estado operativo del negocio (`active`, `draft`, `suspended`); determina si las operaciones privadas están permitidas.
- **Tenant status cache**: entrada temporal por `tenantId` con estado y expiración corta.
- **Subscription tier**: `FREE`/`PRO` derivado de `subscriptionPlan`, `subscriptionStatus` y `subscriptionExpiresAt`; gobierna `SubscriptionGuard`.
- **Protected operation**: operación GraphQL que requiere identidad y, salvo excepción, tenant operable.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El 100% de las operaciones protegidas con `tenantId` rechaza tenants `suspended`/`draft` con `FORBIDDEN`.
- **SC-002**: Las operaciones exceptuadas (`viewer`, `mySubscription`) siguen funcionando para un tenant suspendido.
- **SC-003**: El guard añade como máximo una consulta a base de datos por tenant dentro de la ventana de caché (no una por petición).
- **SC-004**: Una operación Pro produce `PLAN_LIMIT_REACHED` para Free y se ejecuta para Pro; con tenant suspendido produce `FORBIDDEN`.
- **SC-005**: La auditoría de configuración devuelve cero referencias a `FOUNDLY_PASS_SECRET` en `.env.example`, `render.yaml` y código de producción.
- **SC-006**: `apps/book/README.md` no contiene instrucciones operativas de Next.js ni variables `NEXT_PUBLIC_*`.
- **SC-007**: Typecheck, lint, tests y build de API y Book pasan sin regresiones.

## Governance

Esta especificación se subordina a `specs/business-model.md` (licenciamiento Foundly Pass, tiers Free/Pro y reglas del ecosistema), `constitution.md` (SDD, tipado estricto y reutilización), `specs/architecture.md` (topología y variables) y `code-rules.md`. Reutiliza el eje de suscripción ya ratificado en `specs/api/017-subscription-plans` y no reintroduce el mecanismo HMAC retirado en `specs/api/021-supabase-auth-tenant-hardening`.

## Assumptions

- El tier de suscripción es el eje Free/Pro ya existente; `Tenant.plan` queda como dato histórico sin gating en esta iteración.
- `viewer` y `mySubscription` deben seguir disponibles para tenants no operables por razones de soporte y renovación.
- El caché de estado puede ser en memoria del proceso; no se requiere Redis ni infraestructura adicional.
- Los endpoints públicos, la reserva pública y el directorio no cambian.
- La aplicación de gating a operaciones concretas de reservas/catálogo queda a decisión de producto; esta iteración deja el mecanismo listo y probado.
