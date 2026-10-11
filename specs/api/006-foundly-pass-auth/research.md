# Research: Foundly API — Tenant Auth, Sessions & Guards (Foundly Pass)

**Feature**: `specs/api/006-foundly-pass-auth/` | **Date**: 2026-10-11

## Decision 1: Session model — self-contained signed credentials

- **Decision**: sessions are opaque, HMAC-SHA256-signed credentials produced by `AuthService.signSession`
  and validated by `AuthService.verifySession` (payload: `userId`, `tenantId`, `role`, `exp`). The
  signing secret comes from `process.env.FOUNDLY_PASS_SECRET` (no committed secrets). No session or user
  tables are added.
- **Rationale**: DB-free, deterministic tests, stateless guards, and a forward-compatible shape when the
  real Foundly Pass SSO arrives (the service becomes the verification seam).
- **Alternatives considered**: DB-backed `Session` rows — rejected (adds tables/persistence for a stateless
  credential; revocable sessions arrive with the external pass); JWT library — rejected (a tiny `crypto`
  HMAC keeps deps at zero and the token opaque to clients).

## Decision 2: Guard/decorator stack — native NestJS, no Passport

- **Decision**: `GqlAuthGuard implements CanActivate` reading `GqlExecutionContext.create(context)`,
  extracting `Authorization: Bearer <token>`, verifying via `AuthService`, loading the tenant
  (`tenant.findUnique`) to check `status === 'active'` and read `plan`, and attaching an `AuthContext`
  to the request. `PlanGuard` reads `@RequirePlan` metadata via `Reflector` and blocks when the tenant
  plan is not granted. Decorators: `@UseAuth()` (guard), `@CurrentTenant()`/`@CurrentUser()` (param
  injection), `@RequirePlan('book'|'pos')` (both guards).
- **Rationale**: NestJS-native, fully typed, and the spec's exact request (`GqlAuthGuard` + decorators).
- **Alternatives considered**: Passport strategies — rejected (external SSO is future scope; adds deps for
  a token-only flow).

## Decision 3: Error semantics

- **Decision**: missing/malformed/expired/invalid token → GraphQL error `extensions.code =
'UNAUTHENTICATED'`; valid token but non-`active` tenant or unmet plan → `'FORBIDDEN'`. Helpers throw
  `GraphQLError` with those codes (consistent with `VALIDATION_ERROR`/`NOT_FOUND`/`CONFLICT` elsewhere).
- **Rationale**: the spec asks for clear rejection of unauthorized access; distinct codes let clients
  re-authenticate vs. contact-support.
- **Alternatives considered**: single `403`/HTTP-style errors — rejected (GraphQL `extensions.code` is the
  established convention here).

## Decision 4: Entitlement readiness — additive `Tenant.plan`

- **Decision**: add `Tenant.plan String?` (nullable; values like `book`, `pos`; `null` = no
  entitlements). `@RequirePlan(...)` enforces it; `currentTenant`/`me` expose it. A plan-gated sample
  (`bookCapability` with `@RequirePlan('book')`) proves the mechanism without migrating existing modules.
- **Rationale**: satisfies FR-007/FR-008 with a minimal additive field and opt-in gating.
- **Alternatives considered**: a normalized entitlement table — rejected (overkill now); hard-coding gating
  into every module — rejected (breaks the opt-in/no-regression stance).

## Decision 5: Strict tenant isolation

- **Decision**: protected hooks derive `tenantId` exclusively from `AuthContext` (attached by the guard);
  the guard ignores any client-supplied tenant args. The `me`/`currentTenant` surfaces only reflect the
  session tenant.
- **Rationale**: FR-006 — the session is the single source of scope; eliminates cross-tenant reads.
- **Alternatives considered**: trusting `tenantId` from resolver args — rejected (violates isolation).

## Decision 6: Global auth module

- **Decision**: `AuthModule` is `@Global` and exports `AuthService`, `GqlAuthGuard`, `PlanGuard`, so any
  module can use `@UseAuth`/`@RequirePlan` without importing wires; `SharedPrismaModule` (already global)
  provides the tenant lookup seam.
- **Rationale**: reuse for the upcoming protected modules (appointments, services, …) with zero wiring.
- **Alternatives considered**: per-module imports — rejected (boilerplate; guard injection contexts vary).

## Decision 7: Test strategy (DB-free)

- **Decision**: unit specs for `AuthService` (sign/verify, expiry, tamper, malformed/unknown), and guard
  unit specs (allow/deny, tenant status, plan metadata) with a mocked `AuthService`/`PrismaService` and a
  fixed secret; resolver e2e over `POST /graphql`: `me`/`currentTenant` without/invalid token →
  `UNAUTHENTICATED`, inactive tenant → `FORBIDDEN`, valid → context payload, `bookCapability` without plan
  → `FORBIDDEN` and with `book` plan → allowed.
- **Rationale**: matches FR-009; keeps gates DB-free and deterministic.
- **Alternatives considered**: real SSO or live DB — rejected (external/fragile; contradicts 003–005 posture).

## Risks

- Signing secret absent in dev: `AuthService` fails fast with a clear env error; documented in quickstart.
- Guard DB lookup per request grows with traffic — acceptable (single indexed tenant lookup; caching later).
- `@RequirePlan` metadata must be read on both method and class levels — `PlanGuard` checks handler first,
  then class (Reflector fallback).
- Additive `plan` regeneration ripple — regenerate within the same change set (003/005 precedent).
