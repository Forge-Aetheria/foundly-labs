# Implementation Plan: Foundly API — Super Admin Platform Console (Global Metrics & Subscription Override)

**Branch**: `019-super-admin-panel` | **Date**: 2026-10-14 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/api/019-super-admin-panel/spec.md`

## Summary

Add the platform-owner (Super Admin) backend: (1) a **global platform role** carried by the verified identity — the `app_metadata.platform_role` claim extended into `AuthUser`, with a `PLATFORM_ADMIN_EMAILS` env allowlist as bootstrap/fallback — that a business account cannot self-grant; (2) a reusable **`SuperAdminGuard` + `@RequireSuperAdmin()`** decorator protecting every platform-only operation (anonymous → `UNAUTHENTICATED`, non-admin → `FORBIDDEN`, no reads/writes on rejection); (3) a new **`platform` module** exposing three Super-Admin-only operations — `platformMetrics` (businesses total/active, users total/active, subscription distribution + PRO conversion), `managedBusinesses(limit, offset, query)` (all businesses with name/slug/plan/status/expiry, bounded, searchable), and `overrideTenantSubscription(tenantId, plan?, status?, expiresAt?)` (partial cross-tenant override taking effect immediately on entitlement). User counts come from the **identity provider** through a `PlatformIdentityClient` seam (Supabase Admin API) and **degrade to "unavailable"** when the service-role credential is absent, without failing the metrics. **No schema change, no new dependencies.**

## Technical Context

**Language/Version**: TypeScript 5.9 (strict) · NestJS 11 · Node ≥ 20.

**Primary Dependencies**: `@nestjs/graphql` (code-first), `@foundly/database` (Prisma 6), `jose` (identity), global `fetch` (identity-provider metrics). **No new dependencies.**

**Storage**: PostgreSQL via Prisma. Reads the existing `Tenant` subscription columns (`subscriptionPlan`/`subscriptionStatus`/`subscriptionExpiresAt`) and counts via aggregate/groupBy → **no migration** (no schema change). Users are owned by the identity provider, not the database.

**Testing**: Vitest — unit (`platform.service`/`platform.store`/`SuperAdminGuard`/identity client against in-memory seams) and e2e (`AppModule` + local JWKS + memory stores). `tsc --noEmit`; `nest build`; root ESLint. `@foundly/database` schema test unchanged.

**Target Platform**: NestJS HTTP/GraphQL server (`apps/api`).

**Project Type**: Web service (GraphQL API).

**Performance Goals**: metrics are two indexed counts plus one `groupBy`; the managed list is bounded/paginated and ordered by name; user counts are a bounded paging walk over the identity provider.

**Constraints**: strict TS, no `any`; privileged operations are cross-tenant by design and must fail closed for everyone else; the identity-provider call must never hang or fail the whole metrics response (bounded + degrade); plan/status closed sets from `specs/api/017-subscription-plans`.

**Scale/Scope**: 1 new module (`platform`, ~8 files) + `AuthUser`/JWT-claim extension + a guard/decorator + an identity-client seam; 1 query + 2 operations (metrics, managed list, override); 0 migrations; 1 SDL snapshot sync.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **SDD (§5.I)** — spec + this plan exist; `tasks.md` downstream; no code before approval.
- **Dominio (§2.III)** — spec in `specs/api/`; changes confined to `apps/api` (+ the codegen snapshot synced for the `book` console).
- **Tipado estricto (§5.IV)** — code-first enums/types, typed rows/inputs; no `any`; no hand-written client DTOs.
- **Opt-in protection (§5.II / 008)** — platform reads/writes use `@RequireSuperAdmin()` (JWT verification first, then the platform-role check); public surfaces stay untouched.
- **Fail-closed authorization** — anonymous → `UNAUTHENTICATED`, authenticated non-admin → `FORBIDDEN`, and no platform data is read or written on rejection.
- **Capa de datos por módulo (§5.VI)** — the Book consumes the surface through its modules' `actions.ts`/`hooks.ts`; the API exposes codegen-friendly operations only.
- **Gates (§3.I)** — `build`, `typecheck`, `test`, lint for `@foundly/api` with zero regressions.
- **Test location (TODO(monorepo))** — `apps/api` keeps the NestJS colocated `*.spec.ts` convention (migration deferred, per prior confirmation).
- **Governance (§1)** — subordinated to `specs/business-model.md` (platform operation of the Foundly ecosystem) and `constitution.md`.

**Pre-Phase-0**: PASS. **Post-Phase-1**: PASS (no violations → Complexity Tracking empty).

## Project Structure

### Documentation (this feature)

```text
specs/api/019-super-admin-panel/
├── plan.md
├── spec.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── platform-console.contract.md
├── checklists/requirements.md
└── tasks.md                 # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
apps/api/src/modules/platform/                    # NEW module
├── platform.types.ts        # PlatformMetricsObject, PlanDistributionObject, UserMetricsObject, ManagedBusinessObject, OverrideTenantSubscriptionInput
├── platform.store.ts        # PLATFORM_STORE seam + PlatformStore (tenant stats/groupBy, list, get, updateSubscription) + PrismaPlatformStore
├── platform.test-store.ts   # in-memory store
├── platform.identity.ts     # PlatformIdentityClient seam + PLATFORM_IDENTITY token + SupabaseAdminIdentityClient + createMemoryIdentityClient()
├── platform.service.ts      # requireSuperAdmin + metrics + managedBusinesses + overrideSubscription
├── platform.guard.ts        # REQUIRED_SUPER_ADMIN_KEY + SuperAdminGuard
├── platform.decorators.ts   # @RequireSuperAdmin() (SupabaseJwtGuard + SuperAdminGuard)
├── platform.resolver.ts     # platformMetrics / managedBusinesses / overrideTenantSubscription
├── platform.module.ts       # providers + exports
└── platform.*.spec.ts       # unit + e2e (NestJS colocated convention)

apps/api/src/modules/auth/
├── jwt.types.ts             # AuthUser gains platformRole?: string
└── jwt.service.ts           # resolves app_metadata.platform_role into AuthUser
apps/api/src/app.module.ts   # register PlatformModule
apps/book/codegen.schema.gql # versioned SDL snapshot (consumed by book 020)
```

**Structure Decision**: A new `platform` module owns the privileged operations, following the ratified **store-seam** pattern (`payments`/`subscription`/`catalog`) so behavior is DB-free testable, plus a dedicated **identity-client seam** for user metrics (external to the DB). The Super Admin role is resolved from the already-verified JWT (extending `AuthUser`), and enforced by a guard/decorator distinct from the module-license `PlanGuard` and the subscription `SubscriptionGuard`. No Prisma schema change is required.

## Complexity Tracking

> Not required: Constitution Check passes with no violations.
