'use client';

import type { Appointment } from '../../shared/types/appointments';
import type { ActionResult } from '../../shared/types/result';
import { bookPublicAppointment, fetchOfferedSlots, type SlotDay } from './actions';

/** Public booking client hooks (feature 011; constitution §5.VI). */
export function useFetchOfferedSlots(): (input: unknown) => Promise<SlotDay[]> {
  return (input) => fetchOfferedSlots(input);
}

export function useBookAppointment(): (input: unknown) => Promise<ActionResult<Appointment>> {
  return (input) => bookPublicAppointment(input);
}