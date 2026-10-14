'use client';

import type { PaymentMethod } from '../../shared/types/payments';
import type { ActionResult } from '../../shared/types/result';
import { deletePaymentMethod, listPaymentMethods, upsertPaymentMethod } from './actions';

/** Configuration client hooks (feature 017; constitution §5.VI). */
export function useFetchPaymentMethods(): () => Promise<ActionResult<PaymentMethod[]>> {
  return () => listPaymentMethods();
}

export function useUpsertPaymentMethod(): (
  input: unknown,
) => Promise<ActionResult<PaymentMethod>> {
  return (input) => upsertPaymentMethod(input);
}

export function useDeletePaymentMethod(): (
  input: unknown,
) => Promise<ActionResult<{ id: string }>> {
  return (input) => deletePaymentMethod(input);
}
