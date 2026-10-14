import { Test } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { AppointmentsService } from './appointments.service';
import { AppointmentStatus, CreateAppointmentInput } from './appointments.types';

interface FakeNotification {
  id: string;
  kind: string;
  message: string;
  channel: string;
  createdAt: Date;
}

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
  paymentMethodType: string | null;
  advanceAmountCents: number | null;
  paymentReference: string | null;
  paymentProofUrl: string | null;
  paymentSubmittedAt: Date | null;
  service: {
    id: string;
    name: string;
    durationMinutes: number;
    priceCents: number;
    currency: string;
  };
  specialist: { id: string; name: string };
  notifications: FakeNotification[];
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
  paymentMethodType: null,
  advanceAmountCents: null,
  paymentReference: null,
  paymentProofUrl: null,
  paymentSubmittedAt: null,
  service: {
    id: 's1',
    name: 'Corte',
    durationMinutes: 30,
    priceCents: 2500,
    currency: 'EUR',
  },
  specialist: { id: 'sp1', name: 'Ana' },
  notifications: [],
};

function serviceRow(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 's1',
    tenantId: 't1',
    durationMinutes: 30,
    priceCents: 2500,
    currency: 'EUR',
    requiresAdvance: false,
    advanceKind: null,
    advanceValue: null,
    ...overrides,
  };
}

const fakeClient = {
  businessProfile: {
    findUnique: vi.fn(
      async (args: { where: { slug: string } }): Promise<{ tenantId: string } | null> =>
        args.where.slug === 'estudio-ana' ? { tenantId: 't1' } : null,
    ),
  },
  service: {
    findUnique: vi.fn(async (args: { where: { id: string } }): Promise<unknown> => {
      void args;
      return serviceRow();
    }),
  },
  specialist: {
    findUnique: vi.fn(
      async (args: { where: { id: string } }): Promise<{ id: string; tenantId: string } | null> =>
        args.where.id === 'sp1' ? { id: 'sp1', tenantId: 't1' } : null,
    ),
  },
  paymentMethod: {
    findFirst: vi.fn(async (): Promise<{ id: string } | null> => null),
  },
  appointment: {
    findMany: vi.fn(async (): Promise<unknown[]> => []),
    findUnique: vi.fn(
      async (args: { where: { id: string } }): Promise<FakeAppointment | null> =>
        args.where.id === 'apt1' ? seededAppointment : null,
    ),
    findFirst: vi.fn(
      async (args: { select?: unknown; include?: unknown }): Promise<unknown> => {
        if (args.select && !args.include) {
          return { id: 'apt1', status: 'PENDING', appliedDurationMinutes: 30, specialistId: 'sp1' };
        }
        return seededAppointment;
      },
    ),
    create: vi.fn(async (args: { data: Record<string, unknown> }): Promise<FakeAppointment> => ({
      ...seededAppointment,
      ...(args.data as Partial<FakeAppointment>),
      id: 'apt2',
      service: {
        id: String(args.data.serviceId),
        name: 'Corte',
        durationMinutes: Number(args.data.appliedDurationMinutes),
        priceCents: Number(args.data.appliedAmountCents),
        currency: String(args.data.appliedCurrency),
      },
      specialist: { id: String(args.data.specialistId), name: 'Ana' },
      notifications: [],
    })),
    update: vi.fn(
      async (args: { where: { id: string }; data: Partial<FakeAppointment> }): Promise<FakeAppointment> => {
        Object.assign(seededAppointment, args.data);
        return seededAppointment;
      },
    ),
  },
  appointmentNotification: {
    create: vi.fn(async (): Promise<unknown> => ({})),
  },
};

const USER = { tenantId: 't1' };

const baseInput = (overrides: Partial<CreateAppointmentInput> = {}): CreateAppointmentInput => ({
  tenantSlug: 'estudio-ana',
  serviceId: 's1',
  specialistId: 'sp1',
  clientName: 'María',
  startAt: '2026-10-13T10:00:00Z',
  endAt: '2026-10-13T10:30:00Z',
  ...overrides,
});

