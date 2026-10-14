'use client';

import type { ActionResult } from '../../shared/types/result';
import { getManagedBusinesses, getPlatformMetrics, overrideSubscription } from './actions';
import type { ManagedBusinessView, PlatformMetricsView } from './utils/types';

/** Super Admin client hooks (feature 020; constitution §5.VI). */
export function usePlatformMetrics(): () => Promise<ActionResult<PlatformMetricsView>> {
  return () => getPlatformMetrics();
}

export function useManagedBusinesses(): (input: {
  query?: string | null;
  limit?: number | null;
  offset?: number | null;
}) => Promise<ActionResult<ManagedBusinessView[]>> {
  return (input) => getManagedBusinesses(input);
}

export function useOverrideSubscription(): (
  input: unknown,
) => Promise<ActionResult<ManagedBusinessView>> {
  return (input) => overrideSubscription(input);
}
