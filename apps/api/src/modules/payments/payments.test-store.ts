import type { TenantScopeInput } from '../../shared/tenant-scope';
import type { PaymentMethodRow, PaymentsStore, UpsertPaymentMethodData } from './payments.store';
import { PaymentMethodType } from './payments.types';

let seq = 0;
const nextId = (): string => `pm-${++seq}-${Date.now()}`;

export type MemoryPaymentsStore = PaymentsStore & {
  seed(row: PaymentMethodRow): PaymentMethodRow;
  tenantBySlug(slug: string, tenantId: string): void;
};

/** In-memory `PaymentsStore` for DB-free specs. */
export function createMemoryPaymentsStore(): MemoryPaymentsStore {
  const rows = new Map<string, PaymentMethodRow>();
  const slugToTenant = new Map<string, string>();

  const find = (tenantId: string, type: PaymentMethodType): PaymentMethodRow | undefined =>
    [...rows.values()].find((row) => row.tenantId === tenantId && row.type === type);

  return {
    seed(row) {
      rows.set(row.id, row);
      return row;
    },

    tenantBySlug(slug, tenantId) {
      slugToTenant.set(slug, tenantId);
    },

    async resolveTenantId(scope: TenantScopeInput) {
      if (scope.tenantId) {
        return scope.tenantId;
      }
      return scope.tenantSlug ? (slugToTenant.get(scope.tenantSlug) ?? null) : null;
    },

    async listByTenant(tenantId, active) {
      return [...rows.values()]
        .filter((row) => row.tenantId === tenantId && (active === undefined || row.active === active))
        .sort((a, b) => a.type.localeCompare(b.type));
    },

    async getByType(tenantId, type) {
      return find(tenantId, type) ?? null;
    },

    async upsertByType(tenantId, type, data: UpsertPaymentMethodData) {
      const existing = find(tenantId, type);
      const now = new Date().toISOString();
      if (existing) {
        const next: PaymentMethodRow = {
          ...existing,
          ...(data.label !== undefined ? { label: data.label } : {}),
          ...(data.details !== undefined ? { details: data.details } : {}),
          ...(data.instructions !== undefined ? { instructions: data.instructions } : {}),
          ...(data.active !== undefined && data.active !== null ? { active: data.active } : {}),
          updatedAt: now,
        };
        rows.set(next.id, next);
        return next;
      }
      const row: PaymentMethodRow = {
        id: nextId(),
        tenantId,
        type,
        label: data.label ?? null,
        details: data.details ?? null,
        instructions: data.instructions ?? null,
        active: data.active ?? false,
        createdAt: now,
        updatedAt: now,
      };
      rows.set(row.id, row);
      return row;
    },

    async deleteById(id, tenantId) {
      const row = rows.get(id);
      if (!row || row.tenantId !== tenantId) {
        return false;
      }
      rows.delete(id);
      return true;
    },
  };
}