describe('AppointmentsService (unit, 005-appointments + 016-advance-payments)', () => {
  let service: AppointmentsService;

  beforeEach(async () => {
    vi.clearAllMocks();
    seededAppointment.status = 'PENDING';
    seededAppointment.cancellationReason = null;
    seededAppointment.notifications = [];
    fakeClient.service.findUnique.mockImplementation(
      async (args: { where: { id: string } }): Promise<unknown> =>
        args.where.id === 's1' ? serviceRow() : null,
    );
    fakeClient.specialist.findUnique.mockImplementation(
      async (args: { where: { id: string } }): Promise<{ id: string; tenantId: string } | null> =>
        args.where.id === 'sp1' ? { id: 'sp1', tenantId: 't1' } : null,
    );
    fakeClient.paymentMethod.findFirst.mockImplementation(async () => null);
    fakeClient.appointment.findMany.mockImplementation(async () => []);
    fakeClient.appointment.findUnique.mockImplementation(
      async (args: { where: { id: string } }): Promise<FakeAppointment | null> =>
        args.where.id === 'apt1' ? seededAppointment : null,
    );
    fakeClient.appointment.findFirst.mockImplementation(
      async (args: { select?: unknown; include?: unknown }): Promise<unknown> => {
        if (args.select && !args.include) {
          return {
            id: seededAppointment.id,
            status: seededAppointment.status,
            appliedDurationMinutes: seededAppointment.appliedDurationMinutes,
            specialistId: seededAppointment.specialistId,
          };
        }
        return seededAppointment;
      },
    );
    const moduleRef = await Test.createTestingModule({
      providers: [
        AppointmentsService,
        { provide: PrismaService, useValue: { client: fakeClient } as unknown as PrismaService },
      ],
    }).compile();
    service = moduleRef.get(AppointmentsService);
  });

  it('lists appointments (public projection) with tenant/date/specialist/status filters', async () => {
    fakeClient.appointment.findMany.mockResolvedValueOnce([seededAppointment]);
    const result = await service.findAppointments({
      tenantSlug: 'estudio-ana',
      startDate: '2026-10-12T00:00:00Z',
      endDate: '2026-10-12T23:59:59Z',
      specialistId: 'sp1',
      status: 'pending',
    });
    expect(result[0]?.status).toBe('PENDING');
    expect(result[0]?.specialistId).toBe('sp1');
    expect(result[0]).not.toHaveProperty('clientName');
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

  it('resolves a public appointment by id (minimal) and null when missing', async () => {
    const found = await service.findAppointment('apt1');
    const missing = await service.findAppointment('no-ida');
    expect(found?.specialistId).toBe('sp1');
    expect(missing).toBeNull();
  });

  it('creates an appointment with the service snapshot and forces the online origin', async () => {
    const created = await service.createAppointment(baseInput());
    expect(created.id).toBe('apt2');
    expect(created.status).toBe('PENDING');
    expect(created.appliedAmountCents).toBe(2500);
    expect(created.origin).toBe('online');
    expect(fakeClient.appointment.create).toHaveBeenCalled();
  });

  it('rejects an overlapping appointment with CONFLICT', async () => {
    fakeClient.appointment.findMany.mockResolvedValueOnce([{ id: 'apt-x' }]);
    await expect(service.createAppointment(baseInput())).rejects.toMatchObject({
      extensions: { code: 'CONFLICT' },
    });
    expect(fakeClient.appointment.create).not.toHaveBeenCalled();
  });

  it('rejects missing or cross-tenant service/specialist with NOT_FOUND', async () => {
    await expect(service.createAppointment(baseInput({ serviceId: 'no-srv' }))).rejects.toMatchObject(
      { extensions: { code: 'NOT_FOUND' } },
    );
    fakeClient.service.findUnique.mockResolvedValueOnce(serviceRow({ id: 's9', tenantId: 't2' }));
    await expect(service.createAppointment(baseInput({ serviceId: 's9' }))).rejects.toMatchObject({
      extensions: { code: 'NOT_FOUND' },
    });
    await expect(
      service.createAppointment(baseInput({ specialistId: 'no-sp' })),
    ).rejects.toMatchObject({ extensions: { code: 'NOT_FOUND' } });
  });

  it('rejects invalid ranges and missing client name with VALIDATION_ERROR', async () => {
    await expect(
      service.createAppointment(baseInput({ startAt: '2026-10-13T10:30:00Z', endAt: '2026-10-13T10:00:00Z' })),
    ).rejects.toMatchObject({ extensions: { code: 'VALIDATION_ERROR' } });
    await expect(service.createAppointment(baseInput({ clientName: '  ' }))).rejects.toMatchObject({
      extensions: { code: 'VALIDATION_ERROR' },
    });
  });

  it('enforces the advance for an advance-required service (incomplete → VALIDATION_ERROR)', async () => {
    fakeClient.service.findUnique.mockResolvedValueOnce(
      serviceRow({ requiresAdvance: true, advanceKind: 'fixed', advanceValue: 1000 }),
    );
    await expect(service.createAppointment(baseInput())).rejects.toMatchObject({
      extensions: { code: 'VALIDATION_ERROR' },
    });
  });

  it('rejects an advance whose method is not active', async () => {
    fakeClient.service.findUnique.mockResolvedValueOnce(
      serviceRow({ requiresAdvance: true, advanceKind: 'fixed', advanceValue: 1000 }),
    );
    fakeClient.paymentMethod.findFirst.mockResolvedValueOnce(null);
    await expect(
      service.createAppointment(
        baseInput({
          paymentMethodType: 'pago_movil',
          advanceAmountCents: 1000,
          paymentReference: 'REF-1',
          paymentProofUrl: 'https://x.test/proof.png',
        }),
      ),
    ).rejects.toMatchObject({ extensions: { code: 'VALIDATION_ERROR' } });
  });

  it('rejects an advance whose amount does not match the rule', async () => {
    fakeClient.service.findUnique.mockResolvedValueOnce(
      serviceRow({ requiresAdvance: true, advanceKind: 'percent', advanceValue: 50 }),
    );
    fakeClient.paymentMethod.findFirst.mockResolvedValueOnce({ id: 'pm1' });
    await expect(
      service.createAppointment(
        baseInput({
          paymentMethodType: 'transfer',
          advanceAmountCents: 999,
          paymentReference: 'REF-1',
          paymentProofUrl: 'https://x.test/proof.png',
        }),
      ),
    ).rejects.toMatchObject({ extensions: { code: 'VALIDATION_ERROR' } });
  });

  it('persists a complete advance and keeps the appointment PENDING', async () => {
    fakeClient.service.findUnique.mockResolvedValueOnce(
      serviceRow({ requiresAdvance: true, advanceKind: 'percent', advanceValue: 50 }),
    );
    fakeClient.paymentMethod.findFirst.mockResolvedValueOnce({ id: 'pm1' });
    const created = await service.createAppointment(
      baseInput({
        paymentMethodType: 'pago_movil',
        advanceAmountCents: 1250,
        paymentReference: 'REF-1',
        paymentProofUrl: 'https://x.test/proof.png',
      }),
    );
    expect(created.status).toBe('PENDING');
    expect(created.paymentMethodType).toBe('pago_movil');
    expect(created.advanceAmountCents).toBe(1250);
    expect(created.paymentReference).toBe('REF-1');
  });

  it('ignores the payment payload for a service that does not require an advance', async () => {
    const created = await service.createAppointment(
      baseInput({
        paymentMethodType: 'binance',
        advanceAmountCents: 500,
        paymentReference: 'REF',
        paymentProofUrl: 'https://x.test/proof.png',
      }),
    );
    expect(created.paymentMethodType).toBeNull();
    expect(fakeClient.paymentMethod.findFirst).not.toHaveBeenCalled();
  });

  it('creates a manual (admin) appointment that is exempt from the advance', async () => {
    fakeClient.service.findUnique.mockResolvedValueOnce(
      serviceRow({ requiresAdvance: true, advanceKind: 'fixed', advanceValue: 1000 }),
    );
    const created = await service.createMyAppointment(USER, {
      serviceId: 's1',
      specialistId: 'sp1',
      clientName: 'María',
      startAt: '2026-10-13T10:00:00Z',
      endAt: '2026-10-13T10:30:00Z',
    });
    expect(created.origin).toBe('admin');
    expect(fakeClient.paymentMethod.findFirst).not.toHaveBeenCalled();
  });

  it('rejects a manual appointment without an authenticated tenant', async () => {
    await expect(
      service.createMyAppointment(undefined, {
        serviceId: 's1',
        specialistId: 'sp1',
        clientName: 'María',
        startAt: '2026-10-13T10:00:00Z',
        endAt: '2026-10-13T10:30:00Z',
      }),
    ).rejects.toMatchObject({ extensions: { code: 'UNAUTHENTICATED' } });
  });

  it('updates the status following the allowed-transitions map and records a notification', async () => {
    const updated = await service.updateAppointmentStatus(USER, 'apt1', AppointmentStatus.CONFIRMED);
    expect(updated.status).toBe('CONFIRMED');
    expect(fakeClient.appointmentNotification.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ appointmentId: 'apt1', kind: 'status_change' }),
      }),
    );
  });

  it('is idempotent when setting the current status (no notification)', async () => {
    fakeClient.appointment.findFirst.mockResolvedValueOnce({ id: 'apt1', status: 'CONFIRMED' });
    const updated = await service.updateAppointmentStatus(USER, 'apt1', AppointmentStatus.CONFIRMED);
    expect(updated.id).toBe('apt1');
    expect(fakeClient.appointmentNotification.create).not.toHaveBeenCalled();
    expect(fakeClient.appointment.update).not.toHaveBeenCalled();
  });

  it('rejects invalid and disallowed status changes with VALIDATION_ERROR', async () => {
    await expect(service.updateAppointmentStatus(USER, 'apt1', 'BOGUS')).rejects.toMatchObject({
      extensions: { code: 'VALIDATION_ERROR' },
    });
    fakeClient.appointment.findFirst.mockResolvedValueOnce({ id: 'apt1', status: 'CANCELLED' });
    await expect(
      service.updateAppointmentStatus(USER, 'apt1', AppointmentStatus.CONFIRMED),
    ).rejects.toMatchObject({ extensions: { code: 'VALIDATION_ERROR' } });
  });

  it('rejects status updates for a missing appointment with NOT_FOUND', async () => {
    fakeClient.appointment.findFirst.mockResolvedValueOnce(null);
    await expect(
      service.updateAppointmentStatus(USER, 'no-ida', AppointmentStatus.CONFIRMED),
    ).rejects.toMatchObject({ extensions: { code: 'NOT_FOUND' } });
  });

  it('cancels with a reason and records a notification', async () => {
    const cancelled = await service.cancelAppointment(USER, 'apt1', 'Cliente canceló');
    expect(cancelled.status).toBe('CANCELLED');
    expect(fakeClient.appointment.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { status: 'CANCELLED', cancellationReason: 'Cliente canceló' },
      }),
    );
    expect(fakeClient.appointmentNotification.create).toHaveBeenCalled();
  });

  it('rejects cancellation of non-cancellable or missing appointments', async () => {
    fakeClient.appointment.findFirst.mockResolvedValueOnce({ id: 'apt1', status: 'COMPLETED' });
    await expect(service.cancelAppointment(USER, 'apt1', 'x')).rejects.toMatchObject({
      extensions: { code: 'VALIDATION_ERROR' },
    });
    fakeClient.appointment.findFirst.mockResolvedValueOnce(null);
    await expect(service.cancelAppointment(USER, 'no-ida')).rejects.toMatchObject({
      extensions: { code: 'NOT_FOUND' },
    });
  });

  it('reschedules to a free slot and records a notification', async () => {
    const moved = await service.rescheduleAppointment(USER, {
      id: 'apt1',
      startAt: '2026-10-14T09:00:00Z',
    });
    expect(moved.id).toBe('apt1');
    expect(fakeClient.appointmentNotification.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ kind: 'reschedule' }) }),
    );
  });

  it('rejects a reschedule into a conflicting slot', async () => {
    fakeClient.appointment.findMany.mockResolvedValueOnce([{ id: 'other' }]);
    await expect(
      service.rescheduleAppointment(USER, { id: 'apt1', startAt: '2026-10-14T09:00:00Z' }),
    ).rejects.toMatchObject({ extensions: { code: 'CONFLICT' } });
  });

  it('rejects rescheduling a terminal appointment', async () => {
    fakeClient.appointment.findFirst.mockResolvedValueOnce({
      id: 'apt1',
      status: 'CANCELLED',
      appliedDurationMinutes: 30,
      specialistId: 'sp1',
    });
    await expect(
      service.rescheduleAppointment(USER, { id: 'apt1', startAt: '2026-10-14T09:00:00Z' }),
    ).rejects.toMatchObject({ extensions: { code: 'VALIDATION_ERROR' } });
  });

  it('reads the agenda by range scoped to the tenant, rejecting an inverted range', async () => {
    fakeClient.appointment.findMany.mockResolvedValueOnce([seededAppointment]);
    const rows = await service.findMyAppointments(USER, {
      from: '2026-10-01T00:00:00Z',
      to: '2026-10-31T23:59:59Z',
    });
    expect(rows[0]?.id).toBe('apt1');
    expect(fakeClient.appointment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          tenantId: 't1',
          startAt: { gte: expect.any(Date), lte: expect.any(Date) },
        }),
      }),
    );
    await expect(
      service.findMyAppointments(USER, { from: '2026-10-31T00:00:00Z', to: '2026-10-01T00:00:00Z' }),
    ).rejects.toMatchObject({ extensions: { code: 'VALIDATION_ERROR' } });
  });
});
