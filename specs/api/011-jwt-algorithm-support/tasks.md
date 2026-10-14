# Tasks: Supabase JWT Algorithm Support (ES256 + RS256)

**Input**: Design documents from `/specs/api/011-jwt-algorithm-support/`

**Prerequisites**: plan.md, spec.md

**Gates**: `typecheck`, `lint`, `build`, `test` for `@foundly/api` — zero regressions.

## Phase 1: Verifier policy

- [x] T001 `apps/api/src/modules/auth/jwt.service.ts`: replace the hard-coded `algorithms: ['RS256']` with a curated `ALLOWED_ALGORITHMS = ['RS256', 'ES256']`; document why (provider signs ES256).
- [x] T002 Keep issuer/audience validation and the fail-closed `UNAUTHENTICATED` envelope unchanged.

## Phase 2: Tests exercise the production algorithm

- [x] T003 `apps/api/src/modules/auth/jwt.test-helper.ts`: generate an EC P-256 key pair (`ECDSA`/`P-256`) and export an `ES256` JWK.
- [x] T004 `signTestToken` defaults to `ES256`; every auth/catalog spec now signs ES256 tokens.
- [x] T005 Add a regression test in `jwt.service.spec.ts` that decodes the token header and asserts `alg === 'ES256'` before verifying.

## Phase 3: Verification

- [x] T006 `tsc --noEmit` for `apps/api` — green.
- [x] T007 ESLint — green.
- [x] T008 `jwt.service.spec.ts` (9/9) executed green, including the new ES256 test.
- [x] T009 Full `nest`/Vitest suite — **originally blocked in the author's machine** by the OS Application Control policy (`LoadLibraryExW failed` on the unsigned `@swc/core` native addon required by the test transform); `npm rebuild @swc/core` + a clean reinstall of `@swc/core-win32-x64-msvc@1.16.18` did not help because Windows blocks loading the unsigned binary. Not a code issue: a non-SWC (esbuild) runner confirmed the transform (decorator metadata) was the only gap, and pure unit specs passed. **Resolved 2026-10-13**: the API test transform no longer uses SWC (`apps/api/vitest.config.ts` compiles TS with the pure-JS TypeScript compiler), so the full suite runs locally — 32 files / 183 tests green.

---

## Dependencies

- T001 → T003/T004 (allow-list must include ES256 before the ES256 test tokens can pass).
- T005 depends on T003.
