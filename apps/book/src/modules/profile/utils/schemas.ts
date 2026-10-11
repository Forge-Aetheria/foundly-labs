import { z } from 'zod';

const optionalText = (max: number) => z.string().trim().max(max).nullish();

export const profileSchema = z.object({
  name: z.string().trim().min(1, 'El nombre es obligatorio.').max(120),
  category: z.string().trim().min(1, 'La categoría es obligatoria.').max(80),
  slug: z.string().trim().min(1, 'La URL pública es obligatoria.').max(60).optional(),
  bio: optionalText(1000),
  address: optionalText(200),
  phone: optionalText(40),
  avatar: optionalText(500),
  cover: optionalText(500),
  instagram: z.string().trim().url('El enlace de Instagram no es válido.').max(300).nullish(),
  whatsapp: optionalText(300),
});
export type ProfileInput = z.infer<typeof profileSchema>;

export const policySchema = z.object({
  title: z.string().trim().min(1, 'El título de la política es obligatorio.').max(120),
  body: optionalText(1000),
});
export type PolicyInput = z.infer<typeof policySchema>;

export const policiesSchema = z.array(policySchema).max(20);
export type PoliciesInput = z.infer<typeof policiesSchema>;
