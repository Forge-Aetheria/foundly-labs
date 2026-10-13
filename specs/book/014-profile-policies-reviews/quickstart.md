# Quickstart — Foundly Book — Profile, Policies & Reviews

**Feature**: `specs/book/014-profile-policies-reviews` · Runnable validation scenarios.

## Prerequisites

- `apps/book/.env` with `API_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- The API running with the profile-update + reviews surface (`specs/api/013-profile-policies-reviews`) and a migrated DB.
- A signed-in owner bound to a business.

## Run

```bash
npm run codegen -w @foundly/book     # after adding profile.graphql / reviews.graphql + syncing codegen.schema.gql
npm run dev -w @foundly/book         # http://localhost:3001
```

## Scenario 1 — Edit and persist the profile (admin)

1. Open `http://localhost:3001/admin/profile`.
2. Change the name/category, address, phone, Instagram, WhatsApp, bio; add a policy (`Cancelación` / `Avisa con 24 h`); **Guardar perfil**.
3. **Expected**: the save succeeds and the values remain after a reload.
4. Invalid Instagram/WhatsApp/logo/cover URL → inline error, nothing saved. Duplicate/invalid slug → inline error on the slug, previous value preserved.

## Scenario 2 — Policies management

1. Add a second policy, save; then remove the first, save.
2. **Expected**: the list persists accordingly and renders on the public page.

## Scenario 3 — Public sections reflect the backend

1. Open `http://localhost:3001/<your-slug>`.
2. **Expected**: **"Acerca de"** shows the bio, **"Dirección y horarios"** shows the address + hours, and the **policies** card shows the saved entries. A business with none shows clean empty states.

## Scenario 4 — Reviews & rating (public)

1. Open the reviews section on `http://localhost:3001/<your-slug>`.
2. Submit a review (author, rating, comment) → it appears in the list and the rating updates.
3. Invalid rating or empty comment → inline error, nothing submitted. A business with no reviews shows a clean empty state and no invented rating.

## Scenario 5 — Session safety

1. With an expired/absent session, trigger a profile save.
2. **Expected**: the app routes through the global session-expiry handler (`/login` with a notice); no raw error text appears in the editor.

## Automated checks

```bash
npm run test -w @foundly/book
npm run typecheck -w @foundly/book
npm run lint -w @foundly/book
npm run build -w @foundly/book
```
