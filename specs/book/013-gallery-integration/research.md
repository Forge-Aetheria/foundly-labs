# Phase 0 — Research: Foundly Book — Gallery Integration

**Feature**: `specs/book/013-gallery-integration` · **Date**: 2026-10-13

All Technical Context unknowns are resolved below (no `NEEDS CLARIFICATION` remained).

## R1 — Module data layer (`actions.ts` + `hooks.ts`)

- **Decision**: The gallery module follows the canonical structure: `gallery.graphql`, `actions.ts` (server reads + Server Actions), `hooks.ts` (`useFetchGallery`, `useAddGalleryItem`, `useRemoveGalleryItem`), `components/`, `utils/`, `GalleryView.tsx`, `tests/`.
- **Rationale**: Constitution §5.VI / `code-rules.md` §9 mandate per-module data access and forbid the UI from calling the transport or Server Actions directly.
- **Alternatives considered**: Fetching in the component — rejected (violates §5.VI); a `shared/infra` helper — rejected (`shared/infra` is deprecated).

## R2 — Session-aware transport

- **Decision**: Reads and writes go through `apiRequestAdmin` (`shared/api/admin-request.ts`, feature `012`), which injects the Supabase bearer token and routes session failures to the global `/auth/session-expired` handler.
- **Rationale**: Consistent session/expiry handling across admin modules; a missing/rejected token never renders as raw text.
- **Alternatives considered**: Raw `apiRequest` + manual token — rejected (duplicates 012 and loses global session handling).

## R3 — Codegen snapshot

- **Decision**: Add the operations to `gallery.graphql` and regenerate `generated.ts` via `npm run codegen`; sync the versioned `apps/book/codegen.schema.gql` from the API SDL (feature `012`).
- **Rationale**: The client must use codegen-only DTOs (constitution §5.VI); the schema snapshot lets codegen run offline.
- **Alternatives considered**: Hand-written types — forbidden.

## R4 — Public gallery read placement

- **Decision**: Extend `getPublicBusinessRemote` (the existing public read in `modules/public-booking/actions.ts`) to also fetch the gallery by slug and map it into `PublicBusinessProfile.gallery`.
- **Rationale**: The mini-site already aggregates business + services + specialists + availability there; adding gallery keeps one public read path and one `#galeria` consumer, with no new route.
- **Alternatives considered**: A separate public `gallery` route/loader — rejected (fragments the public read and the profile contract).

## R5 — Category representation

- **Decision**: Persist/exchange the closed set `local | trabajos | equipo`; map to display labels via `GALLERY_CATEGORY_LABELS` for both the admin badge and the public card; drop unknown values.
- **Rationale**: The `006` UI spec models a closed set; the public card shows the human label.
- **Alternatives considered**: Free-form categories — rejected (already closed in `006`).

## R6 — Failure & empty-state handling

- **Decision**: Reuse the shared `ApiErrorDialog` (feature `012`) for transient load/action failures; keep validation inline on fields; show a friendly empty state when there are no photos; provide an accessible image fallback (no broken image).
- **Rationale**: Consistent with 012 (no raw text in views) and §6/accessibility.
- **Alternatives considered**: Inline raw error copy — rejected (the 012 problem).

## R7 — Interactive add/remove UX

- **Decision**: A modal to add (URL required, optional title/description/category chips), a lightbox to preview, and a confirmation dialog to delete; optimistic local update of the list after success.
- **Rationale**: Matches the `006` interaction model while persisting to the backend; the list updates without inventing data (only server-confirmed results are shown).
- **Alternatives considered**: Full-page form — rejected (worse UX, diverges from `006`).

## R8 — Tenant scoping for admin reads

- **Decision**: The admin read derives the tenant from the session via `getAdminTenantId()` (never the URL) and passes it to `listGallery(tenantId)`.
- **Rationale**: Consistent with the admin guardrail in `009`/`010`.
- **Alternatives considered**: Reading a slug from the route — rejected (tenant scope must come from the session).
