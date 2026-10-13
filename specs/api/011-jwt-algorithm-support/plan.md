# Implementation Plan: Supabase JWT Algorithm Support (ES256 + RS256)

**Branch**: `011-jwt-algorithm-support` | **Date**: 2026-10-13 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/api/011-jwt-algorithm-support/spec.md`

## Summary

The Supabase JWT verifier hard-coded `algorithms: ['RS256']`. The project's JWKS publishes an ECC key (`ES256`), so every real access token failed verification and every protected operation returned `Unauthenticated`. Replace the single-algorithm restriction with a curated asymmetric allow-list (`RS256`, `ES256`), and switch the authentication test key from RSA to EC P-256 / ES256 so the suite exercises the production algorithm.

## Technical Context

**Language/Version**: TypeScript strict · NestJS 11 · Node ≥ 20.

**Primary Dependencies**: `jose` (JWKS + `jwtVerify`), `graphql`. **No new dependencies.**

**Storage**: none (stateless token verification).

**Testing**: Vitest; `tsc --noEmit`; `nest build`; root ESLint.

**Target Platform**: API server (`apps/api`).

**Constraints**: strict TS, no `any`; fail-closed posture; issuer/audience checks preserved.

**Scale/Scope**: 2 production files (`jwt.service.ts`, `jwt.test-helper.ts`) + 1 spec.

## Constitution Check

_GATE: Must pass before Phase 0. Re-check after Phase 1._

- **SDD (§5.I)** — spec + plan exist; tasks downstream.
- **Dominio (§2.III)** — spec in `specs/api/`; only `apps/api` changes.
- **Tipado estricto (§5.IV)** — no `any`; allow-list typed explicitly.
- **Gates (§3.I)** — build/typecheck/test/lint certified `apps/api`.

**Pre-Phase-0**: PASS. **Post-Phase-1**: PASS (no violations).

## Project Structure

### Documentation (this feature)

```text
specs/api/011-jwt-algorithm-support/
├── plan.md
├── spec.md
└── tasks.md
```

### Source Code (repository root)

```text
apps/api/src/modules/auth/
├── jwt.service.ts        # ALLOWED_ALGORITHMS = ['RS256', 'ES256'] (was ['RS256'])
├── jwt.test-helper.ts    # EC P-256 key + ES256 default (was RSA/RS256)
└── jwt.service.spec.ts   # + regression test asserting the ES256 token header
```

**Structure Decision**: Single-module corrective change in `apps/api`; no new packages, no schema changes.

## Complexity Tracking

> Not required: Constitution Check passes with no violations.
