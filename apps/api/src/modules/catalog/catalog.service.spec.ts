import { beforeEach, describe, expect, it } from 'vitest';
import { createMemoryCatalogStore, type MemoryCatalogStore } from './catalog.test-store';
import { CatalogService } from './catalog.service';
import type { CreateMyServiceInput, CreateMySpecialistInput } from './catalog.types';

const T1 = 'tenant-1';
const T2 = 'tenant-2';

function serviceInput(): CreateMyServiceInput {
  return { name: 'Corte', priceCents: 1500, durationMinutes: 30 };
}

function specialistInput(): CreateMySpecialistInput {
  return { name: 'Ana' };
}

function expectCode(promise: Promise<unknown>, code: string): Promise<void> {
  return expect(promise).rejects.toThrowError(
    expect.objectContaining({ extensions: { code } }),
  );
}

describe('CatalogService (010-domain-mvp-module)', () => {
  let store: MemoryCatalogStore;
  let service: CatalogService;

  beforeEach(() => {
    store = createMemoryCatalogStore();
    service = new CatalogService(store);
  });

  describe('US1 — tenant-scoped CRUD round-trip', () => {
    it('creates, lists, fetches, updates and deletes within the caller tenant', async () => {
      const created = await service.createService(T1, serviceInput());
      expect(created.tenantId).toBe(T1);
      expect(created.name).toBe('Corte');

      const listed = await service.listServices(T1);
      expect(listed.map((s) => s.id)).toEqual([created.id]);

      const fetched = await service.getService(created.id, T1);
      expect(fetched?.id).toBe(created.id);

      const updated = await service.updateService(created.id, T1, { active: false });
      expect(updated.active).toBe(false);

      expect(await service.deleteService(created.id, T1)).toBe(true);
      await expectCode(service.getService(created.id, T1), 'NOT_FOUND');
    });

    it('keeps tenant lists separated', async () => {
      const a = await service.createService(T1, serviceInput());
      await service.createService(T2, { ...serviceInput(), name: 'Otra' });
      const t1 = await service.listServices(T1);
      const t2 = await service.listServices(T2);
      expect(t1.map((s) => s.id)).toEqual([a.id]);
      expect(t2.map((s) => s.id)).not.toContain(a.id);
    });

    it('supports specialist create/list/delete and assignment cascade', async () => {
      const srv = await service.createService(T1, serviceInput());
      const specialist = await service.createSpecialist(T1, specialistInput());
      expect((await service.listSpecialists(T1)).map((s) => s.id)).toEqual([specialist.id]);
      store.seedAssignment(specialist.id, srv.id);
      expect(store.assignments.has(`${specialist.id}:${srv.id}`)).toBe(true);

      expect(await service.deleteSpecialist(specialist.id, T1)).toBe(true);
      expect(store.assignments.has(`${specialist.id}:${srv.id}`)).toBe(false);
    });
  });

  describe('US2 — isolation and predictable errors', () => {
    it('returns NOT_FOUND when a tenant touches another tenant service', async () => {
      const a = await service.createService(T1, serviceInput());
      await expectCode(service.getService(a.id, T2), 'NOT_FOUND');
      await expectCode(service.updateService(a.id, T2, { active: false }), 'NOT_FOUND');
      await expectCode(service.deleteService(a.id, T2), 'NOT_FOUND');
      expect((await service.getService(a.id, T1))?.id).toBe(a.id);
    });

    it('returns NOT_FOUND for unknown ids', async () => {
      await expectCode(service.getService('nope', T1), 'NOT_FOUND');
      await expectCode(service.updateService('nope', T1, { active: true }), 'NOT_FOUND');
      await expectCode(service.deleteService('nope', T1), 'NOT_FOUND');
      await expectCode(service.getSpecialist('nope', T1), 'NOT_FOUND');
    });

    it('rejects operations when the identity carries no tenant scope', async () => {
      expect(() => service.requireTenant(undefined)).toThrowError(
        expect.objectContaining({ extensions: { code: 'UNAUTHENTICATED' } }),
      );
      expect(() => service.requireTenant({ tenantId: undefined })).toThrowError(
        expect.objectContaining({ extensions: { code: 'UNAUTHENTICATED' } }),
      );
    });

    it('validates input before persisting (VALIDATION_ERROR, nothing written)', async () => {
      await expectCode(
        service.createService(T1, { ...serviceInput(), name: '' }),
        'VALIDATION_ERROR',
      );
      await expectCode(
        service.createService(T1, { ...serviceInput(), priceCents: -1 }),
        'VALIDATION_ERROR',
      );
      await expectCode(
        service.createService(T1, { ...serviceInput(), durationMinutes: 0 }),
        'VALIDATION_ERROR',
      );
      await expectCode(
        service.createSpecialist(T1, { name: '  ' }),
        'VALIDATION_ERROR',
      );
      expect(await service.listServices(T1)).toHaveLength(0);
      expect(await service.listSpecialists(T1)).toHaveLength(0);
    });

    it('rejects a duplicate tenant-scoped service name with CONFLICT', async () => {
      await service.createService(T1, serviceInput());
      await expectCode(service.createService(T1, serviceInput()), 'CONFLICT');
      // same name allowed in another tenant
      const other = await service.createService(T2, serviceInput());
      expect(other.tenantId).toBe(T2);
    });
  });
});