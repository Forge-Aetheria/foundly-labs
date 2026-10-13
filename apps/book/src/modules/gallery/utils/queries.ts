import type { GalleryPhoto } from '../../../shared/types/tenancy';

/**
 * Gallery has no backend counterpart yet (feature 010 — T014, US5).
 * Reads are intentionally empty and no local mocks are invented (FR-007);
 * the section renders a clean empty state.
 */
export function listGallery(): GalleryPhoto[] {
  return [];
}