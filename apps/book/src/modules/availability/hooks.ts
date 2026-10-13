'use client';

import type { ActionResult } from '../../shared/types/result';
import type { TimeBlock } from '../../shared/types/appointments';
import { addTimeBlock, listTimeBlocks, removeTimeBlock, saveWeeklyAvailability } from './actions';

/** Availability client hooks (feature 011/015; constitution §5.VI). */
export function useSaveAvailability(): (input: unknown) => Promise<ActionResult<{ updated: true }>> {
  return (input) => saveWeeklyAvailability(input);
}

export function useListTimeBlocks(): (tenantId: string) => Promise<ActionResult<TimeBlock[]>> {
  return (tenantId) => listTimeBlocks(tenantId);
}

export function useAddTimeBlock(): (input: unknown) => Promise<ActionResult<TimeBlock>> {
  return (input) => addTimeBlock(input);
}

export function useRemoveTimeBlock(): (input: unknown) => Promise<ActionResult<{ id: string }>> {
  return (input) => removeTimeBlock(input);
}
