import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AddTimeBlockInput } from '@/shared/api/generated';
import type { ErrorCode } from '@/shared/api/result';
import { useSession } from '@/shared/auth/session-context';
import {
  addTimeBlock,
  fetchAvailability,
  fetchTimeBlocks,
  removeTimeBlock,
  saveWeeklyAvailability,
} from './services';
import type { AvailabilityRule, DayDraft, TimeBlock } from './availability-utils';

export class AvailabilityError extends Error {
  constructor(
    readonly code: ErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'AvailabilityError';
  }
}

function availabilityKey(tenantId: string | null) {
  return ['availability', tenantId] as const;
}

function timeBlocksKey(tenantId: string | null) {
  return ['time-blocks', tenantId] as const;
}

export function useAvailability() {
  const { tenantId } = useSession();

  return useQuery<AvailabilityRule[], AvailabilityError>({
    queryKey: availabilityKey(tenantId),
    enabled: Boolean(tenantId),
    queryFn: async () => {
      if (!tenantId) return [];
      const result = await fetchAvailability(tenantId);
      if (!result.ok) throw new AvailabilityError(result.code, result.message);
      return result.data;
    },
  });
}

export function useTimeBlocks() {
  const { tenantId } = useSession();

  return useQuery<TimeBlock[], AvailabilityError>({
    queryKey: timeBlocksKey(tenantId),
    enabled: Boolean(tenantId),
    queryFn: async () => {
      if (!tenantId) return [];
      const result = await fetchTimeBlocks(tenantId);
      if (!result.ok) throw new AvailabilityError(result.code, result.message);
      return result.data;
    },
  });
}

export function useSaveAvailability() {
  const { tenantId } = useSession();
  const queryClient = useQueryClient();

  return useMutation<true, AvailabilityError, DayDraft[]>({
    mutationFn: async (days) => {
      if (!tenantId) throw new AvailabilityError('UNAUTHENTICATED', 'Tu sesión ha expirado.');
      const result = await saveWeeklyAvailability(tenantId, days);
      if (!result.ok) throw new AvailabilityError(result.code, result.message);
      return true;
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: availabilityKey(tenantId) });
    },
  });
}

export function useAddTimeBlock() {
  const { tenantId } = useSession();
  const queryClient = useQueryClient();

  return useMutation<TimeBlock, AvailabilityError, AddTimeBlockInput>({
    mutationFn: async (input) => {
      const result = await addTimeBlock(input);
      if (!result.ok) throw new AvailabilityError(result.code, result.message);
      return result.data;
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: timeBlocksKey(tenantId) });
    },
  });
}

export function useRemoveTimeBlock() {
  const { tenantId } = useSession();
  const queryClient = useQueryClient();

  return useMutation<true, AvailabilityError, string>({
    mutationFn: async (id) => {
      const result = await removeTimeBlock(id);
      if (!result.ok) throw new AvailabilityError(result.code, result.message);
      return result.data;
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: timeBlocksKey(tenantId) });
    },
  });
}
