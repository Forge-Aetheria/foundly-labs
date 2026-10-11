# Feature Specification: Foundly API — Tenant Auth, Sessions & Guards (Foundly Pass)

**Feature Branch**: `006-foundly-pass-auth`

**Created**: 2026-10-11

**Status**: Draft

**Input**: User description: "Atención: Vamos a implementar la Spec 006 del backend: Sistema de Autenticación de Tenant, Sesiones y Guards de seguridad (`Foundly Pass`) en `apps/api`. Objetivos: (1) Módulo de Autenticación / Sesiones (`apps/api/src/modules/auth/`): lógica y servicios para validar sesiones de usuario/staff asociadas a un `Tenant`; verificar el estado de la cuenta/suscripción del tenant (preparando el terreno para entitlements o planes activos como Book/POS). (2) Guards y Decoradores GraphQL en NestJS: `GqlAuthGuard` y decoradores personalizados (ej. `@CurrentTenant`, `@UseAuth`) para inyectar el contexto de seguridad en los Resolvers; asegurar aislamiento estricto por `tenantId` en operaciones protegidas. (3) Pruebas TDD y Quality Gates: pruebas unitarias y e2e (DB-free con mocks de Prisma) para guards y rechazo de accesos no autorizados; `npm run build -w @foundly/api`, `npm run test -w @foundly/api` y no-regresión en el monorepo."

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Validate sessions and resolve the tenant (Priority: P1)

As a backend service, I want to validate a user/staff session and resolve the tenant it belongs to, so that authenticated requests carry a trusted identity and scope.

**Why this priority**: Auth is the foundation for protecting every tenant operation; without session validation nothing else can be gated safely.

**Independent Test**: Given a valid session token, the auth service resolves the user/staff identity and its tenant; invalid/expired/malformed/missing tokens are rejected with a clear unauthorized error — DB-free green.

**Acceptance Scenarios**:

1. **Given** a valid session token, **When** the auth service validates it, **Then** the user/staff identity and its tenant are returned.
2. **Given** a missing, malformed, expired or unknown token, **When** validated, **Then** it is rejected with a clear unauthorized error.
3. **Given** the tenant's account, **When** its status is checked, **Then** non-active tenants are flagged as not usable.

---

### User Story 2 - Guard protected operations and inject context (Priority: P2)

As a resolver author, I want protected operations enforced by an authentication guard and decorated with the current user/tenant, so that unauthenticated access is refused and handlers never guess the tenant.

**Why this priority**: Guards turn authentication into enforcement; without them any resolver could read cross-tenant data.

**Independent Test**: A protected query without a token is refused; with a valid token it receives the `@CurrentTenant` context — DB-free e2e green.

**Acceptance Scenarios**:

1. **Given** a protected GraphQL operation, **When** no valid session is presented, **Then** it is refused with a clear unauthorized error.
2. **Given** a valid session, **When** a protected resolver runs, **Then** the decorator injects the current tenant context.
3. **Given** a protected operation, **When** a client attempts to pass a different tenant scope, **Then** the system uses only the session's tenant (strict isolation).

---

### User Story 3 - Expose tenant account/subscription status (Priority: P3)

As a business, I want my account's status and plan (readiness for Book/POS capabilities) visible to protected surfaces, so that capability gating can be enforced.

**Why this priority**: Plans drive entitlements; exposing the status prepares the capability-gating layer.

**Independent Test**: A guarded query returns the current tenant's status and plan; a plan-gated capability is refused when the tenant's plan does not include it — DB-free green.

**Acceptance Scenarios**:

1. **Given** an authenticated session, **When** a protected query asks for the current tenant, **Then** it returns its account status and plan.
2. **Given** a plan-gated capability (e.g., Book/POS), **When** the tenant's plan does not include it, **Then** the operation is refused with a clear forbidden error.
3. **Given** a tenant with the required plan, **When** a plan-gated operation runs, **Then** it proceeds.

---

### User Story 4 - Keep the quality gates green (Priority: P3)

As a maintainer, I want DB-free unit and e2e coverage for the guards and unauthorized-rejection paths, and green workspace gates.

**Acceptance Scenarios**:

1. **Given** the auth module, **When** its unit and e2e specs run, **Then** they pass DB-free (session validation, guard activation, unauthorized rejection, tenant-status blocking, plan gating, isolation).
2. **Given** the API, **When** `build`, `typecheck` and `test` run, **Then** they pass.
3. **Given** the workspace, **When** existing apps/packages are built and tested, **Then** there are no regressions.

---

### Edge Cases

