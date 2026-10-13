# Implementation Plan: Front-to-Back API Integration & Admin Catalog Sync

**Branch**: `008-api-integration-catalog-sync` | **Date**: 2026-10-12 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/book/008-api-integration-catalog-sync/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command; its definition describes the execution workflow.

## Summary

Connect `apps/book` (Next.js 15 / React 19) to the existing NestJS GraphQL API (`apps/api`, `POST /graphql`, port 3002) and migrate the **Admin Catalog** (services + team) and **Tenancy** (owner/tenant binding + admin guard) from the in-memory seam (`apps/book/src/shared/infra/store.ts`) to live GraphQL operations. Supporting changes: CORS allowlist in the API, documented environment configuration, a Supabase Auth cookie session that replaces the hardcoded `getCurrentSession()`, a typed GraphQL transport that injects the `Authorization: Bearer <token>`, and a graceful local fallback for unmigrated domains (gallery, reviews, policies). Quality gates (`build`, `typecheck`, `test`) must pass in both apps with zero regressions.

## Technical Context

**Language/Version**: TypeScript strict (book: Next.js 15.5.27 / React 19.3; api: NestJS / Node.js ≥ 20). Configuración monorepo npm workspaces.

**Primary Dependencies**: (proposed, resolved in `research.md`) `@supabase/supabase-js` + `@supabase/ssr` (session), `graphql` + `graphql-request` v7 (typed transport), dev `@graphql-codegen/cli + typescript + typed-document-node` (type sync). Zero new runtime deps for the API (CORS via built-in Nest/Express).

**Storage**: PostgreSQL (Supabase) via `@foundly/database` **server-side only** for migrated entities; the book accesses it exclusively through the API over HTTP. The in-memory store seam (`store.ts`) is retained for unmigrated domains (gallery, reviews, policies) and test seeding.

**Testing**: book — Vitest + RTL + vitest-axe (`npm run test -w @foundly/book`), `tsc --noEmit`; api — Vitest + supertest (`npm run test -w @foundly/api`), `npm run build -w @foundly/api`. Root lint: `npm run lint`.

**Target Platform**: Vercel Multi-Zone — book zone `foundly-book.vercel.app` (public `/book/*`), API deployed as its own project (non-local environments set env vars per project).

**Project Type**: Web application (frontend server-first + backend GraphQL service).

**Performance Goals**: Standard web-app behaviour: admin interactions complete in the order of seconds under normal network with loading/error states; no Core Web Vitals regression (constitution §5.III).

**Constraints**: `strict: true`, no `any` (constitution §5.IV); Server-First — GraphQL calls live in Server Actions/Components, client JS justified only by interaction (§5.II); no secrets in the repository (`.env` gitignored, `.env.example` allowed); apps/book must NOT import `@foundly/database` (architecture.md §1); admin surfaces must keep `@foundly/ui`.

**Scale/Scope**: MVP per-business (single tenant per owner); catalog of services + specialists; low multi-tenancy load. Unmigrated domains stay local.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **SDD (§5.I)** — "No spec, no code": spec exists (`specs/book/008-…/spec.md`); this plan is the design artifact; downstream tasks will be generated per SDD.
- **Dominio (§2.III)** — Spec lives in `specs/book/008-api-integration-catalog-sync`; backend-only behavioural changes would belong to `specs/api/` (none required by this feature beyond documented CORS/env touch).
- **Server-First (§5.II)** — Plan routes all GraphQL through Server Actions/Components; `Authorization` header is injected server-side; client components never receive the bearer token.
- **Tipado estricto (§5.IV)** — Design mandates typed contracts (GraphQL typed documents + Zod where needed); no `any`/implicit casts.
- **Reglas monorepo (architecture.md §1)** — Shared code stays in `packages/`; the GraphQL/session infra is book-scoped (`apps/book/src/shared/infra/`) and may be promoted to a `packages/*` client later if `store` needs it; book consumes the API over HTTP, never `@foundly/database`.
- **Persistence (architecture.md §1)** — Storage remains behind `@foundly/database` + the API; the book only swaps its *client* seam (in-memory store → API), which architecture already anticipates ("single seam that must be replaced").
- **Design system (§6)** — Admin screens continue using `@foundly/ui` tokens/components; no new visual design tokens.
- **Envs & secrets (architecture.md §3.1)** — New variables documented in `specs/architecture.md` (per its amendment policy) and `.env.example` files; secrets never committed.
- **Gates (constitution §3.I)** — Build/typecheck/test for `@foundly/book` and `@foundly/api` must pass with zero regressions (FR-010, SC-005).

