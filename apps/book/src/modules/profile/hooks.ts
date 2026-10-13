'use client';

import type { ActionResult } from '../../shared/types/result';
import type { Tenant } from '../../shared/types/tenancy';
import { getProfile, updateProfile } from './actions';

/**
 * Profile client hooks (feature 014; constitution §5.VI).
 * UI components interact only through these hooks — never with Server Actions.
 */
export function useFetchProfile(): (tenantId: string) => Promise<ActionResult<Tenant>> {
  return (tenantId) => getProfile(tenantId);
}

export function useUpdateProfile(): (input: unknown) => Promise<ActionResult<Tenant>> {
  return (input) => updateProfile(input);
}
