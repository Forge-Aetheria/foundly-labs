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
import { SubscriptionPlan, SubscriptionStatus } from '../subscription/subscription.types';
import { PLATFORM_STORE } from './platform.store';
import { createMemoryPlatformStore, type MemoryPlatformStore } from './platform.test-store';

describe('Platform console e2e (019-super-admin-panel)', () => {
  let app: INestApplication;
  let store: MemoryPlatformStore;
  let publicJwk: TestJwk;
  let privateJwk: TestJwk;
  let adminToken: string;
  let ownerToken: string;

  const METRICS = `query { platformMetrics { businesses { total active } users { available } plans { free pro } proConversion } }`;
  const LIST = `query { managedBusinesses { tenantId name plan status } }`;
  const OVERRIDE = `mutation($input: OverrideTenantSubscriptionInput!) { overrideTenantSubscription(input: $input) { tenantId plan status expiresAt } }`;

  beforeAll(async () => {
    process.env.SUPABASE_AUTH_URL = TEST_AUTH_URL;
    store = createMemoryPlatformStore();
    store.seed({
      tenantId: 't1',
      slug: 'estudio-ana',
      name: 'Estudio Ana',
      plan: SubscriptionPlan.FREE,
      status: SubscriptionStatus.active,
      expiresAt: null,
    });
    ({ publicJwk, privateJwk } = await makeTestKeys());
    adminToken = await signTestToken(privateJwk, { sub: 'admin', platformRole: 'super_admin' });
    ownerToken = await signTestToken(privateJwk, { sub: 'owner', tenantId: 't1' });

    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PLATFORM_STORE)
      .useValue(store)
      .overrideProvider(JWT_JWKS)
      .useValue(makeLocalJwks(publicJwk))
      .overrideProvider(PrismaService)
      .useValue({ client: {} } as unknown as PrismaService)
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

  it('refuses anonymous callers with UNAUTHENTICATED', async () => {
    const response = await gql(METRICS).expect(200);
    expect(response.body.errors?.[0]?.extensions?.code).toBe('UNAUTHENTICATED');
  });

  it('refuses a business owner with FORBIDDEN', async () => {
    const metrics = await gql(METRICS, {}, ownerToken).expect(200);
    expect(metrics.body.errors?.[0]?.extensions?.code).toBe('FORBIDDEN');
    const list = await gql(LIST, {}, ownerToken).expect(200);
    expect(list.body.errors?.[0]?.extensions?.code).toBe('FORBIDDEN');
    const override = await gql(
      OVERRIDE,
      { input: { tenantId: 't1', plan: 'PRO' } },
      ownerToken,
    ).expect(200);
    expect(override.body.errors?.[0]?.extensions?.code).toBe('FORBIDDEN');
    expect(store.getRow('t1')?.plan).toBe(SubscriptionPlan.FREE);
  });

  it('allows the Super Admin to read metrics and the managed list', async () => {
    const metrics = await gql(METRICS, {}, adminToken).expect(200);
    expect(metrics.body.errors).toBeUndefined();
    expect(metrics.body.data.platformMetrics.businesses.total).toBe(1);
    expect(metrics.body.data.platformMetrics.users.available).toBe(false);

    const list = await gql(LIST, {}, adminToken).expect(200);
    expect(list.body.data.managedBusinesses).toHaveLength(1);
    expect(list.body.data.managedBusinesses[0]).toMatchObject({ tenantId: 't1', plan: 'FREE' });
  });

  it('allows the Super Admin to override a subscription', async () => {
    const response = await gql(
      OVERRIDE,
      { input: { tenantId: 't1', plan: 'PRO', status: 'active', expiresAt: '2027-01-01T00:00:00.000Z' } },
      adminToken,
    ).expect(200);
    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.overrideTenantSubscription).toMatchObject({
      tenantId: 't1',
      plan: 'PRO',
      status: 'active',
      expiresAt: '2027-01-01T00:00:00.000Z',
    });
    expect(store.getRow('t1')?.plan).toBe(SubscriptionPlan.PRO);
  });

  it('rejects an invalid override and changes nothing', async () => {
    const before = store.getRow('t1')?.plan;
    const response = await gql(
      OVERRIDE,
      { input: { tenantId: 't1', expiresAt: 'not-a-date' } },
      adminToken,
    ).expect(200);
    expect(response.body.errors?.[0]?.extensions?.code).toBe('VALIDATION_ERROR');
    expect(store.getRow('t1')?.plan).toBe(before);
  });
});
