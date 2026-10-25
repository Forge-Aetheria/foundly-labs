import type { AddGalleryItemInput } from '@/shared/api/generated';
import type { GalleryCategory } from './categories';

export interface GalleryDraft {
  url: string;
  title: string;
  description: string;
  category: GalleryCategory | '';
}

export const EMPTY_GALLERY_DRAFT: GalleryDraft = {
  url: '',
  title: '',
  description: '',
  category: '',
};

const HTTP_URL = /^https?:\/\/\S+$/i;

export function validateGalleryDraft(draft: GalleryDraft): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!draft.url.trim()) {
    errors.url = 'Añade una imagen o introduce su URL.';
  } else if (!HTTP_URL.test(draft.url.trim())) {
    errors.url = 'Introduce una URL válida (http o https).';
  }
  return errors;
}

export function buildGalleryInput(draft: GalleryDraft): AddGalleryItemInput {
  return {
    url: draft.url.trim(),
    title: draft.title.trim() || null,
    description: draft.description.trim() || null,
    category: draft.category || null,
  };
}
