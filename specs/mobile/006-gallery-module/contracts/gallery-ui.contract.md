# UI Contract: Gallery Module

**Feature**: `specs/mobile/006-gallery-module`

## Module surface

```ts
export function useGallery(): UseQueryResult<GalleryPhoto[], GalleryError>;
export function useAddGalleryItem(): UseMutationResult<GalleryPhoto, GalleryError, AddGalleryItemInput>;
export function useRemoveGalleryItem(): UseMutationResult<true, GalleryError, string>;
```

## Screen contract

- `app/(drawer)/galeria.tsx` renders `GalleryView` only.
- `GalleryView` provides:
  - Title “Galería” and subtitle.
  - Add button opening the photo form.
  - Initial loading state.
  - Empty state with a call to action.
  - Error state with retry.
  - Pull-to-refresh and refresh overlay.
  - Photo cards with image, optional title/description/category and delete action.
  - Broken-image fallback per photo.
- Delete requires `Alert` confirmation.
- Mutation errors are visible without removing existing photos.

## Form contract

- `GalleryPhotoFormModal` receives `{ visible, onClose }`.
- Image source: upload via shared media helper or manual URL field.
- Optional fields: title, description, category.
- Save validates the URL before calling `addGalleryItem`.
- Upload button shows pending state; save is disabled while uploading/saving.
- Successful save closes the modal and refreshes the gallery.

## Data guarantees

- UI never calls `apiRequest`/`useQuery` directly.
- Optional empty strings become `null`.
- Query invalidation key is `['gallery', tenantId]`.
- No editing/reordering actions are exposed in this version.
