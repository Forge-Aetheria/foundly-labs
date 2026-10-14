# Phase 0 — Research: Foundly Book — Admin UX Hardening

**Feature**: `specs/book/016-admin-ux-hardening` · **Date**: 2026-10-13

All Technical Context unknowns are resolved below (no `NEEDS CLARIFICATION` remained).

## R1 — Toast system lives in `apps/book` shared components (no new dependency)

- **Decision**: Implement a greenfield toast system in `apps/book/src/shared/components/Toaster.tsx` exporting a client `ToastProvider` and a `useToast()` hook. It renders a fixed, viewport-anchored stack using `@foundly/ui` primitives (`Typography`, `Button`) and design tokens via `sx`. No third-party toast library.
- **Rationale**: No toast/snackbar exists today (verified repo-wide), and `packages/ui` exposes no Snackbar primitive; the spec's assumption places it in `apps/book` reusing tokens. Avoiding a dependency keeps the bundle and the design system coherent.
- **Alternatives considered**: Add `sonner`/`react-hot-toast` — rejected (new dep, off-brand). Add a `Snackbar` primitive to `packages/ui` — deferred (a book-local provider satisfies FR-001; a shared primitive can come later if `apps/store` needs it).

## R2 — Toast semantics & lifecycle

- **Decision**: Four kinds — `success` (green/`accent-positive`), `warning` (yellow/`accent-warning`), `info` (blue/`accent-info`), `error` (red/`accent-negative`). Auto-dismiss after a short delay (default 4 s; errors 8 s), dismissible via a labelled button, and announced through an `aria-live` region (`polite` for success/warning/info, `assertive`/`role="alert"` for error).
- **Rationale**: FR-001/FR-002; semantic colors map to the constitution §6 token palette; accessibility is non-negotiable (`code-rules.md` §4, gates).
- **Alternatives considered**: Single generic style — rejected (FR-001 requires four kinds).

## R3 — Shared async-action helper for pending state and double-submit prevention

- **Decision**: Add `apps/book/src/shared/hooks/useAsyncAction.ts` (client) that wraps a `Promise<ActionResult<T>>`-returning action with `{ pending, run }`; `run` ignores re-entrant calls while `pending`, and routes errors by `errorSurface(code)`. Forms use it (or the equivalent local `pending` boolean) so every submit disables its `Button` (`loading`) until the promise settles.
- **Rationale**: FR-003/FR-004; `Button` already supports `loading`/`disabled`/`aria-busy`, so the helper standardizes the guard and removes copy-paste. Prevents duplicate records (SC-001).
- **Alternatives considered**: Per-component `useState` only — allowed, but the helper keeps the pattern consistent; a global request lock — rejected (over-broad).

## R4 — Revalidation after success

- **Decision**: On a successful create/update/delete, the modal closes and the affected surface is revalidated with `router.refresh()` (server reads re-run) — replacing the current optimistic local `useState` mutation. The public review form already calls `router.refresh()`; align the admin forms to it.
- **Rationale**: FR-004/FR-005/SC-002; guarantees the list reflects persisted state without a manual reload.
- **Alternatives considered**: Optimistic local list mutation — rejected (drifts from the server; caused the current inconsistency).

## R5 — Moderation data layer (extends the `reviews` module)

- **Decision**: Add `MyReviews`, `SetReviewState`, `DeleteReview` operations to `modules/reviews/reviews.graphql`; implement `listMyReviews(state?)`, `setReviewState(input)` and `deleteReview(input)` in `modules/reviews/actions.ts` via `apiRequestAdmin`; expose `useFetchMyReviews`, `useSetReviewState`, `useDeleteReview` in `modules/reviews/hooks.ts`; add zod schemas. Regenerate codegen from the API `015` SDL.
- **Rationale**: Constitution §5.VI; moderation belongs to the reviews domain; `apiRequestAdmin` handles session expiry globally.
- **Alternatives considered**: A separate `moderation` module — rejected (same domain as reviews; would fragment the public/admin surfaces).

## R6 — Moderation UI

