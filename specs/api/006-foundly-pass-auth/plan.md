# Implementation Plan: Foundly API — Tenant Auth, Sessions & Guards (Foundly Pass)

**Branch**: `006-foundly-pass-auth` | **Date**: 2026-10-11 | **Spec**: `specs/api/006-foundly-pass-auth/spec.md`

**Input**: Feature specification from `/specs/api/006-foundly-pass-auth/spec.md`

## Summary

Add the `auth` domain module to `apps/api` (`apps/api/src/modules/auth/`) implementing Foundly Pass
session validation, tenant account/plan status checks, a `GqlAuthGuard`, `PlanGuard` and custom
decorators (`@UseAuth`, `@CurrentTenant`, `@CurrentUser`, `@RequirePlan`) that inject the authenticated
context into GraphQL resolvers and enforce **strict per-tenant isolation** (scope always from the
session). An additive `Tenant.plan` field feeds entitlement gating (Book/POS readiness). Includes a
guarded `me`/`currentTenant` surface and a plan-gated sample capability, plus DB-free unit + e2e specs,
with `AuthModule` registered as `@Global` so future modules can reuse the guards.

## Technical Context

**Language/Version**: TypeScript strict · Node 20+ · NestJS 11 · GraphQL 16 · Prisma 6

**Primary Dependencies**: `@foundly/database` (Tenant model; additive `plan` field); `@nestjs/common`
guards + `@nestjs/graphql` (`GqlExecutionContext`/`ExecutionContext` + metadata `Reflector`); `node:crypto`
(HMAC-SHA256) for signed session credentials — **no Passport/JWT dependencies**. dev: `@nestjs/testing`,
`supertest`, vitest (swc transform).

**Storage**: Prisma + PostgreSQL via `@foundly/database`. One **additive** schema field —
`Tenant.plan String?` — then `npm run generate -w @foundly/database`. Tenant **status** (`active`) is
already in the model and gates protected operations.

**Testing**: Vitest + `@nestjs/testing` + supertest (swc from `003`); DB-free via mocked `PrismaService`
(tenant lookups) and a fixed signing secret. Unit specs for `AuthService` + guards; resolver e2e specs
over `POST /graphql` (authenticated/unauthorized/forbidden paths).

**Target Platform**: Node.js HTTP server (NestJS), monorepo.

**Project Type**: Monorepo — one `apps/api` auth module (+ additive DB field + generated client).

**Performance Goals**: N/A (per-request token verify + single tenant lookup).

**Constraints**: `packages/*` never import from `apps/*`; persistence stays behind `@foundly/database`;
tests require no live DB and no real external SSO; strict typing; reuse `PrismaService`,
`tenant-scope` error helpers and the `extensions.code` convention from `003`–`005`; no regressions in
existing modules (auth is opt-in via decorators).

**Scale/Scope**: session signing/validation service, `GqlAuthGuard` + `PlanGuard` + decorators, tenant
status + additive plan checks, protected `me`/`currentTenant` surface, one plan-gated sample
(`bookCapability`). External SSO/OAuth, registration/logins, refresh/revocation, token issuance HTTP
endpoints and plan billing are out of scope.

## Constitution Check

_GATE: must pass before Phase 0 research. Re-check after Phase 1 design._

- **SDD**: passes — spec exists (`specs/api/006-foundly-pass-auth/spec.md`) and references `specs/business-model.md`.
- **Security posture (constitution §5, business-model)**: session secrets come from the environment
  (`FOUNDLY_PASS_SECRET`), never committed; tokens are signed and validated, rejecting tampering/expiry;
  per-tenant isolation is enforced server-side from the session — no tenant scope from client input on
  protected operations.
- **Persistence governance**: ratified strategy (Prisma + PostgreSQL via `@foundly/database`); only an
  **additive** nullable field (`Tenant.plan`) — no governance amendment.
- **`packages/*` never import from `apps/*`**: unchanged.
- **Strict typing (constitution §5.IV)**: auth context, guards and types fully typed; errors via
  `extensions.code` (`UNAUTHENTICATED`/`FORBIDDEN`).
- **GraphQL dev posture**: code-first `autoSchemaFile`; playground/introspection only outside production.
- **Module structure**: `apps/api/src/modules/auth/` (NestJS standard) registered `@Global` for reuse;
  opt-in decorators keep existing modules untouched.

**Post-design re-check**: PASS — auth is an opt-in layer; additive schema only; DB-free tests; gates preserved.

## Project Structure

### Documentation (this feature)

```text
specs/api/006-foundly-pass-auth/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   └── foundly-pass-auth.contract.md
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
packages/database/
├── prisma/schema.prisma              # EDIT (additive): Tenant + plan String?
└── (regenerate client via npm run generate -w @foundly/database)

apps/api/src/
├── app.module.ts                     # + AuthModule (@Global)
├── modules/auth/
│   ├── auth.module.ts                # @Global; providers AuthService, GqlAuthGuard, PlanGuard; exports
│   ├── auth.service.ts               # signSession / verifySession (HMAC-SHA256, expiry); parse secret from env
│   ├── auth.types.ts                 # CurrentUserObject, CurrentTenantObject, SessionPayload (internal)
│   ├── auth.context.ts               # AuthContext type + CurrentTenant/CurrentUser shape helpers
│   ├── auth.guards.ts                # GqlAuthGuard (validate token + tenant status, attach context), PlanGuard (metadata @RequirePlan)
│   ├── auth.decorators.ts            # @UseAuth, @CurrentTenant, @CurrentUser, @RequirePlan(...)
│   ├── auth.resolver.ts              # guarded me / currentTenant / bookCapability (@RequirePlan('book'))
│   ├── auth.service.spec.ts          # sign/verify, expiry, tamper, format errors
│   ├── auth.guards.spec.ts           # unit: guard allow/deny + tenant status + plan metadata
│   └── auth.resolver.spec.ts         # e2e: me/currentTenant/bookCapability + UNAUTHENTICATED/FORBIDDEN codes
└── shared/                           # existing seam + error helpers (reused)
```

**Structure Decision**: auth is a self-contained `@Global` module (guards + service injectable anywhere),
opting in only where decorators are applied. Sessions are opaque HMAC-signed credentials validated
against tenant status/plan; the `AuthContext` (attached to the request) is the single source of tenant
scope for protected operations.

## Complexity Tracking

> Fill ONLY if Constitution Check has violations that must be justified

| Violation | Why Needed | Simpler Alternative Rejected Because |
| --------- | ---------- | ------------------------------------ |
| _None_    | —          | —                                    |
