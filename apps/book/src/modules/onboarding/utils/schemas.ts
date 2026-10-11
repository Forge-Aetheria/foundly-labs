import { z } from 'zod';
import { validateSlug } from '../../../shared/utils/slug';

export const accountSchema = z.object({
  fullName: z.string().min(1, 'El nombre es obligatorio.').max(120, 'Máximo 120 caracteres.'),
  email: z.string().email('Introduce un email válido.'),
  password: z
    .string()
    .min(8, 'Mínimo 8 caracteres.')
    .regex(/[A-Za-z]/, 'Debe contener letras.')
    .regex(/\d/, 'Debe contener números.'),
});
export type AccountFields = z.infer<typeof accountSchema>;

export const businessSchema = z.object({
  name: z.string().min(1, 'El nombre comercial es obligatorio.').max(120, 'Máximo 120 caracteres.'),
  slug: z
    .string()
    .refine(
      (value) => validateSlug(value).ok === true,
      'URL no válida: 3–40 caracteres, minúsculas y guiones, y no puede ser una palabra reservada.',
    ),
  category: z.string().min(1, 'Elige una categoría.').max(80, 'Máximo 80 caracteres.'),
});
export type BusinessFields = z.infer<typeof businessSchema>;

const dayHoursSchema = z
  .object({
    weekday: z.number().int().min(0).max(6),
    isOpen: z.boolean(),
    startTime: z.string(),
    endTime: z.string(),
  })
  .superRefine((value, ctx) => {
    if (!value.isOpen) return;
    if (!/^\d{2}:\d{2}$/.test(value.startTime) || !/^\d{2}:\d{2}$/.test(value.endTime)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Formato esperado HH:mm.' });
      return;
    }
    if (value.endTime <= value.startTime) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['endTime'],
        message: 'La hora de fin debe ser posterior al inicio.',
      });
    }
  });
export type DayHours = z.infer<typeof dayHoursSchema>;

export const setupSchema = z.object({
  defaultAppointmentDurationMinutes: z.number().int().positive('La duración debe ser mayor que 0.'),
  businessHours: z.array(dayHoursSchema).length(7, 'Define los 7 días de la semana.'),
});
export type SetupFields = z.infer<typeof setupSchema>;

export const createBusinessSchema = z.object({
  draftId: z.string().min(1),
  account: accountSchema,
  business: businessSchema,
  setup: setupSchema,
});
export type CreateBusinessInput = z.infer<typeof createBusinessSchema>;
