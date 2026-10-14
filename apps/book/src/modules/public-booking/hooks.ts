'use client';

import type { Appointment } from '../../shared/types/appointments';
import type { PaymentMethod } from '../../shared/types/payments';
import type { ActionResult } from '../../shared/types/result';
import { bookPublicAppointment, fetchOfferedSlots, listPublicPaymentMethods, type SlotDay } from './actions';
import { uploadPaymentProof } from './utils/uploadProof';

/** Public booking client hooks (feature 011; constitution §5.VI). */
export function useFetchOfferedSlots(): (input: unknown) => Promise<SlotDay[]> {
  return (input) => fetchOfferedSlots(input);
}

export function useBookAppointment(): (input: unknown) => Promise<ActionResult<Appointment>> {
  return (input) => bookPublicAppointment(input);
}

export function useFetchPublicPaymentMethods(): (
  tenantSlug: string,
) => Promise<ActionResult<PaymentMethod[]>> {
  return (tenantSlug) => listPublicPaymentMethods(tenantSlug);
}

export function useUploadPaymentProof(): (
  file: File,
  tenantSlug: string,
) => Promise<ActionResult<{ url: string }>> {
  return (file, tenantSlug) => uploadPaymentProof(file, tenantSlug);
}
