import { Test } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { AvailabilityService } from './availability.service';
import { CreateAvailabilityInput } from './availability.types';

interface FakeAvailability {
  id: string;
  tenantId: string;
  specialistId: string | null;
  weekday: number;
  startTime: string;
  endTime: string;
  slotGranularityMinutes: number;
  minLeadTimeMinutes: number;
  bookingHorizonDays: number;
  breaks: unknown;
}

const seededAvailability: FakeAvailability = {
  id: 'a1',
  tenantId: 't1',
  specialistId: null,
  weekday: 1,
  startTime: '09:00',
  endTime: '17:00',
  slotGranularityMinutes: 30,
  minLeadTimeMinutes: 0,
  bookingHorizonDays: 60,
  breaks: null,
};

const fakeClient = {
  businessProfile: {
    findUnique: vi.fn(
      async (args: { where: { slug: string } }): Promise<{ tenantId: string } | null> =>
        args.where.slug === 'estudio-ana' ? { tenantId: 't1' } : null,
    ),
  },
  availability: {
    findMany: vi.fn(async (): Promise<FakeAvailability[]> => [seededAvailability]),
    findUnique: vi.fn(async (args: { where: { id: string } }): Promise<FakeAvailability | null> =>
      args.where.id === 'a1' ? seededAvailability : null,
    ),
    create: vi.fn(
      async (args: { data: Omit<FakeAvailability, 'id'> }): Promise<FakeAvailability> => ({
        ...args.data,
        id: 'a2',
      }),
    ),
    update: vi.fn(
      async (args: {
        where: { id: string };
        data: Partial<FakeAvailability>;
      }): Promise<FakeAvailability> => ({
        ...seededAvailability,
        ...args.data,
      }),
    ),
    deleteMany: vi.fn(async (): Promise<{ count: number }> => ({ count: 1 })),
  },
};

describe('AvailabilityService (unit, 004-services-specialists-availability)', () => {
  let service: AvailabilityService;

  beforeEach(async () => {
    vi.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        AvailabilityService,
        { provide: PrismaService, useValue: { client: fakeClient } as unknown as PrismaService },
      ],
    }).compile();
    service = moduleRef.get(AvailabilityService);
  });

  it('returns business-wide entries scoped by tenantSlug and [] for unknown slug', async () => {
    const all = await service.findAvailability({ tenantSlug: 'estudio-ana' });
    const none = await service.findAvailability({ tenantSlug: 'no-existe' });
    expect(all).toHaveLength(1);
    expect(all[0]?.startTime).toBe('09:00');
    expect(none).toEqual([]);
  });

  it('scopes reads by specialist adding a business-wide OR filter', async () => {
    await service.findAvailability({ tenantId: 't1' }, 'sp1');
    expect(fakeClient.availability.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: [{ specialistId: null }, { specialistId: 'sp1' }],
        }),
      }),
    );
  });

  it('creates an availability entry for the resolved tenant', async () => {
    const input: CreateAvailabilityInput = {
      tenantSlug: 'estudio-ana',
      weekday: 2,
      startTime: '10:00',
      endTime: '14:00',
    };
    const created = await service.createAvailability(input);
    expect(created.id).toBe('a2');
    expect(fakeClient.availability.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ tenantId: 't1', weekday: 2 }),
      }),
    );
  });

  it('parses a breaks JSON payload on create', async () => {
    await service.createAvailability({
      tenantSlug: 'estudio-ana',
      weekday: 1,
      startTime: '09:00',
      endTime: '17:00',
      breaks: '["12:00","12:30"]',
    });
    const call = vi.mocked(fakeClient.availability.create).mock.calls[0]?.[0];
    expect(call).toBeDefined();
    expect(call?.data.breaks).toEqual(['12:00', '12:30']);
  });

  it('rejects invalid ranges and malformed JSON', async () => {
    await expect(
      service.createAvailability({
        tenantSlug: 'estudio-ana',
        weekday: 7,
        startTime: '09:00',
        endTime: '17:00',
      }),
    ).rejects.toMatchObject({ extensions: { code: 'VALIDATION_ERROR' } });
    await expect(
      service.createAvailability({
        tenantSlug: 'estudio-ana',
        weekday: 1,
        startTime: '17:00',
        endTime: '09:00',
      }),
    ).rejects.toMatchObject({ extensions: { code: 'VALIDATION_ERROR' } });
    await expect(
      service.createAvailability({
        tenantSlug: 'estudio-ana',
        weekday: 1,
        startTime: '09:00',
        endTime: '17:00',
        breaks: '{broken',
      }),
    ).rejects.toMatchObject({ extensions: { code: 'VALIDATION_ERROR' } });
    expect(fakeClient.availability.create).not.toHaveBeenCalled();
  });

  it('rejects creating for an unknown tenant with NOT_FOUND', async () => {
    await expect(
      service.createAvailability({
        tenantSlug: 'no-existe',
        weekday: 1,
        startTime: '09:00',
        endTime: '17:00',
      }),
    ).rejects.toMatchObject({ extensions: { code: 'NOT_FOUND' } });
  });

  it('updates an availability entry and rejects missing ids', async () => {
    const updated = await service.updateAvailability('a1', { endTime: '18:00' });
    expect(updated.endTime).toBe('18:00');
    await expect(service.updateAvailability('no-ida', { weekday: 3 })).rejects.toMatchObject({
      extensions: { code: 'NOT_FOUND' },
    });
  });

  it('removes an availability entry and rejects absent rows', async () => {
    expect(await service.removeAvailability('a1')).toBe(true);

    fakeClient.availability.deleteMany.mockResolvedValueOnce({ count: 0 });
    await expect(service.removeAvailability('no-ida')).rejects.toMatchObject({
      extensions: { code: 'NOT_FOUND' },
    });
  });
});
