# Quickstart: Foundly Book — Tenant Media Uploads & Cover Fallback

**Feature**: `specs/book/021-tenant-media-uploads/` | **Date**: 2026-10-14

## Onboarding

1. `npm install` at the repository root (workspace wiring).
2. Provision Supabase Storage (once, per environment):
   - Create bucket `tenant-media` (public read).
   - Add a policy allowing an **authenticated** owner to `insert`/`update` within `{tenantId}/…` (the first path segment equals the caller's tenant id), and a **public** `select` policy.
   - The existing `payment-proofs` bucket/policies from `017` remain unchanged.
   - Public env: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
3. Run the suites: `npm run test -w @foundly/book` (and `npm run test -w @foundly/ui` if the package is touched).
4. Gates: `npm run typecheck -w @foundly/book`, `npm run lint -w @foundly/book`, `npm run test -w @foundly/book`, `npm run build -w @foundly/book`.

> Without configured Storage, the media fields degrade to URL-only and an attempted upload shows a
> friendly error (no crash).

## Manual walkthrough

1. Start `npm run dev -w @foundly/book` (port 3001).
2. `/admin/profile`: upload a **Logo** (square JPG/PNG/WEBP ≤ 5 MB) and a **Portada**; confirm the
   preview updates and **Guardar perfil** persists them. Try a `.txt`/oversize file → inline error,
   nothing uploaded. Clear the logo → saved empty.
3. `/admin/staff`: create/edit a professional and upload an avatar; save and confirm the card badge
   updates (and the public team section).
4. `/admin/gallery`: click **"+ Añadir imagen"**, upload a photo (or paste a URL), add title/category
   and save; confirm the card and the public `#galeria` show it.
5. Public hero: open `http://localhost:3001/estudio-ana`:
   - with a saved cover → cover shown;
   - clear that tenant's cover but keep gallery photos → first gallery photo shown as the hero;
   - with neither → branded gradient banner with the business name.

## Validation matrix (contract `contracts/media-upload.contract.md`)

| Scenario | Expected |
| -------- | -------- |
| Upload valid JPG/PNG/WEBP ≤ 5 MB | Uploaded, preview + saved URL |
| Upload `.gif`/`.pdf`/`.svg` | Inline error, no request sent |
| Upload > 5 MB | Inline error, no request sent |
| Drag & drop valid image | Same flow as file picker |
| Paste valid `https://` URL | Preview + saved (fallback path) |
| Storage/network failure | Friendly error, previous value kept, retry allowed |
| Cover empty + gallery present | Hero shows first gallery photo |
| Cover and gallery empty | Branded gradient hero with business name |
| Keyboard traversal | File input, URL input and actions reachable & labelled |

## Test commands

| Command | Scope |
| ------- | ----- |
| `npm run typecheck -w @foundly/book` | TypeScript strict check |
| `npm run lint -w @foundly/book` | ESLint |
| `npm run test -w @foundly/book` | Vitest + RTL + vitest-axe (book app) |
| `npm run build -w @foundly/book` | Production build |
