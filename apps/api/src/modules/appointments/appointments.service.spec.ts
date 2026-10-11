import { Test } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { AppointmentsService } from './appointments.service';
import { AppointmentStatus, CreateAppointmentInput } from './appointments.types';

interface FakeAppointment {
  id: string;
  tenantId: string;
  specialistId: string;
  serviceId: string;
  clientName: string;
  clientContact: string | null;
  startAt: Date;
  endAt: Date;
  status: string;
  appliedDurationMinutes: number;
  appliedAmountCents: number;
  appliedCurrency: string;
  origin: string;
  notes: string | null;
  cancellationReason: string | null;
  service: {
    id: string;
    name: string;
    durationMinutes: number;
    priceCents: number;
    currency: string;
  };
  specialist: { id: string; name: string };
}

const seededAppointment: FakeAppointment = {
  id: 'apt1',
  tenantId: 't1',
  specialistId: 'sp1',
  serviceId: 's1',
  clientName: 'María',
  clientContact: null,
  startAt: new Date('2026-10-12T10:00:00Z'),
  endAt: new Date('2026-10-12T10:30:00Z'),
  status: 'PENDING',
  appliedDurationMinutes: 30,
  appliedAmountCents: 2500,
  appliedCurrency: 'EUR',
  origin: 'online',
  notes: null,
  cancellationReason: null,
  service: {
    id: 's1',
    name: 'Corte',
    durationMinutes: 30,
    priceCents: 2500,
    currency: 'EUR',
  },
  specialist: { id: 'sp1', name: 'Ana' },
};

const fakeClient = {
  businessProfile: {
    findUnique: vi.fn(
      async (args: { where: { slug: string } }): Promise<{ tenantId: string } | null> =>
        args.where.slug === 'estudio-ana' ? { tenantId: 't1' } : null,
    ),
  },
  service: {
    findUnique: vi.fn(
      async (args: {
        where: { id: string };
      }): Promise<{
        id: string;
        tenantId: string;
        durationMinutes: number;
        priceCents: number;
        currency: string;
      } | null> =>
        args.where.id === 's1'
          ? { id: 's1', tenantId: 't1', durationMinutes: 30, priceCents: 2500, currency: 'EUR' }
          : null,
    ),
  },
  specialist: {
    findUnique: vi.fn(
      async (args: { where: { id: string } }): Promise<{ id: string; tenantId: string } | null> =>
        args.where.id === 'sp1' ? { id: 'sp1', tenantId: 't1' } : null,
    ),
  },
  appointment: {
    findMany: vi.fn(async (): Promise<unknown[]> => []),
    findUnique: vi.fn(
      async (args: {
        where: { id: string };
      }): Promise<FakeAppointment | { id: string; status: string } | null> =>
        args.where.id === 'apt1' ? seededAppointment : null,
    ),
    create: vi.fn(async (args: { data: FakeAppointment }): Promise<FakeAppointment> => ({
      ...args.data,
      id: 'apt2',
      cancellationReason: null,
      service: {
        id: args.data.serviceId,
        name: 'Corte',
        durationMinutes: args.data.appliedDurationMinutes,
        priceCents: args.data.appliedAmountCents,
        currency: args.data.appliedCurrency,
      },
      specialist: { id: args.data.specialistId, name: 'Ana' },
    })),
    update: vi.fn(
      async (args: {
        where: { id: string };
        data: Partial<FakeAppointment>;
      }): Promise<FakeAppointment> => ({
        ...seededAppointment,
        ...args.data,
      }),
    ),
  },
};

