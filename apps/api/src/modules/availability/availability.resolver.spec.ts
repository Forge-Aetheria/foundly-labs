import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { AppModule } from '../../app.module';
import { PrismaService } from '../../shared/prisma/prisma.service';

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

describe('AvailabilityResolver (GraphQL e2e, 004-services-specialists-availability)', () => {
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

  it('lists availability scoped by tenant over /graphql', async () => {
    const response = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: '{ availability(tenantSlug: "estudio-ana") { id weekday startTime endTime } }',
      })
      .expect(200);

    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.availability).toEqual([
      { id: 'a1', weekday: 1, startTime: '09:00', endTime: '17:00' },
    ]);
    expect(fakeClient.availability.findMany).toHaveBeenCalled();
  });

  it('creates an availability entry via mutation', async () => {
    const response = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query:
          'mutation { createAvailability(input: { tenantSlug: "estudio-ana", weekday: 2, startTime: "10:00", endTime: "14:00" }) { id weekday } }',
      })
      .expect(200);

    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.createAvailability).toEqual({ id: 'a2', weekday: 2 });
  });

  it('updates and removes an availability entry', async () => {
    const update = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query:
          'mutation { updateAvailability(id: "a1", input: { endTime: "18:00" }) { id endTime } }',
      })
      .expect(200);
    expect(update.body.data.updateAvailability).toEqual({ id: 'a1', endTime: '18:00' });

    const remove = await request(app.getHttpServer())
      .post('/graphql')
      .send({ query: 'mutation { removeAvailability(id: "a1") }' })
      .expect(200);
    expect(remove.body.errors).toBeUndefined();
    expect(remove.body.data.removeAvailability).toBe(true);
  });

  it('surfaces VALIDATION_ERROR for an invalid range', async () => {
    const response = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query:
          'mutation { createAvailability(input: { tenantSlug: "estudio-ana", weekday: 7, startTime: "09:00", endTime: "17:00" }) { id } }',
      })
      .expect(200);

    expect(response.body.errors?.[0]?.extensions?.code).toBe('VALIDATION_ERROR');
  });
});
