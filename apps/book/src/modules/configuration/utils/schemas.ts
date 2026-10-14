import { z } from 'zod';

/** Payment method configuration input (feature 017). Mirrors the API `UpsertPaymentMethodInput`. */
export const paymentMethodSchema = z.object({
  type: z.enum(['mobile_payment', 'bank_transfer', 'binance']),
  label: z.string().trim().max(120).nullish(),
  details: z.string().trim().max(2000).nullish(),
  instructions: z.string().trim().max(2000).nullish(),
  active: z.coerce.boolean().default(false),
});
export type PaymentMethodSchemaInput = z.infer<typeof paymentMethodSchema>;

export const deletePaymentMethodSchema = z.object({
  id: z.string().trim().min(1),
});
export type DeletePaymentMethodSchemaInput = z.infer<typeof deletePaymentMethodSchema>;
