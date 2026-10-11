import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { AppModule } from '../../app.module';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { AuthService } from './auth.service';

const SECRET = 'test-secret';

const fakeClient = {
  tenant: {
    findUnique: vi.fn(
      async (args: {
        where: { id: string };
      }): Promise<{ id: string; status: string; plan: string | null } | null> => {
        if (args.where.id === 't1') {
          return { id: 't1', status: 'active', plan: 'book' };
        }
        if (args.where.id === 't2') {
          return { id: 't2', status: 'suspended', plan: null };
        }
        if (args.where.id === 't3') {
          return { id: 't3', status: 'active', plan: null };
        }
        return null;
      },
    ),
  },
};

describe('AuthResolver (GraphQL e2e, 006-foundly-pass-auth)', () => {
  let app: INestApplication;
  let authService: AuthService;

  beforeAll(async () => {
    process.env.FOUNDLY_PASS_SECRET = SECRET;
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue({ client: fakeClient } as unknown as PrismaService)
      .compile();
    app = moduleRef.createNestApplication();
    await app.init();
    authService = moduleRef.get(AuthService);
  });

  afterAll(async () => {
    delete process.env.FOUNDLY_PASS_SECRET;
    await app.close();
  });

  function bearer(tenantId: string): string {
    const token = authService.signSession({
      userId: 'u1',
      tenantId,
      role: 'owner',
    });
    return `Bearer ${token}`;
  }

  it('rejects protected queries without a token with UNAUTHENTICATED', async () => {
    const response = await request(app.getHttpServer())
      .post('/graphql')
      .send({ query: '{ me { userId role tenant { id } } }' })
      .expect(200);
    expect(response.body.errors?.[0]?.extensions?.code).toBe('UNAUTHENTICATED');
  });

  it('returns the session identity and tenant for a valid token', async () => {
    const response = await request(app.getHttpServer())
      .post('/graphql')
      .set('Authorization', bearer('t1'))
      .send({
        query: '{ me { userId role tenant { id status plan } } }',
      })
      .expect(200);

    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.me).toEqual({
      userId: 'u1',
      role: 'owner',
      tenant: { id: 't1', status: 'active', plan: 'book' },
    });
  });

  it('returns the current tenant for a valid token', async () => {
    const response = await request(app.getHttpServer())
      .post('/graphql')
      .set('Authorization', bearer('t1'))
      .send({ query: '{ currentTenant { id status plan } }' })
      .expect(200);

    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.currentTenant).toEqual({
      id: 't1',
      status: 'active',
      plan: 'book',
    });
  });

  it('forbids a suspended tenant with a valid token', async () => {
    const response = await request(app.getHttpServer())
      .post('/graphql')
      .set('Authorization', bearer('t2'))
      .send({ query: '{ me { userId } }' })
      .expect(200);

    expect(response.body.errors?.[0]?.extensions?.code).toBe('FORBIDDEN');
  });

  it('enables the book capability for a tenant with the book plan', async () => {
    const response = await request(app.getHttpServer())
      .post('/graphql')
      .set('Authorization', bearer('t1'))
      .send({ query: '{ bookCapability { tenantId enabled } }' })
      .expect(200);

    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.bookCapability).toEqual({
      tenantId: 't1',
      enabled: true,
    });
  });

  it('forbids the book capability for a tenant without the plan', async () => {
    const response = await request(app.getHttpServer())
      .post('/graphql')
      .set('Authorization', bearer('t3'))
      .send({ query: '{ bookCapability { tenantId enabled } }' })
      .expect(200);

    expect(response.body.errors?.[0]?.extensions?.code).toBe('FORBIDDEN');
  });
});
