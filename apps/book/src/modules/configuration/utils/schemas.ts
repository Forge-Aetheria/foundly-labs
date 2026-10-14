import { z } from 'zod';

/** The closed set of payment method types (feature 022). */
export const PAYMENT_METHOD_TYPES = [
  'pago_movil',
  'binance',
  'zelle',
  'transfer',
  'cash',
] as const;

/** Flexible structured receiving data; empty strings are dropped before persistence. */
const paymentDetailsSchema = z
  .object({
    holder: z.string().trim().max(120).optional(),
    cedula: z.string().trim().max(60).optional(),
    phone: z.string().trim().max(40).optional(),
    bank: z.string().trim().max(120).optional(),
    payId: z.string().trim().max(120).optional(),
    email: z.string().trim().max(160).optional(),
    account: z.string().trim().max(120).optional(),
  })
  .partial();

/** Payment method configuration input (features 017/022). Mirrors `UpsertPaymentMethodInput`. */
export const paymentMethodSchema = z.object({
  type: z.enum(PAYMENT_METHOD_TYPES),
  title: z.string().trim().max(120).nullish(),
  details: paymentDetailsSchema.nullish(),
  instructions: z.string().trim().max(2000).nullish(),
  active: z.coerce.boolean().default(false),
});
export type PaymentMethodSchemaInput = z.infer<typeof paymentMethodSchema>;

export const deletePaymentMethodSchema = z.object({
  id: z.string().trim().min(1),
});
export type DeletePaymentMethodSchemaInput = z.infer<typeof deletePaymentMethodSchema>;
