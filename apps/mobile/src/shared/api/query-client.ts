import { QueryClient } from '@tanstack/react-query';
import { emitUnauthenticated } from './notify-unauthenticated';

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        retry: 1,
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: 0,
      },
    },
  });
}

export function clearTenantCache(client: QueryClient): void {
  client.clear();
}

export { emitUnauthenticated };
