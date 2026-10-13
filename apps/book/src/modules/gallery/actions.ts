import type { GalleryPhoto } from '../../shared/types/tenancy';

/**
 * Gallery module — server data access (feature 011; constitution §5.VI).
 * No backend counterpart yet: reads are intentionally empty, never mocked.
 */
export function listGallery(): GalleryPhoto[] {
  return [];
}