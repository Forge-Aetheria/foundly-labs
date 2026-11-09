# Contract: Tenant Status & Plan Gating

**Feature**: `specs/api/022-tenant-status-plan-gating` | **Date**: 2026-11-09

## 1. Orden de guards

```text
SupabaseJwtGuard → TenantStatusGuard → [SubscriptionGuard] → resolver
```

`TenantStatusGuard` solo se ejecuta si existe `AuthUser.tenantId` y la operación no está marcada con `@AllowInactiveTenant()`.

## 2. Comportamiento del guard de estado

| Condición | Resultado |
| --- | --- |
| Tenant `active` | Continúa. |
| Tenant `draft` o `suspended` | `FORBIDDEN`. |
| Tenant inexistente | `FORBIDDEN`. |
| Identidad sin `tenantId` | No bloquea; decide la operación. |
| Operación con `@AllowInactiveTenant()` | No bloquea. |
| Operación pública | El guard no se aplica. |
| Caché vigente | Usa el estado cacheado sin consultar la BD. |
| Caché expirada | Reconsulta y actualiza. |

## 3. Excepciones

- `viewer`: validación de identidad/login.
- `mySubscription`: consulta y renovación de suscripción.
- Operaciones de plataforma (`@RequireSuperAdmin()`): no dependen de tenant.

## 4. Gating por plan

- Eje: `SubscriptionPlan` (`FREE`/`PRO`) y `SubscriptionGuard`.
- Decorador: `@RequiresSubscription(SubscriptionPlan.PRO)`.
- Free → `PLAN_LIMIT_REACHED`.
- Pro → permite.
- Tenant suspendido → `FORBIDDEN` antes del chequeo de plan.
- Operación sin decorador → sin gating de tier.

## 5. Criterios verificables

1. Un tenant `suspended` no puede listar agenda/catálogo/notificaciones.
2. `viewer` y `mySubscription` siguen funcionando para un tenant suspendido.
3. El guard no consulta la BD en cada petición dentro del TTL.
4. Un tenant suspendido + operación Pro devuelve `FORBIDDEN`, no `PLAN_LIMIT_REACHED`.
5. Las operaciones públicas no cambian.
