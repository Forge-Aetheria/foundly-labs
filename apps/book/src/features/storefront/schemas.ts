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
  bio: optionalText(1000),
  address: optionalText(200),
  phone: optionalText(40),
  avatar: optionalText(500),
  cover: optionalText(500),
  instagram: optionalText(300),
  whatsapp: optionalText(300),
});
export type ProfileInput = z.infer<typeof profileSchema>;

export const galleryImageSchema = z.object({
  url: z.string().trim().min(1, 'La URL de la imagen es obligatoria.').max(1000),
});
export type GalleryImageInput = z.infer<typeof galleryImageSchema>;