- **No authorization header**: a missing bearer token on a protected operation yields an unauthorized error.
- **Malformed/expired/unknown token**: rejected by validation before any data access.
- **Session from another issuer/secret**: rejected (tampering/forgery prevention).
- **Suspended/inactive or draft tenant**: blocked on protected operations even with a valid token.
- **Missing plan on a plan-gated capability**: forbidden with a clear error.
- **Cross-tenant attempt**: protected operations ignore client-supplied tenant scope and enforce the session tenant.
- **Public operations**: unguarded queries/mutations remain accessible without a token.
- **Plan not yet known (null)**: treated as no entitlements for plan-gated capabilities.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: The system MUST validate user/staff sessions and resolve the associated tenant identity from a presented session credential.
- **FR-002**: The system MUST reject missing, malformed, expired, unknown or invalid session credentials with a clear unauthorized error.
- **FR-003**: The system MUST verify the tenant's account status on protected operations and block tenants that are not active.
- **FR-004**: Protected GraphQL operations MUST be refused when no valid session is present (unauthorized) or when the tenant is not usable (forbidden).
- **FR-005**: The system MUST provide resolver decorators to inject the authenticated user and the current tenant context into handlers.
- **FR-006**: In protected operations, the tenant scope MUST be derived from the session only; client-supplied tenant arguments MUST NOT change the effective scope.
- **FR-007**: The system MUST make the current tenant's account status and plan (Book/POS entitlement readiness) available via a protected surface (e.g., a guarded `currentTenant` query).
- **FR-008**: Plan-gated capabilities MUST be refused when the tenant's plan does not include them, and allowed when it does.
- **FR-009**: The auth layer MUST be covered by DB-free unit and end-to-end tests for session validation, guard activation, unauthorized/forbidden rejection, tenant-status blocking, plan gating and isolation.
- **FR-010**: The API gates MUST pass (`build`, `typecheck`, `test`) with no regressions in the existing workspace.

### Key Entities _(include if feature involves data)_

- **User/Staff identity**: the authenticated principal (id, role) carried by a session; belongs to a Tenant.
- **Session credential**: an opaque, signed token conveying identity and tenant scope (no shared secrets in the repository; secret from environment).
- **Tenant**: the scoping root; its **status** (`active`/`draft`/`suspended`) and an additive **plan** field gate protected operations and entitlements.
- **AuthContext**: the runtime object injected into protected resolvers (`{ userId, tenantId, role, tenant }`).

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: A valid session resolves the correct user/staff and tenant in <1 operation round-trip; invalid credentials are rejected 100% of the time.
- **SC-002**: No protected operation succeeds without a valid session, and no suspended/inactive tenant can access protected data (0 unauthorized reads).
- **SC-003**: Protected resolvers derive tenant scope from the session in 100% of cases; client-supplied tenant args cannot alter the scope.
- **SC-004**: The guarded `currentTenant` surface reports account status + plan; plan-gated capabilities are enforced for Book/POS readiness.
- **SC-005**: The auth module's guards and rejection paths are covered by DB-free unit and e2e tests, and the API `build`/`typecheck`/`test` gates pass with no regressions.

## Assumptions

- **Session model**: sessions are self-contained, cryptographically signed credentials (opaque to clients) validated by the auth service — matching a future Foundly Pass SSO integration; no new session or user tables are introduced by this feature.
- **Secret management**: a signing secret is provided via environment (`FOUNDLY_PASS_SECRET`) in local/dev; no secrets are committed.
- **Account/plan model**: `Tenant.status` already exists; an **additive** `Tenant.plan String?` field (e.g., `book`, `pos`) stores the active entitlement, and a null plan means no entitlements. Plan-gating uses an opt-in capability decorator so current modules are unaffected until guarded.
- **Isolation contract**: protected resolvers consume `@CurrentTenant()` from the guard; the feature demonstrates it via a guarded `currentTenant` query (and a plan-gated sample) rather than migrating all existing modules to auth in this change.
- **Posture**: unguarded public operations keep working; this feature does not break existing module behaviour (no regression).
- **Error conventions**: unauthorized/forbidden are surfaced as GraphQL errors with stable codes (e.g., `UNAUTHENTICATED`/`FORBIDDEN`), consistent with the existing `extensions.code` pattern.
- **Testing posture**: unit and e2e tests use mocked auth/DB seams DB-free, per `003`–`005`.
- **Scope boundary**: external SSO/OAuth flows, user registration/password flows, refresh/revocation endpoints and full plan billing are out of scope; only the guard/context/status foundation lands here.
- **This spec respects `specs/business-model.md`** (pricing/plans and entitlements source) and the hierarchy of `constitution.md`; persistence continues under the ratified Prisma + PostgreSQL strategy via `@foundly/database`.
