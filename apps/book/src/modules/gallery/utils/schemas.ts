import { z } from 'zod';
import { GALLERY_CATEGORIES } from '../../../shared/types/tenancy';

/** Add-photo input (feature 013): required URL + optional metadata. */
export const addGalleryItemSchema = z.object({
  url: z.string().trim().url('Introduce una URL válida (http o https).').max(2000),
  title: z.string().trim().max(200, 'Máximo 200 caracteres.').nullish(),
  description: z.string().trim().max(2000, 'Máximo 2000 caracteres.').nullish(),
  category: z.enum(GALLERY_CATEGORIES).nullish(),
});
export type AddGalleryItemSchemaInput = z.infer<typeof addGalleryItemSchema>;

/** Remove-photo input: the photo id. */
export const removeGalleryItemSchema = z.object({ id: z.string().min(1) });
