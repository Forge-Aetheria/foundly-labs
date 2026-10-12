# Implementation Plan: Foundly API — Structured Logging & Standardized GraphQL Errors

**Branch**: `009-structured-logging-errors` | **Date**: 2026-10-11 | **Spec**: `specs/api/009-structured-logging-errors/spec.md`

**Input**: Feature specification from `/specs/api/009-structured-logging-errors/spec.md`

## Summary

Add a **centralized pino-based structured logger** and a **unified GraphQL error pipeline** to
`apps/api`. The logger is injected as Nest's `LoggerService` (JSON in production, pretty in dev) with
built-in redaction (authorization headers, passwords, tokens, PII). An Apollo **request-lifecycle
plugin** logs each operation + duration + outcome (full stack server-side). A **`formatError`
normalizer** turns every thrown error into the envelope `{ code, timestamp, path }`, preserves the
existing application codes (`UNAUTHENTICATED`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT`,
`VALIDATION_ERROR`), sanitizes messages, and — outside development — masks unknown/internal errors to
a generic `INTERNAL_SERVER_ERROR` while the full trace stays in the logs. Additive: 007 context and
008 JWT flows are untouched. New deps: `pino` (+ `pino-pretty` dev). No storage changes.

## Technical Context

**Language/Version**: TypeScript strict · Node 20+ · NestJS 11 · GraphQL 16 · `pino` v9 (new, prod) + `pino-pretty` (dev only)

**Primary Dependencies**: `pino` (**new**) and `pino-pretty` (**new**, dev dep) — structured sinks,
`redact` option for sanitization; `@nestjs/common` (LoggerService), `@nestjs/graphql` +
`@apollo/server` (`formatError`, `ApolloServerPlugin`). No other runtime deps.

**Storage**: none — observability artifacts are runtime-only (log records); no tables, no schema
delta, no client regeneration.

**Testing**: Vitest + `@nestjs/testing` + supertest; DB-free. Unit: `logger` redaction/format specs;
`errors` mapping/masking/sanitization specs (per `NODE_ENV`). E2E: known error (`viewer` without token
→ `UNAUTHENTICATED` envelope) over `AppModule`, and a **test-only GraphQL module with a throwing
resolver** to prove production masking (generic code, no detail) vs development detail — both with
mocked `PrismaService`.

**Target Platform**: Node.js HTTP server (NestJS), npm workspaces monorepo.

**Project Type**: Monorepo — one `apps/api` observability increment (logger + error pipeline).

**Performance Goals**: pino is high-throughput; one log line per request lifecycle (start + result),
no blocking sinks; negligible overhead on 007/008 paths.

**Constraints**: preserve every existing `extensions.code` that clients depend on (006/008 specs assert
them); `NODE_ENV === 'production'` = mask unknown errors, any other value = reveal; sanitize both logs
and client messages (no credentials/tokens/PII anywhere); `packages/*` never import from `apps/*`;
strict typing; no new error vocabulary for known codes.

**Scale/Scope**: logger wrapper + redaction, Apollo lifecycle plugin, `formatError` normalizer
(known-code mapping + timestamp/path + masking + message sanitize), specs. Out of scope: log
aggregation shipping (external sink), distributed tracing, request/response body capture,
changing the known error codes, any storage/packages change.

## Constitution Check

_GATE: must pass before Phase 0 research. Re-check after Phase 1 design._

- **SDD**: passes — spec exists (`specs/api/009-structured-logging-errors/spec.md`) and references
  `specs/business-model.md` and the authority hierarchy.
- **Persistence governance**: no storage change; observability artifacts are runtime-only.
- **`packages/*` never import from `apps/*`**: unchanged.
- **Strict typing (constitution §5.IV)**: logger/error types fully typed; no `any`.
- **Security posture (business-model/constitution)**: redaction and environment masking are the core
  guardrails; no secrets or PII reach sinks or clients.
- **GraphQL dev posture**: code-first; `formatError`/`plugins` are additive Apollo options; playground
 /introspection posture unchanged.
- **Module structure**: new `shared/logger/` and `graphql/` seam files; additive to the ratified
  execution layer.
- **Workspace gates (constitution §3.I, §8)**: `build`, `typecheck`, `test`, lint for `@foundly/api`;
  regression gates for `book`/`ui`; must keep 007/008 suites green.

**Post-design re-check**: PASS — additive options (formatError/plugins + logger injection); existing
codes preserved; masking only alters unknown-error detail outside dev; DB-free tests.

## Project Structure

### Documentation (this feature)

```text
specs/api/009-structured-logging-errors/
├── plan.md                    # This file (/speckit.plan command output)
├── research.md                # Phase 0 output
├── data-model.md              # Phase 1 output
├── quickstart.md              # Phase 1 output
├── contracts/
│   └── graphql-errors.contract.md
└── tasks.md                   # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
apps/api/
├── package.json                       # EDIT: add "pino" dep and "pino-pretty" dev dep
└── src/
    ├── main.ts                        # EDIT: NestFactory.create(AppModule, { logger: foundlyLogger() })
    ├── app.module.ts                  # EDIT: GraphQLModule.forRoot + formatError: formatGraphQLError + plugins: [requestLifecyclePlugin()]
    ├── shared/logger/
    │   └── logger.ts                  # NEW: createLogger() (pino; pretty in dev, JSON in prod; redact) + SANITIZE_PATHS
    ├── graphql/
    │   ├── errors.ts                  # NEW: KNOWN_CODES, formatGraphQLError, masking/sanitize helpers
    │   ├── logging.plugin.ts          # NEW: requestLifecyclePlugin() Apollo plugin (operation/duration/outcome, full stack server-side)
    │   ├── errors.spec.ts             # NEW: unit — mapping, masking per env, message sanitize
    │   └── pipeline.spec.ts           # NEW: e2e — known-code envelope + throwing-resolver masking (prod vs dev), mocked PrismaService
    └── shared/logger/logger.spec.ts   # NEW: unit — redaction + structured format
```

**Structure Decision**: logging is a self-contained `shared/logger` seam; the error pipeline is two
pure/leaf modules under `graphql/` (`errors.ts` formatter + `logging.plugin.ts`), each independently
testable, wired declaratively in `app.module.ts` — no DI graph changes, no changes to 007/008 code.

## Complexity Tracking

> Fill ONLY if Constitution Check has violations that must be justified

| Violation | Why Needed | Simpler Alternative Rejected Because |
| --------- | ---------- | ------------------------------------ |
| _None_    | —          | —                                    |