# Data Model: Foundly API — Structured Logging & Standardized GraphQL Errors

**Feature**: `specs/api/009-structured-logging-errors/` | **Date**: 2026-10-11

## Storage strategy

- **No persistence changes.** Observability artifacts are runtime-only (log records and error
  envelopes); no tables, no `schema.prisma` delta, no migrations.

## Entities (runtime — not persisted)

### Log record (structured lifecycle event)

| Field         | Type   | Notes                                                        |
| ------------- | ------ | ------------------------------------------------------------ |
| `level`       | string | trace/debug/info/warn/error                                  |
| `time`        | string | ISO timestamp (pino default)                                 |
| `service`     | string | `"foundly-api"`                                              |
| `requestId`   | string | per-request correlation id                                  |
| `operation`   | string | GraphQL operation name (or `anonymous`)                     |
| `method`      | string | HTTP verb                                                   |
| `path`        | string | HTTP path                                                    |
| `durationMs`  | number | resolution duration                                          |
| `errorCount`  | number | number of errors in the response                             |
| `error*`      | object | server-side detail incl. full stack (never exposed to client)|
| `env`         | string | `NODE_ENV` at emission time                                  |

Sensitive fields (`password`, `token`, `secret`, `apiKey`, `authorization`, and PII like `email`/
`phone`/`fullName`) are **redacted** by the sink before write.

### Error envelope (client-facing, per error)

| Field       | Type   | Notes                                                         |
| ----------- | ------ | ------------------------------------------------------------- |
| `message`   | string | sanitized; generic for masked internal errors                 |
| `locations` | array? | preserved when present                                        |
| `path`      | array  | GraphQL field path; defaults to `[]` when absent              |
| `extensions.code`      | string | known code preserved, or `INTERNAL_SERVER_ERROR` (masked)  |
| `extensions.timestamp` | string | ISO-8601 timestamp added to every normalized error         |
| `extensions.stacktrace` | string[] | development only (masked/production removed)             |

### Known application codes

`UNAUTHENTICATED`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT`, `VALIDATION_ERROR` (existing, preserved);
`BAD_REQUEST` mapped from Apollo parse/validation failures in production; `INTERNAL_SERVER_ERROR` for
everything else masked outside development.

## Validation rules

- Log records MUST never contain credentials, tokens, authorization headers or PII (sink redaction).
- Client errors MUST carry `code` + `timestamp` (+ `path` when available); multi-error responses
  normalize each error independently.
- In production, unknown/internal errors MUST expose only the generic `INTERNAL_SERVER_ERROR` code and
  message; the full stack is always logged server-side.
- Outside production, unknown/internal errors MAY expose the real message/stack to clients.
- Known application codes MUST keep their value inside the envelope (no renaming).

## GraphQL surface

No schema/surface change — the envelope modifies `errors` responses, not queries/mutations. Existing
007 `health`/context and 008 `viewer`/JWT flows are unchanged.