# Implementation Plan: Tenant Status Enforcement & Subscription Plan Gating

**Branch**: `022-tenant-status-plan-gating` | **Date**: 2026-11-09 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/api/022-tenant-status-plan-gating/spec.md`

## Summary

Cerrar el último hueco de autorización de la API: además de verificar el JWT de Supabase, toda operación protegida comprobará que el tenant del usuario esté `active` antes de ejecutar el resolver. La comprobación se implementa como `TenantStatusGuard` compuesto dentro de `@RequireAuth()` y `@RequiresSubscription()`, con un caché en memoria de TTL corto y excepciones explícitas para `viewer`, `mySubscription` y operaciones de plataforma. El gating de tier se resuelve reutilizando `SubscriptionGuard`/`subscriptionPlan` (FREE/PRO), sin reintroducir `Tenant.plan`. Se actualiza la documentación de Book y se audita la configuración residual.

## Technical Context

**Language/Version**: TypeScript 5.9 estricto, Node.js 20+, NestJS 11

**Primary Dependencies**: `@nestjs/graphql`, Prisma (`@foundly/database`), `jose` (JWT ya existente), `SubscriptionGuard`/`SubscriptionService` existentes

**Storage**: PostgreSQL vía Prisma; sin cambios de esquema. Caché en memoria del proceso para el estado del tenant.

**Testing**: Vitest en API (unitarios de guard/caché y e2e DB-free con Prisma/JWT sustituidos); gates de Book para documentación/build.

**Target Platform**: Servidor Node.js; sin cambios de UI.

**Project Type**: Monorepo — backend NestJS + documentación de SPA Book.

**Performance Goals**: máximo una consulta de estado por tenant dentro de la ventana de caché (TTL 30 s); cero consultas adicionales para operaciones públicas.

**Constraints**: sin nuevas dependencias; sin cambios de esquema; el guard no debe romper `viewer`, `mySubscription`, Super Admin ni endpoints públicos; errores estables `FORBIDDEN`/`PLAN_LIMIT_REACHED`.

**Scale/Scope**: un guard nuevo, un caché pequeño, composición de decoradores existentes, tests y documentación; no se aplica gating de producto a endpoints concretos sin decisión explícita.

## Constitution Check

| Principle | Gate | Status |
| --- | --- | --- |
| §1 / §2.III | Spec en `specs/api/022-…`, referencia `specs/business-model.md`, subordinada a gobernanza global | PASS |
| §5.I SDD | Spec y plan antes de código | PASS |
| §5.IV Strict typing | Guards y caché tipados; sin `any` | PASS |
| §5.VI Data layer | Sin cambios de UI ni servicios de Book; solo README | PASS |
| §5.VII Reuse | Se reutiliza `SubscriptionGuard`, `SubscriptionService`, `SupabaseJwtGuard`, `AuthUser` y Prisma | PASS |
| §3 Monorepo | Sin imports entre apps; sin cambios en `packages/*` | PASS |
| §6/§7 | Sin cambios visuales ni rutas | PASS (N/A) |
| code-rules §10 | API mantiene `*.spec.ts` colocalizados; Book no añade tests de UI | PASS |

Sin violaciones que justifiquen `Complexity Tracking`.

**Post-design re-check (Phase 1)**: PASS — el guard se compone en los decoradores existentes, no duplica lógica de tenant en cada resolver, no cambia el esquema y mantiene las excepciones de identidad/suscripción.

## Project Structure

### Documentation (this feature)

```text
specs/api/022-tenant-status-plan-gating/
├── plan.md
├── research.md
├── data-model.md
├── contracts/
│   └── tenant-plan-gating.contract.md
├── quickstart.md
├── checklists/requirements.md
└── spec.md
```

### Source Code (repository root)

```text
apps/api/src/modules/auth/
├── tenant-status.cache.ts          # NUEVO: caché TTL por tenantId
├── tenant-status.guard.ts          # NUEVO: consulta/caché + FORBIDDEN
├── tenant-status.decorators.ts     # NUEVO: @AllowInactiveTenant()
├── jwt.decorators.ts               # @RequireAuth() compone SupabaseJwtGuard + TenantStatusGuard
├── jwt.guard.ts                    # sin cambios
├── jwt.service.ts                  # sin cambios
└── *.spec.ts                       # tests del guard/caché y composición

apps/api/src/modules/subscription/
├── subscription.decorators.ts      # @RequiresSubscription() añade TenantStatusGuard antes del tier
└── subscription.guard.ts           # sin cambios de contrato

apps/api/src/modules/auth/jwt.resolver.ts       # @AllowInactiveTenant() para viewer
apps/api/src/modules/subscription/subscription.resolver.ts  # @AllowInactiveTenant() para mySubscription

apps/book/README.md                 # actualizar Next.js → React/Vite y VITE_* 
apps/api/.env.example               # solo verificación (ya limpio)
render.yaml                         # solo verificación (ya limpio)
```

## Complexity Tracking

> Sin violaciones que justificar.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| — | — | — |
