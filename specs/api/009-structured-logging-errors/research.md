# Research: Foundly API — Structured Logging & Standardized GraphQL Errors

**Feature**: `specs/api/009-structured-logging-errors/` | **Date**: 2026-10-11

## Decision 1: Logger = pino (JSON in prod, pretty in dev) + pino-pretty (dev)

- **Decision**: add `pino` (runtime) and `pino-pretty` (dev). A `createLogger()` factory builds the
  sink: `pino-pretty` transport when `NODE_ENV !== 'production'`, plain JSON otherwise, base fields
  (service `foundly-api`). It is injected as the Nest `LoggerService`.
- **Rationale**: pino is the high-performance, zero-dependency native structured logger Node
  standard; JSON out of the box for production sinks; human-readable pretty output locally.
- **Alternatives considered**: winston — rejected (heavier, transport ecosystem, slower hot path);
  Nest default Logger — rejected (unstructured, not greppable, no redaction).

## Decision 2: Sanitization at the sink + defensively at the client edge

- **Decision**: use pino's built-in `redact` option with paths covering `req.headers.authorization`,
  `*.password`, `*.token`, `*.secret`, `*.apiKey`, plus a documented PII path list (`*.email`,
  `*.phone`, `*.fullName`). Independently, the client-facing `formatError` never returns internal
  error messages outside development (Decision 4), so sensitive text cannot leak to clients either.
- **Rationale**: FR-002/FR-007 — two independent layers (log sink redaction + client-message
  control); accidental raw `log.info(req)` calls are still safe because redaction runs at the sink.
- **Alternatives considered**: custom serializers only — rejected (only apply where a serializer is
  attached); trusting code discipline — rejected (not testable).

## Decision 3: Lifecycle logging via an Apollo request-lifecycle plugin

- **Decision**: `requestLifecyclePlugin()` (an `ApolloServerPlugin`) logs: request start (method,
  path, requestId), then on `willSendResponse` the operation name, execution duration (ms) and error
  count; every error is logged server-side with its **full stack**, regardless of environment.
- **Rationale**: the GraphQL-native seam (`@apollo/server` plugin) captures resolution rather than raw
  HTTP middleware; full stack always lands in logs while the client envelope stays masked.
- **Alternatives considered**: Nest interceptor for logging — rejected (less access to operation
  name/errors and duplicates Apollo's lifecycle); log only HTTP — rejected (misses resolution detail).

## Decision 4: Error envelope = `formatError` normalizer over the known-code convention

- **Decision**: implement `formatGraphQLError(error)` used as Apollo's `formatError`. For errors that
  already carry a **known application code** (`UNAUTHENTICATED`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT`,
  `VALIDATION_ERROR`) the envelope keeps that `code` and adds `timestamp` and keeps `path`; the
  message is preserved as-is (application-controlled, sanitized). Every **other** error — including
  database/runtime/internal — becomes `{ code: "INTERNAL_SERVER_ERROR", timestamp, path }` with a
  generic message (`"Internal server error"`) when `NODE_ENV === 'production'`, and keeps its real
  message/stack when not production; `path` falls back to `[]` when absent.
- **Rationale**: FR-004/FR-005/FR-006/FR-008 — one normalizer, environment-gated masking, stable
  additive fields that preserve 006/008 contract assertions.
- **Alternatives considered**: Nest `ExceptionFilter` (HTTP) — rejected (error mapping must happen in
  the GraphQL execution layer where `extensions` live); a custom Apollo plugin rewriting errors —
  rejected (`formatError` is the documented, simpler seam).

## Decision 5: Known-code table is explicit and additive

- **Decision**: `KNOWN_CODES = ['UNAUTHENTICATED','FORBIDDEN','NOT_FOUND','CONFLICT','VALIDATION_ERROR']`
  plus a client-oriented `'BAD_REQUEST'` alias mapped from Apollo parse/validation failures
  (`GRAPHQL_PARSE_FAILED`/`GRAPHQL_VALIDATION_FAILED`) in production; codes never renamed.
- **Rationale**: FR-009 — the existing vocabulary is the source of truth; clients already branch on
  these codes in 002–008 specs.
- **Alternatives considered**: introducing a new code taxonomy — rejected (breaks the ratified
  extensions.code contract).

## Decision 6: Environment gate = `NODE_ENV === 'production'`

- **Decision**: masking of unknown/internal errors activates only when `NODE_ENV === 'production'`;
  every other value (including tests/unset) reveals detail — same gate already used by the API for
  playground/introspection.
- **Rationale**: FR-005/FR-006 and precedent; deterministic behavior in dev and CI.
- **Alternatives considered**: a dedicated `LOG_LEVEL`-style toggle — rejected (surplus config;
  `NODE_ENV` is the established seam).

## Decision 7: Test strategy — pure functions + a throwaway throwing resolver

- **Decision**: unit specs for the formatter (known codes, masking per env, message sanitize, missing
  path default) and the logger (redaction of nested secret/PII, structured fields, pretty-vs-json).
  E2E: (a) `AppModule` guarded `viewer` without token returns the `UNAUTHENTICATED` envelope
  (mocked `PrismaService` + local JWKS); (b) a **test-only GraphQL module** hosting a resolver that
  throws `new Error('db secret 123')` asserts production masking → generic `INTERNAL_SERVER_ERROR`
  with no secret, and dev → real message; (c) a log-assay asserts no secret/PII in emitted records.
- **Rationale**: FR-010/FR-011; unknown-error masking needs a real throwing resolver, scaffolded
  test-only so `AppModule` (007/008) stays untouched; DB-free via mocks.
- **Alternatives considered**: injecting a throwing path into `AppModule` — rejected (pollutes
  production code for a test); asserting against mocked log sinks only — rejected (does not prove the
  Apollo wiring).

## Risks

- **formatError regressions**: existing specs assert `extensions.code` — the normalizer preserves
  known codes and only adds fields, so 006/008 stay green; verified in gates.
- **NODE_ENV in tests**: tests run with `NODE_ENV` unset → detail shown — consistent with dev posture;
  production behavior is asserted by explicitly setting `NODE_ENV='production'` in the e2e.
- **Redaction gaps**: new sensitive fields must be added to the path list; the client-edge masking
  (Decision 4) is the backstop, so even an unredacted log field never leaks to clients.
- **pino-pretty in prod**: dev-only dependency; the factory only uses it outside production.