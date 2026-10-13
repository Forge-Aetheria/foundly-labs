import { z } from 'zod';

/** Public review submission input (feature 014). */
export const reviewSchema = z.object({
  tenantSlug: z.string().trim().min(1),
  author: z.string().trim().min(1, 'Tu nombre es obligatorio.').max(120),
  rating: z.number().int().min(1, 'Elige una valoración.').max(5),
  comment: z.string().trim().min(1, 'Escribe un comentario.').max(2000),
});
export type ReviewSchemaInput = z.infer<typeof reviewSchema>;