**Pre-Phase-0 check**: PASS (no violations). **Post-Phase-1 re-check**: PASS — the design only touches `apps/book` infra + a documented CORS/env change in `apps/api/src/main.ts`; it introduces no new projects, no monorepo cycle, no `any`, no duplicate shared logic, and does not couple the book to `@foundly/database`.

## Project Structure

### Documentation (this feature)

```text
specs/book/008-api-integration-catalog-sync/
├── plan.md                    # This file (/speckit.plan command output)
├── research.md                # Phase 0 output — decisions with rationale/alternatives
├── data-model.md              # Phase 1 output — entities, mappings, states
├── quickstart.md              # Phase 1 output — validation guide
├── contracts/                 # Phase 1 output — interface contracts
│   ├── api-connectivity.contract.md
│   ├── session-auth.contract.md
│   ├── admin-catalog.contract.md
│   └── tenancy.contract.md
└── tasks.md                   # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
apps/api/
└── src/
    └── main.ts                            # enableCors with CORS_ORIGINS allowlist (env-driven)
    └── .env.example                       # documented env (DATABASE_URL, SUPABASE_AUTH_URL, FOUNDLY_PASS_SECRET, PORT, CORS_ORIGINS)

apps/book/
├── .env.example                           # API_URL, NEXT_PUBLIC_API_URL?, SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
├── next.config.mjs                        # serverActions.allowedOrigins (multi-zone/custom origin)
├── codegen.ts                             # @graphql-codegen config (schema: generated schema.gql or introspection)
├── src/
│   ├── middleware.ts                      # Supabase cookie refresh (getClaims pattern)
│   ├── shared/infra/
│   │   ├── supabase/
│   │   │   ├── client.ts                  # createBrowserClient singleton
│   │   │   └── server.ts                  # createServerClient per request (async cookies)
│   │   ├── apiClient.ts                   # graphql-request wrapper: URL from API_URL, Bearer injection, error mapping
│   │   ├── graphql/
│   │   │   ├── schema.gql                 # generated/downloaded schema (codegen input)
│   │   │   └── <module>.generated.ts      # typed documents per surface (catalog, tenancy)
│   │   └── auth.ts                        # REPLACED seam: getCurrentSession() ← Supabase session; requireRole/requireTenant unchanged
│   ├── modules/onboarding/utils/actions.ts      # signUp/signIn, createTenant, bind tenant_id, refresh
│   ├── modules/{services,staff}/utils/queries.ts     # catalog reads via apiClient
│   ├── modules/{services,staff}/utils/actions.ts     # catalog writes via apiClient
│   ├── modules/agenda/utils/…            # unchanged (out of scope)
│   └── modules/public-booking/utils/queries.ts   # getPublicBusiness reads tenant(slug) for migrated fields, merges local fields
```

**Structure Decision**: The feature is split across two deployable apps but the *only* new source surface is:
1. `apps/api/src/main.ts` (CORS) — a one-file, env-driven change scoped to this feature and documented via `architecture.md`.
2. `apps/book/src/shared/infra/` (transport + session) and the module `utils/{queries,actions}.ts` of **services** and **staff** (catalog) plus **onboarding** and **public-booking/tenancy** seams.

All other modules (agenda, availability, gallery, business-profile/policies, reviews, public booking dialogs) remain untouched this iteration. No new top-level directories or packages are introduced; the client may be promoted to `packages/api-client` later if `apps/store` requires it (architecture.md §1 promotion rule).

## Complexity Tracking

> Not required: Constitution Check passes with **no violations**, so no complexity justifications are needed. The two-app surface is inherent to the feature (frontend + backend-of-record), not an avoidable structure.