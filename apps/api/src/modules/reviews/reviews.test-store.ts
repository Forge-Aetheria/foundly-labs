import { validationError } from '../../shared/tenant-scope';
import type { TenantScopeInput } from '../../shared/tenant-scope';
import type { ReviewRow, ReviewsStore } from './reviews.store';
import type { ReviewState } from './reviews.types';

let seq = 0;
const nextId = (): string => `rev-${++seq}-${Date.now()}`;

export type MemoryReviewsStore = ReviewsStore & {
  seed(row: ReviewRow): ReviewRow;
  tenantBySlug(slug: string, tenantId: string): void;
};

/** In-memory `ReviewsStore` for DB-free specs. */
export function createMemoryReviewsStore(): MemoryReviewsStore {
  const rows = new Map<string, ReviewRow>();
  const slugToTenant = new Map<string, string>();

  return {
    seed(row) {
      rows.set(row.id, row);
      return row;
    },
    tenantBySlug(slug, tenantId) {
      slugToTenant.set(slug, tenantId);
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
    async listByTenant(tenantId, state) {
      return [...rows.values()]
        .filter((row) => row.tenantId === tenantId && (state === undefined || row.state === state))
        .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    },
    async create(tenantId, input) {
      const row: ReviewRow = {
        id: nextId(),
        tenantId,
        author: input.author,
        rating: input.rating,
        comment: input.comment,
        state: 'pending',
        createdAt: new Date(Date.now() + ++seq).toISOString(),
      };
      rows.set(row.id, row);
      return row;
    },
    async setState(id, tenantId, state: ReviewState) {
      const row = rows.get(id);
      if (!row || row.tenantId !== tenantId) {
        return null;
      }
      const updated: ReviewRow = { ...row, state };
      rows.set(id, updated);
      return updated;
    },
    async deleteById(id, tenantId) {
      const row = rows.get(id);
      if (!row || row.tenantId !== tenantId) {
        return false;
      }
      return rows.delete(id);
    },
  };
}
