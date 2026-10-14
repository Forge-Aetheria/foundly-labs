# Quickstart — Foundly Book Super Admin Console

**Feature**: `specs/book/020-super-admin-panel` · Runnable validation scenarios.

## Prerequisites

- The API (`specs/api/019-super-admin-panel`) is running with `SUPABASE_AUTH_URL` configured; optionally `SUPABASE_SERVICE_ROLE_KEY` for real user counts and `PLATFORM_ADMIN_EMAILS` for the bootstrap allowlist.
- `apps/book/.env` with `API_URL` pointing at the API.
- **A Super Admin session** (a Supabase user with `app_metadata.platform_role = "super_admin"`, or an allow-listed email) and **a normal business-owner session**.
- `apps/book/codegen.schema.gql` already contains the platform surface (synced in `api/019`).

## Run

```bash
npm run codegen -w @foundly/book     # regenerate src/shared/api/generated.ts
npm run dev -w @foundly/book         # http://localhost:3001/super-admin
```

## Scenario 1 — Access control

- Open `/super-admin` **signed out** → redirected to `/login`.
- Open it as a **business owner** (no platform role) → an "access denied" state with a way back; no metrics, businesses or override controls are rendered.
- Open it as the **Super Admin** → the console renders.

## Scenario 2 — Dashboard

- The cards show **Total Negocios**, **Negocios Activos** and **Total Usuarios** ("unavailable" when the API reports `users.available = false`).
- The plan distribution shows the **FREE vs PRO** split with counts; the PRO conversion matches `pro / total`.

## Scenario 3 — Managed businesses table

- The table lists businesses with **Nombre, Plan, Estado, Vencimiento**.
- Type a term → the URL becomes `/super-admin?q=<term>` and the list narrows (name/slug); clearing restores it; a nonsense term shows a no-results state.
- Navigate pages → the list reflects `page`; an empty platform shows a clean empty state.

## Scenario 4 — Override a subscription

- Open a row's **Editar** dialog; set Plan = PRO, Estado = active, Vencimiento = a future date; confirm.
- **Expected**: the mutation succeeds, the dialog closes and the row shows the new plan/status/expiry (no manual reload).
- Set Plan = FREE → the row reflects FREE. Clear the expiry → the row shows no expiry.
- Submit with no changes or an invalid date → blocked inline with guidance and nothing changes.

## Scenario 5 — States

- **Loading**: throttled navigation → skeleton cards/table.
- **Error**: stop the API and reload → a friendly error state with retry.
- **Session expiry**: sign out then trigger an action → routed to the session-expired flow.

## Automated checks

```bash
npm run typecheck -w @foundly/book
npm run test -w @foundly/book        # module tests (actions/view/dashboard/table/dialog)
npm run lint -w @foundly/book
npm run build -w @foundly/book
```

> `pretypecheck`/`prebuild` run `codegen` first; the snapshot is already synced by `api/019`.
