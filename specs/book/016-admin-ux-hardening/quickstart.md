# Quickstart — Foundly Book — Admin UX Hardening

**Feature**: `specs/book/016-admin-ux-hardening` · Runnable validation scenarios.

## Prerequisites

- `apps/book/.env` with `API_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- The API running with the review-moderation surface (`specs/api/015-review-moderation`) and a migrated DB.
- A signed-in owner bound to a business.

## Run

```bash
npm run codegen -w @foundly/book     # after syncing codegen.schema.gql + adding the moderation operations
npm run dev -w @foundly/book         # http://localhost:3001
```

## Scenario 1 — Toasts (US1)

1. Save a gallery photo / profile change → **green** toast.
2. Submit a form with a missing field → inline field error **+ yellow** toast.
3. Trigger a transient API failure (e.g. stop the API) → **red** toast and/or `ApiErrorDialog`.
4. Any toast is dismissible, announced to assistive tech and auto-hides.

## Scenario 2 — Loading / double-submit (US2)

1. In the gallery add modal, click "Guardar foto" repeatedly.
2. **Expected**: the button disables and shows a pending state on the first click; only one request is sent; on success the modal closes and the gallery refreshes (no manual reload).
3. Repeat for the add-professional modal, the service create modal, the appointment modal and the public review form.

## Scenario 3 — Review moderation (US3) — requires API `015`

1. Submit a public review → it is **not** visible on the public page (pending).
2. Open `/admin/reviews` → the review is listed and flagged **pending**.
3. Approve it → it appears on the public page; reject/delete it → it disappears.
4. Apply the state filter → only that state is listed.
5. With the API unreachable or the session expired → clean error surface (toast/dialog), no false success.

## Scenario 4 — Profile image rules (US4)

1. Open `/admin/profile`; the recommended dimensions/aspect are shown for logo (square) and cover (banner).
2. Provide a logo that is clearly non-square (measurable) → the save is blocked with an inline error.
3. Provide a compliant logo/cover → previewed and saved.
4. Provide an image whose dimensions cannot be measured (CORS/remote) → guidance is shown and the save is allowed with a notice.

## Scenario 5 — Orphan actions (US5)

1. `/admin/services` → "Crear servicio" opens a real form; create a service → it persists, appears in the catalog and is offered on the public page; a success toast is shown.
2. `/admin/agenda` → "Nueva cita" creates a manual appointment (client, service, specialist, date/time) → it persists and appears in the agenda; invalid/incomplete input is blocked inline.
3. While submitting either action, the button is disabled.

## Automated checks

```bash
npm run test -w @foundly/book
npm run typecheck -w @foundly/book
npm run lint -w @foundly/book
npm run build -w @foundly/book
```
