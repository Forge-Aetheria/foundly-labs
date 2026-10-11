# Data Model: Foundly — API Bootstrap

**Feature**: `specs/api/001-api-bootstrap/` | **Date**: 2026-10-11

This feature introduces no business/domain entities. The "model" it defines is the **workspace graph**
entry and the **governance registry** record for the new service.

## Workspace graph (npm workspaces)

| Field        | Value                              | Rule                                                            |
| ------------ | ---------------------------------- | --------------------------------------------------------------- |
| package name | `@foundly/api`                     | unique within `packages/*` and `apps/*`                          |
| location     | `apps/api/`                        | under the `apps/*` workspace glob                               |
| type         | `module` (ESM-friendly build)      | consistent with other apps                                       |
| scripts      | `build`, `dev`, `start`, `test`, `lint`, `typecheck` | all must run from the workspace |
| port         | `3002` (override `PORT`)           | no collision with `book` (3001) / others                          |
| deps         | NestJS core + common + platform-express, reflect-metadata, rxjs | runtime |
| devDeps      | `@nestjs/cli`, `@nestjs/testing`, types, vitest, supertest, eslint-config-* | build/test tooling |

## Governance registry records

### Inventory (constitution §3 + `specs/architecture.md` §1 + README)

| Field      | Value                     |
| ---------- | ------------------------- |
| service    | `apps/api`                |
| workspace  | `@foundly/api`            |
| stack      | NestJS (Node.js)          |
| role       | Backend API / servidor    |
| gates      | `npm run build -w @foundly/api` · `npm run test -w @foundly/api` |

### Domain rule (constitution §1/§2 + mirror + README)

- New domain `api`, valid domain list includes `api`.
- Backend specs live under `/specs/api/<nnn>-<feature>/` with per-domain sequential numbering (starts at `001`).

## Relationships

`apps/api` is a sibling of `apps/landing|book|store` under `apps/*`. It must not be imported by any
`packages/*` (dependency rule), and — for this bootstrap — it imports no shared UI package. The
spec-domain rule binds all future backend features to `/specs/api/`.