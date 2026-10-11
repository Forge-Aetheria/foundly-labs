# Research: Foundly — Persistence & GraphQL

**Feature**: `specs/api/002-persistence-graphql/` | **Date**: 2026-10-11

## Decision 1: Shared database package

- **Decision**: new workspace `packages/database` (`@foundly/database`) owning `prisma/schema.prisma`
  and exporting the Prisma client from `src/index.ts` (main → `./src/index.ts`, like `@foundly/ui`).
- **Rationale**: single persistence seam; `apps/api` (and future apps) consume it without duplicating
  schema/client; honours "packages/* never import from apps/*".
- **Alternatives considered**: embedding Prisma in `apps/api` — rejected (couples stack+app, no reuse).

## Decision 2: Prisma client generation

- **Decision**: run `prisma generate` from `packages/database`; the client lands in the root
  `node_modules/@prisma/client` (workspace resolution) and is available to `apps/api` via
  `@foundly/database`. Wire a `generate` script and run it as part of build/typecheck verification.
- **Rationale**: DB-First workflow; generated code stays out of git; the root install links shared deps.
- **Alternatives considered**: committing generated code — rejected (noise + drift risk).

## Decision 3: Postgres target

- **Decision**: `provider = "postgresql"`, `DATABASE_URL` via env (Supabase or local docker
  `postgres:16`). The health query does not require a live DB.
- **Rationale**: matches the Supabase/docker requirement; env-driven connection keeps local dev simple.
- **Alternatives considered**: SQLite for local — rejected (dev/prod parity with Postgres is better).

## Decision 4: GraphQL mode + playground

- **Decision**: NestJS `GraphQLModule.forRoot` in **Code-First** mode (`autoSchemaFile`), GraphQL
  endpoint `/graphql`, and playground/sandbox enabled only when `NODE_ENV !== 'production'`.
- **Rationale**: Code-First decorators are the NestJS-native path and compile cleanly with the current
  stack; abstraction parity with Apollo Server 4 is maintained by `@nestjs/apollo`.
- **Alternatives considered**: SDL-First (schema-first) — rejected (adds schema hand-editing; the user
  allowed either, Code-First is the least-friction compatible mode).

## Decision 5: Health resolver

- **Decision**: `HealthResolver` with `@Query('health')` returning `{ service: 'foundly-api', status: 'ok' }`;
  no Prisma dependency in the resolver so the query works without a live database.
- **Rationale**: proves the endpoint end-to-end while keeping persistence out of the graph surface.
- **Alternatives considered**: a data-backed query — rejected (needs live DB; deferred to later features).

## Decision 6: Ratification of storage

- **Decision**: update `specs/architecture.md` to state persistence = Prisma + PostgreSQL (Supabase or
  docker), resolving the TODO(PERSISTENCE); apps stay decoupled behind `@foundly/database`.
- **Rationale**: governance requires an explicit, documented decision before using storage.
- **Alternatives considered**: leaving it undefined — rejected (blocks this feature and all DB work).

## Risks

- Prisma CLI/engines require download on first `generate` (network): documented in quickstart.
- Code-first autoSchema writes `schema.gql` at build — ensure it is git-ignored or ephemeral.
- GraphQL e2e tests need the full Nest app with GraphQLModule; keep the health spec isolated so a
  missing DB never breaks it.