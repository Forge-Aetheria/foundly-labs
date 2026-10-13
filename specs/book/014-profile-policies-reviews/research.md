# Phase 0 — Research: Foundly Book — Profile, Policies & Reviews

**Feature**: `specs/book/014-profile-policies-reviews` · **Date**: 2026-10-13

## R1 — Module data layer for the editor (`actions.ts` + `hooks.ts`)

- **Decision**: The profile editor gets `actions.ts` (server `getProfile` read + `updateProfile` Server Action) and `hooks.ts` (`useFetchProfile`, `useUpdateProfile`); the UI consumes only the hooks. `ProfileEditor` becomes an editable form seeded from the server read.
- **Rationale**: Constitution §5.VI / `code-rules.md` §9; the current view is read-only with no update path.
- **Alternatives considered**: Inline fetch in the component — rejected.

## R2 — Session-aware transport for updates

- **Decision**: The profile update uses `apiRequestAdmin` (feature `012`) so a missing/rejected token routes to the global session-expiry flow; no raw text.
- **Rationale**: Consistent session handling across admin modules.
- **Alternatives considered**: Raw `apiRequest` + manual token — rejected.

## R3 — Policies as a managed list

- **Decision**: The editor manages policies as a list of `{ title, body }` (add/edit/remove), submitted as part of the profile update. The public policies card renders the list.
- **Rationale**: Matches the API contract (`[BusinessPolicyInput!]`) and the `007` product intent.
- **Alternatives considered**: Single free-text blob — rejected (poor UX, no per-entry rendering).

## R4 — Policies/Reviews mapping

- **Decision**: Map server policies `{title, body}` to the domain `PortalPolicy` (synthesize a stable `id` from the index; `tenantId` from the profile). Map server reviews to the domain `Review` (`id, author, rating, comment, date`); expose `rating` (average) and `reviewCount`.
- **Rationale**: Reuses existing domain types; the server list has no id.
- **Alternatives considered**: Change `PortalPolicy` to drop `id` — rejected (broader ripple on existing UI/tests).

## R5 — Public aggregate read

- **Decision**: Extend `getPublicBusinessRemote` to also read the reviews summary (public `Reviews` query by slug) and map policies from the profile, populating `PublicBusinessProfile.policies`, `.reviews`, `.rating`, `.reviewCount`. A reviews-fetch failure is non-fatal (empty + null rating).
- **Rationale**: One public read path for the mini-site; matches the existing pattern (specialists/availability/gallery).
- **Alternatives considered**: A separate reviews route/loader — rejected (fragments the public read).

## R6 — Public review submission

- **Decision**: A `reviews` module with `submitPublicReview(input)` (public Server Action) + `useSubmitReview` hook + a `ReviewForm` rendered in the public reviews section. On success, the new review is appended and the rating updated client-side.
- **Rationale**: Delivers the resolved option A (public guest submission) end-to-end; keeps the write in the module's `actions.ts`.
- **Alternatives considered**: Put submission in `public-booking` — rejected (mixes the reviews domain into booking).

## R7 — Validation & errors

- **Decision**: `zod` schemas for the editor (absolute URLs for instagram/whatsapp/logo/cover; slug format; bounded text; policy title/body non-empty) and for review submission (author non-empty, rating 1–5, comment non-empty). Validation errors show inline; transient/server errors use the shared `ApiErrorDialog` (feature `012`); `CONFLICT` on slug surfaces as a field error on the slug.
- **Rationale**: Matches the existing validation and error-surfacing conventions.
- **Alternatives considered**: Raw server messages — rejected (012).

## R8 — Codegen

- **Decision**: Add `profile.graphql` and `reviews.graphql`, sync `apps/book/codegen.schema.gql` from the API SDL, and regenerate `generated.ts`; the client uses only generated documents/types.
- **Rationale**: Constitution §5.VI (codegen-only DTOs); offline codegen via the versioned snapshot.
- **Alternatives considered**: Hand-written types — forbidden.
