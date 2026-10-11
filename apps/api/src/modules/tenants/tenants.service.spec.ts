import { Test } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { TenantsService } from './tenants.service';
import { CreateTenantInput } from './tenants.types';

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

const duplicateError = Object.assign(new Error('Unique constraint failed'), {
  code: 'P2002',
});

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
          throw duplicateError;
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

describe('TenantsService (unit, 003-db-first-graphql-core)', () => {
  let service: TenantsService;

  beforeEach(async () => {
    vi.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        TenantsService,
        { provide: PrismaService, useValue: { client: fakeClient } as unknown as PrismaService },
      ],
    }).compile();
    service = moduleRef.get(TenantsService);
  });

  it('lists tenants with their public profile and services', async () => {
    const tenants = await service.findAll();
    expect(tenants).toHaveLength(1);
    expect(tenants[0]?.name).toBe('Estudio Ana');
    expect(tenants[0]?.profile?.slug).toBe('estudio-ana');
    expect(tenants[0]?.services).toHaveLength(1);
    expect(tenants[0]?.services[0]?.name).toBe('Corte');
    expect(fakeClient.tenant.findMany).toHaveBeenCalledTimes(1);
  });

  it('resolves a tenant by public slug and returns null when missing', async () => {
    const found = await service.findBySlug('estudio-ana');
    const missing = await service.findBySlug('no-existe');
    expect(found?.id).toBe('t1');
    expect(found?.profile?.slug).toBe('estudio-ana');
    expect(missing).toBeNull();
  });

  it('creates a tenant with its public profile and returns the aggregate', async () => {
    const input: CreateTenantInput = {
      name: 'Rona Piercing',
      category: 'Salud',
      timezone: 'America/Liberia',
      profile: { slug: 'rona-piercing' },
    };
    const created = await service.create(input);
    expect(created.id).toBe('t2');
    expect(created.profile?.slug).toBe('rona-piercing');
    expect(fakeClient.tenant.create).toHaveBeenCalledTimes(1);
  });

  it('rejects a duplicate slug with a CONFLICT error and persists nothing', async () => {
    const input: CreateTenantInput = {
      name: 'Otro',
      category: 'Salud',
      timezone: 'America/Liberia',
      profile: { slug: 'estudio-ana' },
    };
    await expect(service.create(input)).rejects.toMatchObject({
      extensions: { code: 'CONFLICT' },
    });
  });

  it('rejects an invalid or reserved slug with VALIDATION_ERROR before writing', async () => {
    const input: CreateTenantInput = {
      name: 'Otro',
      category: 'Salud',
      timezone: 'America/Liberia',
      profile: { slug: 'Mi Slug!' },
    };
    await expect(service.create(input)).rejects.toMatchObject({
      extensions: { code: 'VALIDATION_ERROR' },
    });
    expect(fakeClient.tenant.create).not.toHaveBeenCalled();
  });

  it('rejects malformed JSON brandColors/policies with VALIDATION_ERROR', async () => {
    const input: CreateTenantInput = {
      name: 'Otro',
      category: 'Salud',
      timezone: 'America/Liberia',
      profile: { slug: 'rona-piercing', brandColors: '{broken' },
    };
    await expect(service.create(input)).rejects.toMatchObject({
      extensions: { code: 'VALIDATION_ERROR' },
    });
    expect(fakeClient.tenant.create).not.toHaveBeenCalled();
  });
});