describe('AppointmentsService (unit, 005-appointments)', () => {
  let service: AppointmentsService;

  beforeEach(async () => {
    vi.clearAllMocks();
    fakeClient.service.findUnique.mockReset();
    fakeClient.service.findUnique.mockImplementation(
      async (args: {
        where: { id: string };
      }): Promise<{
        id: string;
        tenantId: string;
        durationMinutes: number;
        priceCents: number;
        currency: string;
      } | null> =>
        args.where.id === 's1'
          ? { id: 's1', tenantId: 't1', durationMinutes: 30, priceCents: 2500, currency: 'EUR' }
          : null,
    );
    fakeClient.specialist.findUnique.mockReset();
    fakeClient.specialist.findUnique.mockImplementation(
      async (args: { where: { id: string } }): Promise<{ id: string; tenantId: string } | null> =>
        args.where.id === 'sp1' ? { id: 'sp1', tenantId: 't1' } : null,
    );
    fakeClient.appointment.findMany.mockReset();
    fakeClient.appointment.findMany.mockImplementation(async (): Promise<unknown[]> => []);
    fakeClient.appointment.findUnique.mockReset();
    fakeClient.appointment.findUnique.mockImplementation(
      async (args: {
        where: { id: string };
      }): Promise<FakeAppointment | { id: string; status: string } | null> =>
        args.where.id === 'apt1' ? seededAppointment : null,
    );
    const moduleRef = await Test.createTestingModule({
      providers: [
        AppointmentsService,
        { provide: PrismaService, useValue: { client: fakeClient } as unknown as PrismaService },
      ],
    }).compile();
    service = moduleRef.get(AppointmentsService);
  });

  it('lists appointments with tenant, date, specialist and status filters', async () => {
    fakeClient.appointment.findMany.mockResolvedValueOnce([seededAppointment]);
    const result = await service.findAppointments({
      tenantSlug: 'estudio-ana',
      startDate: '2026-10-12T00:00:00Z',
      endDate: '2026-10-12T23:59:59Z',
      specialistId: 'sp1',
      status: 'pending',
    });
    expect(result[0]?.status).toBe('PENDING');
    expect(result[0]?.service.name).toBe('Corte');
    expect(fakeClient.appointment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          tenantId: 't1',
          specialistId: 'sp1',
          status: 'PENDING',
          startAt: expect.objectContaining({ gte: expect.any(Date), lte: expect.any(Date) }),
        }),
      }),
    );
  });

  it('returns [] for an unknown tenantSlug', async () => {
    expect(await service.findAppointments({ tenantSlug: 'no-existe' })).toEqual([]);
    expect(fakeClient.appointment.findMany).not.toHaveBeenCalled();
  });

  it('resolves an appointment by id and returns null when missing', async () => {
    const found = await service.findAppointment('apt1');
    const missing = await service.findAppointment('no-ida');
    expect(found?.clientName).toBe('María');
    expect(missing).toBeNull();
  });

  it('creates an appointment with the service snapshot and origin default', async () => {
    const input: CreateAppointmentInput = {
      tenantSlug: 'estudio-ana',
      serviceId: 's1',
      specialistId: 'sp1',
      clientName: 'María',
      startAt: '2026-10-13T10:00:00Z',
      endAt: '2026-10-13T10:30:00Z',
    };
    const created = await service.createAppointment(input);
    expect(created.id).toBe('apt2');
    expect(created.status).toBe('PENDING');
    expect(created.appliedAmountCents).toBe(2500);
    expect(created.appliedDurationMinutes).toBe(30);
    expect(created.origin).toBe('online');
    expect(fakeClient.appointment.create).toHaveBeenCalled();
  });

  it('rejects an overlapping appointment with CONFLICT', async () => {
    fakeClient.appointment.findMany.mockResolvedValueOnce([{ id: 'apt-x' }]);
    const input: CreateAppointmentInput = {
      tenantSlug: 'estudio-ana',
      serviceId: 's1',
      specialistId: 'sp1',
      clientName: 'María',
      startAt: '2026-10-12T10:00:00Z',
      endAt: '2026-10-12T10:30:00Z',
    };
    await expect(service.createAppointment(input)).rejects.toMatchObject({
      extensions: { code: 'CONFLICT' },
    });
    expect(fakeClient.appointment.create).not.toHaveBeenCalled();
  });

  it('rejects missing or cross-tenant service/specialist with NOT_FOUND', async () => {
    const base = {
      tenantSlug: 'estudio-ana',
      serviceId: 's1',
      specialistId: 'sp1',
      clientName: 'María',
      startAt: '2026-10-13T10:00:00Z',
      endAt: '2026-10-13T10:30:00Z',
    };
    await expect(service.createAppointment({ ...base, serviceId: 'no-srv' })).rejects.toMatchObject(
      { extensions: { code: 'NOT_FOUND' } },
    );

    fakeClient.service.findUnique.mockResolvedValueOnce({
      id: 's9',
      tenantId: 't2',
      durationMinutes: 30,
      priceCents: 100,
      currency: 'EUR',
    });
    await expect(service.createAppointment({ ...base, serviceId: 's9' })).rejects.toMatchObject({
      extensions: { code: 'NOT_FOUND' },
    });

    await expect(
      service.createAppointment({ ...base, specialistId: 'no-sp' }),
    ).rejects.toMatchObject({ extensions: { code: 'NOT_FOUND' } });
  });

  it('rejects invalid ranges and missing client name with VALIDATION_ERROR', async () => {
    await expect(
      service.createAppointment({
        tenantSlug: 'estudio-ana',
        serviceId: 's1',
        specialistId: 'sp1',
        clientName: 'María',
        startAt: '2026-10-13T10:30:00Z',
        endAt: '2026-10-13T10:00:00Z',
      }),
    ).rejects.toMatchObject({ extensions: { code: 'VALIDATION_ERROR' } });
    await expect(
      service.createAppointment({
        tenantSlug: 'estudio-ana',
        serviceId: 's1',
        specialistId: 'sp1',
        clientName: '  ',
        startAt: '2026-10-13T10:00:00Z',
        endAt: '2026-10-13T10:30:00Z',
      }),
    ).rejects.toMatchObject({ extensions: { code: 'VALIDATION_ERROR' } });
    expect(fakeClient.appointment.create).not.toHaveBeenCalled();
  });

  it('updates the status following the allowed-transitions map', async () => {
    fakeClient.appointment.findUnique.mockResolvedValueOnce({
      id: 'apt1',
      status: 'PENDING',
    });
    const updated = await service.updateAppointmentStatus('apt1', AppointmentStatus.CONFIRMED);
    expect(updated.status).toBe('CONFIRMED');
    expect(fakeClient.appointment.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: 'CONFIRMED' } }),
    );
  });

  it('rejects invalid and disallowed status changes with VALIDATION_ERROR', async () => {
    await expect(service.updateAppointmentStatus('apt1', 'BOGUS')).rejects.toMatchObject({
      extensions: { code: 'VALIDATION_ERROR' },
    });

    fakeClient.appointment.findUnique.mockResolvedValueOnce({
      id: 'apt1',
      status: 'CANCELLED',
    });
    await expect(
      service.updateAppointmentStatus('apt1', AppointmentStatus.CONFIRMED),
    ).rejects.toMatchObject({ extensions: { code: 'VALIDATION_ERROR' } });
  });

  it('rejects status updates for a missing appointment with NOT_FOUND', async () => {
    await expect(
      service.updateAppointmentStatus('no-ida', AppointmentStatus.CONFIRMED),
    ).rejects.toMatchObject({ extensions: { code: 'NOT_FOUND' } });
  });

  it('cancels with and without a reason', async () => {
    fakeClient.appointment.findUnique.mockResolvedValueOnce({
      id: 'apt1',
      status: 'PENDING',
    });
    const withReason = await service.cancelAppointment('apt1', 'Cliente canceló');
    expect(withReason.status).toBe('CANCELLED');
    expect(fakeClient.appointment.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { status: 'CANCELLED', cancellationReason: 'Cliente canceló' },
      }),
    );

    fakeClient.appointment.findUnique.mockResolvedValueOnce({
      id: 'apt1',
      status: 'PENDING',
    });
    const withoutReason = await service.cancelAppointment('apt1');
    expect(withoutReason.cancellationReason).toBeNull();
  });

  it('rejects cancellation of non-cancellable or missing appointments', async () => {
    fakeClient.appointment.findUnique.mockResolvedValueOnce({
      id: 'apt1',
      status: 'COMPLETED',
    });
    await expect(service.cancelAppointment('apt1', 'porque sí')).rejects.toMatchObject({
      extensions: { code: 'VALIDATION_ERROR' },
    });

    await expect(service.cancelAppointment('no-ida')).rejects.toMatchObject({
      extensions: { code: 'NOT_FOUND' },
    });
  });
});
