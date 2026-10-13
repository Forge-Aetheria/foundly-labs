'use client';

import type { Resource } from '../../shared/types/appointments';
import type { ActionResult } from '../../shared/types/result';
import { createStaff, removeStaff, setStaffActive, updateStaff } from './actions';

/**
 * Staff client hooks (feature 011; constitution §5.VI).
 * UI components interact only through these hooks — never with Server Actions.
 */

export function useCreateStaff(): (input: unknown) => Promise<ActionResult<Resource>> {
  return (input) => createStaff(input);
}

export function useUpdateStaff(): (input: unknown) => Promise<ActionResult<Resource>> {
  return (input) => updateStaff(input);
}

export function useSetStaffActive(): (input: unknown) => Promise<ActionResult<Resource>> {
  return (input) => setStaffActive(input);
}

export function useRemoveStaff(): (input: unknown) => Promise<ActionResult<{ id: string }>> {
  return (input) => removeStaff(input);
}