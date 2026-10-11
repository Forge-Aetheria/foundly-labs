# Contract: Admin Gallery View (Galería)

**Feature**: `specs/book/006-gallery-management/` | **Date**: 2026-10-10

Documents the `/admin/gallery` surface after 006-gallery-management. All primitives come from
`@foundly/ui` and colors from theme tokens (glass cards via `GLASS_CARD_SX`, pill `#6C5CE7 →
primary.main`). Mutations write to the same store seam read by `getPublicBusiness`, so the public
`#galeria` block on `/book/<slug>` reflects every change immediately (FR-007).

## Grid (photo cards)

| Area   | Contract                                                                                                                                                                                                     |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Header | Title `Galería` + subtitle + right-aligned pill primary **"+ Añadir imagen"**.                                                                                                                               |
| Cards  | Responsive grid of glassmorphism cards. Each shows the photo (4/3), optional title, optional category badge (`Local`/`Trabajos`/`Equipo`), a **"Ver"** preview action and a **"Quitar foto"** remove action. |
| Empty  | "Todavía no has añadido fotos…" hint when the gallery is empty.                                                                                                                                              |

## Add / edit photo modal

| Area       | Contract                                                                                                                                                                                                          |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Title      | `Añadir imagen` (creation only; photos are immutable after creation except removal).                                                                                                                              |
| Fields     | `URL de la imagen` (required, valid absolute URL, inline error otherwise) · `Título / Descripción` (optional, ≤ 120) · `Categoría` (optional, selectable `Chip` row: Local / Trabajos / Equipo; none by default). |
| Actions    | Pill primary **"Añadir"** + pill secondary **"Cancelar"**.                                                                                                                                                        |
| Duplicates | Re-adding an existing URL is rejected with `CONFLICT` and an inline error.                                                                                                                                        |

## Preview (lightbox) & remove

| Area     | Contract                                                                                                                                        |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Lightbox | "Ver" opens an `@foundly/ui` `Modal` showing the photo large (glass surface, dismissible via ESC/close and backdrop).                           |
| Remove   | "Quitar foto" opens a destructive `AlertDialog` ("Sí, quitar"); confirm calls `removeGalleryPhoto({ id })` and updates the grid + public state. |

## Data & mutations

- Feature module: `apps/book/src/modules/{staff,gallery,profile}/` (`schemas.ts`, `actions.ts`, `components/GalleryManager.tsx`).
- `addGalleryPhoto({ url, title?, description?, category? })` → creates a `GalleryPhoto` (validates URL, rejects duplicates), returns the new tenant gallery.
- `removeGalleryPhoto({ id })` → removes by id (`NOT_FOUND` if absent), returns the new tenant gallery.
- Read: `listGallery(tenantId)` → `GalleryPhoto[]`; public read maps to `PublicGalleryPhoto` (title + category label) in `getPublicBusiness`.
- All actions authorize the admin session and return the typed `ActionResult` (`VALIDATION_ERROR`, `CONFLICT`, `NOT_FOUND`, `UNAUTHENTICATED`/`FORBIDDEN`).

## Guarantees

- Views use `@foundly/ui` only; raw `<img>` previews use the MUI `Box` primitive (same convention as `ProviderSections`).
- `vitest-axe` clean; grid, form and lightbox fully keyboard-operable.
- Component and action tests assert invalid-URL rejection, duplicate rejection, lightbox open/dismiss, confirmed removal and admin → public `#galeria` reflection.
