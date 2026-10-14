import { z } from 'zod';

/** Client contact fields of the booking flow (contracts/booking-flow.contract.md). */
export const clientDetailsSchema = z.object({
  clientName: z.string().min(1, 'El nombre es obligatorio.').max(120, 'Máximo 120 caracteres.'),
  clientEmail: z.string().email('Introduce un email válido.'),
  clientPhone: z
    .string()
    .min(8, 'El teléfono debe tener al menos 8 caracteres.')
    .max(20, 'El teléfono no puede superar los 20 caracteres.')
    .regex(/^[0-9+\- ]+$/, 'El teléfono solo admite dígitos, espacios, + y -.'),
  notes: z.string().max(2000, 'Máximo 2000 caracteres.').optional(),
});
export type ClientDetails = z.infer<typeof clientDetailsSchema>;

/** Advance payment draft collected by the mandatory payment step (feature 017). */
export const advancePaymentSchema = z.object({
  methodType: z.enum(['mobile_payment', 'bank_transfer', 'binance'], {
    message: 'Selecciona un método de pago.',
  }),
  amountCents: z
    .number({ message: 'Introduce el monto del adelanto.' })
    .int()
    .positive('El monto debe ser mayor que cero.'),
  reference: z.string().trim().min(1, 'La referencia es obligatoria.').max(200),
  proofUrl: z.string().url('Adjunta el comprobante.'),
});
export type AdvancePaymentDraft = z.infer<typeof advancePaymentSchema>;
