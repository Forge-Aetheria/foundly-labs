# Phase 0 — Research: Foundly Book — Public Business Directory & Discovery

**Feature**: `specs/book/019-business-directory` · **Date**: 2026-10-14

All Technical Context unknowns are resolved below (no `NEEDS CLARIFICATION` remained).

## R1 — Route and rendering model

- **Decision**: Add a public route at `apps/book/src/app/directorio/page.tsx` that is a **thin Server Component**: it reads the `q` search param and renders `DirectoryView`. Results render on the server; the only client JavaScript is the search input.
- **Rationale**: Constitution §5.II (server-first) and §3 (thin routes + modules + shared). A server-rendered listing is fast, indexable and keeps the data transport server-side (§5.VI forbids data calls in the UI).
- **Alternatives considered**: A fully client-rendered page with `useQuery` — rejected (violates §5.VI and the server-first default). Keeping the list in local component state — rejected (loses shareable/SEO-friendly URLs).

## R2 — Data access lives in the `directory` module

- **Decision**: Create `apps/book/src/modules/directory/` with `actions.ts` (server reads + view-model mapping), `hooks.ts` (client search hook), `directory.graphql` (the `SearchBusinesses` document), `DirectoryView.tsx`, `components/` and `tests/` — mirroring `public-booking`.
- **Rationale**: Constitution §5.VI mandates the module layout and forbids the UI from calling `apiRequest`/`useQuery`/Server Actions directly. Codegen-only types keep the API contract single-sourced.
- **Alternatives considered**: Reusing the `landing` or `public-booking` module — rejected (the directory is a distinct domain; cross-module data logic would blur ownership).

## R3 — Search is URL-driven and server-resolved

- **Decision**: The search term lives in the URL query (`/directorio?q=...`). A small client island (`DirectorySearch`) debounces input and calls `router.replace` with the new `q`; the Server Component re-renders the grid from the API. The server passes the current `q` down as an initial value.
- **Rationale**: Keeps the listing server-rendered, makes searches shareable/bookmarkable and avoids a client cache layer. Debouncing (+ `replace`, not `push`) keeps history clean and preserves focus (FR-003/edge "rapid typing").
- **Alternatives considered**: Client-side filtering of the first page — rejected (misses businesses beyond the page and diverges from the API search). A form submit on Enter — rejected (heavier UX than the requested live filter).

## R4 — Card content, placeholders and hours formatting

- **Decision**: `BusinessCard` shows cover (or a neutral fallback), logo/avatar (or an initial-letter avatar), name, short description, location/address and the general weekly hours formatted compactly (e.g. "Lun–Vie 09:00–18:00") from the listing's schedule; missing optional fields render placeholders. The primary action is a `next/link` to `/[tenantSlug]` labelled **"Ver perfil"** (with a secondary hint that booking happens there).
- **Rationale**: FR-005/FR-006/FR-009; matches the requested card content and the existing public page. A pure `utils/hours.ts` formatter keeps the component dumb and testable.
- **Alternatives considered**: Showing full per-day hours on the card — rejected (too dense; the detail page already has richer hours). A single "Reservar" button that deep-links into the flow — deferred (the booking flow starts from the profile; a deep link can be a later enhancement).

## R5 — Navigation into the existing public page & booking flow

- **Decision**: "Ver perfil" navigates to `/[tenantSlug]` (the existing `PublicBookingView`), which already hosts the service catalog, calendar, slot selection and the advance/payment step (spec 017). No new booking UI is created.
- **Rationale**: FR-007/SC-006; reuses the ratified booking flow and its tests; avoids duplicating booking logic.
- **Alternatives considered**: A separate `/directorio/[slug]` profile — rejected (duplicate of `/[tenantSlug]`).

## R6 — Loading, empty, no-results and error states

- **Decision**: Use route-level skeletons (a `loading.tsx` or Suspense fallback) for pending navigation, an empty-state (`DirectoryStates`) for no businesses and for a no-results search (with distinct copy), and a friendly error state with a retry that re-runs the server read.
- **Rationale**: FR-008/SC-005; the spec's edge cases require each state to be explicit and non-breaking.
- **Alternatives considered**: A single blank/"no data" message — rejected (loses the distinction between empty directory and no search match, and between empty and error).

## R7 — Reuse the design system and a responsive grid

- **Decision**: Build the view with `@foundly/ui` primitives and the canonical tokens (Clean Light UI): white cards, subtle lavender border, rounded-3xl, soft shadow; a responsive grid (1 → 2 → 3 columns); pill badges; `tabular-nums` where numbers appear.
- **Rationale**: Constitution §6; the request asks for card-based discovery consistent with the brand.
- **Alternatives considered**: New visual language — rejected (constitution forbids colors/components outside the system).

## R8 — Accessibility

- **Decision**: The search input has a visible/programmatic label and is keyboard operable; cards expose meaningful link text and are reachable by keyboard; adequate contrast via tokens; loading states announce politely.
- **Rationale**: FR-011 and the constitution's accessibility objective (§5.III).
- **Alternatives considered**: Placeholder-only label — rejected (fails accessibility).

## R9 — Testing approach

- **Decision**: Vitest + React Testing Library for the view/search/card (render, filter, states, navigation) and a Vitest unit test for `actions.ts` mapping with `apiRequest` mocked (same hoisted-mock pattern as `public-booking/tests/queries.test.ts`). Tests live in `modules/directory/tests/` (constitution §10).
- **Rationale**: FR-012; consistent with the existing book test conventions.
- **Alternatives considered**: e2e/Playwright — rejected (no such harness; component + action tests cover the behavior).

## R10 — Dependency on the API companion (`specs/api/018-business-directory`)

- **Decision**: The module consumes a public `searchBusinesses` query added by the `api` companion; the codegen snapshot `apps/book/codegen.schema.gql` must include it before this feature's codegen/tests run. The `action` maps the API shape to the card view model and degrades to an empty list on a failed read (the view shows the error state).
- **Rationale**: FR-001..FR-006 depend on the public listing; the API owns eligibility and the general schedule.
- **Alternatives considered**: Calling `tenants` (which returns all tenants) — rejected (no eligibility/search/schedule and exposes drafts). Implementing search by fetching `tenant(slug)` per business — rejected (N+1).

## R11 — No new dependencies; nav entry

- **Decision**: No new packages. Optionally add a "Directorio" entry in the existing public navigation/landing so the route is discoverable (non-blocking, cosmetic).
- **Rationale**: The feature uses existing Next.js/`@foundly/ui`/codegen tooling; the route is reachable directly regardless.
- **Alternatives considered**: A new search library (fuzzy/ranking) — rejected (the API does simple containment; a client library would duplicate it).
