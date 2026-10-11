import { Test } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { ServicesService } from './services.service';
import { CreateServiceInput } from './services.types';

interface FakeSpecialistRef {
  id: string;
  name: string;
}

interface FakeAssignment {
  specialist: FakeSpecialistRef;
}

interface FakeService {
  id: string;
  tenantId: string;
  name: string;
  description: string | null;
  durationMinutes: number;
  bufferMinutes: number;
  category: string | null;
  priceCents: number;
  currency: string;
  active: boolean;
  assignments: FakeAssignment[];
}

const seededService: FakeService = {
  id: 's1',
  tenantId: 't1',
  name: 'Corte',
  description: null,
  durationMinutes: 30,
  bufferMinutes: 0,
  category: 'Peluquería',
  priceCents: 2500,
  currency: 'EUR',
  active: true,
  assignments: [{ specialist: { id: 'sp1', name: 'Ana' } }],
};

const fakeClient = {
  businessProfile: {
    findUnique: vi.fn(
      async (args: { where: { slug: string } }): Promise<{ tenantId: string } | null> =>
        args.where.slug === 'estudio-ana' ? { tenantId: 't1' } : null,
    ),
  },
  service: {
    findMany: vi.fn(async (): Promise<FakeService[]> => [seededService]),
    findUnique: vi.fn(async (args: { where: { id: string } }): Promise<FakeService | null> =>
      args.where.id === 's1' ? seededService : null,
    ),
    create: vi.fn(
      async (args: { data: Omit<FakeService, 'id' | 'assignments'> }): Promise<FakeService> => ({
        ...args.data,
        id: 's2',
        assignments: [],
      }),
    ),
    update: vi.fn(
      async (args: {
        where: { id: string };
        data: Partial<FakeService>;
      }): Promise<FakeService> => ({
        ...seededService,
        ...args.data,
      }),
    ),
    delete: vi.fn(async (): Promise<FakeService> => seededService),
  },
  specialistService: {
    deleteMany: vi.fn(async (): Promise<{ count: number }> => ({ count: 1 })),
  },
  $transaction: vi.fn(async (ops: Promise<unknown>[]): Promise<unknown[]> => Promise.all(ops)),
};

describe('ServicesService (unit, 004-services-specialists-availability)', () => {
  let service: ServicesService;

  beforeEach(async () => {
    vi.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        ServicesService,
        { provide: PrismaService, useValue: { client: fakeClient } as unknown as PrismaService },
      ],
    }).compile();
    service = moduleRef.get(ServicesService);
  });

  it('lists services scoped by tenantSlug with a mapped specialist ref', async () => {
    const result = await service.findServices({ tenantSlug: 'estudio-ana' });
    expect(result).toHaveLength(1);
    expect(result[0]?.name).toBe('Corte');
    expect(result[0]?.specialists).toEqual([{ id: 'sp1', name: 'Ana' }]);
    expect(fakeClient.businessProfile.findUnique).toHaveBeenCalledWith({
      where: { slug: 'estudio-ana' },
      select: { tenantId: true },
    });
  });

  it('returns an empty list for an unknown tenantSlug', async () => {
    const result = await service.findServices({ tenantSlug: 'no-existe' });
    expect(result).toEqual([]);
  });

  it('passes category and duration filters to the store', async () => {
    await service.findServices({
      tenantId: 't1',
      category: 'Peluquería',
      minDuration: 20,
      maxDuration: 60,
    });
    expect(fakeClient.service.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          tenantId: 't1',
          category: 'Peluquería',
          durationMinutes: { gte: 20, lte: 60 },
        },
      }),
    );
  });

  it('resolves a service by id and returns null when missing', async () => {
    const found = await service.findService('s1');
    const missing = await service.findService('no-ida');
    expect(found?.name).toBe('Corte');
    expect(missing).toBeNull();
  });

  it('creates a service for the resolved tenant', async () => {
    const input: CreateServiceInput = {
      tenantSlug: 'estudio-ana',
      name: 'Tinte',
      durationMinutes: 60,
      priceCents: 4500,
    };
    const created = await service.createService(input);
    expect(created.id).toBe('s2');
    expect(fakeClient.service.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ tenantId: 't1', name: 'Tinte' }),
      }),
    );
  });

  it('rejects invalid catalog values with VALIDATION_ERROR before writing', async () => {
    await expect(
      service.createService({
        tenantSlug: 'estudio-ana',
        name: 'X',
        durationMinutes: 0,
        priceCents: 100,
      }),
    ).rejects.toMatchObject({ extensions: { code: 'VALIDATION_ERROR' } });
    expect(fakeClient.service.create).not.toHaveBeenCalled();
  });

  it('rejects creating a service for an unknown tenant with NOT_FOUND', async () => {
    await expect(
      service.createService({
        tenantSlug: 'no-existe',
        name: 'X',
        durationMinutes: 30,
        priceCents: 100,
      }),
    ).rejects.toMatchObject({ extensions: { code: 'NOT_FOUND' } });
  });

  it('updates a service and rejects missing ids', async () => {
    const updated = await service.updateService('s1', { durationMinutes: 45 });
    expect(updated.durationMinutes).toBe(45);

    await expect(service.updateService('no-ida', { name: 'X' })).rejects.toMatchObject({
      extensions: { code: 'NOT_FOUND' },
    });
  });

  it('removes a service cleaning its assignments transactionally', async () => {
    const removed = await service.removeService('s1');
    expect(removed).toBe(true);
    expect(fakeClient.specialistService.deleteMany).toHaveBeenCalledWith({
      where: { serviceId: 's1' },
    });
    expect(fakeClient.service.delete).toHaveBeenCalled();

    await expect(service.removeService('no-ida')).rejects.toMatchObject({
      extensions: { code: 'NOT_FOUND' },
    });
  });
});
