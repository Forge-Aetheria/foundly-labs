import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
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
import { TIME_BLOCK_STORE } from './time-block.store';
import { createMemoryTimeBlockStore, type MemoryTimeBlockStore } from './time-block.test-store';

const T1 = 'tenant-1';
const T2 = 'tenant-2';
const SLUG = 'estudio-ana';

describe('TimeBlock e2e (014-availability-time-blocks)', () => {
  let app: INestApplication;
  let store: MemoryTimeBlockStore;
  let publicJwk: TestJwk;
  let privateJwk: TestJwk;
  let tokenT1: string;
  let tokenT2: string;

  beforeAll(async () => {
    process.env.SUPABASE_AUTH_URL = TEST_AUTH_URL;
    store = createMemoryTimeBlockStore();
    store.tenantBySlug(SLUG, T1);
    addSpecialist();
    ({ publicJwk, privateJwk } = await makeTestKeys());
    tokenT1 = await signTestToken(privateJwk, { sub: `user-${T1}`, tenantId: T1 });
    tokenT2 = await signTestToken(privateJwk, { sub: `user-${T2}`, tenantId: T2 });
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(TIME_BLOCK_STORE)
      .useValue(store)
      .overrideProvider(JWT_JWKS)
      .useValue(makeLocalJwks(publicJwk))
      .overrideProvider(PrismaService)
      .useValue({
        client: { $queryRaw: () => Promise.resolve([{ '?column?': 1 }]) },
      } as unknown as PrismaService)
      .compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  function addSpecialist(): void {
    store.addSpecialist('res-ana', T1);
  }

  afterAll(async () => {
    delete process.env.SUPABASE_AUTH_URL;
    await app.close();
  });

  function gql(query: string, variables: Record<string, unknown> = {}, bearer?: string): request.Test {
    const req = request(app.getHttpServer()).post('/graphql').send({ query, variables });
    if (bearer) {
      req.set('Authorization', `Bearer ${bearer}`);
    }
    return req;
  }

  const ADD = `mutation($input: AddTimeBlockInput!) {
    addTimeBlock(input: $input) { id startAt endAt reason specialistId }
  }`;
  const REMOVE = `mutation($id: ID!) { removeTimeBlock(id: $id) }`;

  it('serves the public blocks by slug (empty then populated, ordered)', async () => {
    const empty = await gql(`{ timeBlocks(tenantSlug: "${SLUG}") { id } }`).expect(200);
    expect(empty.body.data.timeBlocks).toEqual([]);

    const added = await gql(
      ADD,
      { input: { startAt: '2026-12-24T09:00:00.000Z', endAt: '2026-12-24T18:00:00.000Z', reason: 'Nochebuena' } },
      tokenT1,
    ).expect(200);
    expect(added.body.errors).toBeUndefined();
    const id = added.body.data.addTimeBlock.id as string;
    expect(added.body.data.addTimeBlock.specialistId).toBeNull();

    const list = await gql(`{ timeBlocks(tenantSlug: "${SLUG}") { id reason } }`).expect(200);
    expect(list.body.data.timeBlocks.map((r: { id: string }) => r.id)).toEqual([id]);
  });

  it('rejects anonymous adds with UNAUTHENTICATED', async () => {
    const res = await gql(ADD, {
      input: { startAt: '2026-12-24T09:00:00.000Z', endAt: '2026-12-24T18:00:00.000Z' },
    }).expect(200);
    expect(res.body.errors?.[0]?.extensions?.code).toBe('UNAUTHENTICATED');
  });

  it('rejects an invalid range with VALIDATION_ERROR', async () => {
    const bad = await gql(
      ADD,
      { input: { startAt: '2026-12-24T18:00:00.000Z', endAt: '2026-12-24T09:00:00.000Z' } },
      tokenT1,
    ).expect(200);
    expect(bad.body.errors?.[0]?.extensions?.code).toBe('VALIDATION_ERROR');
  });

  it('isolates tenants and rejects a foreign removal', async () => {
    const added = await gql(
      ADD,
      { input: { startAt: '2026-12-31T09:00:00.000Z', endAt: '2026-12-31T12:00:00.000Z' } },
      tokenT1,
    ).expect(200);
    const id = added.body.data.addTimeBlock.id as string;

    const t2List = await gql(`{ timeBlocks(tenantId: "${T2}") { id } }`, {}, tokenT2).expect(200);
    expect(t2List.body.data.timeBlocks).toEqual([]);

    const foreign = await gql(REMOVE, { id }, tokenT2).expect(200);
    expect(foreign.body.errors?.[0]?.extensions?.code).toBe('NOT_FOUND');

    const own = await gql(REMOVE, { id }, tokenT1).expect(200);
    expect(own.body.data.removeTimeBlock).toBe(true);
  });
});
