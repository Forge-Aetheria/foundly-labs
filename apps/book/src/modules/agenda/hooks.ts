'use client';

import type { Appointment } from '../../shared/types/appointments';
import type { ActionResult } from '../../shared/types/result';
import {
  cancelAppointment,
  changeAppointmentStatus,
  createAppointment,
  rescheduleAppointment,
} from './actions';

/** Agenda client hooks (feature 011; constitution §5.VI). */
export function useCreateAppointment(): (input: unknown) => Promise<ActionResult<Appointment>> {
  return (input) => createAppointment(input);
}

export function useCancelAppointment(): (input: unknown) => Promise<ActionResult<Appointment>> {
  return (input) => cancelAppointment(input);
}

export function useChangeAppointmentStatus(): (input: unknown) => Promise<ActionResult<Appointment>> {
  return (input) => changeAppointmentStatus(input);
}

export function useRescheduleAppointment(): (input: unknown) => Promise<ActionResult<Appointment>> {
  return (input) => rescheduleAppointment(input);
}