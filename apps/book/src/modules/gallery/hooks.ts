'use client';

import type { GalleryPhoto } from '../../shared/types/tenancy';
import type { ActionResult } from '../../shared/types/result';
import { uploadImage } from '../../shared/utils/uploadImage';
import { addGalleryItem, listGallery, removeGalleryItem } from './actions';

/**
 * Gallery client hooks (feature 013; constitution §5.VI).
 * UI components interact only through these hooks — never with Server Actions.
 */
export function useFetchGallery(): (tenantId: string) => Promise<ActionResult<GalleryPhoto[]>> {
  return (tenantId) => listGallery(tenantId);
}

export function useAddGalleryItem(): (input: unknown) => Promise<ActionResult<GalleryPhoto>> {
  return (input) => addGalleryItem(input);
}

export function useRemoveGalleryItem(): (input: unknown) => Promise<ActionResult<{ id: string }>> {
  return (input) => removeGalleryItem(input);
}

/** Upload a gallery photo to tenant storage (feature 021). */
export function useUploadGalleryPhoto(
  scope: string,
): (file: File) => Promise<ActionResult<{ url: string }>> {
  return (file) => uploadImage(file, { scope, folder: 'gallery' });
}
