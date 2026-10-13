import { z } from 'zod';

const SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])?$/;

const policySchema = z.object({
  title: z.string().trim().min(1, 'El título de la política es obligatorio.').max(120),
  body: z.string().trim().min(1, 'El cuerpo de la política es obligatorio.').max(2000),
});

/** Business-profile update input (feature 014). */
export const updateProfileSchema = z.object({
  name: z.string().trim().min(1, 'El nombre es obligatorio.').max(120),
  category: z.string().trim().min(1, 'La categoría es obligatoria.').max(120),
  slug: z.string().trim().regex(SLUG_PATTERN, 'URL pública inválida.'),
  bio: z.string().trim().max(2000, 'Máximo 2000 caracteres.').nullish(),
  address: z.string().trim().nullish(),
  phone: z.string().trim().nullish(),
  instagram: z.string().trim().url('El enlace de Instagram no es válido.').nullish(),
  whatsapp: z.string().trim().url('El enlace de WhatsApp no es válido.').nullish(),
  logo: z.string().trim().url('La URL del logo no es válida.').nullish(),
  cover: z.string().trim().url('La URL de la portada no es válida.').nullish(),
  policies: z.array(policySchema).default([]),
});
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
