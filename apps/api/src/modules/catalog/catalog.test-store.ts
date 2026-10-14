import type {
  CatalogStore,
  ServiceRow,
  SpecialistRow,
} from './catalog.store';
import type {
  CreateMyServiceInput,
  UpdateMyServiceInput,
  UpdateMySpecialistInput,
} from './catalog.types';

let seq = 0;
const nextId = (prefix: string): string => `${prefix}-${++seq}-${Date.now()}`;

export type MemoryCatalogStore = CatalogStore & {
  assignments: Set<string>;
  seedService(row: ServiceRow): ServiceRow;
  seedSpecialist(row: SpecialistRow): SpecialistRow;
  seedAssignment(specialistId: string, serviceId: string): void;
};

const pickServiceInput = (input: CreateMyServiceInput): Omit<ServiceRow, 'id' | 'tenantId'> => ({
  name: input.name,
  description: input.description ?? null,
  priceCents: input.priceCents,
  durationMinutes: input.durationMinutes,
  category: input.category ?? null,
  active: input.active ?? true,
  requiresAdvance: input.requiresAdvance ?? false,
  advanceKind: input.requiresAdvance ? (input.advanceKind ?? null) : null,
  advanceValue: input.requiresAdvance ? (input.advanceValue ?? null) : null,
});

const applyServiceUpdate = (
  row: ServiceRow,
  input: UpdateMyServiceInput,
): ServiceRow => ({
  ...row,
  ...(input.name !== undefined && input.name !== null ? { name: input.name } : {}),
  ...(input.description !== undefined ? { description: input.description } : {}),
  ...(input.priceCents !== undefined && input.priceCents !== null
    ? { priceCents: input.priceCents }
    : {}),
  ...(input.durationMinutes !== undefined && input.durationMinutes !== null
    ? { durationMinutes: input.durationMinutes }
    : {}),
  ...(input.category !== undefined ? { category: input.category } : {}),
  ...(input.active !== undefined && input.active !== null ? { active: input.active } : {}),
  ...(input.requiresAdvance === false
    ? { requiresAdvance: false, advanceKind: null, advanceValue: null }
    : {}),
  ...(input.requiresAdvance === true
    ? {
        requiresAdvance: true,
        advanceKind: input.advanceKind ?? null,
        advanceValue: input.advanceValue ?? null,
      }
    : {}),
});

const applySpecialistUpdate = (
  row: SpecialistRow,
  input: UpdateMySpecialistInput,
): SpecialistRow => ({
  ...row,
  ...(input.name !== undefined && input.name !== null ? { name: input.name } : {}),
  ...(input.role !== undefined ? { role: input.role } : {}),
  ...(input.bio !== undefined ? { bio: input.bio } : {}),
  ...(input.avatar !== undefined ? { avatar: input.avatar } : {}),
  ...(input.active !== undefined && input.active !== null ? { active: input.active } : {}),
});

/** In-memory `CatalogStore` for DB-free specs; also tracks specialist-service assignments. */
export function createMemoryCatalogStore(): MemoryCatalogStore {
  const services = new Map<string, ServiceRow>();
  const specialists = new Map<string, SpecialistRow>();
  const assignments = new Set<string>();

  const store: MemoryCatalogStore = {
    assignments,

    seedService(row) {
      services.set(row.id, row);
      return row;
    },
    seedSpecialist(row) {
      specialists.set(row.id, row);
      return row;
    },
    seedAssignment(specialistId, serviceId) {
      assignments.add(`${specialistId}:${serviceId}`);
    },

    async listServices(tenantId) {
      return [...services.values()].filter((s) => s.tenantId === tenantId);
    },
    async getService(id, tenantId) {
      const s = services.get(id);
      return s && s.tenantId === tenantId ? s : null;
    },
    async findServiceByName(tenantId, name) {
      return [...services.values()].find((s) => s.tenantId === tenantId && s.name === name) ?? null;
    },
    async createService(tenantId, input) {
      const row: ServiceRow = {
        id: nextId('srv'),
        tenantId,
        ...pickServiceInput(input),
      };
      services.set(row.id, row);
      return row;
    },
    async updateService(id, tenantId, input) {
      const s = services.get(id);
      if (!s || s.tenantId !== tenantId) return null;
      const next = applyServiceUpdate(s, input);
      services.set(id, next);
      return next;
    },
    async deleteService(id, tenantId) {
      const s = services.get(id);
      if (!s || s.tenantId !== tenantId) return false;
      services.delete(id);
      return true;
    },

    async listSpecialists(tenantId) {
      return [...specialists.values()].filter((s) => s.tenantId === tenantId);
    },
    async getSpecialist(id, tenantId) {
      const s = specialists.get(id);
      return s && s.tenantId === tenantId ? s : null;
    },
    async createSpecialist(tenantId, input) {
      const row: SpecialistRow = {
        id: nextId('spc'),
        tenantId,
        name: input.name,
        role: input.role ?? null,
        bio: input.bio ?? null,
        avatar: input.avatar ?? null,
        active: input.active ?? true,
      };
      specialists.set(row.id, row);
      return row;
    },
    async updateSpecialist(id, tenantId, input) {
      const s = specialists.get(id);
      if (!s || s.tenantId !== tenantId) return null;
      const next = applySpecialistUpdate(s, input);
      specialists.set(id, next);
      return next;
    },
    async deleteSpecialist(id, tenantId) {
      const s = specialists.get(id);
      if (!s || s.tenantId !== tenantId) return false;
      specialists.delete(id);
      for (const key of [...assignments]) {
        if (key.startsWith(`${id}:`)) assignments.delete(key);
      }
      return true;
    },
  };

  return store;
}