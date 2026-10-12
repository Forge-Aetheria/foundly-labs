import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AppModule } from '../app.module';
import { PrismaService } from '../shared/prisma/prisma.service';
import { HealthResolver } from './health.resolver';

type PrismaLike = { client: { $queryRaw: ReturnType<typeof vi.fn> } };

function makePrisma($queryRaw: PrismaLike['client']['$queryRaw']): PrismaService {
  return { client: { $queryRaw } } as unknown as PrismaService;
}

describe('HealthResolver — readiness probe (007-graphql-api-layer)', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('reports database "up" when the probe query succeeds', async () => {
    const resolver = new HealthResolver(
      makePrisma(vi.fn().mockResolvedValue([{ '?column?': 1 }])),
    );
    const payload = await resolver.health();

    expect(payload).toMatchObject({
      service: 'foundly-api',
      status: 'ok',
      database: 'up',
    });
    expect(payload.checkedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('reports database "down" when the probe query rejects', async () => {
    const resolver = new HealthResolver(
      makePrisma(vi.fn().mockRejectedValue(new Error('unreachable'))),
    );
    const payload = await resolver.health();

    expect(payload.status).toBe('ok');
    expect(payload.database).toBe('down');
  });

  it('reports database "down" when the probe never settles (timeout bound)', async () => {
    vi.useFakeTimers();
    const never = new Promise<never>(() => {});
    const resolver = new HealthResolver(makePrisma(vi.fn().mockReturnValue(never)));

    const pending = resolver.health();
    await vi.advanceTimersByTimeAsync(2000);
    const payload = await pending;

    expect(payload.status).toBe('ok');
    expect(payload.database).toBe('down');
  });

  it('answers the health query over POST /graphql with the wired context', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(makePrisma(vi.fn().mockResolvedValue([{ '?column?': 1 }])))
      .compile();
    const app = moduleRef.createNestApplication();
    await app.init();

    try {
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: '{ health { service status database checkedAt } }' })
        .expect(200);

      expect(response.body.errors).toBeUndefined();
      expect(response.body.data.health).toMatchObject({
        service: 'foundly-api',
        status: 'ok',
        database: 'up',
      });
      expect(typeof response.body.data.health.checkedAt).toBe('string');
    } finally {
      await app.close();
    }
  });
});