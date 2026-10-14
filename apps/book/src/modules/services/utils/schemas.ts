import { z } from 'zod';

/** Service create/edit input (feature 016/017). Mirrors the API `CreateMyServiceInput`. */
const serviceFields = z.object({
  name: z.string().trim().min(1, 'El nombre es obligatorio.').max(120),
  description: z.string().trim().max(2000).nullish(),
  durationMinutes: z.coerce.number().int().positive('La duración debe ser positiva.'),
  priceCents: z.coerce.number().int().min(0, 'El precio no puede ser negativo.'),
  category: z.string().trim().max(60).nullish(),
  requiresAdvance: z.coerce.boolean().default(false),
  advanceKind: z.enum(['fixed', 'percent']).nullish(),
  advanceValue: z.coerce.number().int().positive('El adelanto debe ser mayor que cero.').nullish(),
});

function withAdvance<T extends typeof serviceFields>(schema: T) {
  return schema.superRefine((value, ctx) => {
    if (!value.requiresAdvance) {
      return;
    }
    if (!value.advanceKind) {
      ctx.addIssue({
        code: 'custom',
        path: ['advanceKind'],
        message: 'Selecciona el tipo de adelanto.',
      });
    }
    if (value.advanceValue == null) {
      ctx.addIssue({
        code: 'custom',
        path: ['advanceValue'],
        message: 'Indica el importe o el porcentaje.',
      });
    } else if (value.advanceKind === 'percent' && value.advanceValue > 100) {
      ctx.addIssue({
        code: 'custom',
        path: ['advanceValue'],
        message: 'El porcentaje no puede superar 100.',
      });
    }
  });
}

export const serviceSchema = withAdvance(serviceFields);
export type ServiceSchemaInput = z.infer<typeof serviceSchema>;

export const updateServiceSchema = withAdvance(serviceFields.extend({ id: z.string().trim().min(1) }));
export type UpdateServiceSchemaInput = z.infer<typeof updateServiceSchema>;

export const deleteServiceSchema = z.object({
  id: z.string().trim().min(1),
});
export type DeleteServiceSchemaInput = z.infer<typeof deleteServiceSchema>;
