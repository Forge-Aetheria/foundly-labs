import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { AppModule } from '../../app.module';
import { PrismaService } from '../../shared/prisma/prisma.service';

interface FakeProfile {
  id: string;
  slug: string;
  bio: string | null;
  address: string | null;
  phone: string | null;
  instagram: string | null;
  whatsapp: string | null;
  logo: string | null;
  cover: string | null;
  brandColors: unknown;
  policies: unknown;
}

interface FakeService {
  id: string;
  name: string;
  description: string | null;
  durationMinutes: number;
  priceCents: number;
  currency: string;
  category: string | null;
  active: boolean;
}

interface FakeTenant {
  id: string;
  name: string;
  category: string;
  status: string;
  timezone: string;
  currency: string;
  profile: FakeProfile | null;
  services: FakeService[];
}

const seededProfile: FakeProfile = {
  id: 'p1',
  slug: 'estudio-ana',
  bio: null,
  address: null,
  phone: null,
  instagram: null,
  whatsapp: null,
  logo: null,
  cover: null,
  brandColors: null,
  policies: ['cancelar 24h antes'],
};

const seededTenant: FakeTenant = {
  id: 't1',
  name: 'Estudio Ana',
  category: 'Salud & Belleza',
  status: 'active',
  timezone: 'America/Liberia',
  currency: 'EUR',
  profile: seededProfile,
  services: [
    {
      id: 's1',
      name: 'Corte',
      description: null,
      durationMinutes: 30,
      priceCents: 2500,
      currency: 'EUR',
      category: null,
      active: true,
    },
  ],
};

const fakeClient = {
  tenant: {
    findMany: vi.fn(async (): Promise<FakeTenant[]> => [seededTenant]),
    create: vi.fn(
      async (args: {
        data: {
          name: string;
          category: string;
          timezone: string;
          currency?: string | null;
          profile: { create: { slug: string } };
        };
      }): Promise<FakeTenant> => {
        const slug = args.data.profile.create.slug;
        if (slug === seededProfile.slug) {
          throw Object.assign(new Error('Unique constraint failed'), {
            code: 'P2002',
          });
        }
        return {
          id: 't2',
          name: args.data.name,
          category: args.data.category,
          status: 'active',
          timezone: args.data.timezone,
          currency: args.data.currency ?? 'EUR',
          profile: {
            id: 'p2',
            slug,
            bio: null,
            address: null,
            phone: null,
            instagram: null,
            whatsapp: null,
            logo: null,
            cover: null,
            brandColors: null,
            policies: null,
          },
          services: [],
        };
      },
    ),
  },
  businessProfile: {
    findUnique: vi.fn(
      async (args: { where: { slug: string } }): Promise<{ tenant: FakeTenant } | null> =>
        args.where.slug === seededProfile.slug ? { tenant: seededTenant } : null,
    ),
  },
};

describe('TenantsResolver (GraphQL e2e, 003-db-first-graphql-core)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue({ client: fakeClient } as unknown as PrismaService)
      .compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('lists tenants over POST /graphql', async () => {
    const response = await request(app.getHttpServer())
      .post('/graphql')
      .send({ query: '{ tenants { id name profile { slug } services { id name } } }' })
      .expect(200);

    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.tenants).toEqual([
      {
        id: 't1',
        name: 'Estudio Ana',
        profile: { slug: 'estudio-ana' },
        services: [{ id: 's1', name: 'Corte' }],
      },
    ]);
    expect(fakeClient.tenant.findMany).toHaveBeenCalled();
  });

  it('resolves a tenant by public slug and returns null when missing', async () => {
    const found = await request(app.getHttpServer())
      .post('/graphql')
      .send({ query: '{ tenant(slug: "estudio-ana") { id profile { slug } } }' })
      .expect(200);
    expect(found.body.errors).toBeUndefined();
    expect(found.body.data.tenant).toEqual({
      id: 't1',
      profile: { slug: 'estudio-ana' },
    });

    const missing = await request(app.getHttpServer())
      .post('/graphql')
      .send({ query: '{ tenant(slug: "no-existe") { id } }' })
      .expect(200);
    expect(missing.body.data.tenant).toBeNull();
  });

  it('creates a tenant with its public profile via mutation', async () => {
    const response = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query:
          'mutation { createTenant(input: { name: "Rona Piercing", category: "Salud", timezone: "America/Liberia", profile: { slug: "rona-piercing" } }) { id profile { slug } } }',
      })
      .expect(200);

    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.createTenant).toEqual({
      id: 't2',
      profile: { slug: 'rona-piercing' },
    });
  });

  it('rejects a duplicate slug with a CONFLICT GraphQL error and persists nothing', async () => {
    const response = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query:
          'mutation { createTenant(input: { name: "Otro", category: "Salud", timezone: "America/Liberia", profile: { slug: "estudio-ana" } }) { id } }',
      })
      .expect(200);

    expect(response.body.errors).toBeDefined();
    expect(response.body.errors?.[0]?.extensions?.code).toBe('CONFLICT');
  });
});
