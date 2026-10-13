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
import { GALLERY_STORE } from './gallery.store';
import { createMemoryGalleryStore, type MemoryGalleryStore } from './gallery.test-store';

const T1 = 'tenant-1';
const T2 = 'tenant-2';
const SLUG = 'estudio-ana';

describe('Gallery e2e (012-gallery-management)', () => {
  let app: INestApplication;
  let store: MemoryGalleryStore;
  let publicJwk: TestJwk;
  let privateJwk: TestJwk;
  let tokenT1: string;
  let tokenT2: string;

  beforeAll(async () => {
    process.env.SUPABASE_AUTH_URL = TEST_AUTH_URL;
    store = createMemoryGalleryStore();
    store.tenantBySlug(SLUG, T1);
    ({ publicJwk, privateJwk } = await makeTestKeys());
    tokenT1 = await signTestToken(privateJwk, { sub: `user-${T1}`, tenantId: T1 });
    tokenT2 = await signTestToken(privateJwk, { sub: `user-${T2}`, tenantId: T2 });
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(GALLERY_STORE)
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

  const ADD = `mutation($input: AddGalleryItemInput!) {
    addGalleryItem(input: $input) { id url title category order }
  }`;
  const REMOVE = `mutation($id: ID!) { removeGalleryItem(id: $id) }`;

  it('serves the public gallery by slug (empty then populated, in order)', async () => {
    const empty = await gql(`{ gallery(tenantSlug: "${SLUG}") { id } }`).expect(200);
    expect(empty.body.data.gallery).toEqual([]);

    const added = await gql(ADD, { input: { url: 'https://example.com/1.jpg', title: 'Uno' } }, tokenT1).expect(200);
    expect(added.body.errors).toBeUndefined();
    const id = added.body.data.addGalleryItem.id as string;

    const list = await gql(`{ gallery(tenantSlug: "${SLUG}") { id order } }`).expect(200);
    expect(list.body.data.gallery.map((r: { id: string }) => r.id)).toEqual([id]);
  });

  it('rejects anonymous adds with UNAUTHENTICATED', async () => {
    const res = await gql(ADD, { input: { url: 'https://example.com/anon.jpg' } }).expect(200);
    expect(res.body.errors?.[0]?.extensions?.code).toBe('UNAUTHENTICATED');
  });

  it('isolates tenants and rejects a foreign removal', async () => {
    const added = await gql(ADD, { input: { url: 'https://example.com/t1.jpg' } }, tokenT1).expect(200);
    const id = added.body.data.addGalleryItem.id as string;

    const t2List = await gql(`{ gallery(tenantId: "${T2}") { id } }`, {}, tokenT2).expect(200);
    expect(t2List.body.data.gallery).toEqual([]);

    const foreign = await gql(REMOVE, { id }, tokenT2).expect(200);
    expect(foreign.body.errors?.[0]?.extensions?.code).toBe('NOT_FOUND');

    const own = await gql(REMOVE, { id }, tokenT1).expect(200);
    expect(own.body.data.removeGalleryItem).toBe(true);
  });

  it('rejects duplicate URLs with CONFLICT and invalid input with VALIDATION_ERROR', async () => {
    await gql(ADD, { input: { url: 'https://example.com/dup.jpg' } }, tokenT1).expect(200);
    const dup = await gql(ADD, { input: { url: 'https://example.com/dup.jpg' } }, tokenT1).expect(200);
    expect(dup.body.errors?.[0]?.extensions?.code).toBe('CONFLICT');

    const bad = await gql(ADD, { input: { url: 'not-a-url' } }, tokenT1).expect(200);
    expect(bad.body.errors?.[0]?.extensions?.code).toBe('VALIDATION_ERROR');
  });
});
