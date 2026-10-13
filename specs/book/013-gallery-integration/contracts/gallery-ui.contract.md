# Contract — Gallery UI (module data layer + views)

**Feature**: `specs/book/013-gallery-integration`

## Module data layer (`src/modules/gallery/`)

Repository rule (constitution §5.VI): the UI calls **only** these functions/types; it never imports the transport, codegen documents, or the Server Actions directly.

### `actions.ts` (server-only)

```ts
type ActionResult<T> = { ok: true; data: T } | { ok: false; error: { code: ErrorCode; message: string; fields?: Record<string,string> } };

listGallery(tenantId: string): Promise<ActionResult<GalleryPhoto[]>>;
addGalleryItem(input: unknown): Promise<ActionResult<GalleryPhoto>>;
removeGalleryItem(input: unknown): Promise<ActionResult<{ id: string }>>;
```

- Reads go through `apiRequestAdmin(GalleryDocument, { tenantId, tenantSlug: null })`.
- `addGalleryItem` validates with `addGalleryItemSchema` (→ `VALIDATION_ERROR` with field errors) then `apiRequestAdmin(AddGalleryItemDocument, …)`.
- `removeGalleryItem` validates with `removeGalleryItemSchema` then `apiRequestAdmin(RemoveGalleryItemDocument, { id })`.
- Session errors (`UNAUTHENTICATED`, missing token) are handled globally by `apiRequestAdmin` (redirect to `/auth/session-expired`); they do not surface as inline text.

### `hooks.ts` (`'use client'`)

```ts
useFetchGallery(): (tenantId: string) => Promise<ActionResult<GalleryPhoto[]>>;
useAddGalleryItem(): (input: unknown) => Promise<ActionResult<GalleryPhoto>>;
useRemoveGalleryItem(): (input: unknown) => Promise<ActionResult<{ id: string }>>;
```

### Error presentation

| Error | Surface |
|---|---|
| `VALIDATION_ERROR` | inline field errors (`fields`) |
| `CONFLICT` / `STATE_ERROR` / `NOT_FOUND` | clean alert (`ApiErrorDialog`) |
| `UNAUTHENTICATED` | global session handler (redirect) — never inline |

## Admin view (`/admin/gallery`)

- **Route**: `src/app/admin/gallery/page.tsx` renders `<GalleryView/>` (unchanged thin route).
- **Server view**: `GalleryView` resolves the tenant via `getAdminTenantId()` and calls `listGallery(tenantId)`; passes `photos` + `error` to `GalleryManager`.
- **`GalleryManager` props**: `{ photos: GalleryPhoto[]; error?: string | null }`.
- **Behaviors**: grid of photo cards (image, title, description, category badge); `+ Añadir imagen` opens the add modal; each card offers `Ver` (lightbox) and `Quitar foto` (confirmation → remove); empty state when there are no photos; accessible image fallback.

## Public portal (`/book/<slug>`)

- `getPublicBusinessRemote(slug)` reads the gallery via a **public** `Gallery` query (`tenantSlug`) and maps each item to `PublicGalleryPhoto` (category → display label), populating `PublicBusinessProfile.gallery`.
- `ProviderSections.GallerySection` (`#galeria`) renders the real photos; clean "no photos yet" state when empty.
- A gallery fetch failure is non-fatal (empty gallery), keeping the rest of the public page usable (consistent with specialists/availability handling).
