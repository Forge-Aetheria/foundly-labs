# Quickstart — Foundly Book — Gallery Integration

**Feature**: `specs/book/013-gallery-integration` · Runnable validation scenarios.

## Prerequisites

- `apps/book/.env` with `API_URL`, `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- The API running with the gallery surface (`specs/api/012-gallery-management`) and a migrated DB.
- A signed-in owner bound to a business.

## Run

```bash
npm run codegen -w @foundly/book     # after adding gallery.graphql / syncing codegen.schema.gql
npm run dev -w @foundly/book         # http://localhost:3001
```

## Scenario 1 — Admin shows real photos

1. With at least one photo in the DB for your tenant, open `http://localhost:3001/admin/gallery`.
2. **Expected**: the grid shows the real photos (title/description/category), not the previous hard empty state.

## Scenario 2 — Add a photo (persisted)

1. Click **+ Añadir imagen**, enter a valid `https://…` URL (title/description/category optional), **Guardar foto**.
2. **Expected**: the photo appears in the grid and is still there after a reload.
3. Invalid/empty URL → inline error, nothing saved. Duplicate URL → clean conflict alert, grid unchanged.

## Scenario 3 — Preview & remove

1. Click **Ver** on a card → lightbox shows the image; close it.
2. Click **Quitar foto** → confirmation → **Sí, quitar**.
3. **Expected**: the card disappears and stays gone after reload.

## Scenario 4 — Public mini-site reflects the gallery

1. Open `http://localhost:3001/<your-slug>` and scroll to the **Galería** (`#galeria`) section.
2. **Expected**: the real photos render (with title/category label). A business with no photos shows a clean "no photos yet" state. A photo added in the admin appears after reload.

## Scenario 5 — Session safety

1. With an expired/absent session, trigger a gallery read/write.
2. **Expected**: the app routes through the global session-expiry handler (`/login` with a notice); no raw error text appears in the gallery.

## Automated checks

```bash
npm run test -w @foundly/book
npm run typecheck -w @foundly/book
npm run lint -w @foundly/book
npm run build -w @foundly/book
```
