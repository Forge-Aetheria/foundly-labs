import { validationError } from '../../shared/tenant-scope';
import type { TenantScopeInput } from '../../shared/tenant-scope';
import type { AddGalleryItemInput } from './gallery.types';
import type { GalleryRow, GalleryStore } from './gallery.store';

let seq = 0;
const nextId = (): string => `gal-${++seq}-${Date.now()}`;

export type MemoryGalleryStore = GalleryStore & {
  seed(row: GalleryRow): GalleryRow;
  tenantBySlug(slug: string, tenantId: string): void;
};

/** In-memory `GalleryStore` for DB-free specs. */
export function createMemoryGalleryStore(): MemoryGalleryStore {
  const rows = new Map<string, GalleryRow>();
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
    async listByTenant(tenantId) {
      return [...rows.values()]
        .filter((row) => row.tenantId === tenantId)
        .sort((a, b) => a.order - b.order);
    },
    async findByUrl(tenantId, url) {
      return [...rows.values()].find((row) => row.tenantId === tenantId && row.url === url) ?? null;
    },
    async nextOrder(tenantId) {
      const list = [...rows.values()].filter((row) => row.tenantId === tenantId);
      return list.length > 0 ? Math.max(...list.map((row) => row.order)) + 1 : 0;
    },
    async create(tenantId: string, input: AddGalleryItemInput, order: number) {
      const row: GalleryRow = {
        id: nextId(),
        tenantId,
        url: input.url,
        title: input.title ?? null,
        description: input.description ?? null,
        category: input.category ?? null,
        order,
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
