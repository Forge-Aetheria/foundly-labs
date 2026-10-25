# Quickstart Validation: Mobile Gallery Module

**Feature**: `specs/mobile/006-gallery-module/spec.md`
**Date**: 2026-10-25

## Prerequisites

- Authenticated tenant session.
- API reachable from the device.
- Permission to access photos (for upload).
- Existing gallery photos, or permission to add them.

## Automated verification

```bash
pnpm --filter @foundly/mobile typecheck
pnpm --filter @foundly/mobile lint
pnpm --filter @foundly/mobile test
pnpm --filter @foundly/mobile build
```

Expected: all pass; gallery form tests cover URL validation, category mapping and null normalization.

## Manual validation

1. Open **Galería** from the drawer; confirm the placeholder is gone.
2. With existing photos, confirm image, title, description and category.
3. Without photos, confirm the empty state and add action.
4. Upload a valid image; confirm preview, save and appearance in the gallery.
5. Add a photo using a manual `https://` URL.
6. Try to save without URL or with an invalid URL; confirm the validation error.
7. Try an oversized or unsupported file; confirm the upload is rejected.
8. Delete a photo and confirm the confirmation dialog.
9. Pull to refresh; confirm the overlay while fetching.
10. Break an image URL and confirm the fallback without breaking the grid.
11. Disconnect the API and confirm the error state with retry.
