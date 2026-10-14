import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { AppModule } from '../../app.module';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { createMemorySubscriptionStore } from '../subscription/subscription.test-store';
import { SUBSCRIPTION_STORE } from '../subscription/subscription.store';

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
  assignments: { specialist: { id: string; name: string } }[];
}

const seededServices: FakeService[] = [
  {
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
  },
];

const fakeClient = {
  businessProfile: {
    findUnique: vi.fn(
      async (args: { where: { slug: string } }): Promise<{ tenantId: string } | null> =>
        args.where.slug === 'estudio-ana' ? { tenantId: 't1' } : null,
    ),
  },
  service: {
    findMany: vi.fn(async (): Promise<FakeService[]> => seededServices),
    findUnique: vi.fn(async (args: { where: { id: string } }): Promise<FakeService | null> =>
      args.where.id === 's1' ? (seededServices[0] ?? null) : null,
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
        ...((seededServices[0] ?? {}) as FakeService),
        ...args.data,
      }),
    ),
    delete: vi.fn(async (): Promise<FakeService> => seededServices[0] as FakeService),
  },
  specialistService: {
    deleteMany: vi.fn(async (): Promise<{ count: number }> => ({ count: 1 })),
  },
  $transaction: vi.fn(async (ops: Promise<unknown>[]): Promise<unknown[]> => Promise.all(ops)),
};

describe('ServicesResolver (GraphQL e2e, 004-services-specialists-availability)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue({ client: fakeClient } as unknown as PrismaService)
      .overrideProvider(SUBSCRIPTION_STORE)
      .useValue(createMemorySubscriptionStore())
      .compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('lists services with tenant scoping and filters over /graphql', async () => {
    const response = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query:
          '{ services(tenantSlug: "estudio-ana", category: "Peluquería", minDuration: 20) { id name durationMinutes specialists { id name } } }',
      })
      .expect(200);

    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.services).toEqual([
      {
        id: 's1',
        name: 'Corte',
        durationMinutes: 30,
        specialists: [{ id: 'sp1', name: 'Ana' }],
      },
    ]);
    expect(fakeClient.service.findMany).toHaveBeenCalled();
  });

  it('resolves a single service and returns null when missing', async () => {
    const found = await request(app.getHttpServer())
      .post('/graphql')
      .send({ query: '{ service(id: "s1") { id name } }' })
      .expect(200);
    expect(found.body.errors).toBeUndefined();
    expect(found.body.data.service).toEqual({ id: 's1', name: 'Corte' });

    const missing = await request(app.getHttpServer())
      .post('/graphql')
      .send({ query: '{ service(id: "no-ida") { id } }' })
      .expect(200);
    expect(missing.body.data.service).toBeNull();
  });

  it('creates a service via mutation for the resolved tenant', async () => {
    const response = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query:
          'mutation { createService(input: { tenantSlug: "estudio-ana", name: "Tinte", durationMinutes: 60, priceCents: 4500 }) { id name } }',
      })
      .expect(200);

    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.createService).toEqual({ id: 's2', name: 'Tinte' });
  });

  it('updates and removes a service over /graphql', async () => {
    const update = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query:
          'mutation { updateService(id: "s1", input: { durationMinutes: 45 }) { id durationMinutes } }',
      })
      .expect(200);
    expect(update.body.errors).toBeUndefined();
    expect(update.body.data.updateService).toEqual({ id: 's1', durationMinutes: 45 });

    const remove = await request(app.getHttpServer())
      .post('/graphql')
      .send({ query: 'mutation { removeService(id: "s1") }' })
      .expect(200);
    expect(remove.body.errors).toBeUndefined();
    expect(remove.body.data.removeService).toBe(true);
  });

  it('surfaces VALIDATION_ERROR for invalid catalog values', async () => {
    const response = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query:
          'mutation { createService(input: { tenantSlug: "estudio-ana", name: "X", durationMinutes: 0, priceCents: 100 }) { id } }',
      })
      .expect(200);

    expect(response.body.errors?.[0]?.extensions?.code).toBe('VALIDATION_ERROR');
  });
});
