import { useQuery } from '@tanstack/react-query';
import type { ActionResult } from '../types/result';

export type AdminResourceState<T> =
  | { status: 'loading' }
  | { status: 'ready'; data: T }
  | { status: 'error'; message: string };

/**
 * Client-side data loading for the admin modules backed by TanStack Query
 * (feature 024). Keeps the historical return shape so existing views only need
 * to call `router.refresh()` (which invalidates the cache) after mutations.
 */
export function useAdminResource<T>(
  tenantId: string | undefined,
  load: (tenantId: string) => Promise<ActionResult<T>>,
  fallbackMessage = 'No pudimos cargar la información.',
): AdminResourceState<T> {
  const query = useQuery({
    queryKey: ['admin-resource', tenantId ?? null, load.name],
    enabled: Boolean(tenantId),
    queryFn: async () => {
      const result = await load(tenantId as string);
      if (!result.ok) {
        throw new Error(result.error.message);
      }
      return result.data;
    },
  });

  if (!tenantId || query.isLoading) {
    return { status: 'loading' };
  }
  if (query.isError) {
    return {
      status: 'error',
      message: query.error instanceof Error ? query.error.message : fallbackMessage,
    };
  }
  return { status: 'ready', data: query.data as T };
}
