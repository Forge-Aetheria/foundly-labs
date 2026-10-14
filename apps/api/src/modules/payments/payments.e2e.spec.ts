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
} from '../auth/jwt.test-helper';
import { PAYMENTS_STORE } from './payments.store';
import { createMemoryPaymentsStore, type MemoryPaymentsStore } from './payments.test-store';

const T1 = 'tenant-1';
const T2 = 'tenant-2';
const SLUG = 'estudio-ana';

describe('Payments e2e (016-advance-payments)', () => {
  let app: INestApplication;
  let store: MemoryPaymentsStore;
  let tokenT1: string;
  let tokenT2: string;

  beforeAll(async () => {
    process.env.SUPABASE_AUTH_URL = TEST_AUTH_URL;
    store = createMemoryPaymentsStore();
    store.tenantBySlug(SLUG, T1);
    const { publicJwk, privateJwk } = await makeTestKeys();
    tokenT1 = await signTestToken(privateJwk, { sub: `user-${T1}`, tenantId: T1 });
    tokenT2 = await signTestToken(privateJwk, { sub: `user-${T2}`, tenantId: T2 });
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PAYMENTS_STORE)
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

  function gql(query: string, bearer?: string): request.Test {
    const req = request(app.getHttpServer()).post('/graphql').send({ query });
    if (bearer) {
      req.set('Authorization', `Bearer ${bearer}`);
    }
    return req;
  }

  it('configures a method and exposes only active ones publicly', async () => {
    const empty = await gql(`{ paymentMethods(tenantSlug: "${SLUG}") { id } }`).expect(200);
    expect(empty.body.data.paymentMethods).toEqual([]);

    const created = await gql(
      `mutation { upsertPaymentMethod(input: { type: mobile_payment, label: "Pago Móvil", details: "Banco X", active: true }) { id type active details } }`,
      tokenT1,
    ).expect(200);
    expect(created.body.errors).toBeUndefined();
    expect(created.body.data.upsertPaymentMethod).toMatchObject({
      type: 'mobile_payment',
      active: true,
      details: 'Banco X',
    });

    const mine = await gql('{ myPaymentMethods { type active } }', tokenT1).expect(200);
    expect(mine.body.data.myPaymentMethods).toEqual([{ type: 'mobile_payment', active: true }]);

    const publicList = await gql(`{ paymentMethods(tenantSlug: "${SLUG}") { type } }`).expect(200);
    expect(publicList.body.data.paymentMethods).toEqual([{ type: 'mobile_payment' }]);
  });

  it('disabling a method removes it from the public read', async () => {
    await gql(
      `mutation { upsertPaymentMethod(input: { type: mobile_payment, active: false }) { id active } }`,
      tokenT1,
    ).expect(200);
    const publicList = await gql(`{ paymentMethods(tenantSlug: "${SLUG}") { type } }`).expect(200);
    expect(publicList.body.data.paymentMethods).toEqual([]);
  });

  it('is tenant-scoped', async () => {
    const other = await gql('{ myPaymentMethods { id } }', tokenT2).expect(200);
    expect(other.body.data.myPaymentMethods).toEqual([]);
  });

  it('rejects anonymous configuration writes', async () => {
    const response = await gql(
      'mutation { upsertPaymentMethod(input: { type: binance, active: true }) { id } }',
    ).expect(200);
    expect(response.body.errors?.[0]?.extensions?.code).toBe('UNAUTHENTICATED');
  });
});
