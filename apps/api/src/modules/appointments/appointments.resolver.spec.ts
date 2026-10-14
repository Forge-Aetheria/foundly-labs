import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { AppModule } from '../../app.module';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { JWT_JWKS } from '../auth/jwt.service';
import {
  makeLocalJwks,
  makeTestKeys,
  signTestToken,
  TEST_AUTH_URL,
  type TestJwk,
} from '../auth/jwt.test-helper';

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

function seedAppointment(): FakeAppointment {
  return {
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
    service: { id: 's1', name: 'Corte', durationMinutes: 30, priceCents: 2500, currency: 'EUR' },
    specialist: { id: 'sp1', name: 'Ana' },
    notifications: [],
  };
}

let row: FakeAppointment = seedAppointment();

const fakeClient = {
  businessProfile: {
    findUnique: vi.fn(
      async (args: { where: { slug: string } }): Promise<{ tenantId: string } | null> =>
        args.where.slug === 'estudio-ana' ? { tenantId: 't1' } : null,
    ),
  },
  service: {
    findUnique: vi.fn(
      async (args: { where: { id: string } }): Promise<Record<string, unknown> | null> =>
        args.where.id === 's1'
          ? {
              id: 's1',
              tenantId: 't1',
              durationMinutes: 30,
              priceCents: 2500,
              currency: 'EUR',
              requiresAdvance: false,
              advanceKind: null,
              advanceValue: null,
            }
          : null,
    ),
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
        args.where.id === 'apt1' ? row : null,
    ),
    findFirst: vi.fn(
      async (args: { select?: unknown; include?: unknown }): Promise<unknown> => {
        if (args.select && !args.include) {
          return {
            id: row.id,
            status: row.status,
            appliedDurationMinutes: row.appliedDurationMinutes,
            specialistId: row.specialistId,
          };
        }
        return row;
      },
    ),
    create: vi.fn(async (args: { data: Record<string, unknown> }): Promise<FakeAppointment> => ({
      ...row,
      ...(args.data as Partial<FakeAppointment>),
      id: 'apt2',
      service: { id: 's1', name: 'Corte', durationMinutes: 30, priceCents: 2500, currency: 'EUR' },
      specialist: { id: 'sp1', name: 'Ana' },
      notifications: [],
    })),
    update: vi.fn(
      async (args: { where: { id: string }; data: Partial<FakeAppointment> }): Promise<FakeAppointment> => {
        row = { ...row, ...args.data };
        return row;
      },
    ),
  },
  appointmentNotification: {
    create: vi.fn(async (args: { data: Omit<FakeNotification, 'id' | 'createdAt' | 'channel'> }) => {
      const notification: FakeNotification = {
        id: `notif-${row.notifications.length + 1}`,
        kind: args.data.kind,
        message: args.data.message,
        channel: 'simulated',
        createdAt: new Date('2026-10-14T00:00:00Z'),
      };
      row.notifications = [notification, ...row.notifications];
      return notification;
    }),
  },
};

