# Implementation Plan: Module Data Layer & Client Hooks

**Branch**: `011-module-data-layer` | **Date**: 2026-10-12 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/book/011-module-data-layer/spec.md`

## Summary

Activate `graphql-codegen` as the single source of typed documents/types, rewire `apiClient` to
`TypedDocumentNode`, and reorganize `apps/book` so every module owns its data access
(`actions.ts` server + `hooks.ts` client + `components/`). Dissolve `shared/infra/`, moving its
cross-cutting pieces to purpose-named folders (`shared/api/`, `shared/types/`, `shared/auth/`).
Server-First is preserved: render reads stay in Server Components via `actions.ts`; hooks wrap
Server Actions for client interaction.

## Technical Context

**Language/Version**: TypeScript strict · Next.js 15.5.27 · React 19.3 · Node ≥ 20.

**Primary Dependencies**: existing `graphql-request` (v7, supports `TypedDocumentNode`),
`@graphql-codegen/cli` + `typescript` + `typescript-operations` + `typed-document-node` (already in
devDependencies). **No new runtime dependencies.**

**Storage**: PostgreSQL via `apps/api` (GraphQL). Book consumes it over HTTP only.

**Testing**: Vitest + RTL + vitest-axe; `tsc --noEmit`; `next build`; root ESLint.

**Constraints**: strict TS, no `any`; Server-First (constitution §5.II/§5.VI); `@foundly/ui` only.

## Constitution Check

- **§5.I SDD** — spec + plan + tasks exist.
- **§5.II Server-First** — render reads stay server-side; hooks are interaction-only.
- **§5.VI Capa de Datos por Módulo** — the target of this feature; `shared/infra` dissolved.
- **§5.V RSC boundary** — client hooks/components keep serializable props.
- **§5.IV Tipado estricto** — codegen types replace hand-written DTOs; no `any`.
- **§3/§7 Estructura** — `modules/<modulo>/{actions.ts,hooks.ts,components/}`.

**Pre-Phase-0**: PASS.

## Migration map (`shared/infra` → destino)

| Origen (`src/shared/infra/…`) | Destino |
| --- | --- |
| `apiClient.ts` | `src/shared/api/client.ts` (transporte GraphQL genérico) |
| `graphql/*.graphql` + `generated.ts` | `src/shared/api/operations/*.graphql` + `src/shared/api/generated.ts` |
| `health.ts` | `src/shared/api/health.ts` |
| `result.ts` | `src/shared/types/result.ts` |
| `auth.ts`, `authServer.ts`, `authConstants.ts`, `authGuard.ts` | `src/shared/auth/` |
| `supabase/*` | `src/shared/auth/supabase/` |
| `sessionActions.ts`, `sessionSchemas.ts` | `src/modules/auth/actions.ts` + `utils/` |
| `securityActions.ts` | `src/modules/security/actions.ts` |
| `remoteCatalog.ts` (services) | `src/modules/services/actions.ts` |
| `remoteCatalog.ts` (specialists admin) | `src/modules/staff/actions.ts` |
| `remoteAvailability.ts` | `src/modules/availability/actions.ts` |
| `remoteAppointments.ts` | `src/modules/agenda/actions.ts` (dueño); public-booking importa de agenda |
| `remoteSpecialists.ts` (público) | `src/modules/staff/actions.ts` (lectura pública); public-booking importa de staff |
| `remoteTenancy.ts` | `src/modules/onboarding/actions.ts` (createTenant) + `src/shared/tenancy/` (lecturas tenant) |

> **Recursos compartidos entre módulos** (appointments, specialists, tenancy): un único dueño; los
> demás módulos importan las funciones de servidor del dueño. No se duplican documentos.

## Project Structure

```text
apps/book/src/
├── shared/
│   ├── api/
│   │   ├── client.ts            # apiRequest<TypedDocumentNode> (server-only)
│   │   ├── generated.ts         # codegen (committed)
│   │   ├── health.ts
│   │   └── operations/*.graphql # documentos por área
│   ├── auth/                    # sesión (auth*, supabase/*)
│   ├── types/                   # result.ts + dominio
│   ├── utils/ tenancy/ components/
├── modules/<modulo>/
│   ├── actions.ts               # server: lecturas + Server Actions (codegen)
│   ├── hooks.ts                 # client: use<Acción><Entidad>
│   ├── components/ dialogs/ utils/ tests/
│   └── <Modulo>View.tsx
└── (sin shared/infra)
```

**Codegen**: `apps/book/codegen.ts` apunta `schema: '../api/src/schema.gql'` y
`documents: ['src/shared/api/operations/**/*.graphql']`; salida `src/shared/api/generated.ts`
(committed, se quita de `.gitignore`).

## Complexity Tracking

> No violations: la feature implementa directamente los principios §5.VI/§5.I.
