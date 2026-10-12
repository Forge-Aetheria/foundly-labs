# Quickstart: Foundly API — Structured Logging & Standardized GraphQL Errors

**Feature**: `specs/api/009-structured-logging-errors/` | **Date**: 2026-10-11

## Onboarding

1. `npm install` at the repository root (installs `pino` + dev `pino-pretty`).
2. No schema/`.env` changes required.

## Manual walkthrough

1. `npm run dev -w @foundly/api` (port 3002, `NODE_ENV` unset → pretty logs).
2. Observe structured lifecycle lines for any request, e.g.:

   ```graphql
   query { health { status database } }
   ```
   → request-start and resolution-result lines with `requestId`, `operation`, `durationMs`,
   `errorCount: 0`.

3. Trigger a known error and inspect the envelope (`viewer` without a token):

   ```graphql
   query { viewer { sub } }
   ```
   → `errors[0]` carries `code: "UNAUTHENTICATED"`, `path: []`, and a new `timestamp`; an `error`
   log line with the full stack appears server-side.

4. Production masking (optional): run with `NODE_ENV=production` and a throwing resolver scenario;
   confirm clients receive `INTERNAL_SERVER_ERROR` + `"Internal server error"` with no stack or
   secret, while the server log holds the full trace.

## Verification matrix

| Scenario (test)                                                | Expected                                                        |
| -------------------------------------------------------------- | --------------------------------------------------------------- |
| `npm run build                                                 | typecheck -w @foundly/api`                                      | clean |
| `npm run test -w @foundly/api`                                 | 17 files green — incl. errors.spec, logger.spec, pipeline.spec  |
| `viewer` without token (e2e, AppModule)                        | envelope code `UNAUTHENTICATED` + `timestamp` + `path`          |
| throwing-resolver e2e with `NODE_ENV=production`               | `INTERNAL_SERVER_ERROR`, generic message, no secret/stack        |
| throwing-resolver e2e with `NODE_ENV` unset                    | real message (+ stack) visible                                  |
| log-assay (e2e)                                                | no secret/PII in any emitted record                             |
| 007 health/context + 008 viewer/JWT specs                       | zero regressions (known codes preserved)                        |
| `npm run lint` (root)                                          | clean                                                           |
| `npm run build -w @foundly/book`, `npm run test -w @foundly/ui`| no regressions                                                  |

Refer to `contracts/graphql-errors.contract.md` for the exact envelope/masking/redaction rules and
`data-model.md` for the log-record and envelope shapes.

## Test commands

| Command                                                         | Scope                |
| --------------------------------------------------------------- | -------------------- |
| `npm run build                                               | typecheck            | test -w @foundly/api` | API gates (logging + error pipeline) |
| `npm run lint` (root)                                           | workspace lint       |
| `npm run build -w @foundly/book`, `npm run test -w @foundly/ui` | regression gates     |