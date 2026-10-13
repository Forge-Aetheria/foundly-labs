'use client';

import type { ActionResult } from '../../shared/types/result';
import { saveWeeklyAvailability } from './actions';

/** Availability client hooks (feature 011; constitution §5.VI). */
export function useSaveAvailability(): (input: unknown) => Promise<ActionResult<{ updated: true }>> {
  return (input) => saveWeeklyAvailability(input);
}