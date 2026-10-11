# Research: Foundly — API Bootstrap (NestJS apps/api)

**Feature**: `specs/api/001-api-bootstrap/` | **Date**: 2026-10-11

## Decision 1: Workspace wiring (npm workspaces)

- **Decision**: rely on the existing root `workspaces: ["apps/*","packages/*"]`. Adding
  `apps/api/package.json` (name `@foundly/api`) makes npm link it automatically after `npm install`;
  no changes to the root manifest are required to resolve the new app.
- **Rationale**: the fetch uses the standard workspace mechanism already in place for `book`/`store`.
- **Alternatives considered**: pointing the root tsconfig at the app (there is **no** root tsconfig;
  each app ships its own), or adding explicit `references` (not used today).

## Decision 2: tsconfig strategy

- **Decision**: `apps/api/tsconfig.json` strict (target ES2022, moduleResolution Bundler, strict,
  noUncheckedIndexedAccess, noEmit for editor) + `tsconfig.build.json` (emits to `dist/`) used by
  `nest build`.
- **Rationale**: mirrors `apps/book/tsconfig.json`; keeps the compiler self-contained per app.
- **Alternatives considered**: a shared root tsconfig base — rejected, none exists to reuse.

## Decision 3: Test runner

- **Decision**: vitest (`@nestjs/testing` + `supertest`), consistent with `apps/book` and
  `packages/ui`.
- **Rationale**: mono-consistent tooling; the bootstrap "standard" `test` script still applies.
- **Alternatives considered**: Nest CLI default `jest` — rejected to avoid a second runner/config.

## Decision 4: NestJS scaffold + health endpoint

- **Decision**: minimal `main.ts` + `app.module.ts` + a small `AppController` exposing `GET /`
  (health payload), bootstrapped with `NestFactory.create(AppModule)`; port `3002` (override via
  `PORT`), avoiding conflicts with `book` (3001) and the Astro build runner.
- **Rationale**: matches the spec's minimal structure while satisfying the health-checkable endpoint
  (FR-002) and giving the test something real to exercise.
- **Alternatives considered**: inline `app.get('/')` in `main.ts` — rejected (not testable without
  extracting a module/controller).

## Decision 5: Governance amendment (scope)

- **Decision**: the feature updates, in one commit: the root `constitution.md` (domain tables §1/§2,
  inventory §3 and gates §gates), its canonical mirror `.specify/memory/constitution.md` (must stay
  byte-aligned with root), `specs/architecture.md` (topology + inventory) and `README.md` (routes,
  commands, specs reference).
- **Rationale**: constitution §2 mandates the domain path rule and the mirror sync discipline; one
  coherent change avoids governance drift.
- **Alternatives considered**: updating only README — rejected (would violate the amendment rules).

## Decision 6: Lint/format

- **Decision**: reuse the root `eslint.config.js` and `.prettierrc` (covers `apps/*`); the API
   registers `lint: eslint .` internally.
- **Rationale**: no per-app lint config duplication (constitución: shared tooling).
- **Alternatives considered**: a separate ESLint config for apps/api — rejected as duplication.

## Risks

- Nest 11 requires a recent Node; the CI/dev Node version must be ≥ 20 (document in README).
- `nest start --watch` spinner in `dev` is fine locally; CI uses `build`.
- Lockfile churn: `npm install` updates `package-lock.json` (kept out of feature commits per project practice).