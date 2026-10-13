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
import { REVIEWS_STORE } from './reviews.store';
import { createMemoryReviewsStore, type MemoryReviewsStore } from './reviews.test-store';

const T1 = 'tenant-1';
const SLUG = 'estudio-ana';

describe('Reviews e2e (013-profile-policies-reviews)', () => {
  let app: INestApplication;
  let store: MemoryReviewsStore;
  let publicJwk: TestJwk;
  let privateJwk: TestJwk;

  beforeAll(async () => {
    process.env.SUPABASE_AUTH_URL = TEST_AUTH_URL;
    store = createMemoryReviewsStore();
    store.tenantBySlug(SLUG, T1);
    ({ publicJwk, privateJwk } = await makeTestKeys());
    const token = await signTestToken(privateJwk, { sub: `user-${T1}`, tenantId: T1 });
    void token;
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(REVIEWS_STORE)
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

  function gql(query: string, variables: Record<string, unknown> = {}): request.Test {
    return request(app.getHttpServer()).post('/graphql').send({ query, variables });
  }

  const ADD = `mutation($input: AddReviewInput!) {
    addReview(input: $input) { id author rating comment }
  }`;

  it('serves the public reviews summary (empty then populated)', async () => {
    const empty = await gql(`{ reviews(tenantSlug: "${SLUG}") { items { id } average count } }`).expect(200);
    expect(empty.body.data.reviews).toEqual({ items: [], average: null, count: 0 });

    const added = await gql(
      ADD,
      { input: { tenantSlug: SLUG, author: 'Lucía', rating: 5, comment: 'Genial' } },
    ).expect(200);
    expect(added.body.errors).toBeUndefined();

    const summary = await gql(`{ reviews(tenantSlug: "${SLUG}") { items { author rating } average count } }`).expect(200);
    expect(summary.body.data.reviews.count).toBe(1);
    expect(summary.body.data.reviews.average).toBe(5);
  });

  it('rejects an invalid review with VALIDATION_ERROR', async () => {
    const bad = await gql(
      ADD,
      { input: { tenantSlug: SLUG, author: 'X', rating: 9, comment: 'Y' } },
    ).expect(200);
    expect(bad.body.errors?.[0]?.extensions?.code).toBe('VALIDATION_ERROR');
  });

  it('rejects an unknown business with NOT_FOUND', async () => {
    const missing = await gql(
      ADD,
      { input: { tenantSlug: 'no-existe', author: 'X', rating: 5, comment: 'Y' } },
    ).expect(200);
    expect(missing.body.errors?.[0]?.extensions?.code).toBe('NOT_FOUND');
  });
});
