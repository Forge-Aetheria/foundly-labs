import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AppModule } from '../../app.module';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { JWT_JWKS } from './jwt.service';
import {
  makeLocalJwks,
  makeTestKeys,
  signTestToken,
  TEST_AUTH_URL,
  type TestJwk,
} from './jwt.test-helper';

describe('JwtResolver (GraphQL e2e, 008-supabase-jwt-auth)', () => {
  let app: INestApplication;
  let publicJwk: TestJwk;
  let privateJwk: TestJwk;

  beforeAll(async () => {
    process.env.SUPABASE_AUTH_URL = TEST_AUTH_URL;
    ({ publicJwk, privateJwk } = await makeTestKeys());
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
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

  function gql(query: string, token?: string): request.Test {
    const req = request(app.getHttpServer()).post('/graphql').send({ query });
    if (token) {
      req.set('Authorization', `Bearer ${token}`);
    }
    return req;
  }

  it('rejects viewer without a token with UNAUTHENTICATED', async () => {
    const response = await gql('query { viewer { sub email role aud } }').expect(200);
    expect(response.body.data).toBeNull();
    expect(response.body.errors?.[0]?.extensions?.code).toBe('UNAUTHENTICATED');
  });

  it('returns the identity for a valid token', async () => {
    const token = await signTestToken(privateJwk, {
      sub: 'user-9',
      email: 'a@foundly.dev',
    });
    const response = await gql('query { viewer { sub email role aud } }', token).expect(200);
    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.viewer).toEqual({
      sub: 'user-9',
      email: 'a@foundly.dev',
      role: 'authenticated',
      aud: 'authenticated',
    });
  });

  it('rejects an expired token with UNAUTHENTICATED', async () => {
    const token = await signTestToken(privateJwk, { sub: 'u1', expiresIn: '-1h' });
    const response = await gql('query { viewer { sub } }', token).expect(200);
    expect(response.body.errors?.[0]?.extensions?.code).toBe('UNAUTHENTICATED');
  });

  it('keeps a public query working while protected ops reject', async () => {
    const publicResponse = await request(app.getHttpServer())
      .post('/graphql')
      .send({ query: '{ health { service status database } }' })
      .expect(200);
    expect(publicResponse.body.errors).toBeUndefined();
    expect(publicResponse.body.data.health.status).toBe('ok');

    const viewer = await gql('query { viewer { sub } }').expect(200);
    expect(viewer.body.errors?.[0]?.extensions?.code).toBe('UNAUTHENTICATED');
  });
});