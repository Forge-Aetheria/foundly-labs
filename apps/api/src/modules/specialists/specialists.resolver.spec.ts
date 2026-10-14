import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { AppModule } from '../../app.module';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { createMemorySubscriptionStore } from '../subscription/subscription.test-store';
import { SUBSCRIPTION_STORE } from '../subscription/subscription.store';

interface FakeSpecialist {
  id: string;
  tenantId: string;
  name: string;
  role: string | null;
  avatar: string | null;
  bio: string | null;
  active: boolean;
  assignments: { service: { id: string; name: string } }[];
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
    findUnique: vi.fn(async (args: { where: { id: string } }): Promise<FakeSpecialist | null> =>
      args.where.id === 'sp1' ? seededSpecialist : null,
    ),
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
    create: vi.fn(async (): Promise<{ specialistId: string }> => ({ specialistId: 'sp1' })),
    deleteMany: vi.fn(async (): Promise<{ count: number }> => ({ count: 1 })),
  },
  $transaction: vi.fn(async (ops: Promise<unknown>[]): Promise<unknown[]> => Promise.all(ops)),
};

describe('SpecialistsResolver (GraphQL e2e, 004-services-specialists-availability)', () => {
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

  it('lists specialists scoped by tenant over /graphql', async () => {
    const response = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: '{ specialists(tenantSlug: "estudio-ana") { id name services { id name } } }',
      })
      .expect(200);

    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.specialists).toEqual([
      {
        id: 'sp1',
        name: 'Ana',
        services: [{ id: 's1', name: 'Corte' }],
      },
    ]);
  });

  it('resolves a specialist and lists service specialists (reverse read)', async () => {
    const detail = await request(app.getHttpServer())
      .post('/graphql')
      .send({ query: '{ specialist(id: "sp1") { id role } }' })
      .expect(200);
    expect(detail.body.data.specialist).toEqual({ id: 'sp1', role: 'Estilista' });

    const reverse = await request(app.getHttpServer())
      .post('/graphql')
      .send({ query: '{ serviceSpecialists(serviceId: "s1") { id name } }' })
      .expect(200);
    expect(reverse.body.errors).toBeUndefined();
    expect(reverse.body.data.serviceSpecialists).toEqual([{ id: 'sp1', name: 'Ana' }]);
  });

  it('creates, updates and removes a specialist over /graphql', async () => {
    const create = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query:
          'mutation { createSpecialist(input: { tenantSlug: "estudio-ana", name: "Rona", role: "Piercer" }) { id name } }',
      })
      .expect(200);
    expect(create.body.data.createSpecialist).toEqual({ id: 'sp2', name: 'Rona' });

    const update = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: 'mutation { updateSpecialist(id: "sp1", input: { bio: "11 años" }) { id bio } }',
      })
      .expect(200);
    expect(update.body.data.updateSpecialist).toEqual({ id: 'sp1', bio: '11 años' });

    const remove = await request(app.getHttpServer())
      .post('/graphql')
      .send({ query: 'mutation { removeSpecialist(id: "sp1") }' })
      .expect(200);
    expect(remove.body.errors).toBeUndefined();
    expect(remove.body.data.removeSpecialist).toBe(true);
  });

  it('assigns and unassigns a service, surfacing CONFLICT on duplicates', async () => {
    const assign = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query:
          'mutation { assignServiceToSpecialist(specialistId: "sp1", serviceId: "s1") { id services { id } } }',
      })
      .expect(200);
    expect(assign.body.errors).toBeUndefined();
    expect(assign.body.data.assignServiceToSpecialist.id).toBe('sp1');

    vi.mocked(fakeClient.specialistService.create).mockRejectedValueOnce(
      Object.assign(new Error('Unique constraint failed'), { code: 'P2002' }),
    );
    const duplicate = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query:
          'mutation { assignServiceToSpecialist(specialistId: "sp1", serviceId: "s1") { id } }',
      })
      .expect(200);
    expect(duplicate.body.errors?.[0]?.extensions?.code).toBe('CONFLICT');
    vi.mocked(fakeClient.specialistService.create).mockResolvedValue({
      specialistId: 'sp1',
    });

    const unassign = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query:
          'mutation { unassignServiceFromSpecialist(specialistId: "sp1", serviceId: "s1") { id } }',
      })
      .expect(200);
    expect(unassign.body.errors).toBeUndefined();
    expect(unassign.body.data.unassignServiceFromSpecialist.id).toBe('sp1');
  });
});
