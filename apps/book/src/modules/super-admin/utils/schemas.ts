import { z } from 'zod';

/**
 * Partial subscription override (feature 020). Only the provided fields change; at least one
 * field must be present. `expiresAt` may be an ISO-8601 string (set) or null (clear).
 */
export const overrideInputSchema = z
  .object({
    tenantId: z.string().min(1),
    plan: z.enum(['FREE', 'PRO']).optional(),
    status: z.enum(['active', 'past_due', 'expired', 'canceled']).optional(),
    expiresAt: z.string().datetime({ offset: true }).nullable().optional(),
  })
  .refine(
    (value) =>
      value.plan !== undefined || value.status !== undefined || value.expiresAt !== undefined,
    { message: 'Cambia al menos un campo.', path: ['_form'] },
  );

export type OverrideInputParsed = z.infer<typeof overrideInputSchema>;
