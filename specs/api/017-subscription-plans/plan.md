# Implementation Plan: Foundly API — Subscription Plans (Free vs. Pro) & Plan Limits Enforcement

**Branch**: `017-subscription-plans` | **Date**: 2026-10-14 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/api/017-subscription-plans/spec.md`

## Summary

Introduce the monetization foundation in the Foundly API: (1) a **subscription tier** on the business — a `SubscriptionPlan` enum (`FREE` | `PRO`), a `SubscriptionStatus`, and an optional expiry, defaulting every business to Free/active in **one migration**; (2) an **effective-plan** rule (Pro only when plan is Pro, status is active and not expired, else Free — fail-closed); (3) **count-based plan limits** enforced on the catalog surfaces the admin app actually uses — `createMyService`/`updateMyService` (activation) and `createMySpecialist`/`updateMySpecialist` (activation) — plus the legacy public `createService`/`updateService` and `createSpecialist`/`updateSpecialist` paths, rejecting over-limit Free operations with the stable domain error `PLAN_LIMIT_REACHED` and creating nothing; (4) a reusable **`SubscriptionGuard` + `@RequiresSubscription()`** decorator for Pro-only operations (metrics/analytics, advanced advance/notification rules), distinct from the existing module-license `PlanGuard`/`@RequirePlan`; and (5) an authenticated, tenant-scoped **`mySubscription`** read exposing the effective plan, status, expiry and per-limit usage. Counting is restricted to **active** records, existing over-limit assets are grandfathered, and the tier is additive to the existing module-entitlement `plan` field. **No new dependencies.**

## Technical Context

**Language/Version**: TypeScript 5.9 (strict) · NestJS 11 · Node ≥ 20.

**Primary Dependencies**: `@nestjs/graphql` (code-first), `@foundly/database` (Prisma 6), `jose` (identity via the global `AuthModule`). **No new dependencies.**

**Storage**: PostgreSQL via Prisma. New enums `SubscriptionPlan`/`SubscriptionStatus` and 3 columns on `Tenant` (`subscriptionPlan`, `subscriptionStatus`, `subscriptionExpiresAt`) → **one new migration**, no backfill required (defaults/nullable). The existing `Tenant.plan` (module/Foundly Pass entitlement) is **kept unchanged**.

**Testing**: Vitest — unit (subscription service/guard against an in-memory store; catalog/services/specialists with the limit check) and e2e (`AppModule` + local JWKS + memory store). `tsc --noEmit`; `nest build`; root ESLint; `@foundly/database` schema test.

**Target Platform**: NestJS HTTP/GraphQL server (`apps/api`).

**Project Type**: Web service (GraphQL API).

**Performance Goals**: a limit check is two indexed counts (`Service(tenantId, active)` / `Specialist(tenantId, active)`); the subscription summary is one tenant read + two counts. Writes remain single-row and tenant-scoped.

**Constraints**: strict TS, no `any`; tenant derived from the authenticated identity (or the existing public scope argument on legacy paths); limits count **active** records only; effective plan is fail-closed; `PLAN_LIMIT_REACHED` must be preserved by the error normalizer; downgrade/expiry never deletes existing assets.

**Scale/Scope**: 1 new module (`subscription`, ~7 files) + edits to `catalog`, `services`, `specialists` (limit enforcement) and `auth` (tier guard); 1 new domain error code; 2 new GraphQL enums, 1 query and a guard/decorator; 1 migration; 1 SDL snapshot sync.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **SDD (§5.I)** — spec + this plan exist; `tasks.md` downstream; no code before approval.
- **Dominio (§2.III)** — spec in `specs/api/`; changes confined to `apps/api` (+ Prisma schema/migration + schema test in `packages/database` + codegen snapshot in `apps/book`).
- **Tipado estricto (§5.IV)** — code-first enums/types, typed rows/inputs; no `any`; no hand-written client DTOs.
- **Opt-in protection (§5.II / 008)** — the summary read and the tier guard use `@RequireAuth` + `@AuthUser`; the public availability/booking surfaces stay untouched.
- **Capa de datos por módulo (§5.VI)** — the Book consumes `mySubscription` and the `PLAN_LIMIT_REACHED` error through its modules' `actions.ts`/`hooks.ts`; the API exposes codegen-friendly operations only.
- **Gates (§3.I)** — `build`, `typecheck`, `test`, lint for `@foundly/api` (+ `@foundly/database`) with zero regressions.
- **Test location (TODO(monorepo))** — `apps/api` keeps the NestJS colocated `*.spec.ts` convention; the `code-rules.md` §10 migration remains deferred (confirmed with the owner, 2026-10-13).
- **Governance (§1)** — subordinated to `specs/business-model.md` (Foundly Pass licensing and the Free/Pro progression) and `constitution.md`; the tier is additive to the module-entitlement axis, so no existing license behavior is changed.

**Pre-Phase-0**: PASS. **Post-Phase-1**: PASS (no violations → Complexity Tracking empty).

## Project Structure

### Documentation (this feature)

```text
specs/api/017-subscription-plans/
├── plan.md
├── spec.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── subscription-plans.contract.md
├── checklists/requirements.md
└── tasks.md                 # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
apps/api/src/modules/subscription/                 # NEW module
├── subscription.types.ts     # SubscriptionPlan/SubscriptionStatus enums (registerEnumType), SubscriptionObject, SubscriptionUsage, SubscriptionSummaryObject
├── subscription.store.ts     # SubscriptionStore seam + SUBSCRIPTION_STORE token + PrismaSubscriptionStore (tenant read + active counts)
├── subscription.test-store.ts# in-memory store
├── subscription.service.ts   # effective plan, summary, assertCanAddActiveService/Staff, assertPlan
├── subscription.guard.ts     # SubscriptionGuard + REQUIRED_SUBSCRIPTION_KEY
├── subscription.decorators.ts# @RequiresSubscription(...plans) (UseGuards(SupabaseJwtGuard, SubscriptionGuard))
├── subscription.resolver.ts  # mySubscription query (@RequireAuth)
├── subscription.module.ts    # exports SubscriptionService for consumers
└── subscription.*.spec.ts    # unit + e2e (NestJS colocated convention)