- **Decision**: A server `ModerationView` (`modules/reviews/ModerationView.tsx`) resolves the tenant and calls `listMyReviews()`, passing the reviews + error to a client `ReviewModerationList` (`components/ReviewModerationList.tsx`) that flags `pending`, filters by state (Chips), and offers approve/reject (idempotent) and delete (with confirmation). Add the thin route `app/admin/reviews/page.tsx` and a "Reseñas" item in `PRIMARY_NAV`.
- **Rationale**: FR-006/FR-007; mirrors the existing admin view/component split; the public page reflects changes on next read.
- **Alternatives considered**: Client-only fetch — rejected (Server-First; the initial render should come from the server).

## R7 — Image dimension/aspect rules for logo and cover (URL-based)

- **Decision**: Add `modules/profile/utils/image-rules.ts` with `AVATAR_RULE` (square, aspect 1:1, recommended 512×512, ≤ ~2 MB) and `COVER_RULE` (banner, aspect 3:1, recommended 1200×400, ≤ ~4 MB), a tolerance (±2% on aspect), and a client `measureImage(url)` helper (`new Image()` + `crossOrigin='anonymous'` + timeout). The editor shows the recommended dimensions/aspect, and **blocks the save with an inline error when a measured image violates its aspect rule**. When dimensions cannot be measured (CORS/remote error/timeout), it degrades gracefully: shows the guidance and allows the save with a non-blocking notice (documented). Byte-size is guidance only because images are URL strings today (no upload).
- **Rationale**: FR-008 and the spec edge case; `apps/book` has no upload pipeline, so only measurable aspects can be enforced.
- **Alternatives considered**: Server-side dimension checks — rejected (the API stores URLs, not bytes). Hard-fail on unmeasurable images — rejected (would block legitimate remote URLs).

## R8 — Orphan "Crear servicio"

- **Decision**: Add `serviceSchema` (`modules/services/utils/schemas.ts`), `createService`/`updateService`/`deleteService` in `modules/services/actions.ts` (via `apiRequestAdmin`, using the existing `CreateMyService`/`UpdateMyService`/`DeleteMyService` documents), and `hooks.ts` (`useCreateService`, `useUpdateService`, `useDeleteService`). Replace the placeholder modal in `ServiceCatalog.tsx` with a real form (name, duration, price, optional category) and wire the delete confirmation.
- **Rationale**: FR-010/SC-006; the mutations already exist and are codegen'd but no action/hook consumes them; the button is currently a no-op.
- **Alternatives considered**: Keep the placeholder — rejected (spec US5 explicitly requires it to work end-to-end).

## R9 — Orphan "Nueva cita" (submission fix)

- **Decision**: Fix `Agenda.tsx` `saveCreate` to compose `startAt` as a valid ISO-8601 instant **with an offset** (currently `"YYYY-MM-DDTHH:mm:00"` without offset fails `z.string().datetime({ offset: true })`), derive `endAt` from the selected service duration (as today), add the pending/disable guard, revalidate on success and show a success toast.
- **Rationale**: FR-009/SC-006; the flow is wired but silently fails validation; the backend mutation and action already exist.
- **Alternatives considered**: Relax the schema to accept offset-less datetimes — rejected (the API expects an absolute instant).

## R10 — Accessibility

- **Decision**: Toasts use an `aria-live` region and a labelled dismiss control; moderation actions are labelled buttons with keyboard support and a confirm dialog for destructive delete; new surfaces pass `vitest-axe` with zero critical violations.
- **Rationale**: SC-004; constitution §6 and `code-rules.md`; existing tests already run `vitest-axe`.
- **Alternatives considered**: None (non-negotiable).

## R11 — Error surfacing mapping

- **Decision**: Reuse `errorSurface()`/`errorMessage()` (`shared/api/error-surface.ts`): `VALIDATION_ERROR` → inline field errors + yellow toast (complementary, never a replacement); `STATE_ERROR`/`NOT_FOUND` → red toast and/or `ApiErrorDialog`; `UNAUTHENTICATED` → global session redirect (never inline).
- **Rationale**: FR-011/FR-012; keeps centralized error handling with no raw provider text.
- **Alternatives considered**: Inline-only — rejected (the spec requires semantic toasts).

## R12 — Codegen & dependency on API `015`

- **Decision**: Sync `apps/book/codegen.schema.gql` from the API `015` SDL and regenerate `generated.ts` before implementing the moderation surface; use only generated documents/types.
- **Rationale**: Constitution §5.VI (codegen-only DTOs); the moderation operations do not exist until `api/015` lands.
- **Alternatives considered**: Hand-written moderation DTOs — forbidden.
