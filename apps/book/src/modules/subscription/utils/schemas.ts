import { z } from 'zod';

export const manualPaymentSchema = z.object({
  gateway: z.enum(['PAGO_MOVIL', 'TRANSFERENCIA']),
  referenceNumber: z.string().trim().min(1, 'La referencia es obligatoria.'),
  bank: z.string().trim().min(1, 'El banco es obligatorio.'),
  amount: z
    .string()
    .trim()
    .min(1, 'El monto es obligatorio.')
    .refine((value) => Number.isFinite(Number(value)) && Number(value) > 0, {
      message: 'El monto debe ser mayor que cero.',
    }),
  currency: z.enum(['USD', 'VES']),
  phone: z.string().trim().min(5, 'El teléfono es obligatorio.'),
});

export type ManualPaymentFormValues = z.infer<typeof manualPaymentSchema>;
