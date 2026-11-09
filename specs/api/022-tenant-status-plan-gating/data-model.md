# Data Model: Tenant Status Enforcement & Subscription Plan Gating

**Feature**: `specs/api/022-tenant-status-plan-gating` | **Date**: 2026-11-09

No hay cambios en `packages/database/prisma/schema.prisma` ni migraciones.

## 1. Tenant status (persistido, sin cambios)

| Campo | Tipo | Regla |
| --- | --- | --- |
| `Tenant.id` | `string` | Identificador del negocio. |
| `Tenant.status` | `string` | Solo `active` permite operaciones privadas; `draft`/`suspended` → `FORBIDDEN`. |
| `Tenant.subscriptionPlan` | `FREE \| PRO` | Eje de tier existente, gobernado por `SubscriptionGuard`. |
| `Tenant.subscriptionStatus` / `subscriptionExpiresAt` | `string` / `DateTime?` | Determinan el plan efectivo (fail-closed). |

## 2. Tenant status cache (runtime, no persistido)

| Campo | Tipo | Regla |
| --- | --- | --- |
| `tenantId` | `string` | Clave del caché. |
| `status` | `string` | Último estado consultado. |
| `expiresAt` | `number` | `Date.now() + 30_000`. |

**Regla**: una entrada expirada se descarta y se vuelve a consultar. No se cachea una ausencia de tenant como estado válido; se trata como no operable.

## 3. Identidad y alcance

`AuthUser.tenantId` sigue siendo la única fuente de alcance. El guard no acepta `tenantId` de argumentos, URL o cabeceras.

## 4. Gating por plan

`SubscriptionGuard` evalúa el plan efectivo ya existente. `@RequiresSubscription(SubscriptionPlan.PRO)` se compone después del guard de estado. No se crea una entidad nueva ni se modifica `Tenant.plan`.

## 5. Invariantes

- Tenant `active` + operación no exceptuada → permitido.
- Tenant `draft`/`suspended` + operación no exceptuada → `FORBIDDEN`.
- `viewer`/`mySubscription` → permitidos aunque el tenant no esté activo.
- Identidad sin tenant → el guard no bloquea; la operación decide.
- Tenant suspendido + operación Pro → `FORBIDDEN` antes de `PLAN_LIMIT_REACHED`.
