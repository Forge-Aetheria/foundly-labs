'use client';

import type { ActionResult } from '../../shared/types/result';
import { changePassword } from './actions';

/** Security client hooks (feature 011; constitution §5.VI). */
export function useChangePassword(): (input: unknown) => Promise<ActionResult<{ updated: true }>> {
  return (input) => changePassword(input);
}