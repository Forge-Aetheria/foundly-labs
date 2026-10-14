# Implementation Plan: Foundly Book — Public Business Directory & Discovery

**Branch**: `019-business-directory` | **Date**: 2026-10-14 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/book/019-business-directory/spec.md`

## Summary

Add the public discovery directory to `apps/book`: a server-first route at `/directorio` that lists eligible businesses as cards, a text search (name/category/city) driven by the URL query string, and a `BusinessCard` that presents logo/cover, name, short description, location, general weekly hours and a prominent **"Ver perfil" / "Reservar"** action linking to the existing public page `/[tenantSlug]` (which already hosts the booking flow: catalog, calendar, slots and the advance step).

The feature follows the ratified **module data-layer** convention (constitution §5.VI): a new `directory` module owns `actions.ts` (server reads), `hooks.ts` (client search), `directory.graphql` (the `searchBusinesses` document added by the `api` companion) and codegen-only types. The route is a thin Server Component that renders `DirectoryView`; only the search input is a small client island that debounces and writes the term to the URL, so results render on the server. The data comes from the public `searchBusinesses` query specified under **`specs/api/018-business-directory`** (its implementation is a prerequisite of this feature). **No new dependencies.**

## Technical Context

**Language/Version**: TypeScript 5.9 (strict) · Next.js / React 19 (App Router) · Tailwind CSS v4 + `@foundly/ui` (Clean Light UI theme).

**Primary Dependencies**: the existing module data-layer (`shared/api/client` `apiRequest`, `graphql-codegen` TypedDocumentNode), `@foundly/ui` primitives, Next.js `app` router. **No new dependencies.**

**Storage**: N/A in `apps/book` — public reads go through the API over GraphQL; the only persistence concern is the `searchBusinesses` query owned by `specs/api/018-business-directory`.

**Testing**: Vitest + React Testing Library (component/render tests) and Vitest unit tests for the server `actions.ts` mapping (mirroring `public-booking/tests/queries.test.ts`). `tsc --noEmit`; `next build`; root ESLint.

**Target Platform**: Next.js web app (`apps/book`), public zone `/book` (`/[tenantSlug]` is the public mini-site; `/directorio` is the discovery route).

**Project Type**: Web application (public SaaS discovery surface).

**Performance Goals**: server-render the first page of results with skeletons for pending navigations; the search interaction must not perform a full reload or lose focus; bounded result sets (the API caps the limit). Core Web Vitals budget per constitution §5.III.

**Constraints**: strict TS, no `any`; the UI must not call `apiRequest`/`useQuery`/Server Actions directly (§5.VI); codegen-only DTOs; no functions crossing the RSC boundary (§5.V); design tokens only (§6); public route with no authentication.

**Scale/Scope**: 1 new route (`/directorio`) + 1 new module (`directory`, ~9 files incl. components/tests) + a nav entry; 1 GraphQL document; 0 migrations; 1 codegen snapshot sync (owned by the `api` companion).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **SDD (§5.I)** — spec + this plan exist; `tasks.md` downstream; no code before approval.
- **Dominio (§2.III)** — spec in `specs/book/`; changes confined to `apps/book` (+ the codegen snapshot synced with `specs/api/018-business-directory`).
- **Tipado estricto (§5.IV)** — codegen-only documents/types; no `any`; no hand-written GraphQL DTOs.
- **Server-First (§5.II)** — the directory renders on the server from the URL query; only the debounced search input is a client island.
- **Frontera Server/Client (§5.V)** — the search island receives serializable props only; no callbacks pass from a Server Component into a client primitive.
- **Capa de datos por módulo (§5.VI)** — `directory/actions.ts` + `hooks.ts` + `directory.graphql`; UI components never call data directly; naming `useFetchDirectory`/`useSearchDirectory`.
- **Diseño (§6)** — cards, badges, skeletons and states use the canonical tokens/`@foundly/ui` primitives.
- **Gates (§3.I)** — `build`, `typecheck`, `test`, lint for `@foundly/book` with zero regressions.
- **Test location (§10)** — tests live under `apps/book/src/modules/directory/tests/` (book already complies).
- **Governance (§1)** — subordinated to `specs/business-model.md` (module discovery and the Foundly Book value proposition) and `constitution.md`.

**Pre-Phase-0**: PASS. **Post-Phase-1**: PASS (no violations → Complexity Tracking empty).

## Project Structure

### Documentation (this feature)

```text
specs/book/019-business-directory/
├── plan.md
├── spec.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── directory.contract.md
├── checklists/requirements.md
└── tasks.md                 # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
apps/book/src/app/directorio/
└── page.tsx                 # thin route: reads `q`, renders <DirectoryView>

apps/book/src/modules/directory/                # NEW module
├── directory.graphql        # SearchBusinesses query (consumes api 018)
├── actions.ts               # 'use server': getDirectoryBusinesses(query) + mapping to card view model
├── hooks.ts                 # 'use client': useDirectorySearch (debounced URL write)
├── DirectoryView.tsx        # server-rendered view: header, search, grid, states
├── components/
│   ├── DirectoryHeader.tsx  # title + intro (public, SEO-friendly)
│   ├── DirectorySearch.tsx  # 'use client' island wrapping the input (debounce → URL)
│   ├── BusinessCard.tsx     # logo/cover, name, description, location, hours, CTA
│   ├── BusinessCardGrid.tsx # responsive grid + empty/no-results states
│   └── DirectoryStates.tsx  # skeletons + error/retry
├── utils/
│   └── hours.ts             # format the general weekly schedule for display
└── tests/
    ├── actions.test.ts      # server mapping + error handling
    ├── DirectoryView.test.tsx
    ├── DirectorySearch.test.tsx
    └── BusinessCard.test.tsx

apps/book/src/shared/components/AdminNavigation.ts   # (optional) public entry link to /directorio
apps/book/codegen.schema.gql                          # synced with api 018 (searchBusinesses) — owner: api companion
```

**Structure Decision**: A new `directory` module owns the public read and the search interaction, following the ratified `actions.ts`/`hooks.ts`/`<module>.graphql`/`components/`/`tests/` layout (constitution §5.VI; mirrors `public-booking`). The route is a thin Server Component that resolves the `q` search param and renders `DirectoryView`; the only client JavaScript is the search island. The card/view-model mapping keeps the API shape (codegen types) out of the UI.

## Complexity Tracking

> Not required: Constitution Check passes with no violations.
