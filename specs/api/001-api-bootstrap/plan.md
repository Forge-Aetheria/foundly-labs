# Implementation Plan: Foundly — API Bootstrap (NestJS apps/api)

**Branch**: `001-api-bootstrap` | **Date**: 2026-10-11 | **Spec**: `specs/api/001-api-bootstrap/spec.md`

**Input**: Feature specification from `/specs/api/001-api-bootstrap/spec.md`

## Summary

Bootstrap a new backend service `apps/api` (NestJS) in the monorepo: workspace package `@foundly/api`
with the standard `build`/`dev`/`start`/`test`/`lint`/`typecheck` scripts, a minimal bootable app
(`src/main.ts` + `src/app.module.ts` + a tiny health controller), and self-contained `tsconfig.json`
consistent with the other apps. In the same change set, register `apps/api` in the governance docs and
README and amend the spec-domain table to include the new `api` domain (`/specs/api/<nnn>-<feature>/`).
Finally verify the workspace graph keeps `apps/book` and `@foundly/ui` green.

## Technical Context

**Language/Version**: TypeScript strict · Node 20+ · NestJS 11

**Primary Dependencies**: `@nestjs/core`, `@nestjs/common`, `@nestjs/platform-express`, `reflect-metadata`, `rxjs` (+ dev: `@nestjs/cli`/`@nestjs/schematics`, types, `vitest`, `@nestjs/testing`, `supertest`)

**Storage**: None — health-only bootstrap; persistence stays undefined

**Testing**: Vitest (consistent with the rest of the monorepo) + `@nestjs/testing` + `supertest`

**Target Platform**: Node.js HTTP server (web service)

**Project Type**: Monorepo app (`apps/api`) built via npm workspaces

**Performance Goals**: N/A (bootstrap)

**Constraints**: C1 — shared design-system binding only where relevant (not applicable to a server app); C2 — domain modules stay pure; C3 — persistence only via the app seam; C4 — existing apps must not regress.

**Scale/Scope**: one scaffolded service + governance registration; no business endpoints yet.

## Constitution Check

*GATE: must pass before Phase 0 research. Re-check after Phase 1 design.*

- The constitution currently enumerates apps `landing/book/store` and domains `shared-ui/landing/book/store` (§1, §2.I, §2.III, §3). Adding `apps/api` + the `api` domain is a **change to the constitution itself**; this feature is the authorized amendment and MUST also update the canonical mirror at `.specify/memory/constitution.md` and the topology inventory at `specs/architecture.md`.
- Governance updates (registration, domain rule, gates) are documented in the same change set (spec FR-004/005/006).
- No regressions to `apps/book` or `@foundly/ui` (spec FR-003/007).

**Post-design re-check**: PASS — the amendment is scoped and explicit; `apps/api` stays decoupled (no cross-imports into `packages/*`; no persistence introduced).

## Project Structure

### Documentation (this feature)

```text
specs/api/001-api-bootstrap/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   └── api-bootstrap.contract.md
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
apps/api/                       # NEW service (workspace @foundly/api)
├── package.json                # name @foundly/api; scripts; NestJS deps (dev + prod)
├── tsconfig.json               # strict, noEmit-free build config (mirrors book pattern)
├── tsconfig.build.json         # used by nest build
├── nest-cli.json               # compiler options for nest build/start
├── vitest.config.ts
├── vitest.setup.ts (optional)
└── src/
    ├── main.ts                 # bootstrap NestFactory + port 3002 (PORT env override)
    ├── app.module.ts           # root module (registers the health controller)
    ├── app.controller.ts       # GET / health route
    └── app.controller.spec.ts  # @nestjs/testing + supertest

governance (same commit):
constitution.md                          # §1/§2 domain lists + §3 inventory + gates
.specify/memory/constitution.md          # mirror sync (must stay equal to root)
specs/architecture.md                    # §1 topology + service inventory
README.md                                # routes + commands + specs reference
specs/api/                               # new spec domain (this feature)
```

**Structure Decision**: standard NestJS layout under `apps/api`; vitest instead of jest for test
tooling consistency with the existing workspace; root ESLint/Prettier configs apply to `apps/*`.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Constitution + architecture + mirror + README all change in one feature | The service is brand-new to governance; all four documents must stay consistent (no drift) | Updating only one doc would violate the "no duplicación normativa / mirror sync" rules |
| `apps/api` is a Node server in a Next/Astro monorepo | The user explicitly opened the backend phase with NestJS | Restricting to Next.js-only would contradict the requested phase |
| vitest instead of the Nest CLI default (jest) | Tooling consistency across the monorepo + C-constraints | Adding a second runner duplicates config/maintenance |