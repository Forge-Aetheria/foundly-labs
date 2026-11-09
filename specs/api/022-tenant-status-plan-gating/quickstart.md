# Quickstart & Validation Guide

**Feature**: `specs/api/022-tenant-status-plan-gating` | **Date**: 2026-11-09

## Prerequisites

- Node.js 20+, dependencias instaladas.
- `apps/api/.env` con `SUPABASE_AUTH_URL`, `DATABASE_URL` y `DIRECT_URL`.
- Un tenant de prueba `active` y otro `suspended`/`draft` con usuarios vinculados en Supabase.

## 1. Tests automáticos

```bash
corepack pnpm --filter @foundly/api test
corepack pnpm --filter @foundly/api typecheck
corepack pnpm --filter @foundly/api lint
corepack pnpm --filter @foundly/api build
```

Resultado esperado: guard unitario y e2e en verde; operaciones protegidas de tenant suspendido devuelven `FORBIDDEN`; `viewer`/`mySubscription` siguen funcionando.

## 2. Validación manual de estado

1. Iniciar sesión con el tenant `active` y ejecutar una operación protegida (`myAppointments`, `myServices`, `notifications`). Debe responder.
2. Cambiar el tenant a `suspended` en la base de datos.
3. Repetir la operación: debe devolver `FORBIDDEN` sin ejecutar el resolver.
4. Consultar `viewer` y `mySubscription`: deben seguir respondiendo.
5. Volver a `active` y esperar el TTL de 30 s: la operación vuelve a funcionar.
6. Probar una operación pública sin token: debe seguir funcionando.

## 3. Validación de plan

Aplicar temporalmente `@RequiresSubscription(SubscriptionPlan.PRO)` a una operación de prueba o usar los tests del guard:

- Free → `PLAN_LIMIT_REACHED`.
- Pro → permite.
- Suspendido → `FORBIDDEN` antes del chequeo de plan.
- Sin decorador → sin gating.

## 4. Limpieza documental

```bash
# Configuración activa del backend: sin coincidencias
rg "FOUNDLY_PASS_SECRET" apps/api render.yaml

# README de Book: sin instrucciones operativas de Next.js
rg "next|NEXT_PUBLIC" apps/book/README.md
```

Resultado esperado: el secreto solo puede aparecer en specs históricas; el README describe React 19 + Vite y `VITE_*`.

## 5. Gates finales

```bash
corepack pnpm --filter @foundly/api typecheck
corepack pnpm --filter @foundly/api lint
corepack pnpm --filter @foundly/api test
corepack pnpm --filter @foundly/api build
corepack pnpm --filter @foundly/book typecheck
corepack pnpm --filter @foundly/book lint
corepack pnpm --filter @foundly/book test
corepack pnpm --filter @foundly/book build
```

Resultado esperado: todo en verde, sin regresiones en Book.
