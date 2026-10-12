# Implementation Plan: Foundly API — Domain MVP Module (Authenticated CRUD, Tenant-Isolated)

**Branch**: `010-domain-mvp-module` | **Date**: 2026-10-11 | **Spec**: `specs/api/010-domain-mvp-module/spec.md`

**Input**: Feature specification from `/specs/api/010-domain-mvp-module/spec.md`

## Summary

Add a self-contained **authenticated domain MVP module** (`apps/api/src/modules/catalog/`) that
demonstrates the full CRUD + tenant-isolation pattern for the core catalog entities (Service,
Specialist). All operations are under the 008 `@RequireAuth()` guard, derive the organization scope
**only** from `ctx.user.tenantId` (a custom `tenant_id` claim on the Supabase access token, mapped
additively by `SupabaseJwtService`), filter every Prisma query by that scope, and return predictable
errors through the 009 pipeline (`NOT_FOUND` for cross-tenant/missing, `VALIDATION_ERROR`, `CONFLICT`,
`UNAUTHENTICATED`). GraphQL surface uses a distinct `my*` naming so nothing collides with the
ratified 003–005 modules; those modules are not migrated. No schema/storage change (`tenant_id` is a
claim, not a table). Tests DB-free: in-memory model store + local JWKS (008 harness).

## Technical Context

**Language/Version**: TypeScript strict · Node 20+ · NestJS 11 · GraphQL 16 · Prisma 6 (via `@foundly/database`)

**Primary Dependencies**: existing only — 008 `SupabaseJwtService`/`@RequireAuth()`/`@AuthUser()` and
009 error helpers (`validationError`, `notFoundError`, `conflictError` in
`apps/api/src/shared/tenant-scope.ts`; `unauthError` in auth guards); `@nestjs/graphql`,
`@foundly/database` (shared seam). No new dependencies.

**Storage**: Prisma + PostgreSQL via `@foundly/database` (ratified) — **no schema delta**; tenant
membership is a JWT claim (`tenant_id`), not a DB column.

**Testing**: Vitest + `@nestjs/testing` + supertest; **DB-free** — a typed in-memory model store
implements the used Prisma methods (`service`/`specialist` CRUD + `specialistService.deleteMany`),
local JWKS tokens carry `tenant_id`, `NODE_ENV` per 009 masks nothing here. Unit: `catalog.service`
(scope filters, not-found/validation/conflict), `catalog.resolver` (delegation). E2E over
`POST /graphql`: ownership round-trip + isolation + error codes.

**Target Platform**: Node.js HTTP server (NestJS), npm workspaces monorepo.

**Project Type**: Monorepo — one additive `apps/api` domain module (+ additive claim mapping in 008 service).

**Performance Goals**: no extra requests beyond the per-operation scoped query; <100 ms typical on the
existing seam.

**Constraints**: tenant scope NEVER from client input (client `tenant*` args are ignored); cross-tenant
by-ID access returns `NOT_FOUND` (no existence oracle); mutation writes are always preceded by a
tenant-scoped ownership check (or a single scoped write that affects zero rows → `NOT_FOUND`);
validation before persist; hard delete with owned-relation cleanup in a transaction; `packages/*`
never import from `apps/*`; strict typing (no `any`); the 003–005 modules and their GraphQL field names
are untouched; 007 context / 008 identity / 009 pipeline behavior unchanged.

**Scale/Scope**: new `catalog` module (6 queries-ish surface: `my*` list/byId/create/update/delete for
Service and Specialist), `AuthUser.tenantId` mapping in 008 `jwt.service.ts`/`jwt.types.ts`, specs.
Out of scope: migrating 003–005, other entities, pagination/ordering, soft delete, permissions beyond
tenant membership, membership table.

## Constitution Check

_GATE: must pass before Phase 0 research. Re-check after Phase 1 design._

- **SDD**: passes — spec exists (`specs/api/010-domain-mvp-module/spec.md`) and references
  `specs/business-model.md` and the authority hierarchy.
- **Persistence governance**: no storage change; organization membership comes from the credential
  claims, not a new table.
- **`packages/*` never import from `apps/*`**: unchanged.
- **Strict typing (constitution §5.IV)**: `AuthUser.tenantId`, catalog types and store fully typed; no `any`.
- **Security posture (constitution §5, business-model)**: scope derived exclusively from the verified
  identity; fail-closed (`NOT_FOUND`) on cross-tenant access; validation before writes.
- **GraphQL dev posture**: code-first; distinct `my*` fields avoid collisions; opt-in guard keeps
  003–005 untouched.
- **Module structure**: additive `modules/catalog/` reusing `@Global` AuthModule (008) guards.
- **Workspace gates (constitution §3.I, §8)**: build/typecheck/test/lint for `@foundly/api`;
  regressions for `book`/`ui`; the 007/008/009 suites MUST stay green.

**Post-design re-check**: PASS — additive module + additive claim mapping; zero storage/deps change;
DB-free tests; existing contracts preserved.

## Project Structure

### Documentation (this feature)

```text
specs/api/010-domain-mvp-module/
├── plan.md                    # This file (/speckit.plan command output)
├── research.md                # Phase 0 output
├── data-model.md              # Phase 1 output
├── quickstart.md              # Phase 1 output
├── contracts/
│   └── catalog.contract.md
└── tasks.md                   # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
apps/api/src/
├── modules/auth/
│   ├── jwt.types.ts           # EDIT (additive): AuthUser + tenantId?: string
│   └── jwt.service.ts         # EDIT (additive): map tenant_id claim -> AuthUser.tenantId
├── modules/catalog/           # NEW module (additive; distinct my* surface)
│   ├── catalog.module.ts      #            @Module providers/controllers; registered in app.module
│   ├── catalog.types.ts       #            MyService / MySpecialist / Create*/Update* inputs / IDs
│   ├── catalog.store.ts       #            typed seam over Prisma methods (DI provider)
│   ├── catalog.service.ts     #            tenant-scoped CRUD + validation + errors
│   ├── catalog.resolver.ts    #            @RequireAuth() ... @AuthUser() -> scoping
│   ├── catalog.service.spec.ts#            unit
│   ├── catalog.resolver.spec.ts#           unit
│   └── catalog.e2e.spec.ts    #            POST /graphql (ownership round-trip, isolation, codes)
└── app.module.ts              # EDIT: + CatalogModule
```

**Structure Decision**: the module is fully self-contained and additive (like 008/009). The store is a
thin typed seam (a Nest provider) that test specs override with an in-memory store — so `catalog.service`
runs hermetically and the e2e boots `AppModule` with the store mocked. Tenant scope is read on every
operation from `@AuthUser()`'s `ctx.user.tenantId`; client `tenant*` arguments are ignored.

## Complexity Tracking

> Fill ONLY if Constitution Check has violations that must be justified

| Violation | Why Needed | Simpler Alternative Rejected Because |
| --------- | ---------- | ------------------------------------ |
| _None_    | —          | —                                    |