import { QueryClient } from '@tanstack/react-query';

/** Fresh query client for tests: no retries, no logging. */
export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, refetchOnWindowFocus: false },
      mutations: { retry: false },
    },
  });
}
