import { z } from 'zod';

/** Service create/edit input (feature 016, US5). Mirrors the API `CreateMyServiceInput`. */
export const serviceSchema = z.object({
  name: z.string().trim().min(1, 'El nombre es obligatorio.').max(120),
  description: z.string().trim().max(2000).nullish(),
  durationMinutes: z.coerce.number().int().positive('La duración debe ser positiva.'),
  priceCents: z.coerce.number().int().min(0, 'El precio no puede ser negativo.'),
  category: z.string().trim().max(60).nullish(),
});
export type ServiceSchemaInput = z.infer<typeof serviceSchema>;

export const updateServiceSchema = serviceSchema.extend({
  id: z.string().trim().min(1),
});
export type UpdateServiceSchemaInput = z.infer<typeof updateServiceSchema>;

export const deleteServiceSchema = z.object({
  id: z.string().trim().min(1),
});
export type DeleteServiceSchemaInput = z.infer<typeof deleteServiceSchema>;
