import { z } from 'zod';

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
