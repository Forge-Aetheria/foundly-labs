import { QueryClient } from '@tanstack/react-query';
import { emitUnauthenticated } from './notify-unauthenticated';

/**
 * Shared query cache (feature 024). Defaults mirror the validated mobile app:
 * short stale window, one retry for transient failures, no focus refetch.
 */
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

/**
 * Canonical cache keys. Every tenant-scoped key includes the tenant id (or public
 * slug) so data cannot leak across businesses.
 */
export const queryKeys = {
  workspace: (tenantId: string | null) => ['workspace', tenantId] as const,
  profile: (tenantId: string | null) => ['profile', tenantId] as const,
  agenda: (tenantId: string | null, extra?: unknown) => ['agenda', tenantId, extra] as const,
  services: (tenantId: string | null) => ['services', tenantId] as const,
  staff: (tenantId: string | null) => ['staff', tenantId] as const,
  availability: (tenantId: string | null, resourceId?: string | null) =>
    ['availability', tenantId, resourceId] as const,
  timeBlocks: (tenantId: string | null) => ['time-blocks', tenantId] as const,
  gallery: (tenantId: string | null) => ['gallery', tenantId] as const,
  payments: (tenantId: string | null) => ['payments', tenantId] as const,
  reviews: (tenantId: string | null, state?: string | null) =>
    ['reviews', tenantId, state] as const,
  notifications: (tenantId: string | null, filter?: string | null) =>
    ['notifications', tenantId, filter] as const,
  directory: (query: string, category?: string | null) =>
    ['directory', query, category] as const,
  publicBusiness: (slug: string) => ['public-business', slug] as const,
  platformMetrics: () => ['platform-metrics'] as const,
  managedBusinesses: (query: string, page: number) =>
    ['managed-businesses', query, page] as const,
} as const;

/** Drop all cached data (logout or expired session). */
export function clearTenantCache(client: QueryClient): void {
  client.clear();
}

export { emitUnauthenticated };
