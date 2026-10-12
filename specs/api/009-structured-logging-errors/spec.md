# Feature Specification: Foundly API — Structured Logging & Standardized GraphQL Errors

**Feature Branch**: `009-structured-logging-errors`

**Created**: 2026-10-11

**Status**: Draft

**Input**: User description: "Structured Logging & Standardized GraphQL Error Handling (Foundly Ecosystem). Implement a centralized, structured logging system and a unified GraphQL error-handling pipeline inside `apps/api`. Provide deep observability in development and production while shielding sensitive system/database details from API clients. (1) Structured Logger Integration: integrate a high-performance logger; log key HTTP/GraphQL lifecycle events (request context, resolution duration, error status); sanitize log outputs so sensitive data (passwords, tokens, PII) is never written to log sinks. (2) Standardized GraphQL Error Formatting: custom GraphQL error plugin/filter to format all thrown exceptions; map known application exceptions (UNAUTHENTICATED, FORBIDDEN, BAD_REQUEST, NOT_FOUND) to predictable extensions (code, timestamp, path); mask internal database or unhandled runtime errors in non-development environments, returning generic internal error codes while logging full stack traces internally. (3) SDD & Quality Gates: unit tests verifying error masking, logging format, exception mapping; strict TypeScript; zero regressions across 007 and 008."

## User Scenarios & Testing _(mandatory)_

### User Story 1 - See what the API is doing without leaking secrets (Priority: P1)

As an operator, I want every request to produce structured, machine-readable log records describing the operation, its duration and its outcome, while never exposing passwords, tokens or personal data, so that I can debug and monitor the service safely.

**Why this priority**: Without trustworthy, safe logs there is no way to observe failures or measure the API in production; logging is the foundation this feature stands on.

**Independent Test**: Send a request that fails with an application error and one that fails with an internal error; inspect the produced log records and confirm each request produced a structured record (operation, duration, outcome) and that no sensitive value (a test password/token placed in the request) appears anywhere in the log output.

**Acceptance Scenarios**:

1. **Given** any incoming request, **When** it is processed, **Then** a structured log record is emitted describing the operation, duration and outcome.
2. **Given** a request containing a password or token value, **When** its lifecycle is logged, **Then** the sensitive value never appears in any log sink.
3. **Given** a request whose resolution throws, **When** it is logged, **Then** the internal trace is recorded on the server side with the outcome marked as failed.

---

### User Story 2 - Predictable, safe error responses for clients (Priority: P2)

As an API consumer, I want every failure to come back in the same shape with a stable code, timestamp and path, so that my client can react uniformly — and I must never see internal database or runtime details that I cannot act on.

**Why this priority**: Consistent, sanitized error contracts are what let clients handle failures correctly; leaking internals confuses clients and can reveal system details.

**Independent Test**: Trigger a known application failure (missing/invalid credential, forbidden, not found) and an unknown internal failure; confirm the known ones return the documented code/timestamp/path envelope, and in non-development environments the internal failure returns a generic internal code with no internal message or stack while the server log keeps the full trace.

**Acceptance Scenarios**:

1. **Given** a known application failure, **When** it is returned, **Then** the response contains the documented error code, a timestamp and the failing operation path.
2. **Given** an unknown internal failure in a non-development environment, **When** it is returned, **Then** the client sees a generic internal error code and no internal/database detail.
3. **Given** the same internal failure in a development environment, **When** it is returned, **Then** the client sees the detailed cause while the server log still records the full trace.
4. **Given** an internal failure, **When** it occurs, **Then** the full trace is recorded server-side regardless of environment.

---

### User Story 3 - Keep the workspace healthy (Priority: P3)

As a maintainer, I want the logging and error pipeline to integrate without breaking the ratified modules (007 execution layer and 008 JWT identity), so that the whole workspace keeps building, type-checking and testing green.

**Why this priority**: This feature touches the shared request pipeline; a regression there would silently break every module, so a guarded, additive integration is the acceptance criterion.

**Independent Test**: Run the API gates and the 007/008 suites (health/context/JWT) and confirm everything still passes with the new pipeline active.

**Acceptance Scenarios**:

1. **Given** the API workspace, **When** `build` and `typecheck` run, **Then** they complete successfully.
2. **Given** the API workspace, **When** the automated test suite runs, **Then** the existing 007 and 008 specs still pass alongside the new logging/error specs.
3. **Given** the workspace, **When** lint and regression gates run, **Then** nothing regresses.

