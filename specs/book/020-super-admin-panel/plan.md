# Implementation Plan: Foundly Book — Super Admin Console (Global Dashboard & Business Management)

**Branch**: `020-super-admin-panel` | **Date**: 2026-10-14 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/book/020-super-admin-panel/spec.md`

## Summary

Build the platform-owner console in `apps/book` on top of the already-implemented API (`specs/api/019-super-admin-panel`): a **protected top-level route `/super-admin`** (server-guarded; anonymous → sign-in, non-admin → access-denied state, no platform data rendered) with (1) a **metrics dashboard** (total/active businesses, total users with an "unavailable" state, PRO conversion, and a FREE-vs-PRO distribution breakdown), and (2) a **managed-businesses table** (bounded/paginated, searchable by name/slug, showing name/plan/status/expiry) with an **override dialog** to change a business's plan, status and expiry via `overrideTenantSubscription`. The console follows the ratified **module data-layer** (constitution §5.VI): a new `super-admin` module with `actions.ts` (server reads/writes through the session-aware `apiRequestAdmin`), `hooks.ts` (client triggers), `super-admin.graphql` (codegen documents) and codegen-only types; UI components never call the API directly. It reuses the Clean Light UI tokens and `@foundly/ui` primitives. **No new dependencies.**

## Technical Context

**Language/Version**: TypeScript 5.9 (strict) · Next.js / React 19 (App Router) · Tailwind CSS v4 + `@foundly/ui` (Clean Light UI).

**Primary Dependencies**: the existing module data-layer (`shared/api/client` `apiRequest`, `shared/api/admin-request` `apiRequestAdmin` with session bearer, `graphql-codegen` TypedDocumentNode), `@foundly/ui` primitives, Next.js `app` router. **No new dependencies.**

**Storage**: N/A in `apps/book` — the console reads/writes the API over GraphQL; the source of truth is the `api` feature.

**Testing**: Vitest + React Testing Library (view/dashboard/table/dialog) and Vitest unit tests for the server `actions.ts` mapping/error handling (mock `shared/api/client`, mirroring `modules/directory/tests/actions.test.ts`). `tsc --noEmit`; `next build`; root ESLint.

**Target Platform**: Next.js web app (`apps/book`); a top-level console route independent of the tenant-bound `/admin` workspace.

**Performance Goals**: server-render the initial metrics/table from the session; the search updates the URL query; keep the result set bounded (the API caps the limit); skeletons while data resolves.

**Constraints**: strict TS, no `any`; the UI must not call the API/data hooks directly (§5.VI); codegen-only DTOs; serializable props across the RSC boundary (§5.V); design tokens only (§6); the console must never render platform data to a non-admin.

**Scale/Scope**: 1 new route (`/super-admin` + `layout.tsx` + `loading.tsx`) + 1 new module (`super-admin`, ~12 files incl. components/dialog/tests); 3 GraphQL operations; 0 migrations; codegen snapshot already synced by `api/019`.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **SDD (§5.I)** — spec + this plan exist; `tasks.md` downstream; no code before approval.
- **Dominio (§2.III)** — spec in `specs/book/`; changes confined to `apps/book` (the API surface already exists in `specs/api/019-super-admin-panel`).
- **Tipado estricto (§5.IV)** — codegen-only documents/types; no `any`; no hand-written GraphQL DTOs.
- **Server-First (§5.II)** — the console renders on the server from the session; only the search input and the override dialog are client islands.
- **Frontera Server/Client (§5.V)** — client islands receive serializable props only; the dialog receives the row data and a serializable action result, not server callbacks with functions.
- **Capa de datos por módulo (§5.VI)** — `super-admin/actions.ts` + `hooks.ts` + `super-admin.graphql`; the UI never calls the API directly; naming `usePlatformMetrics`/`useManagedBusinesses`/`useOverrideSubscription`.
- **Diseño (§6)** — cards, badges, table, dialog and states use canonical tokens/`@foundly/ui`.
- **Gates (§3.I)** — `build`, `typecheck`, `test`, lint for `@foundly/book` with zero regressions.
- **Test location (§10)** — tests under `apps/book/src/modules/super-admin/tests/` and `apps/book/src/app/super-admin/tests/`.
- **Governance (§1)** — subordinated to `specs/business-model.md` and `constitution.md`.

**Pre-Phase-0**: PASS. **Post-Phase-1**: PASS (no violations → Complexity Tracking empty).

## Project Structure

### Documentation (this feature)

```text
specs/book/020-super-admin-panel/
├── plan.md
├── spec.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── super-admin.contract.md
├── checklists/requirements.md
└── tasks.md                 # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
apps/book/src/app/super-admin/
├── layout.tsx               # server guard: resolve session; anonymous → /login; renders the console shell
├── page.tsx                 # thin route: reads `q`/`page`, calls the module action, renders <SuperAdminView>
└── loading.tsx              # skeleton dashboard/table

apps/book/src/modules/super-admin/            # NEW module
├── super-admin.graphql      # PlatformMetrics + ManagedBusinesses + OverrideTenantSubscription
├── actions.ts               # 'use server': getPlatformMetrics / getManagedBusinesses / overrideSubscription
├── hooks.ts                 # 'use client': usePlatformMetrics / useManagedBusinesses / useOverrideSubscription
├── SuperAdminView.tsx       # server: composes dashboard + table + access state
├── components/
│   ├── MetricsCards.tsx     # total businesses, active businesses, total users (+ unavailable)
│   ├── PlanDistribution.tsx # FREE vs PRO breakdown (badges/segmented bar)
│   ├── ManagedBusinessesTable.tsx
│   ├── BusinessRow.tsx
│   └── SuperAdminStates.tsx # skeletons + empty/error/access-denied states
├── dialogs/
│   └── OverrideSubscriptionDialog.tsx   # 'use client': plan/status/expiry form + confirm
├── utils/
│   ├── types.ts             # view models (PlatformMetricsView, ManagedBusinessView, OverrideFormValues)
│   └── schemas.ts           # zod schema for the override form
└── tests/
    ├── actions.test.ts
    ├── SuperAdminView.test.tsx
    ├── MetricsCards.test.tsx
    ├── ManagedBusinessesTable.test.tsx
    └── OverrideSubscriptionDialog.test.tsx
```

**Structure Decision**: A new `super-admin` module owns the privileged data access and the console UI, following the ratified `actions.ts`/`hooks.ts`/`<module>.graphql`/`components/`/`dialogs/`/`tests/` layout (constitution §5.VI). The route is a **top-level** `/super-admin` (not under `/admin`) with a thin server page and a server guard layout, because the `/admin` workspace requires a tenant-bound session that a platform admin may not have. The override dialog is the only interactive client island besides the search input.

## Complexity Tracking

> Not required: Constitution Check passes with no violations.
