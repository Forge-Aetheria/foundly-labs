# Contract: API Bootstrap (apps/api)

**Feature**: `specs/api/001-api-bootstrap/` | **Date**: 2026-10-11

## Workspace / scripts contract

| Script       | Command expectations                                                            |
| ------------ | -------------------------------------------------------------------------------- |
| `build`      | Compiles `src/` → `dist/` with the Nest CLI (workspace `npm run build -w @foundly/api`). |
| `dev`        | Watch mode (server restarts on changes).                                          |
| `start`      | Builds and starts the compiled server.                                            |
| `test`       | Runs the vitest suite (workspace `npm run test -w @foundly/api`).                 |
| `lint`       | Runs the root ESLint config over the app.                                        |
| `typecheck`  | `tsc --noEmit` over the app.                                                     |

## Health endpoint contract

| Method | Path | Status | Body (example)                    |
| ------ | ---- | ------ | --------------------------------- |
| GET    | `/`  | 200    | `{ "service": "foundly-api", "status": "ok" }` |

Guarantees: responds without external dependencies; startup via `PORT` env override (default 3002);
no auth required (bootstrap health check).

## Governance registration contract

The same commit MUST touch all of the following, keeping them consistent:

1. `constitution.md` — add `apps/api` to the service inventory (§3) and `api` to the domain tables (§1/§2) + gates.
2. `.specify/memory/constitution.md` — mirror sync (must stay equal to root).
3. `specs/architecture.md` — add `apps/api` to the topology/inventory.
4. `README.md` — routes, commands and the `/specs/api/` reference.

## Gates / verification

- `npm run build -w @foundly/api` → success.
- `npm run test -w @foundly/api` → 100% pass.
- `npm run build -w @foundly/book` and `npm run test -w @foundly/ui` → unchanged green (no regressions).
- `npm install` at root resolves the workspace graph with no errors.