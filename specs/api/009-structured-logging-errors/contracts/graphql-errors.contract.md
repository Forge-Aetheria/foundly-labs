# Contract: Structured logging & standardized GraphQL errors (`apps/api`)

**Feature**: `specs/api/009-structured-logging-errors/` | **Date**: 2026-10-11

## Endpoint posture (unchanged)

`POST /graphql` (Apollo/NestJS, code-first); playground/introspection only when `NODE_ENV !==
'production'`. Logs: JSON when `NODE_ENV === 'production'`, pino-pretty otherwise.

## Structured logs

One request-start record and one resolution record per request:

- **request start**: `{ level: 'info', requestId, method, path, operation, time }`
- **resolution result**: `{ level: 'info'|'warn'|'error', requestId, operation, durationMs, errorCount, time }`
- **error detail**: `{ level: 'error', requestId, operation, err: { message, stack } }` — the **full
  stack is always written server-side**, in every environment.

Sink redaction (never written): authorization headers, `password`, `token`, `secret`, `apiKey` values
and PII fields (`email`, `phone`, `fullName`) — nested included.

## Error envelope

Every thrown error returned to a client is normalized to:

```json
{
  "message": "<sanitized>",
  "locations": [{ "line": 1, "column": 3 }],
  "path": ["viewer"],
  "extensions": {
    "code": "UNAUTHENTICATED",
    "timestamp": "2026-10-11T00:00:00.000Z",
    "stacktrace": ["..."]   // development only; removed in production
  }
}
```

`path` defaults to `[]` when absent; `timestamp` is added to every error.

## Known application codes (preserved)

| Code                | Source                                                              |
| ------------------- | ------------------------------------------------------------------- |
| `UNAUTHENTICATED`   | missing/invalid/expired credentials (006/008)                        |
| `FORBIDDEN`         | inactive tenant / unmet entitlement (006)                            |
| `NOT_FOUND`         | missing resources (003–005)                                          |
| `CONFLICT`          | duplicate/conflicting mutations (003)                                |
| `VALIDATION_ERROR`  | invalid payloads (003–005)                                           |
| `BAD_REQUEST`       | GraphQL parse/validation failures in production                       |
| `INTERNAL_SERVER_ERROR` | any other (unknown/internal) error in production                 |

## Masking policy

| Environment      | Known application error | Unknown/internal error                            |
| ---------------- | ----------------------- | ------------------------------------------------- |
| `NODE_ENV === 'production'` | preserved code + message (sanitized) | `INTERNAL_SERVER_ERROR` + `"Internal server error"`, no stack, no detail |
| otherwise        | preserved code + message | real message (+ stack) shown to client            |

The full server-side log trace is recorded in both cases, both environments.

## Multi-error responses

Every error in the same response is normalized independently (own code/timestamp/path).

## Tests (DB-free)

- Unit `errors.spec.ts`: known code preserved + timestamp/path added; parse/validation failure →
  `BAD_REQUEST` in production; unknown error masked in production (generic code/message, no stack) vs
  detailed outside; missing path → `[]`; message never contains a secret.
- Unit `logger.spec.ts`: structured fields present; `password`/`token`/`authorization`/PII redacted
  in nested objects; pretty transport chosen outside production, JSON in production.
- E2E `pipeline.spec.ts` (mocked `PrismaService`): `viewer` without token → `UNAUTHENTICATED` envelope
  (code + timestamp + path); a test-only throwing resolver → production masking asserts no secret in
  the client response and no PII in emitted logs.