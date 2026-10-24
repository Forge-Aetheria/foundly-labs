import { useQuery } from '@tanstack/react-query';
import { useSession } from '@/shared/auth/session-context';
import type { ErrorCode } from '@/shared/api/result';
import { fetchAgenda, type AgendaEntry } from './services';

export class AgendaError extends Error {
  constructor(
    readonly code: ErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'AgendaError';
  }
}

export function useAgenda(range: { from: string; to: string }) {
  const { tenantId } = useSession();

  return useQuery<AgendaEntry[], AgendaError>({
    queryKey: ['agenda', tenantId, range.from, range.to],
    enabled: Boolean(tenantId),
    queryFn: async () => {
      const result = await fetchAgenda(range.from, range.to);
      if (!result.ok) {
        throw new AgendaError(result.code, result.message);
      }
      return [...result.data].sort(
        (left, right) => new Date(left.startAt).getTime() - new Date(right.startAt).getTime(),
      );
    },
  });
}
