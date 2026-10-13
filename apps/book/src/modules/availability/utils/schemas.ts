import { z } from 'zod';

/** Weekly availability input (feature 010/011): one entry per weekday (0 = Sunday). */
export const saveAvailabilitySchema = z.object({
  days: z.array(
    z.object({
      weekday: z.number().int().min(0).max(6),
      isOpen: z.boolean(),
      startTime: z.string(),
      endTime: z.string(),
    }),
  ),
});
export type SaveAvailabilityInput = z.infer<typeof saveAvailabilitySchema>;

const TIME_PATTERN = /^\d{2}:\d{2}$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** Concrete time-block input (feature 015): a single date + time range. */
export const timeBlockSchema = z
  .object({
    date: z.string().trim().regex(DATE_PATTERN, 'Fecha inválida.'),
    startTime: z.string().trim().regex(TIME_PATTERN, 'Hora de inicio inválida.'),
    endTime: z.string().trim().regex(TIME_PATTERN, 'Hora de fin inválida.'),
    reason: z.string().trim().max(200, 'Máximo 200 caracteres.').nullish(),
  })
  .refine((value) => value.endTime > value.startTime, {
    path: ['endTime'],
    message: 'La hora de fin debe ser posterior al inicio.',
  });
export type TimeBlockInput = z.infer<typeof timeBlockSchema>;

/** Remove a time block by id. */
export const removeTimeBlockSchema = z.object({ id: z.string().min(1) });