# Quickstart: Foundly Book — Gallery Management

**Feature**: `specs/book/006-gallery-management/` | **Date**: 2026-10-10

## Onboarding

1. `npm install` at the repository root (workspace wiring).
2. Run the suites: `npm run test -w @foundly/book` and `npm run test -w @foundly/ui` (expect 100%).
3. Run the build gate: `npm run build -w @foundly/book`.

## Manual walkthrough

1. Start `npm run dev -w @foundly/book` (port 3001) and open `http://localhost:3001/admin/gallery`.
2. The header shows **"Galería"** with a pill **"+ Añadir imagen"**; seeded photos render as glass
   cards with their category badges.
3. Click "+ Añadir imagen":
   - Give an invalid or empty URL → inline error, save blocked.
   - Enter a valid URL, an optional title and a category (Local/Trabajos/Equipo), then **Añadir** → a
     new card appears.
   - Try the same URL again → rejected as duplicate.
4. On a card: "Ver" opens the lightbox preview (close via ESC/backdrop); "Quitar foto" prompts a
   confirmation ("Sí, quitar") and removes the card.
5. Verify the public side: open `http://localhost:3001/estudio-ana` — the `#galeria` block shows the
   same photos (title + category), including newly added ones, and removes disappear immediately.

## Validation matrix (contract `contracts/admin-gallery.contract.md`)

| Scenario                    | Expected                                                              |
| --------------------------- | --------------------------------------------------------------------- |
| Add valid photo             | Card appears; visible in public `#galeria`                            |
| Add empty/invalid URL       | Inline `VALIDATION_ERROR`, nothing added                               |
| Add duplicate URL           | `CONFLICT`, nothing added                                              |
| Preview (lightbox)          | Modal opens with the photo; dismissible                                |
| Remove with confirmation    | Card gone; gone from public `#galeria`                                 |
| Optional title/category     | Photo saved and rendered without them                                 |

## Test commands

| Command                              | Scope                                        |
| ------------------------------------ | -------------------------------------------- |
| `npm run test -w @foundly/book`      | Vitest + RTL + vitest-axe (book app)         |
| `npm run test -w @foundly/ui`        | Shared UI primitives suite                   |
| `npm run build -w @foundly/book`     | Production build + type check                |