apps/api/src/modules/catalog/
├── catalog.service.ts        # + requireCanAddActiveService/Staff + requireCanActivate before create/update
└── catalog.module.ts         # imports SubscriptionModule

apps/api/src/modules/services/services.service.ts     # + limit check on createService and activation via updateService
apps/api/src/modules/specialists/specialists.service.ts# + limit check on createSpecialist and activation via updateSpecialist
apps/api/src/modules/services/services.module.ts       # imports SubscriptionModule
apps/api/src/modules/specialists/specialists.module.ts # imports SubscriptionModule

apps/api/src/modules/auth/auth.guards.ts             # (re-export/keep) PlanGuard untouched; SubscriptionGuard lives in subscription/
apps/api/src/graphql/errors.ts                       # + 'PLAN_LIMIT_REACHED' in KNOWN_CODES
apps/api/src/shared/tenant-scope.ts                  # + planLimitError() helper
apps/api/src/app.module.ts                           # register SubscriptionModule
packages/database/prisma/schema.prisma               # enums SubscriptionPlan/SubscriptionStatus + 3 Tenant columns
packages/database/prisma/migrations/<new>/migration.sql
packages/database/test/schema.test.ts                # + assert the subscription fields exist
apps/book/codegen.schema.gql                         # versioned SDL snapshot (consumed by book 018)
```

**Structure Decision**: A new `subscription` module owns the tier state, the effective-plan rule, the count-based limit checks and the tier guard, following the ratified **store-seam** pattern (`payments`/`catalog`/`reviews`) so the behavior is DB-free testable. Limit enforcement is wired into the **existing** creation/activation paths (`catalog` admin surface — the one `apps/book` uses — plus the legacy public `services`/`specialists` surfaces) rather than by intercepting at the resolver, so every path is covered by one authoritative check. The tier guard is deliberately separate from the existing module-license `PlanGuard`/`@RequirePlan` to preserve that axis.

## Complexity Tracking

> Not required: Constitution Check passes with no violations.
