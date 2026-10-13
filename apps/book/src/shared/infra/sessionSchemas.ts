import { z } from 'zod';

/**
 * Validation for the auth surfaces (feature 009 — specs/book/009-admin-auth).
 * Mirrors the onboarding account password policy (≥ 8 chars, letters + numbers).
 */

export const loginSchema = z.object({
  email: z.string().email('Introduce un email válido.'),
  password: z.string().min(1, 'Introduce tu contraseña.'),
});
export type LoginFields = z.infer<typeof loginSchema>;

export const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, 'Introduce tu contraseña actual.'),
    newPassword: z
      .string()
      .min(8, 'Mínimo 8 caracteres.')
      .regex(/[A-Za-z]/, 'Debe contener letras.')
      .regex(/\d/, 'Debe contener números.'),
    confirmPassword: z.string().min(1, 'Confirma la nueva contraseña.'),
  })
  .refine((value) => value.newPassword === value.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Las contraseñas no coinciden.',
  });
export type PasswordChangeFields = z.infer<typeof passwordChangeSchema>;
