import { z } from 'zod';

/**
 * Validation schemas for the storefront admin operations (`/admin/staff`,
 * `/admin/gallery`, `/admin/profile`). They mirror the public portal profile
 * (`contracts/portal-profile.contract.md`) so the admin edits exactly what the
 * landing renders.
 */

const optionalText = (max: number) => z.string().trim().max(max).nullish();

export const staffSchema = z.object({
  name: z.string().trim().min(1, 'El nombre es obligatorio.').max(120),
  role: optionalText(120),
  avatar: optionalText(500),
  bio: optionalText(500),
  active: z.boolean().optional(),
  serviceIds: z.array(z.string().min(1)).optional(),
});
export type StaffInput = z.infer<typeof staffSchema>;

export const updateStaffSchema = staffSchema.extend({
  id: z.string().min(1),
});
export type UpdateStaffInput = z.infer<typeof updateStaffSchema>;

export const staffIdSchema = z.object({ id: z.string().min(1) });
export type StaffIdInput = z.infer<typeof staffIdSchema>;

export const staffActiveSchema = z.object({ id: z.string().min(1), active: z.boolean() });
export type StaffActiveInput = z.infer<typeof staffActiveSchema>;

export const profileSchema = z.object({
  name: z.string().trim().min(1, 'El nombre es obligatorio.').max(120),
  category: z.string().trim().min(1, 'La categoría es obligatoria.').max(80),
  slug: z.string().trim().min(1, 'La URL pública es obligatoria.').max(60).optional(),
  bio: optionalText(1000),
  address: optionalText(200),
  phone: optionalText(40),
  avatar: optionalText(500),
  cover: optionalText(500),
  instagram: z
    .string()
    .trim()
    .url('El enlace de Instagram no es válido.')
    .max(300)
    .nullish(),
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

export const galleryPhotoSchema = z.object({
  url: z.string().trim().url('La URL de la imagen es inválida.').max(1000),
  title: z.string().trim().max(120).optional(),
  description: z.string().trim().max(250).optional(),
  category: z.enum(['local', 'trabajos', 'equipo']).optional(),
});
export type GalleryPhotoInput = z.infer<typeof galleryPhotoSchema>;

export const galleryPhotoIdSchema = z.object({ id: z.string().min(1) });
export type GalleryPhotoIdInput = z.infer<typeof galleryPhotoIdSchema>;