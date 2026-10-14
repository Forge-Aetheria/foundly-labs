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
const T2 = 'tenant-2';
const SLUG = 'estudio-ana';

describe('Reviews e2e (013 reviews + 015 moderation)', () => {
  let app: INestApplication;
  let store: MemoryReviewsStore;
  let publicJwk: TestJwk;
  let privateJwk: TestJwk;
  let tokenT1: string;
  let tokenT2: string;

  beforeAll(async () => {
    process.env.SUPABASE_AUTH_URL = TEST_AUTH_URL;
    store = createMemoryReviewsStore();
    store.tenantBySlug(SLUG, T1);
    ({ publicJwk, privateJwk } = await makeTestKeys());
    tokenT1 = await signTestToken(privateJwk, { sub: `user-${T1}`, tenantId: T1 });
    tokenT2 = await signTestToken(privateJwk, { sub: `user-${T2}`, tenantId: T2 });
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

  function gql(query: string, variables: Record<string, unknown> = {}, bearer?: string): request.Test {
    const req = request(app.getHttpServer()).post('/graphql').send({ query, variables });
    if (bearer) {
      req.set('Authorization', `Bearer ${bearer}`);
    }
    return req;
  }

  const ADD = `mutation($input: AddReviewInput!) {
    addReview(input: $input) { id author rating comment state }
  }`;
  const SUMMARY = `{ reviews(tenantSlug: "${SLUG}") { items { id author rating state } average count } }`;

  it('creates submissions as pending and hides them from the public summary', async () => {
    const added = await gql(
      ADD,
      { input: { tenantSlug: SLUG, author: 'Lucía', rating: 5, comment: 'Genial' } },
    ).expect(200);
    expect(added.body.errors).toBeUndefined();
    expect(added.body.data.addReview.state).toBe('pending');

    const summary = await gql(SUMMARY).expect(200);
    expect(summary.body.data.reviews).toEqual({ items: [], average: null, count: 0 });
  });

  it('approving publishes the review and updates the aggregate', async () => {
    const added = await gql(
      ADD,
      { input: { tenantSlug: SLUG, author: 'Ana', rating: 4, comment: 'Muy bien' } },
    ).expect(200);
    const id = added.body.data.addReview.id as string;

    const approved = await gql(
      `mutation($id: ID!) { setReviewState(id: $id, state: approved) { id state } }`,
      { id },
      tokenT1,
    ).expect(200);
    expect(approved.body.errors).toBeUndefined();
    expect(approved.body.data.setReviewState.state).toBe('approved');

    const summary = await gql(SUMMARY).expect(200);
    expect(summary.body.data.reviews.count).toBe(1);
    expect(summary.body.data.reviews.average).toBe(4);
    expect(summary.body.data.reviews.items[0].state).toBe('approved');
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

  it('myReviews returns every state and filters; anonymous is rejected', async () => {
    const anon = await gql(`{ myReviews { id } }`).expect(200);
    expect(anon.body.errors?.[0]?.extensions?.code).toBe('UNAUTHENTICATED');

    const all = await gql(`{ myReviews { id state } }`, {}, tokenT1).expect(200);
    expect(all.body.errors).toBeUndefined();
    expect(all.body.data.myReviews.length).toBeGreaterThanOrEqual(2);

    const rejected = await gql(`{ myReviews(state: rejected) { id state } }`, {}, tokenT1).expect(200);
    expect(rejected.body.data.myReviews).toEqual([]);
  });

  it('moderation is idempotent and rejects pending', async () => {
    const added = await gql(
      ADD,
      { input: { tenantSlug: SLUG, author: 'Idem', rating: 5, comment: 'Ok' } },
    ).expect(200);
    const id = added.body.data.addReview.id as string;

    const first = await gql(
      `mutation($id: ID!) { setReviewState(id: $id, state: rejected) { id state } }`,
      { id },
      tokenT1,
    ).expect(200);
    expect(first.body.data.setReviewState.state).toBe('rejected');

    const again = await gql(
      `mutation($id: ID!) { setReviewState(id: $id, state: rejected) { id state } }`,
      { id },
      tokenT1,
    ).expect(200);
    expect(again.body.errors).toBeUndefined();
    expect(again.body.data.setReviewState.state).toBe('rejected');

    const toPending = await gql(
      `mutation($id: ID!) { setReviewState(id: $id, state: pending) { id } }`,
      { id },
      tokenT1,
    ).expect(200);
    expect(toPending.body.errors?.[0]?.extensions?.code).toBe('VALIDATION_ERROR');
  });

  it('isolates tenants and rejects a foreign deletion', async () => {
    const added = await gql(
      ADD,
      { input: { tenantSlug: SLUG, author: 'Cross', rating: 5, comment: 'Ok' } },
    ).expect(200);
    const id = added.body.data.addReview.id as string;

    const foreignSet = await gql(
      `mutation($id: ID!) { setReviewState(id: $id, state: approved) { id } }`,
      { id },
      tokenT2,
    ).expect(200);
    expect(foreignSet.body.errors?.[0]?.extensions?.code).toBe('NOT_FOUND');

    const foreignDelete = await gql(
      `mutation($id: ID!) { deleteReview(id: $id) }`,
      { id },
      tokenT2,
    ).expect(200);
    expect(foreignDelete.body.errors?.[0]?.extensions?.code).toBe('NOT_FOUND');

    const anonDelete = await gql(`mutation($id: ID!) { deleteReview(id: $id) }`, { id }).expect(200);
    expect(anonDelete.body.errors?.[0]?.extensions?.code).toBe('UNAUTHENTICATED');

    const ownDelete = await gql(
      `mutation($id: ID!) { deleteReview(id: $id) }`,
      { id },
      tokenT1,
    ).expect(200);
    expect(ownDelete.body.data.deleteReview).toBe(true);
  });
});
