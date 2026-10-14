import { Test } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { SubscriptionService } from '../subscription/subscription.service';
import { createMemorySubscriptionStore } from '../subscription/subscription.test-store';
import { SubscriptionPlan, SubscriptionStatus } from '../subscription/subscription.types';
import { SpecialistsService } from './specialists.service';
import { CreateSpecialistInput } from './specialists.types';

interface FakeServiceRef {
  id: string;
  name: string;
}

interface FakeAssignment {
  service: FakeServiceRef;
}

interface FakeSpecialist {
  id: string;
  tenantId: string;
  name: string;
  role: string | null;
  avatar: string | null;
  bio: string | null;
  active: boolean;
  assignments: FakeAssignment[];
}

const seededSpecialist: FakeSpecialist = {
  id: 'sp1',
  tenantId: 't1',
  name: 'Ana',
  role: 'Estilista',
  avatar: null,
  bio: '10 años de experiencia',
  active: true,
  assignments: [{ service: { id: 's1', name: 'Corte' } }],
};

const fakeClient = {
  businessProfile: {
    findUnique: vi.fn(
      async (args: { where: { slug: string } }): Promise<{ tenantId: string } | null> =>
        args.where.slug === 'estudio-ana' ? { tenantId: 't1' } : null,
    ),
  },
  specialist: {
    findMany: vi.fn(async (): Promise<FakeSpecialist[]> => [seededSpecialist]),
    findUnique: vi.fn(async (args: { where: { id: string } }): Promise<FakeSpecialist | null> => {
      if (args.where.id === 'sp1') return seededSpecialist;
      if (args.where.id === 'sp3') {
        return { ...seededSpecialist, id: 'sp3', name: 'Rona', active: false };
      }
      return null;
    }),
    create: vi.fn(
      async (args: {
        data: Omit<FakeSpecialist, 'id' | 'assignments'>;
      }): Promise<FakeSpecialist> => ({
        ...args.data,
        id: 'sp2',
        assignments: [],
      }),
    ),
    update: vi.fn(
      async (args: {
        where: { id: string };
        data: Partial<FakeSpecialist>;
      }): Promise<FakeSpecialist> => ({
        ...seededSpecialist,
        ...args.data,
      }),
    ),
    delete: vi.fn(async (): Promise<FakeSpecialist> => seededSpecialist),
  },
  service: {
    findUnique: vi.fn(
      async (args: { where: { id: string } }): Promise<{ id: string; tenantId: string } | null> =>
        args.where.id === 's1' ? { id: 's1', tenantId: 't1' } : null,
    ),
  },
  specialistService: {
    findMany: vi.fn(async (): Promise<{ specialist: FakeSpecialist }[]> => [
      { specialist: seededSpecialist },
    ]),
    create: vi.fn(async (): Promise<{ specialistId: string } | never> => {
      throw new Error('not implemented');
    }),
    deleteMany: vi.fn(async (): Promise<{ count: number }> => ({ count: 1 })),
  },
  $transaction: vi.fn(async (ops: Promise<unknown>[]): Promise<unknown[]> => Promise.all(ops)),
};

