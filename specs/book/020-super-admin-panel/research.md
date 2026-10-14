# Phase 0 — Research: Foundly Book — Super Admin Console

**Feature**: `specs/book/020-super-admin-panel` · **Date**: 2026-10-14

All Technical Context unknowns are resolved below (no `NEEDS CLARIFICATION` remained).

## R1 — Top-level `/super-admin` route outside the tenant admin workspace

- **Decision**: Add the console at `apps/book/src/app/super-admin/` with its own `layout.tsx` (server guard), `page.tsx` (thin) and `loading.tsx`. Do **not** nest it under `/admin`.
- **Rationale**: `app/admin/layout.tsx` requires a **tenant-bound** session (`resolveTenantSession`) and redirects unbound users to onboarding; a platform admin is not necessarily bound to a business, so `/admin/super` would be unusable. The spec allowed `/admin/super` or `/super-admin`.
- **Alternatives considered**: Making `/admin/layout.tsx` tolerant of platform admins — rejected (invasive to a shared, ratified guard). Keeping `/admin/super` with a nested override — rejected (Next.js parent layouts always apply).

## R2 — Authorization: authoritative server check + access-denied state

- **Decision**: The guard is **server-side and fail-closed**. The `layout.tsx` resolves the live session and redirects anonymous users to `/login`. The `page.tsx` calls `getPlatformMetrics()`; when the API answers `FORBIDDEN` the view renders an **AccessDenied** state and no platform data. There is no client-only role flag guarding data.
- **Rationale**: FR-001/FR-002/FR-003/SC-001; the API (`specs/api/019-super-admin-panel`) is the authority (platform role ⊂ verified JWT). Trusting a client-side flag would be bypassable.
- **Alternatives considered**: A client-only role check — rejected (not secure). Duplicating the platform-role parsing in the book — rejected (the API is the authority; the book only needs to react to `FORBIDDEN`).

## R3 — Data layer follows the module convention (§5.VI)

- **Decision**: A new `super-admin` module with `actions.ts` (`'use server'`, using `apiRequestAdmin` to inject the session bearer), `hooks.ts` (`'use client'`), `super-admin.graphql` (codegen documents) and a `tests/` folder — mirroring `directory`/`services`.
- **Rationale**: FR-012/SC; constitution §5.VI forbids data calls in the UI and requires codegen-only types. `apiRequestAdmin` already centralizes session-expiry redirects.
- **Alternatives considered**: Reusing another module's actions — rejected (distinct privileged domain). A direct `fetch` in the page — rejected (bypasses the data-layer rule and the error/redirect handling).

## R4 — Metrics dashboard composition

- **Decision**: `MetricsCards` renders the summary cards — **Total Negocios**, **Negocios Activos**, **Total Usuarios** (with an "unavailable" state when the API reports `users.available = false`) — plus a **PRO conversion** figure; `PlanDistribution` renders the FREE vs PRO breakdown as badges/segmented bar with the counts. All are server-rendered from `getPlatformMetrics()`.
- **Rationale**: FR-004/FR-005/FR-006/SC-002; matches the requested indicators and the API `platformMetrics` shape.
- **Alternatives considered**: A charting dependency — rejected (no new deps; a segmented bar/badges convey the split with the design tokens). Client-fetching the metrics — rejected (server-first).

## R5 — Managed businesses table: URL-driven search + pagination

- **Decision**: The table shows name, plan, status and expiry with limit/offset paging and a text search. Search and page live in the URL query (`?q=&page=`); a small client island debounces the term and writes the URL, and the Server Component re-reads via `getManagedBusinesses`. Empty, loading and error states are explicit.
- **Rationale**: FR-007/FR-008; mirrors the `directory` approach (shareable URLs, server rendering, bounded results). The API caps `limit` at 100 and validates paging.
- **Alternatives considered**: Client-side filtering of a single page — rejected (misses businesses beyond the page).

## R6 — Override dialog (client island) + refresh

- **Decision**: `OverrideSubscriptionDialog` (`'use client'`) is opened per row, presenting a **plan** (FREE/PRO), **status** (active/past_due/expired/canceled) and an **expiry date** (clearable). On confirm it calls `useOverrideSubscription` (wrapping the server action); on success it refreshes the view (`router.refresh()`) and closes; on failure it shows the typed error inline. Invalid input is blocked before submitting (zod).
- **Rationale**: FR-009/FR-010/FR-011/SC-003/SC-004; the dialog is the interactive island; the server action persists via `overrideTenantSubscription`. The row data is passed as serializable props.
- **Alternatives considered**: An inline row editor — rejected (busier UI; a modal matches the request). Optimistic-only update — rejected (must reflect the persisted state).

## R7 — View models and validation

- **Decision**: Map the codegen types to view models in `actions.ts` (`ManagedBusinessView { tenantId, slug, name, plan, status, expiresAt }`, `PlatformMetricsView { businesses, users, plans, proConversion }`) and validate the override form with a zod schema (`plan` ∈ {FREE,PRO}, `status` ∈ the closed set, `expiresAt` ISO-8601 or null) before calling the API.
- **Rationale**: FR-011/SC; keeps the UI decoupled from the transport shapes and rejects invalid input early (the API also validates).
- **Alternatives considered**: Passing codegen types straight to the UI — rejected (the constitution prefers view models in the module and keeps the API shape out of components).

## R8 — Reuse the Clean Light UI / `@foundly/ui`

- **Decision**: Build the dashboard cards, table and dialog with `@foundly/ui` primitives (`Card`, `Badge`, `Typography`, `Stack`, `Container`, `Button`, `TextField`, `Switch`/`Select`-style controls) and the canonical tokens; no magic colors.
- **Rationale**: FR-013/§6; the request asks to follow `@foundly/ui`.
- **Alternatives considered**: Raw MUI with ad-hoc colors — rejected (constitution §4/§6). A new visual language — rejected.

## R9 — Testing approach

- **Decision**: Vitest + RTL for `SuperAdminView`, `MetricsCards`, `ManagedBusinessesTable` and `OverrideSubscriptionDialog` (render, states, interaction, navigation), and a Vitest unit test for `actions.ts` with `shared/api/client` mocked (hoisted-mock pattern). Tests live under `modules/super-admin/tests/` (and `app/super-admin/tests/` if needed).
- **Rationale**: FR-014/SC-006; matches the book test conventions.
- **Alternatives considered**: e2e/Playwright — rejected (no harness; component + action tests cover the behavior).

## R10 — No new dependencies; snapshot already synced

- **Decision**: Use the existing tooling only. The `apps/book/codegen.schema.gql` snapshot already contains the platform types/operations (synced during `api/019`), so `codegen` validates the module documents without further changes.
- **Rationale**: SC; keeps the two apps in lockstep.
- **Alternatives considered**: A table/pagination library — rejected (a simple bounded table suffices).
