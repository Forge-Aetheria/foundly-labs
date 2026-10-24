import { Test } from '@nestjs/testing';
import { INestApplication, type ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { AppModule } from '../../app.module';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { SupabaseJwtGuard } from '../auth/jwt.guard';
import type { AuthUser } from '../auth/jwt.types';

const fakeUser: AuthUser = {
  sub: 'u-owner',
  role: 'authenticated',
  aud: 'authenticated',
  exp: 9_999_999_999,
  tenantId: 't1',
};

const notificationRow = {
  id: 'n1',
  tenantId: 't1',
  type: 'NEW_BOOKING',
  title: 'Nueva reserva online',
  message: 'Ana reservó Corte el 24/10 a las 10:00.',
  read: false,
  createdAt: new Date('2026-10-24T10:00:00.000Z'),
};

function makeFakeClient() {
  return {
    notification: {
      findMany: vi.fn(async () => [notificationRow]),
      count: vi.fn(async () => 3),
      findFirst: vi.fn(async () => notificationRow),
      update: vi.fn(async () => ({ ...notificationRow, read: true })),
      updateMany: vi.fn(async () => ({ count: 2 })),
      deleteMany: vi.fn(async (args: { where: { id: string; tenantId: string } }) =>
        args.where.id === notificationRow.id ? { count: 1 } : { count: 0 },
      ),
      create: vi.fn(async () => notificationRow),
    },
    tenant: {
      findUnique: vi.fn(async () => ({
        subscriptionPlan: 'FREE',
        subscriptionStatus: 'active',
        subscriptionExpiresAt: null,
      })),
    },
  };
}

async function buildApp(options: { authenticated: boolean }): Promise<INestApplication> {
  const builder = Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(PrismaService)
    .useValue({ client: makeFakeClient() } as unknown as PrismaService);

  if (options.authenticated) {
    builder.overrideGuard(SupabaseJwtGuard).useValue({
      canActivate: (context: ExecutionContext): boolean => {
        const ctx = GqlExecutionContext.create(context).getContext<{ user?: AuthUser }>();
        ctx.user = fakeUser;
        return true;
      },
    });
  }

  const moduleRef = await builder.compile();
  const app = moduleRef.createNestApplication();
  await app.init();
  return app;
}

describe('NotificationsResolver (GraphQL e2e, 020)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await buildApp({ authenticated: true });
  });

  afterAll(async () => {
    await app.close();
  });

  it('lists the caller notifications newest-first', async () => {
    const response = await request(app.getHttpServer())
      .post('/graphql')
      .send({ query: '{ notifications { id type title read createdAt } }' })
      .expect(200);

    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.notifications).toEqual([
      {
        id: 'n1',
        type: 'NEW_BOOKING',
        title: 'Nueva reserva online',
        read: false,
        createdAt: '2026-10-24T10:00:00.000Z',
      },
    ]);
  });

  it('returns the unread count', async () => {
    const response = await request(app.getHttpServer())
      .post('/graphql')
      .send({ query: '{ unreadNotificationCount }' })
      .expect(200);

    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.unreadNotificationCount).toBe(3);
  });

  it('marks one notification as read', async () => {
    const response = await request(app.getHttpServer())
      .post('/graphql')
      .send({ query: 'mutation { markNotificationRead(id: "n1") { id read } }' })
      .expect(200);

    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.markNotificationRead).toEqual({ id: 'n1', read: true });
  });

  it('marks all as read and returns the count', async () => {
    const response = await request(app.getHttpServer())
      .post('/graphql')
      .send({ query: 'mutation { markAllNotificationsRead }' })
      .expect(200);

    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.markAllNotificationsRead).toBe(2);
  });

  it('deletes a notification', async () => {
    const response = await request(app.getHttpServer())
      .post('/graphql')
      .send({ query: 'mutation { deleteNotification(id: "n1") }' })
      .expect(200);

    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.deleteNotification).toBe(true);
  });
});

describe('NotificationsResolver (anonymous)', () => {
  let anonApp: INestApplication;

  beforeAll(async () => {
    anonApp = await buildApp({ authenticated: false });
  });

  afterAll(async () => {
    await anonApp.close();
  });

  it('refuses anonymous access with UNAUTHENTICATED', async () => {
    const response = await request(anonApp.getHttpServer())
      .post('/graphql')
      .send({ query: '{ unreadNotificationCount }' })
      .expect(200);

    expect(response.body.errors?.[0]?.extensions?.code).toBe('UNAUTHENTICATED');
  });
});
