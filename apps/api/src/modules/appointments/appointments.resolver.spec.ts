import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { AppModule } from '../../app.module';
import { PrismaService } from '../../shared/prisma/prisma.service';

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
  service: { id: 's1', name: 'Corte', durationMinutes: 30, priceCents: 2500, currency: 'EUR' },
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

describe('AppointmentsResolver (GraphQL e2e, 005-appointments)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue({ client: fakeClient } as unknown as PrismaService)
      .compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('lists appointments with filters and resolves one by id', async () => {
    fakeClient.appointment.findMany.mockResolvedValueOnce([seededAppointment]);
    const list = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query:
          '{ appointments(tenantSlug: "estudio-ana", status: PENDING) { id clientName status startAt } }',
      })
      .expect(200);
    expect(list.body.errors).toBeUndefined();
    expect(list.body.data.appointments).toEqual([
      {
        id: 'apt1',
        clientName: 'María',
        status: 'PENDING',
        startAt: '2026-10-12T10:00:00.000Z',
      },
    ]);

    const detail = await request(app.getHttpServer())
      .post('/graphql')
      .send({ query: '{ appointment(id: "apt1") { id service { name } specialist { name } } }' })
      .expect(200);
    expect(detail.body.data.appointment).toEqual({
      id: 'apt1',
      service: { name: 'Corte' },
      specialist: { name: 'Ana' },
    });
  });

  it('creates an appointment via mutation and snapshots the service', async () => {
    const response = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query:
          'mutation { createAppointment(input: { tenantSlug: "estudio-ana", serviceId: "s1", specialistId: "sp1", clientName: "María", startAt: "2026-10-13T10:00:00Z", endAt: "2026-10-13T10:30:00Z" }) { id status appliedAmountCents origin } }',
      })
      .expect(200);

    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.createAppointment).toEqual({
      id: 'apt2',
      status: 'PENDING',
      appliedAmountCents: 2500,
      origin: 'online',
    });
  });

  it('rejects an overlapping booking with CONFLICT', async () => {
    fakeClient.appointment.findMany.mockResolvedValueOnce([{ id: 'apt-x' }]);
    const response = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query:
          'mutation { createAppointment(input: { tenantSlug: "estudio-ana", serviceId: "s1", specialistId: "sp1", clientName: "María", startAt: "2026-10-12T10:00:00Z", endAt: "2026-10-12T10:30:00Z" }) { id } }',
      })
      .expect(200);

    expect(response.body.errors?.[0]?.extensions?.code).toBe('CONFLICT');
  });

  it('surfaces NOT_FOUND for missing targets', async () => {
    const response = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query:
          'mutation { createAppointment(input: { tenantSlug: "estudio-ana", serviceId: "no-srv", specialistId: "sp1", clientName: "María", startAt: "2026-10-13T10:00:00Z", endAt: "2026-10-13T10:30:00Z" }) { id } }',
      })
      .expect(200);

    expect(response.body.errors?.[0]?.extensions?.code).toBe('NOT_FOUND');
  });

  it('updates the appointment status over /graphql', async () => {
    fakeClient.appointment.findUnique.mockResolvedValueOnce({
      id: 'apt1',
      status: 'PENDING',
    });
    const response = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: 'mutation { updateAppointmentStatus(id: "apt1", status: CONFIRMED) { id status } }',
      })
      .expect(200);

    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.updateAppointmentStatus).toEqual({
      id: 'apt1',
      status: 'CONFIRMED',
    });
  });

  it('rejects an invalid status change with VALIDATION_ERROR', async () => {
    fakeClient.appointment.findUnique.mockResolvedValueOnce({
      id: 'apt1',
      status: 'CANCELLED',
    });
    const response = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: 'mutation { updateAppointmentStatus(id: "apt1", status: CONFIRMED) { id status } }',
      })
      .expect(200);

    expect(response.body.errors?.[0]?.extensions?.code).toBe('VALIDATION_ERROR');
  });

  it('cancels an appointment with an optional reason', async () => {
    fakeClient.appointment.findUnique.mockResolvedValueOnce({
      id: 'apt1',
      status: 'PENDING',
    });
    const response = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query:
          'mutation { cancelAppointment(id: "apt1", reason: "Cliente canceló") { id status cancellationReason } }',
      })
      .expect(200);

    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.cancelAppointment).toEqual({
      id: 'apt1',
      status: 'CANCELLED',
      cancellationReason: 'Cliente canceló',
    });
  });
});
