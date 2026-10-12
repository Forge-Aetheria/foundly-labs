# Research: Foundly API — Domain MVP Module (Authenticated CRUD, Tenant-Isolated)

**Feature**: `specs/api/010-domain-mvp-module/` | **Date**: 2026-10-11

## Decision 1: Tenant scope source = custom claim on the Supabase access token

- **Decision**: add an optional `tenantId?: string` to `AuthUser` (008) mapped by `SupabaseJwtService`
  from the `tenant_id` claim (`app_metadata.tenant_id ?? claims.tenant_id`). Every catalog operation
  derives its scope from `ctx.user.tenantId`; client-supplied `tenant*` args are ignored.
- **Rationale**: the scope must come from the verified identity (spec FR-003); a custom claim is the
  standard claim-based multi-tenant pattern and requires **zero storage changes** (it is not a DB
  column). Additive: `tenantId` is optional, so existing 008 tokens/specs are unaffected.
- **Alternatives considered**: a users-to-tenant membership table — rejected (adds persistence and a
  migration for an MVP; deferred to a later account-management increment); reusing the 006 HMAC session
  tenant — rejected (different credential seam; mixing identities would muddle the Supabase flow).

## Decision 2: New additive module with a distinct `my*` GraphQL surface

- **Decision**: new `apps/api/src/modules/catalog/` module exposing `myServices`, `myService(id)`,
  `createMyService(input)`, `updateMyService(id, input)`, `deleteMyService(id)` and the same for
  Specialists — all `@RequireAuth()` — with new ObjectTypes/inputs. The 003–005 modules keep their
  existing field names and behavior.
- **Rationale**: code-first GraphQL rejects duplicate field names, so an authenticated, `ctx.user`-
  scoped surface must be additive and named distinctly; the `my*` prefix makes its origin unambiguous
  and keeps 003–005 (and their tests) untouched.
- **Alternatives considered**: mutating the existing `services`/`specialists` modules to require auth —
  rejected (breaks the ratified 003–005 contract and specs); nested `catalog { ... }` root — rejected
  (flatter `my*` reads better in resolvers/tests).

## Decision 3: Fail-closed scope enforcement, no existence oracle

- **Decision**: lookups and mutations always query with `where: { id, tenantId }` (or a tenant-scoped
  ownership check first); a zero-row result for an owned write → `NOT_FOUND`. Cross-tenant by-ID reads
  therefore cannot distinguish "exists elsewhere" → `NOT_FOUND` (spec FR-005). Lists filter by
  `where: { tenantId }` only.
- **Rationale**: prevents cross-tenant leaks and existence disclosure in one rule; matches the spec
  (cross-tenant → not found) and stays simple (single scoped filter per operation).
- **Alternatives considered**: pre-fetch + explicit `FORBIDDEN` — rejected (creates an existence oracle
  and an extra query).

## Decision 4: Validation before persist + predictable codes

- **Decision**: mutations whitelist input fields and validate required fields/bounds with the 009
  helpers (`validationError` → `VALIDATION_ERROR`); duplicate unique values (e.g., tenant-scoped unique key)
  mapped to `conflictError` → `CONFLICT`; the guard provides `UNAUTHENTICATED`. The 009 formatter wraps
  each into the envelope (`code`, `timestamp`, `path`).
- **Rationale**: spec FR-006/FR-007/FR-009 — validate before hitting the store, reuse the ratified
  error vocabulary rather than inventing codes.
- **Alternatives considered**: letting Prisma throw and mapping in a filter — rejected (validation at
  the service boundary is deterministic and testable without the DB).

## Decision 5: Hard delete with owned-relation cleanup

- **Decision**: `deleteMySpecialist` removes `SpecialistService` assignments and the specialist inside
  a transaction (the existing `@foundly/database` client supports `$transaction`); services with
  cross-relations rely on the scoped delete as in 004.
- **Rationale**: consistent with the ratified modules and prevents dangling join rows (spec FR-008).
- **Alternatives considered**: soft delete/status toggle — rejected (consistent with 003–005 existing
  hard-delete semantics; deferred as a later lifecycle concern).

## Decision 6: DB-free, deterministic tests via an in-memory store seam

- **Decision**: `catalog.store.ts` declares a narrow typed seam over the used Prisma methods; specs
  provide an in-memory implementation (tenant-keyed maps) and override it; e2e boots `AppModule` with
  the store overridden and signs tokens (008 local JWKS) carrying `tenant_id`. Unit specs cover scope
  filtering, not-found, validation and conflict paths.
- **Rationale**: spec FR-011 — hermetic, fast, no live DB; the optional `tenant_id` claim proves the
  isolation matrix (two tenants) deterministically.
- **Alternatives considered**: hitting the Supabase pooler — rejected (fragile, contradicts 003–010
  DB-free posture); mocking delegated `PrismaService` per model — accepted but the store seam keeps
  the surface tighter.

## Decision 7: Additive claim mapping keeps 008 green

- **Decision**: `jwt.service.ts` maps `tenant_id` only when present; `AuthUser.tenantId` optional; the
  existing `viewer`/008 specs assert only the fields they already assert — no behavior change.
- **Rationale**: spec FR-010/FR-012 — the identity layer must not regress; additive field + additive
  mapping with a safe default (`undefined` when the claim is absent).
- **Alternatives considered**: requiring `tenant_id` on every token — rejected (breaks anonymous/user
  tokens and 008 tests).

## Risks

- **GraphQL name collisions**: `my*` surface is deliberately distinct; the API build fails loudly if a
  duplicate sneaks in (code-first schema validation).
- **Claim availability**: legacy tokens without `tenant_id` → `ctx.user.tenantId` undefined → catalog
  ops must fail `UNAUTHENTICATED`/explicit config-style guard (documented); auth issues the claim going
  forward.
- **Store seam drift**: only the methods the module uses are exposed; growth adds methods + tests.
- **Transaction support**: in-memory store in tests implements a no-op `$transaction`; production path
  uses the ratified Prisma client unchanged.