export const GALLERY_CATEGORIES = ['local', 'trabajos', 'equipo'] as const;

export type GalleryCategory = (typeof GALLERY_CATEGORIES)[number];

export const GALLERY_CATEGORY_LABELS: Record<GalleryCategory, string> = {
  local: 'Local',
  trabajos: 'Trabajos',
  equipo: 'Equipo',
};

export function galleryCategoryLabel(value: string | null | undefined): string | null {
  if (!value) return null;
  return value in GALLERY_CATEGORY_LABELS
    ? GALLERY_CATEGORY_LABELS[value as GalleryCategory]
    : value;
}
