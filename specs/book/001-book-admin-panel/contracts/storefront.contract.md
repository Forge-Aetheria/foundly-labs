# Contract: Storefront Admin (Equipo, Galería, Perfil)

**Feature**: `specs/book/001-book-admin-panel/` | **Date**: 2026-10-10

Documents the storefront admin sections added in Phase 10. They manage exactly the content that the
public mini-sitio renders (`specs/book/003-public-portal-minisite/`): professionals → team section,
gallery photos → gallery section, and profile → about/contact/direction/sidebar. All views compose
`@foundly/ui` primitives and token colors (FR-017); all mutations write to the same in-memory seam
read by `getPublicBusiness`, so edits surface in `/book/<slug>` (FR-026).

## Equipo (`/admin/staff`) — `StaffManager.tsx`

| Area          | Contract                                                                                                                                                                                                            |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Header        | Title `Equipo` + subtitle + right-aligned pill primary **"+ Añadir profesional"** (`primary.main` #6C5CE7).                                                                                                         |
| Columns       | **Profesional** (avatar initials or photo + name + role caption) · **Bio** · **Estado** (`Activo`/`Inactivo` badge) · **Acciones** (right: Activ·/Desactiv· secondary, "Editar" secondary, "Eliminar" destructive). |
| Create/edit   | `Modal` with `TextField` (nombre, rol, foto URL, bio corta); required name with inline error from `ActionResult`. Regional forms save via `createStaff`/`updateStaff`.                                              |
| Toggle/delete | "Activ·/Desactiv·" calls `setStaffActive`; "Eliminar" opens a destructive `AlertDialog` ("Sí, eliminar") and calls `removeStaff`.                                                                                   |
| Density       | `DataTable dense`.                                                                                                                                                                                                  |

## Galería (`/admin/gallery`) — `GalleryManager.tsx`

| Area   | Contract                                                                                                                            |
| ------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| Header | Title `Galería` + subtitle + pill primary **"+ Añadir imagen"**. `Card` root, tokens for the canvas.                                |
| Grid   | Responsive photo grid (`4/3` tiles); each tile has a full-width secondary **"Quitar foto"** that opens a destructive `AlertDialog`. |
| Add    | `Modal` with URL `TextField`; duplicate URLs are rejected (`CONFLICT`) with inline error; success appends to `Tenant.gallery`.      |
| Empty  | "Todavía no has añadido fotos…" hint when the gallery is empty.                                                                     |

## Perfil (`/admin/profile`) — `ProfileEditor.tsx`

| Area   | Contract                                                                                                                           |
| ------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| Header | Title `Perfil y Acerca de` + right-aligned pill primary **"Guardar perfil"**.                                                      |
| Fields | `TextField`s: nombre, categoría, bio, dirección, teléfono, logo URL, portada URL, Instagram, WhatsApp. Two-column layout on `sm+`. |
| Save   | Calls `updateProfile`; on success shows a `Badge pill` "Guardado"; errors render inline via `ActionResult`.                        |
| Sync   | Persists `name/category/bio/address/phone/social` on the tenant read by `getPublicBusiness`.                                       |

## Data & mutations

- Feature module: `apps/book/src/modules/{staff,gallery,profile}/` (`schemas.ts`, `actions.ts`, `queries.ts`, `components/`).
- Every action authorizes the admin role through the Foundly Pass session seam, resolves the tenant id
  from the session (never the client), validates with Zod and returns the typed `ActionResult`.
- Reads mirror the public contract: `listStaff` ↔ `specialists`, `listGallery` ↔ `gallery`, `getTenantProfile` ↔ portal identity.
- Optional profile/social fields accept empty/`null` → normalized to `null`/omitted.

## Guarantees

- Views use `@foundly/ui` components and theme tokens; only raw `<img>` media use the MUI `Box` primitive
  (same convention as the public portal `ProviderSections`).
- `vitest-axe` runs clean; row actions and dialogs are keyboard reachable.
- Component and action tests assert the admin → public reflection (`getPublicBusiness`) after each mutation.