---

### Edge Cases

- **Sensitive fields in input**: passwords, tokens, authorization headers and personal data (email/phone-like values) never reach log sinks, even when nested in request bodies.
- **Sensitive text in error messages**: an error message containing a credential or PII is sanitized before reaching the client.
- **Unknown internal errors**: unexpected database/network/runtime failures map to a generic internal code in non-development environments; the full trace is logged server-side.
- **Known application errors**: `UNAUTHENTICATED`, `FORBIDDEN`, not-found and validation failures keep their stable codes inside the new envelope (timestamp + path added).
- **Multiple failures in one response**: every error in a response is normalized independently.
- **Very high traffic**: structured logging adds negligible overhead per request (one record, no blocking).
- **Empty/missing values**: errors with no path or no timestamp fall back to safe defaults rather than failing the pipeline.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: The system MUST emit a structured log record for each HTTP/GraphQL request lifecycle describing the operation, duration and outcome.
- **FR-002**: The system MUST sanitize log output so credentials, tokens, authorization headers and personal data (PII) are never written to any log sink.
- **FR-003**: The system MUST record the full internal trace for every failed operation on the server side, in every environment.
- **FR-004**: Known application failures MUST be returned in a normalized envelope containing a stable code, a timestamp and the failing operation path.
- **FR-005**: In non-development environments, unknown internal failures MUST be returned to clients as a generic internal error code, with no internal, database or runtime detail.
- **FR-006**: In development environments, the same unknown internal failures MAY expose the detailed cause to clients while keeping the full trace server-side.
- **FR-007**: Error messages returned to clients MUST be sanitized so they never contain credentials, tokens or personal data.
- **FR-008**: Every error in a multi-error response MUST be normalized independently.
- **FR-009**: The mapping MUST preserve the existing application error codes already used by the API (e.g. authentication, forbidden, not found, conflict, validation), only wrapping them in the normalized envelope.
- **FR-010**: The system MUST include automated tests for sanitization, masking behaviour per environment, exception mapping and lifecycle logging.
- **FR-011**: All workspace gates MUST pass with zero regressions in the existing suites (007 execution layer, 008 JWT identity) under strict TypeScript rules.

### Key Entities _(include if feature involves data)_

- **Log record**: A structured event for a request lifecycle — operation, duration, outcome, and (server-side) internal trace, sanitized by classification.
- **Error envelope**: The normalized client-facing failure — stable code, timestamp, operation path — with internal detail stripped outside development.
- **Sensitive classification**: The set of field/pattern rules (credentials, tokens, PII) applied to both log sinks and client-visible messages.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Every request produces at least one structured log record (operation, duration, outcome) with negligible per-request overhead.
- **SC-002**: Automated log inspection finds **zero** occurrences of test credentials, tokens or PII across all emitted records.
- **SC-003**: Every known application failure returns the documented code + timestamp + path envelope.
- **SC-004**: In non-development environments, every unknown internal failure returns the generic internal code to the client while the full trace exists in the server log; in development, the detail is shown.
- **SC-005**: All workspace gates pass and the 007/008 suites show zero regressions.

## Assumptions

- **Structured logger**: a high-performance, established Node.js structured logger (per research) is used; development uses human-readable output, production uses JSON records consumed by log sinks.
- **Pipeline integration**: the error pipeline integrates with the ratified NestJS/Apollo request execution (lifecycle hooks + formatting layer), reusing the existing `extensions.code` convention rather than introducing a new error vocabulary.
- **Environment gate**: `NODE_ENV` (already used by the API) selects masking behaviour — non-production reveals, production masks unknown internal errors.
- **Sanitization scope**: credentials/tokens/authorization headers are always redacted; PII fields are redacted under a documented policy (email/phone-like user data in logs is treated as sensitive).
- **Existing codes preserved**: the API's current application codes (authentication, forbidden, not found, conflict, validation) keep their values inside the envelope; no client-breaking renames.
- **Existing request context preserved**: the execution layer (007) and JWT identity (008) context flow is unchanged — logging/formatting is additive.
- **Respect for the governance hierarchy**: this spec follows `specs/business-model.md` and the authority order of `constitution.md`; per SDD it precedes any implementation, and introduces no persistence, pricing or entitlement behavior.