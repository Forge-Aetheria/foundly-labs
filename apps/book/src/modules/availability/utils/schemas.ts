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