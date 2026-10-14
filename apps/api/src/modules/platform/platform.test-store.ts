import type {
  ManagedBusinessRow,
  PlatformStore,
  SubscriptionPatch,
} from './platform.store';

export type MemoryPlatformStore = PlatformStore & {
  seed(row: ManagedBusinessRow, status?: string): ManagedBusinessRow;
  getRow(tenantId: string): ManagedBusinessRow | undefined;
};

/** In-memory `PlatformStore` for DB-free specs (tracking a separate tenant status for counts). */
export function createMemoryPlatformStore(): MemoryPlatformStore {
  const rows = new Map<string, ManagedBusinessRow>();
  const statuses = new Map<string, string>();

  return {
    seed(row, status = 'active') {
      rows.set(row.tenantId, row);
      statuses.set(row.tenantId, status);
      return row;
    },

    getRow(tenantId) {
      return rows.get(tenantId);
    },

    async countTenants() {
      return rows.size;
    },

    async countActiveTenants() {
      return [...statuses.values()].filter((status) => status === 'active').length;
    },

    async countByPlan() {
      const counts = new Map<ManagedBusinessRow['plan'], number>();
      for (const row of rows.values()) {
        counts.set(row.plan, (counts.get(row.plan) ?? 0) + 1);
      }
      return [...counts.entries()].map(([plan, count]) => ({ plan, count }));
    },

    async listTenants(query, limit, offset) {
      const term = query?.toLowerCase() ?? null;
      return [...rows.values()]
        .filter(
          (row) =>
            !term ||
            row.name.toLowerCase().includes(term) ||
            row.slug.toLowerCase().includes(term),
        )
        .sort((a, b) => a.name.localeCompare(b.name))
        .slice(offset, offset + limit);
    },

    async getTenant(tenantId) {
      return rows.get(tenantId) ?? null;
    },

    async updateSubscription(tenantId, patch: SubscriptionPatch) {
      const row = rows.get(tenantId);
      if (!row) {
        return null;
      }
      const next: ManagedBusinessRow = {
        ...row,
        ...(patch.plan !== undefined ? { plan: patch.plan } : {}),
        ...(patch.status !== undefined ? { status: patch.status } : {}),
        ...(patch.expiresAt !== undefined ? { expiresAt: patch.expiresAt } : {}),
      };
      rows.set(tenantId, next);
      return next;
    },
  };
}