describe('SpecialistsService (unit, 004-services-specialists-availability)', () => {
  let service: SpecialistsService;
  let subscriptionStore: ReturnType<typeof createMemorySubscriptionStore>;

  beforeEach(async () => {
    vi.clearAllMocks();
    fakeClient.specialistService.create.mockResolvedValue({ specialistId: 'sp1' });
    fakeClient.specialistService.deleteMany.mockResolvedValue({ count: 1 });
    subscriptionStore = createMemorySubscriptionStore();
    const moduleRef = await Test.createTestingModule({
      providers: [
        SpecialistsService,
        { provide: PrismaService, useValue: { client: fakeClient } as unknown as PrismaService },
        { provide: SubscriptionService, useValue: new SubscriptionService(subscriptionStore) },
      ],
    }).compile();
    service = moduleRef.get(SpecialistsService);
  });

  it('lists specialists scoped by tenantSlug and returns [] for unknown slug', async () => {
    const all = await service.findSpecialists({ tenantSlug: 'estudio-ana' });
    const none = await service.findSpecialists({ tenantSlug: 'no-existe' });
    expect(all).toHaveLength(1);
    expect(all[0]?.name).toBe('Ana');
    expect(all[0]?.services).toEqual([{ id: 's1', name: 'Corte' }]);
    expect(none).toEqual([]);
  });

  it('resolves a specialist detail and null when missing', async () => {
    const found = await service.findSpecialist('sp1');
    const missing = await service.findSpecialist('no-ida');
    expect(found?.role).toBe('Estilista');
    expect(missing).toBeNull();
  });

  it('lists the specialists performing a service (reverse read)', async () => {
    const result = await service.serviceSpecialists('s1');
    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe('sp1');
  });

  it('creates a specialist for the resolved tenant', async () => {
    const input: CreateSpecialistInput = {
      tenantSlug: 'estudio-ana',
      name: 'Rona',
      role: 'Piercer',
    };
    const created = await service.createSpecialist(input);
    expect(created.id).toBe('sp2');
    expect(fakeClient.specialist.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ tenantId: 't1', name: 'Rona' }),
      }),
    );
  });

  it('rejects invalid or unscoped creation', async () => {
    await expect(
      service.createSpecialist({ tenantSlug: 'estudio-ana', name: '  ' }),
    ).rejects.toMatchObject({ extensions: { code: 'VALIDATION_ERROR' } });
    await expect(
      service.createSpecialist({ tenantSlug: 'no-existe', name: 'X' }),
    ).rejects.toMatchObject({ extensions: { code: 'NOT_FOUND' } });
  });

  it('updates a specialist and rejects missing ids', async () => {
    const updated = await service.updateSpecialist('sp1', { bio: '11 años' });
    expect(updated.bio).toBe('11 años');
    await expect(service.updateSpecialist('no-ida', { name: 'X' })).rejects.toMatchObject({
      extensions: { code: 'NOT_FOUND' },
    });
  });

  it('removes a specialist cleaning assignments transactionally', async () => {
    expect(await service.removeSpecialist('sp1')).toBe(true);
    expect(fakeClient.specialistService.deleteMany).toHaveBeenCalledWith({
      where: { specialistId: 'sp1' },
    });
    await expect(service.removeSpecialist('no-ida')).rejects.toMatchObject({
      extensions: { code: 'NOT_FOUND' },
    });
  });

  it('assigns a service to a specialist and rejects duplicates', async () => {
    const result = await service.assignServiceToSpecialist('sp1', 's1');
    expect(result.id).toBe('sp1');

    fakeClient.specialistService.create.mockRejectedValueOnce(
      Object.assign(new Error('Unique constraint failed'), { code: 'P2002' }),
    );
    await expect(service.assignServiceToSpecialist('sp1', 's1')).rejects.toMatchObject({
      extensions: { code: 'CONFLICT' },
    });
  });

  it('rejects assignment to a missing or cross-tenant service', async () => {
    await expect(service.assignServiceToSpecialist('sp1', 'no-ida')).rejects.toMatchObject({
      extensions: { code: 'NOT_FOUND' },
    });
  });

  it('unassigns a service and rejects absent assignments', async () => {
    fakeClient.specialistService.deleteMany.mockResolvedValueOnce({ count: 0 });
    await expect(service.unassignServiceFromSpecialist('sp1', 's1')).rejects.toMatchObject({
      extensions: { code: 'NOT_FOUND' },
    });

    fakeClient.specialistService.deleteMany.mockResolvedValueOnce({ count: 1 });
    const result = await service.unassignServiceFromSpecialist('sp1', 's1');
    expect(result.id).toBe('sp1');
  });

  describe('Free plan limits (017-subscription-plans)', () => {
    it('blocks a second active specialist on Free before writing', async () => {
      subscriptionStore.seedSpecialist('t1', true);
      await expect(
        service.createSpecialist({ tenantSlug: 'estudio-ana', name: 'Rona' }),
      ).rejects.toMatchObject({ extensions: { code: 'PLAN_LIMIT_REACHED' } });
      expect(fakeClient.specialist.create).not.toHaveBeenCalled();
    });

    it('allows an inactive specialist on Free', async () => {
      subscriptionStore.seedSpecialist('t1', true);
      const created = await service.createSpecialist({
        tenantSlug: 'estudio-ana',
        name: 'Rona',
        active: false,
      });
      expect(created.id).toBe('sp2');
    });

    it('allows an active specialist on an effective Pro plan', async () => {
      subscriptionStore.seedTenant({
        tenantId: 't1',
        plan: SubscriptionPlan.PRO,
        status: SubscriptionStatus.active,
        expiresAt: null,
      });
      subscriptionStore.seedSpecialist('t1', true);
      const created = await service.createSpecialist({
        tenantSlug: 'estudio-ana',
        name: 'Rona',
      });
      expect(created.id).toBe('sp2');
    });

    it('blocks activating a second specialist on Free', async () => {
      subscriptionStore.seedSpecialist('t1', true);
      await expect(service.updateSpecialist('sp3', { active: true })).rejects.toMatchObject({
        extensions: { code: 'PLAN_LIMIT_REACHED' },
      });
    });
  });
});
