---
description: "Tasks for tenant status enforcement and subscription plan gating"
---

# Tasks: Tenant Status Enforcement & Subscription Plan Gating

**Input**: `specs/api/022-tenant-status-plan-gating/`

- [X] T001 Create the short-lived tenant status cache in `apps/api/src/modules/auth/tenant-status.cache.ts`
- [X] T002 Create `TenantStatusGuard` with Prisma lookup and `FORBIDDEN` for non-active tenants in `apps/api/src/modules/auth/tenant-status.guard.ts`
- [X] T003 Create the `@AllowInactiveTenant()` decorator in `apps/api/src/modules/auth/tenant-status.decorators.ts`
- [X] T004 Compose `SupabaseJwtGuard` + `TenantStatusGuard` inside `@RequireAuth()` in `apps/api/src/modules/auth/jwt.decorators.ts`
- [X] T005 Compose `SupabaseJwtGuard` + `TenantStatusGuard` + `SubscriptionGuard` inside `@RequiresSubscription()` in `apps/api/src/modules/subscription/subscription.decorators.ts`
- [X] T006 Register and export the guard/cache in `apps/api/src/modules/auth/auth.module.ts`
- [X] T007 Mark `viewer` and `mySubscription` with `@AllowInactiveTenant()`
- [X] T008 Add unit coverage for the cache and guard in `apps/api/src/modules/auth/tenant-status.guard.spec.ts`
- [X] T009 Add e2e coverage for suspended tenants in `apps/api/src/modules/auth/jwt.resolver.spec.ts`
- [X] T010 Update existing API e2e fake Prisma clients to return an active tenant
- [X] T011 Update `apps/book/README.md` from Next.js to React 19 + Vite and `VITE_*`
- [X] T012 Audit active backend configuration for `FOUNDLY_PASS_SECRET`
- [X] T013 Run API typecheck, lint, tests and build
- [X] T014 Run Book typecheck and lint
