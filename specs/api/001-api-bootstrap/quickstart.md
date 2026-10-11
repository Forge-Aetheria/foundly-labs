# Quickstart: Foundly — API Bootstrap

**Feature**: `specs/api/001-api-bootstrap/` | **Date**: 2026-10-11

## Onboarding

1. `npm install` at the repository root (wires `@foundly/api` into the workspace graph).
2. Verify workspace resolution: `npm ls @foundly/api` lists `apps/api`.
3. Run the API gates: `npm run build -w @foundly/api` and `npm run test -w @foundly/api`.

## Manual walkthrough

1. Start `npm run dev -w @foundly/api` (default port 3002).
2. `curl http://localhost:3002/` → `200 { "service": "foundly-api", "status": "ok" }`.
3. Change `src/app.controller.ts` and confirm the watcher restarts the server.
4. Edit `src/app.controller.spec.ts`, add an assertion, run `npm run test -w @foundly/api` → suite green.

## Verification matrix (contract `contracts/api-bootstrap.contract.md`)

| Scenario                                  | Expected                                                        |
| ----------------------------------------- | --------------------------------------------------------------- |
| `npm install` at root                     | workspace graph resolves `@foundly/api` without errors          |
| `npm run build -w @foundly/api`           | exit 0, `dist/` produced                                        |
| `npm run test -w @foundly/api`            | 100% pass                                                       |
| `curl :3002/`                             | `200` health payload                                            |
| `npm run build -w @foundly/book`          | unchanged success (no regressions)                              |
| `npm run test -w @foundly/ui`             | unchanged success (no regressions)                              |
| Inspect `constitution.md` + README        | `apps/api` registered; `api` domain + gates present             |

## Test commands

| Command                                  | Scope                    |
| ---------------------------------------- | ------------------------ |
| `npm run build -w @foundly/api`          | Build gate               |
| `npm run test -w @foundly/api`           | Vitest suite             |
| `npm run typecheck -w @foundly/api`      | `tsc --noEmit`           |
| `npm run test -w @foundly/book`, `-w @foundly/ui` | Regression gates |