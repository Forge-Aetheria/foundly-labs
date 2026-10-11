# Feature Specification: Foundly — API Bootstrap (NestJS apps/api)

**Feature Branch**: `001-api-bootstrap`

**Created**: 2026-10-11

**Status**: Draft

**Input**: User description: "Vamos a iniciar la fase de Backend inicializando el servidor NestJS en `apps/api` e integrándolo al monorepo bajo las reglas de la constitución. Objetivo: (1) scaffold inicial de NestJS en `apps/api` (package.json con dependencias base y scripts build/dev/test/lint; estructura mínima `main.ts` + `app.module.ts`; vinculación al tsconfig del workspace); (2) actualizar `constitution.md` y `README.md` (registrar `apps/api` en el inventario de apps, definir la regla de dominio `/specs/api/<nnn>-<feature>/`, establecer los gates `npm run build -w @foundly/api` y `npm run test -w @foundly/api`); (3) verificar que la resolución de workspaces en la raíz reconoce `apps/api` sin romper `apps/book` ni `@foundly/ui`."

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Bootstrap the backend service (Priority: P1)

As a developer, I want a new runnable backend service in `apps/api` wired into the npm workspaces, with the standard build/dev/test/lint scripts and a minimal bootable application, so that future backend work has a consistent starting point.

**Why this priority**: Without a bootable, wired-up service nothing else (registration, gates) can be verified.

**Independent Test**: Run the API's build and test commands from the workspace and confirm the service compiles and its suite passes; confirm the root workspace resolution now includes `apps/api`.

**Acceptance Scenarios**:

1. **Given** the workspace, **When** `apps/api` is added, **Then** it is recognized as a workspace (`@foundly/api`) by the root `npm install`/workspace resolution.
2. **Given** the API workspace, **When** its standard scripts run, **Then** `build`, `dev`, `test` and `lint` exist and the build/test commands complete successfully.
3. **Given** the API source, **When** the server is started, **Then** it boots with an HTTP endpoint that responds (e.g., a root or health route).

---

### User Story 2 - Register the service and the API domain (Priority: P2)

As a maintainer, I want `apps/api` documented in the service inventory and a dedicated `/specs/api/` domain rule so that the codebase and future backend specs follow the governance.

**Why this priority**: Governance docs must reflect the new member so rules are unambiguous and enforceable.

**Independent Test**: Inspect the updated governance/README and confirm `apps/api` is listed, the `api` domain rule exists with `/specs/api/<nnn>-<feature>/`, and the API gates are documented.

**Acceptance Scenarios**:

1. **Given** the governance inventory, **When** `apps/api` is added, **Then** it appears in the service/app inventory (constitution/architecture/README).
2. **Given** the domain table, **When** the API domain is added, **Then** valid domains include `api` and specs for the API live under `/specs/api/<nnn>-<feature>/`.
3. **Given** the commands section, **When** documented, **Then** the API gates `npm run build -w @foundly/api` and `npm run test -w @foundly/api` are listed.

---

### User Story 3 - Verify integration without regressions (Priority: P3)

As a maintainer, I want to confirm the new workspace does not break existing applications or packages.

**Why this priority**: Only unblocked, green integration proves the change is safe.

**Independent Test**: Run the full workspace-resolved build/test for `apps/book` and the `@foundly/ui` package and confirm all still pass.

**Acceptance Scenarios**:

1. **Given** the updated workspace, **When** `apps/book` is built/tested, **Then** it still compiles and passes without changes.
2. **Given** the updated workspace, **When** `@foundly/ui` is tested, **Then** its suite still passes.
3. **Given** the monorepo, **When** dependency resolution runs, **Then** there are no workspace-link errors from the new `apps/api`.

---

### Edge Cases

- The new workspace collides in naming or port with an existing one: the service name `@foundly/api` and port must not conflict with `book`/`store`.
- The root workspace fails to resolve `apps/api` (e.g., missing lockfile entry): resolution must be re-run until the workspace graph is clean.
- Governance docs drift (inventory vs architecture vs README): the feature keeps the three references consistent in one commit.
- The API is the first service in a new domain: numbering restarts at `001` inside `/specs/api/`, consistent with the per-domain sequential rule.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: The monorepo MUST include a new deployable service `apps/api` exposed as the workspace package `@foundly/api` with `build`, `dev`, `start`, `test`, `lint` and `typecheck` scripts.
- **FR-002**: `apps/api` MUST contain a minimal bootable application structure (entrypoint and root module) with a health-checkable HTTP endpoint.
- **FR-003**: The workspace MUST resolve `apps/api` without breaking the existing `apps/book` and `@foundly/ui` resolution or their tests/build.
- **FR-004**: The service inventory MUST be updated to register `apps/api` (with its stack, role and scope) in the governance docs and README.
- **FR-005**: The domain rule MUST be updated so valid spec domains include `api`, with backend specs living under `/specs/api/<nnn>-<feature>/` (per-domain sequential numbering).
- **FR-006**: The verification gates for the API MUST be documented as `npm run build -w @foundly/api` and `npm run test -w @foundly/api`, and MUST pass after the bootstrap.
- **FR-007**: Existing applications and packages MUST remain green (no regressions) after the integration.

### Key Entities _(include if feature involves data)_

- **API service (`apps/api`)**: a new backend service in the monorepo (workspace `@foundly/api`), stack and behavior documented as part of the registration.
- **API domain (`/specs/api/`)**: the new spec domain governing backend/server features and tasks.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: `npm run build -w @foundly/api` completes successfully from the root.
- **SC-002**: The API test suite runs and passes 100% (`npm run test -w @foundly/api`).
- **SC-003**: After integration, `apps/book` builds/test passes and `@foundly/ui` tests pass (0 regressions).
- **SC-004**: `apps/api` appears in the inventory and the `api` domain rule exists in the governance docs (constitution/README), verifiable by inspection.

## Assumptions

- The backend stack is NestJS (Node framework) as specified by the user; the exact dependency set is the standard NestJS scaffolding (`core`, `common`, `platform-express`, CLI/dev utilities), resolved through the workspace.
- Bootstrapping the service is a constitution-level change: this feature includes the required governance amendment (register the app and the new domain) in the same change set.
- `apps/api` uses a dedicated port and root module that does not collide with `book`/`store`.
- No persistence/domain endpoints beyond the health route are in scope for this feature; those follow in later `/specs/api/<nnn>-<feature>/` specs.
- Vercel multi-zone routing for the new service is out of scope for this initial bootstrap.