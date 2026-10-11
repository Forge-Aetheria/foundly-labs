import { z } from 'zod';
import type { AppointmentStatus } from '../../../shared/types/appointments';

export const APPOINTMENT_STATUSES = [
  'pending',
  'confirmed',
  'checked-in',
  'completed',
  'cancelled',
  'no-show',
] as const satisfies readonly AppointmentStatus[];

const id = z.string().min(1);
const isoDate = z.string().datetime({ offset: true });

export const createAppointmentSchema = z.object({
  resourceId: id,
  serviceId: id,
  clientName: z.string().min(1).max(120),
  clientContact: z.string().max(200).optional(),
  startAt: isoDate,
  notes: z.string().max(2000).optional(),
});
export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;

export const rescheduleAppointmentSchema = z.object({
  appointmentId: id,
  startAt: isoDate,
});
export type RescheduleAppointmentInput = z.infer<typeof rescheduleAppointmentSchema>;

export const cancelAppointmentSchema = z.object({
  appointmentId: id,
  reason: z.string().min(1).max(500),
});
export type CancelAppointmentInput = z.infer<typeof cancelAppointmentSchema>;

export const changeStatusSchema = z.object({
  appointmentId: id,
  status: z.enum(APPOINTMENT_STATUSES),
});
export type ChangeStatusInput = z.infer<typeof changeStatusSchema>;
