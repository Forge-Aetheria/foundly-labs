# Feature Specification: Foundly API — Supabase Auth & JWT Identity for GraphQL

**Feature Branch**: `008-supabase-jwt-auth`

**Created**: 2026-10-11

**Status**: Draft

**Input**: User description: "Supabase Auth & JWT Integration for GraphQL API (Foundly Ecosystem). Implement robust authentication and authorization within `apps/api` using Supabase Auth JWTs. The system must securely intercept incoming GraphQL requests, validate the Bearer token, extract user claims, and inject the authenticated user profile into the GraphQL context (`ctx.user`). (1) Token Extraction & Validation: parse the `Authorization` header, validate Supabase JWT tokens securely (expiration and signature verification). (2) Context Enrichment: extend `GraphQLContext` with a user object (`id`, `email`, `role`, etc.); handle unauthenticated requests gracefully (public queries open, protected resolvers restricted). (3) Guards / Directives / Decorators: protect mutations and private queries from anonymous access. (4) Testing & SDD Compliance: unit and integration tests for valid tokens, expired tokens, missing headers, guarded routes; strict TypeScript; monorepo workspace boundaries."

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Recognize who is calling a protected operation (Priority: P1)

As a logged-in user, I want the API to recognize me from the access credential I present on each request, so that operations that require an identity only serve me and act on my behalf.

**Why this priority**: Without a trustworthy identity on every request, no protected mutation or private query can know who it is serving; this is the foundation of authorization for the whole API.

**Independent Test**: Present a valid, unexpired access credential from the identity provider to a protected operation and confirm the operation resolves and is attributed to the correct user (identifier, email, role); repeat with the credential removed and confirm the operation is rejected.

**Acceptance Scenarios**:

1. **Given** a request with a valid, unexpired access credential, **When** a protected operation runs, **Then** the operation is resolved and the request is attributed to the correct user identity.
2. **Given** a request with a valid credential, **When** a protected operation observes the request context, **Then** it can read the authenticated user's identifiers (user id, email, role).
3. **Given** a request without a credential, **When** a protected operation runs, **Then** it is rejected with a clear, machine-readable error and no protected data is returned.

---

### User Story 2 - Keep public surface open and degrade gracefully (Priority: P2)

As an operator, I want anonymous and erroring requests to fail cleanly without taking down the API, so that public queries stay available while protected operations are strictly gated.

**Why this priority**: The API mixes open and protected surface; graceful handling of missing/expired/invalid credentials is what keeps public read flows working at all times.

**Independent Test**: Call a public query without any credential (succeeds), then with an expired credential and a tampered credential on a protected operation (each rejected with the stable error code and no crash), then confirm the service keeps answering afterward.

**Acceptance Scenarios**:

1. **Given** a public query, **When** it is called without a credential, **Then** it succeeds and returns its data.
2. **Given** a protected operation with an expired credential, **When** it runs, **Then** it is rejected with a clear machine-readable error and the service stays up.
3. **Given** a protected operation with a tampered or invalid credential, **When** it runs, **Then** it is rejected and the service stays up.
4. **Given** the identity provider is temporarily unreachable, **When** a protected operation runs, **Then** it is rejected (fail-closed) without crashing the service.

---

### User Story 3 - Keep the workspace healthy and protected modules opt-in (Priority: P3)

As a maintainer, I want the new identity layer to bolt onto existing modules without forcing changes, so that the workspace keeps building, type-checking and testing with no regressions.

**Why this priority**: The constitutional workflow requires every increment to keep the workspace gates green and to protect only what is explicitly marked, avoiding breaking the ratified modules.

**Independent Test**: Run the API build, typecheck and test gates plus the workspace regression gates; confirm the existing modules still pass and that only operations explicitly marked as protected require an identity.

**Acceptance Scenarios**:

1. **Given** the API workspace, **When** `build` and `typecheck` run, **Then** they complete successfully.
2. **Given** the API workspace, **When** the automated test suite runs, **Then** it passes, including coverage for the identity scenarios in User Stories 1 and 2.
3. **Given** an existing module that is not marked protected, **When** it is called without a credential, **Then** it continues to behave as before (unchanged).
4. **Given** the whole workspace, **When** existing apps and packages are built and tested, **Then** there are no regressions.

---

### Edge Cases

