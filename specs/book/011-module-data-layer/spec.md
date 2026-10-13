# Feature Specification: Module Data Layer & Client Hooks

**Feature Branch**: `011-module-data-layer`

**Created**: 2026-10-12

**Status**: Draft

**Input**: User description: "Establecer una regla estricta de arquitectura para la estructura de archivos y el consumo de la API en el frontend (`apps/book`): cada módulo tiene `actions.ts` (funciones de servidor: fetches y Server Actions), `hooks.ts` (hooks de cliente que envuelven las interacciones) y `components/`. Ninguna vista/componente puede llamar a `useQuery`/`useMutation`/`apiRequest` directamente. Nomenclatura `use<Acción><Entidad|Módulo>`. Tipado exclusivo vía `graphql-codegen` (`generated.ts`), prohibidos los DTOs manuales. Los archivos de `shared/infra` que manejen acciones de servidor deben pertenecer a su módulo; `shared/infra` debe dejar de existir. Activar `codegen` de verdad (Opción A)."

_This spec is governed by `constitution.md` v5.2.0 (§5.I SDD, §5.II Server-First, §5.VI Capa de Datos por Módulo), `specs/business-model.md` (Foundly Book, §2.3) and `specs/architecture.md` v1.1.0. It lives in the `book` domain because the primary affected application is `apps/book`._

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Tipado único generado por codegen (Priority: P1)

As a developer, I want the GraphQL contract types to be generated from the API schema, so there is a single source of truth and no drift between the API and the frontend.

**Independent Test**: Change a field in `apps/api/src/schema.gql`, run codegen, and confirm the frontend fails to type-check until the operation is updated.

**Acceptance Scenarios**:

1. **Given** the API SDL, **When** `npm run codegen -w @foundly/book` runs, **Then** `shared/api/generated.ts` contains the documents and types for every operation used by `apps/book`.
2. **Given** the generated artifacts, **When** `typecheck` runs without a running API, **Then** it passes (the generated file is committed).
3. **Given** the transports, **When** a response is read, **Then** it is typed by the generated types, never by a hand-written DTO.

---

### User Story 2 - Capa de datos por módulo (Priority: P1)

As a developer, I want each module to own its server data access, so the codebase is scalable and the UI never talks to the API.

**Independent Test**: Inspect any module: server reads/writes live in `actions.ts`, client interactions live in `hooks.ts`, and `components/` import neither transports nor Server Actions.

**Acceptance Scenarios**:

1. **Given** a module with data, **When** I look at its folder, **Then** it has `actions.ts` (server) and `hooks.ts` (client).
2. **Given** any view/component, **When** it needs data, **Then** it uses a hook from its `hooks.ts` (client) or receives props from a Server Component (server).
3. **Given** `shared/infra`, **When** the migration is complete, **Then** the folder no longer exists.

---

### User Story 3 - Hooks de cliente con nomenclatura estándar (Priority: P2)

As a developer, I want predictable hook names, so interactions are discoverable.

**Acceptance Scenarios**:

1. **Given** an interaction, **When** it is exposed to the UI, **Then** it is a hook named `use<Acción><Entidad|Módulo>`.
2. **Given** a client component, **When** it triggers a mutation, **Then** it calls the hook, never the Server Action directly.

---

### Edge Cases

- A read-only module (profile/gallery) has `actions.ts` but no `hooks.ts` if it has no client interaction.
- A resource consumed by more than one module (appointments, specialists, tenancy) has a single owner; consumers import the owner's server functions, never re-declare the document.
- Generated artifacts are committed so `typecheck`/`build` pass in CI without a running API.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: `apps/book` MUST consume the GraphQL API through `graphql-codegen` documents and types (`generated.ts`); hand-written GraphQL DTOs MUST be removed.
- **FR-002**: `apiClient` MUST accept generated `TypedDocumentNode` documents (typed variables and results).
- **FR-003**: Each module with data MUST expose its server access through `src/modules/<modulo>/actions.ts`.
- **FR-004**: Each module with client interaction MUST expose its hooks through `src/modules/<modulo>/hooks.ts`.
- **FR-005**: Views/components (`components/`, `dialogs/`, `<Modulo>View`) MUST NOT call `useQuery`, `useMutation`, `apiRequest` or Server Actions directly.
- **FR-006**: Hooks MUST follow `use<Acción><Entidad|Módulo>`.
- **FR-007**: `shared/infra/` MUST be eliminated; its cross-cutting content MUST move to purpose-named shared folders (`shared/api/`, `shared/types/`, `shared/auth/`).
- **FR-008**: Server-First MUST be preserved: render reads stay in Server Components via `actions.ts`; `hooks.ts` is for client interaction only.
- **FR-009**: The constitution (§5.VI), `code-rules.md` (§9) and `specs/architecture.md` (§1.I) MUST reflect this architecture.

### Key Entities

- **Generated contract**: `shared/api/generated.ts` (documents + types) produced from `apps/api/src/schema.gql`.
- **Module actions**: server-only data access per module.
- **Module hooks**: client wrappers per module.
- **Shared api/auth/types**: cross-cutting infrastructure with clear purpose.

## Success Criteria _(mandatory)_

- **SC-001**: Zero hand-written GraphQL DTOs remain in `apps/book/src`.
- **SC-002**: `shared/infra/` no longer exists.
- **SC-003**: Zero direct data calls (`apiRequest`/Server Actions/`useQuery`/`useMutation`) inside `components/`/`dialogs/`/`<Modulo>View`.
- **SC-004**: 100% of hooks follow the naming pattern.
- **SC-005**: `typecheck`, `lint`, `test` and `build` pass with zero regressions.

## Assumptions

- The API SDL is available at `apps/api/src/schema.gql` (code-first auto schema).
- Generated artifacts are committed (so CI type-checks without a running API).
- Server-First is preserved; client hooks wrap Server Actions, they do not fetch the API directly.
