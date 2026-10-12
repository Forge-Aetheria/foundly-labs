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
import { CATALOG_STORE } from './catalog.store';
import { createMemoryCatalogStore, type MemoryCatalogStore } from './catalog.test-store';

const T1 = 'tenant-1';
const T2 = 'tenant-2';

describe('Catalog e2e (010-domain-mvp-module)', () => {
  let app: INestApplication;
  let store: MemoryCatalogStore;
  let publicJwk: TestJwk;
  let privateJwk: TestJwk;
  let tokenT1: string;
  let tokenT2: string;

  beforeAll(async () => {
    process.env.SUPABASE_AUTH_URL = TEST_AUTH_URL;
    store = createMemoryCatalogStore();
    ({ publicJwk, privateJwk } = await makeTestKeys());
    tokenT1 = await signTestToken(privateJwk, { sub: `user-${T1}`, tenantId: T1 });
    tokenT2 = await signTestToken(privateJwk, { sub: `user-${T2}`, tenantId: T2 });
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(CATALOG_STORE)
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

  const CREATE = `mutation($input: CreateMyServiceInput!) {
    createMyService(input: $input) { id name priceCents durationMinutes }
  }`;

  it('rejects anonymous access with UNAUTHENTICATED', async () => {
    const response = await gql('{ myServices { id } }', {}).expect(200);
    expect(response.body.errors?.[0]?.extensions?.code).toBe('UNAUTHENTICATED');
  });

  it('runs the ownership round-trip for T1 and isolates T2', async () => {
    const created = await gql(CREATE, { input: { name: 'Corte', priceCents: 1500, durationMinutes: 30 } }, tokenT1).expect(200);
    expect(created.body.errors).toBeUndefined();
    const id = created.body.data.createMyService.id as string;

    const t1List = await gql('{ myServices { id } }', {}, tokenT1).expect(200);
    expect(t1List.body.data.myServices.map((s: { id: string }) => s.id)).toContain(id);

    const t2List = await gql('{ myServices { id } }', {}, tokenT2).expect(200);
    expect(t2List.body.data.myServices).toHaveLength(0);

    const foreignGet = await gql('query($id: ID!){ myService(id: $id) { id } }', { id }, tokenT2).expect(200);
    expect(foreignGet.body.errors?.[0]?.extensions?.code).toBe('NOT_FOUND');

    const foreignDelete = await gql('mutation($id: ID!){ deleteMyService(id: $id) }', { id }, tokenT2).expect(200);
    expect(foreignDelete.body.errors?.[0]?.extensions?.code).toBe('NOT_FOUND');

    const ownGet = await gql('query($id: ID!){ myService(id: $id) { id } }', { id }, tokenT1).expect(200);
    expect(ownGet.body.data.myService.id).toBe(id);

    const updated = await gql(
      'mutation($id: ID!, $input: UpdateMyServiceInput!){ updateMyService(id: $id, input: $input) { id active } }',
      { id, input: { active: false } },
      tokenT1,
    ).expect(200);
    expect(updated.body.data.updateMyService.active).toBe(false);

    const deleted = await gql('mutation($id: ID!){ deleteMyService(id: $id) }', { id }, tokenT1).expect(200);
    expect(deleted.body.data.deleteMyService).toBe(true);

    const gone = await gql('query($id: ID!){ myService(id: $id) { id } }', { id }, tokenT1).expect(200);
    expect(gone.body.errors?.[0]?.extensions?.code).toBe('NOT_FOUND');
  });

  it('returns VALIDATION_ERROR for malformed create input', async () => {
    const response = await gql(
      CREATE,
      { input: { name: '', priceCents: 1500, durationMinutes: 30 } },
      tokenT1,
    ).expect(200);
    expect(response.body.errors?.[0]?.extensions?.code).toBe('VALIDATION_ERROR');
    const list = await gql('{ myServices { id } }', {}, tokenT1).expect(200);
    expect(list.body.data.myServices).toHaveLength(0);
  });
});