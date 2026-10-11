import { z } from 'zod';

export const galleryPhotoSchema = z.object({
  url: z.string().trim().url('La URL de la imagen es inválida.').max(1000),
  title: z.string().trim().max(120).optional(),
  description: z.string().trim().max(250).optional(),
  category: z.enum(['local', 'trabajos', 'equipo']).optional(),
});
export type GalleryPhotoInput = z.infer<typeof galleryPhotoSchema>;

export const galleryPhotoIdSchema = z.object({ id: z.string().min(1) });
export type GalleryPhotoIdInput = z.infer<typeof galleryPhotoIdSchema>;
