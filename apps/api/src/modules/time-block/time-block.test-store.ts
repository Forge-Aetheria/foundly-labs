import { validationError } from '../../shared/tenant-scope';
import type { TenantScopeInput } from '../../shared/tenant-scope';
import type { CreateTimeBlockRow, TimeBlockRow, TimeBlockStore } from './time-block.store';

let seq = 0;
const nextId = (): string => `tb-${++seq}-${Date.now()}`;

export type MemoryTimeBlockStore = TimeBlockStore & {
  seed(row: TimeBlockRow): TimeBlockRow;
  tenantBySlug(slug: string, tenantId: string): void;
  addSpecialist(specialistId: string, tenantId: string): void;
};

/** In-memory `TimeBlockStore` for DB-free specs. */
export function createMemoryTimeBlockStore(): MemoryTimeBlockStore {
  const rows = new Map<string, TimeBlockRow>();
  const slugToTenant = new Map<string, string>();
  const specialists = new Map<string, string>();

  return {
    seed(row) {
      rows.set(row.id, row);
      return row;
    },
    tenantBySlug(slug, tenantId) {
      slugToTenant.set(slug, tenantId);
    },
    addSpecialist(specialistId, tenantId) {
      specialists.set(specialistId, tenantId);
    },

    async resolveTenantId(scope: TenantScopeInput) {
      const { tenantId, tenantSlug } = scope;
      if (!tenantId && !tenantSlug) {
        throw validationError('Provide tenantId or tenantSlug');
      }
      if (tenantId) {
        return tenantId;
      }
      return slugToTenant.get(tenantSlug ?? '') ?? null;
    },
    async list(tenantId, specialistId) {
      return [...rows.values()]
        .filter((row) => row.tenantId === tenantId)
        .filter((row) => !specialistId || row.specialistId === specialistId || row.specialistId === null)
        .sort((a, b) => (a.startAt < b.startAt ? -1 : 1));
    },
    async specialistBelongsToTenant(specialistId, tenantId) {
      return specialists.get(specialistId) === tenantId;
    },
    async create(tenantId: string, input: CreateTimeBlockRow) {
      const row: TimeBlockRow = {
        id: nextId(),
        tenantId,
        specialistId: input.specialistId,
        startAt: input.startAt.toISOString(),
        endAt: input.endAt.toISOString(),
        reason: input.reason,
      };
      rows.set(row.id, row);
      return row;
    },
    async removeById(id, tenantId) {
      const row = rows.get(id);
      if (!row || row.tenantId !== tenantId) {
        return false;
      }
      rows.delete(id);
      return true;
    },
  };
}