- **Missing header**: A request with no `Authorization` header reaches public queries fine; a protected operation rejects it.
- **Malformed header**: A header not using the standard bearer format is treated as missing credential and rejected on protected operations.
- **Expired credential**: A validly signed but expired credential is rejected with a stable, machine-readable error (distinguishable from "invalid").
- **Tampered / wrong signature**: A credential whose signature does not verify (tampered or issued elsewhere) is rejected.
- **Wrong audience / issuer**: A well-signed token for another audience/provider is rejected.
- **Unknown or inactive user**: If the identity cannot be attributed to a known/active user, the operation rejects (fail-closed).
- **Provider unreachable**: If the signature key cannot be fetched, protected operations reject fail-closed without crashing; the service keeps answering afterwards.
- **Clock skew**: A credential a few seconds past its expiry (within a standard tolerance) is still accepted to avoid flaky edge failures.
- **Protected vs public surface**: Marking an operation protects only that operation; the rest of the schema stays unchanged.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: The API MUST read an access credential from the `Authorization` header of GraphQL requests using the standard bearer format.
- **FR-002**: The API MUST verify the credential's signature against the trusted identity provider's keys and reject credentials that fail verification.
- **FR-003**: The API MUST reject expired credentials with a clear, machine-readable error.
- **FR-004**: The API MUST reject protected operations when the credential is missing or malformed.
- **FR-005**: A verified credential MUST resolve to the user identity (user id, email, role, and validity times) and that identity MUST be available in the request context of the served operation.
- **FR-006**: Public queries MUST remain accessible without a credential; operations explicitly marked as protected MUST require a valid, unexpired credential.
- **FR-007**: When the identity provider cannot be reached (key fetch failure), protected operations MUST fail closed (reject) without crashing the service.
- **FR-008**: The protection mechanism MUST be opt-in (a standard operation guard/decorator), leaving existing unmarked modules unchanged.
- **FR-009**: The API MUST validate that a credential belongs to the expected issuer and audience before trusting it.
- **FR-010**: The API MUST include automated tests covering valid, expired, missing and malformed credentials, provider-unreachable and wrong-audience cases, plus public/guarded route behaviour.
- **FR-011**: All workspace gates MUST pass (`build`, `typecheck`, `test`, lint) with no regressions in existing apps and packages, under strict TypeScript rules.

### Key Entities _(include if feature involves data)_

- **User identity**: The authenticated caller resolved from a verified credential — user id, email, role, plus the credential's issuer and validity period.
- **Request context identity**: The identity attached to a request's context (`user`); present on authenticated requests and absent on public/anonymous ones.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: A user with a valid access credential gets protected operations answered, attributed to their identity, in under 1 second under normal conditions.
- **SC-002**: Anonymous, missing, malformed, expired or tampered credentials are rejected with the same stable machine-readable error, and public queries still succeed — with no service crash.
- **SC-003**: Each authenticated request is attributed to exactly one user identity (id, email, role) available in the request context.
- **SC-004**: The automated suite covers all four required credential scenarios (valid, expired, missing, malformed) plus guarded and public routes, all green.
- **SC-005**: The workspace gates pass (`build`, `typecheck`, `test`, lint) and existing apps/packages show no regressions.

## Assumptions

- **Identity provider = Supabase Auth**: the trusted provider is the already-in-use Supabase project; access credentials are Supabase Auth JWTs carrying the standard claims (`sub`, `email`, `role`, `aud`, `exp`, `iat`, `iss`).
- **Additive to the ratified auth posture**: the existing Foundly Pass session mechanism (`006`) is preserved; the Supabase JWT identity layer is added as the standard for user-facing identity (`request context user`) and is opt-in via operation guards, so no existing module is forced to change.
- **Fail-closed posture**: any inability to verify (unknown/inactive user, provider unreachable) rejects protected operations rather than allowing them through; public operations remain open regardless.
- **Reuse of the established GraphQL conventions**: the guard/context mechanisms follow the ratified NestJS code-first patterns already in the API (`007` request context, `006` guard/decorator conventions), extended with the JWT identity — documented at the capability level here, HOW left to the plan.
- **No new identity tables**: user identity is derived from the credential claims; persisting user profiles/sessions is out of scope.
- **Clock tolerance**: a small standard tolerance (seconds) applies around expiry to avoid flaky edge failures.
- **Respect for the governance hierarchy**: this spec follows `specs/business-model.md` (the ecosystem's value proposition and entitlement rules remain the source of truth for what an identity may access) and the authority order of `constitution.md` — per SDD it precedes any implementation, and introduces no pricing or entitlement behavior of its own.