describe('AppointmentsResolver (GraphQL e2e, 005-appointments + 016-advance-payments)', () => {
  let app: INestApplication;
  let privateJwk: TestJwk;
  let tokenT1: string;
  let publicJwk: TestJwk;

  beforeAll(async () => {
    process.env.SUPABASE_AUTH_URL = TEST_AUTH_URL;
    ({ publicJwk, privateJwk } = await makeTestKeys());
    tokenT1 = await signTestToken(privateJwk, { sub: 'user-t1', tenantId: 't1' });
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(JWT_JWKS)
      .useValue(makeLocalJwks(publicJwk))
      .overrideProvider(PrismaService)
      .useValue({ client: fakeClient } as unknown as PrismaService)
      .compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    delete process.env.SUPABASE_AUTH_URL;
    await app.close();
  });

  function gql(query: string, bearer?: string): request.Test {
    const req = request(app.getHttpServer()).post('/graphql').send({ query });
    if (bearer) {
      req.set('Authorization', `Bearer ${bearer}`);
    }
    return req;
  }

  beforeEach(() => {
    row = seedAppointment();
    vi.clearAllMocks();
  });

  it('lists appointments (public projection) with filters and resolves one by id', async () => {
    fakeClient.appointment.findMany.mockResolvedValueOnce([row]);
    const list = await gql(
      '{ appointments(tenantSlug: "estudio-ana", status: PENDING) { id specialistId status startAt } }',
    ).expect(200);
    expect(list.body.errors).toBeUndefined();
    expect(list.body.data.appointments).toEqual([
      { id: 'apt1', specialistId: 'sp1', status: 'PENDING', startAt: '2026-10-12T10:00:00.000Z' },
    ]);

    const detail = await gql('{ appointment(id: "apt1") { id specialistId status } }').expect(200);
    expect(detail.body.data.appointment).toEqual({
      id: 'apt1',
      specialistId: 'sp1',
      status: 'PENDING',
    });
  });

  it('creates an appointment via mutation and snapshots the service', async () => {
    const response = await gql(
      'mutation { createAppointment(input: { tenantSlug: "estudio-ana", serviceId: "s1", specialistId: "sp1", clientName: "María", startAt: "2026-10-13T10:00:00Z", endAt: "2026-10-13T10:30:00Z" }) { id status appliedAmountCents origin paymentMethodType } }',
    ).expect(200);

    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.createAppointment).toEqual({
      id: 'apt2',
      status: 'PENDING',
      appliedAmountCents: 2500,
      origin: 'online',
      paymentMethodType: null,
    });
  });

  it('rejects an overlapping booking with CONFLICT', async () => {
    fakeClient.appointment.findMany.mockResolvedValueOnce([{ id: 'apt-x' }]);
    const response = await gql(
      'mutation { createAppointment(input: { tenantSlug: "estudio-ana", serviceId: "s1", specialistId: "sp1", clientName: "María", startAt: "2026-10-12T10:00:00Z", endAt: "2026-10-12T10:30:00Z" }) { id } }',
    ).expect(200);

    expect(response.body.errors?.[0]?.extensions?.code).toBe('CONFLICT');
  });

  it('surfaces NOT_FOUND for missing targets', async () => {
    const response = await gql(
      'mutation { createAppointment(input: { tenantSlug: "estudio-ana", serviceId: "no-srv", specialistId: "sp1", clientName: "María", startAt: "2026-10-13T10:00:00Z", endAt: "2026-10-13T10:30:00Z" }) { id } }',
    ).expect(200);

    expect(response.body.errors?.[0]?.extensions?.code).toBe('NOT_FOUND');
  });

  it('reads the agenda by range for the authenticated owner', async () => {
    fakeClient.appointment.findMany.mockResolvedValueOnce([row]);
    const response = await gql(
      '{ myAppointments(from: "2026-10-01T00:00:00.000Z", to: "2026-10-31T23:59:59.000Z") { id status notifications { kind } } }',
      tokenT1,
    ).expect(200);

    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.myAppointments).toEqual([
      { id: 'apt1', status: 'PENDING', notifications: [] },
    ]);
  });

  it('rejects an unauthenticated agenda read', async () => {
    const response = await gql(
      '{ myAppointments(from: "2026-10-01T00:00:00.000Z", to: "2026-10-31T23:59:59.000Z") { id } }',
    ).expect(200);
    expect(response.body.errors?.[0]?.extensions?.code).toBe('UNAUTHENTICATED');
  });

  it('updates the appointment status and records a notification', async () => {
    const response = await gql(
      'mutation { updateAppointmentStatus(id: "apt1", status: CONFIRMED) { id status notifications { kind message } } }',
      tokenT1,
    ).expect(200);

    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.updateAppointmentStatus.status).toBe('CONFIRMED');
    expect(response.body.data.updateAppointmentStatus.notifications[0].kind).toBe('status_change');
  });

  it('rejects an invalid status change with VALIDATION_ERROR', async () => {
    row = { ...row, status: 'CANCELLED' };
    const response = await gql(
      'mutation { updateAppointmentStatus(id: "apt1", status: CONFIRMED) { id } }',
      tokenT1,
    ).expect(200);
    expect(response.body.errors?.[0]?.extensions?.code).toBe('VALIDATION_ERROR');
  });

  it('requires authentication for control actions', async () => {
    const response = await gql(
      'mutation { cancelAppointment(id: "apt1", reason: "x") { id } }',
    ).expect(200);
    expect(response.body.errors?.[0]?.extensions?.code).toBe('UNAUTHENTICATED');
  });

  it('cancels an appointment with an optional reason', async () => {
    const response = await gql(
      'mutation { cancelAppointment(id: "apt1", reason: "Cliente canceló") { id status cancellationReason } }',
      tokenT1,
    ).expect(200);

    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.cancelAppointment).toEqual({
      id: 'apt1',
      status: 'CANCELLED',
      cancellationReason: 'Cliente canceló',
    });
  });
});
