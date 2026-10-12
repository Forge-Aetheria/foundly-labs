# Implementation Plan: Foundly API — GraphQL Execution Layer & Data Integration

**Branch**: `007-graphql-api-layer` | **Date**: 2026-10-11 | **Spec**: `specs/api/007-graphql-api-layer/spec.md`

**Input**: Feature specification from `/specs/api/007-graphql-api-layer/spec.md`

## Summary

Ratify and complete the foundational GraphQL execution layer of `apps/api` on top of the shared
`@foundly/database` seam. The layer already exists (NestJS code-first Apollo, `SharedPrismaModule` +
`PrismaService`, `health` resolver); this feature (1) adds a typed GraphQL request context
(`apps/api/src/graphql/context.ts`) that injects the shared Prisma client into every request, and
(2) turns the current liveness-only `health` query into a **readiness probe** that validates the data
layer with a read-only `SELECT 1`, reporting `database: up|down` without crashing or throwing when the
store is unreachable. No schema, storage or framework changes: the Supabase pooler connection pattern
already ratified stays untouched; tests remain DB-free via a mocked `PrismaService`.

## Technical Context

**Language/Version**: TypeScript strict · Node 20+ · NestJS 11 · GraphQL 16 · Prisma 6

**Primary Dependencies**: `@foundly/database` (shared Prisma client singleton — the single
persistence seam); `@nestjs/graphql` + `@nestjs/apollo` (`GraphQLModule` context factory);
`@nestjs/common`. dev: `@nestjs/testing`, `supertest`, vitest (swc transform, from `003`). **No new
runtime dependencies.**

**Storage**: Prisma + PostgreSQL via `@foundly/database` (ratified). **No schema change** — the
Supabase pooler pattern (`DATABASE_URL` runtime / `DIRECT_URL` CLI) stays as-is; no client
regeneration required.

**Testing**: Vitest + `@nestjs/testing` + supertest; **DB-free** by overriding `PrismaService` with a
mock (`$queryRaw` resolves → `up`; rejects/times out → `down`). Health resolver unit spec + e2e over
`POST /graphql` + a `contextFactory` unit spec.

**Target Platform**: Node.js HTTP server (NestJS), npm workspaces monorepo.

**Project Type**: Monorepo — one `apps/api` execution-layer increment (context seam + health probe).

**Performance Goals**: readiness probe answers in **<1 s under normal conditions** and is bounded at
**2 s** (timeout) when the data layer is slow/unreachable; probe is read-only and does not block the
event loop.

**Constraints**: `packages/*` never import from `apps/*`; persistence stays behind
`@foundly/database`; no dual Prisma instances (context factory and `PrismaService` MUST reference the
same singleton); tests require no live database; strict typing; reuse the `extensions.code`
convention where errors are surfaced; the existing `health` query name (bootstrap contract) is
preserved.

**Scale/Scope**: typed request context, DB-aware `health` probe, payload shape
(`service`/`status`/`database`/`checkedAt`), DB-free specs. Out of scope: renaming the query,
auth on health, new domain modules, storage changes, new framework, HTTP (`GET /`) controller
changes.

## Constitution Check

_GATE: must pass before Phase 0 research. Re-check after Phase 1 design._

- **SDD**: passes — spec exists (`specs/api/007-graphql-api-layer/spec.md`) and explicitly references
  `specs/business-model.md` and the authority hierarchy.
- **Persistence governance**: reuses the ratified seam (Prisma + PostgreSQL via `@foundly/database`);
  **zero** schema/persistence change; the ratified Supabase pooler pattern is untouched.
- **`packages/*` never import from `apps/*`**: unchanged.
- **Strict typing (constitution §5.IV)**: `GraphQLContext` and `HealthPayload` fully typed; no `any`.
- **GraphQL dev posture**: code-first `autoSchemaFile`; playground/introspection only outside
  production (unchanged).
- **Module structure**: execution seam fits the existing `apps/api` layout (`shared/prisma`,
  `graphql/`, `health/`); no cross-domain duplication.
- **Workspace gates (constitution §3.I, §8)**: `build`, `typecheck`, `test` for `@foundly/api`; root
  `lint`; regression checks on `book` build and `ui` tests.

**Post-design re-check**: PASS — additive/read-only surface; context reuses the existing singleton;
DB-free tests; gates preserved.

## Project Structure

### Documentation (this feature)

```text
specs/api/007-graphql-api-layer/
├── plan.md                    # This file (/speckit.plan command output)
├── research.md                # Phase 0 output
├── data-model.md              # Phase 1 output
├── quickstart.md              # Phase 1 output
├── contracts/
│   └── graphql-execution-layer.contract.md
└── tasks.md                   # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
apps/api/src/
├── app.module.ts              # EDIT: GraphQLModule.forRoot({ ..., context: contextFactory })
├── graphql/
│   └── context.ts             # NEW: GraphQLContext type + contextFactory (exposes shared prisma)
├── health/
│   ├── health.types.ts        # NEW: HealthPayload ObjectType (service, status, database, checkedAt)
│   ├── health.resolver.ts     # EDIT: inject PrismaService; DB-aware readiness probe (read-only $queryRaw)
│   └── health.resolver.spec.ts# EDIT: DB-free up/down paths via mocked PrismaService + e2e
```

`PrismaService` (`apps/api/src/shared/prisma/prisma.service.ts`) and `SharedPrismaModule` stay
unchanged; `contextFactory` imports the **same** `prisma` singleton from `@foundly/database`.

**Structure Decision**: keep the ratified NestJS code-first surface. The request context is a thin,
fully typed seam (`context: () => ({ prisma })`) registered on `GraphQLModule` — resolvers keep
receiving `PrismaService` by DI (same instance), so there is exactly one persistence path.

## Complexity Tracking

> Fill ONLY if Constitution Check has violations that must be justified

| Violation | Why Needed | Simpler Alternative Rejected Because |
| --------- | ---------- | ------------------------------------ |
| _None_    | —          | —                                    |