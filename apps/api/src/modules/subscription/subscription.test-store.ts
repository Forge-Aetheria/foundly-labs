import type { SubscriptionRow, SubscriptionStore, UsageKind } from './subscription.store';

export type MemorySubscriptionStore = SubscriptionStore & {
  seedTenant(row: SubscriptionRow): SubscriptionRow;
  /** Seed one countable record; `active` defaults to true. */
  seedService(tenantId: string, active?: boolean): void;
  seedSpecialist(tenantId: string, active?: boolean): void;
};

/** In-memory `SubscriptionStore` for DB-free specs. */
export function createMemorySubscriptionStore(): MemorySubscriptionStore {
  const tenants = new Map<string, SubscriptionRow>();
  const services: { tenantId: string; active: boolean }[] = [];
  const specialists: { tenantId: string; active: boolean }[] = [];

  const count = (
    rows: { tenantId: string; active: boolean }[],
    tenantId: string,
  ): number => rows.filter((row) => row.tenantId === tenantId && row.active).length;

  return {
    seedTenant(row) {
      tenants.set(row.tenantId, row);
      return row;
    },

    seedService(tenantId, active = true) {
      services.push({ tenantId, active });
    },

    seedSpecialist(tenantId, active = true) {
      specialists.push({ tenantId, active });
    },

    async getTenantSubscription(tenantId: string): Promise<SubscriptionRow | null> {
      return tenants.get(tenantId) ?? null;
    },

    async countActive(tenantId: string, kind: UsageKind): Promise<number> {
      return kind === 'services' ? count(services, tenantId) : count(specialists, tenantId);
    },
  };
}
