import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { TenantsService } from './tenants.service';
import { CreateTenantInput, UpdateBusinessProfileInput } from './tenants.types';

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
  isPublic: boolean;
  profile: FakeProfile | null;
  services: FakeService[];
}

function makeProfile(overrides: Partial<FakeProfile> = {}): FakeProfile {
  return {
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
    policies: null,
    ...overrides,
  };
}

function makeTenant(profile: FakeProfile | null = makeProfile()): FakeTenant {
  return {
    id: 't1',
    name: 'Estudio Ana',
    category: 'Salud & Belleza',
    status: 'active',
    timezone: 'Europe/Madrid',
    currency: 'EUR',
    isPublic: true,
    profile,
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
}

const duplicateError = Object.assign(new Error('Unique constraint failed'), { code: 'P2002' });

const TAKEN_SLUG = 'slug-ocupado';

function makeFakeClient(tenant: FakeTenant) {
  return {
    tenant: {
      findMany: vi.fn(async (): Promise<FakeTenant[]> => [tenant]),
      findUnique: vi.fn(
        async (args: { include?: unknown; select?: unknown }): Promise<unknown> => {
          if (args.include) return tenant;
          return { id: tenant.id, profile: tenant.profile ? { id: tenant.profile.id } : null };
        },
      ),
      update: vi.fn(async (args: { data: Record<string, unknown> }): Promise<FakeTenant> => {
        Object.assign(tenant, args.data);
        return tenant;
      }),
      create: vi.fn(async (args: { data: { profile: { create: { slug: string } } } }): Promise<FakeTenant> => {
        const slug = args.data.profile.create.slug;
        if (slug === 'estudio-ana') throw duplicateError;
        tenant.profile = makeProfile({ id: 'p2', slug });
        return tenant;
      }),
    },
    businessProfile: {
      findUnique: vi.fn(async (args: { where: { slug?: string } }): Promise<unknown> => {
        if (args.where.slug) {
          return args.where.slug === tenant.profile?.slug ? { tenant } : null;
        }
        return null;
      }),
      update: vi.fn(
        async (args: { where: { tenantId: string }; data: Record<string, unknown> }): Promise<FakeProfile> => {
          if (args.data.slug === TAKEN_SLUG) throw duplicateError;
          if (tenant.profile) Object.assign(tenant.profile, args.data);
          return tenant.profile as FakeProfile;
        },
      ),
      create: vi.fn(async (args: { data: Record<string, unknown> }): Promise<FakeProfile> => {
        tenant.profile = { ...makeProfile(), ...(args.data as unknown as FakeProfile) };
        return tenant.profile;
      }),
    },
  };
}

function scoped(tenantId?: string): { tenantId?: string } {
  return { tenantId };
}

describe('TenantsService (unit, 003-db-first-graphql-core; 013 profile update)', () => {
  let service: TenantsService;
  let tenant: FakeTenant;
  let client: ReturnType<typeof makeFakeClient>;

  beforeEach(() => {
    tenant = makeTenant();
    client = makeFakeClient(tenant);
    service = new TenantsService({ client } as unknown as PrismaService);
  });

  it('lists tenants with their public profile and services', async () => {
    const tenants = await service.findAll();
    expect(tenants).toHaveLength(1);
    expect(tenants[0]?.name).toBe('Estudio Ana');
    expect(tenants[0]?.profile?.slug).toBe('estudio-ana');
    expect(tenants[0]?.services).toHaveLength(1);
  });

  it('resolves a tenant by public slug and returns null when missing', async () => {
    const found = await service.findBySlug('estudio-ana');
    const missing = await service.findBySlug('no-existe');
    expect(found?.id).toBe('t1');
    expect(missing).toBeNull();
  });

  it('creates a tenant with its public profile and returns the aggregate', async () => {
    const input: CreateTenantInput = {
      name: 'Rona Piercing',
      category: 'Salud',
      timezone: 'Europe/Madrid',
      profile: { slug: 'rona-piercing' },
    };
    const created = await service.create(input);
    expect(created.profile?.slug).toBe('rona-piercing');
  });

  it('rejects a duplicate slug with a CONFLICT error and persists nothing', async () => {
    const input: CreateTenantInput = {
      name: 'Otro',
      category: 'Salud',
      timezone: 'Europe/Madrid',
      profile: { slug: 'estudio-ana' },
    };
    await expect(service.create(input)).rejects.toMatchObject({ extensions: { code: 'CONFLICT' } });
  });

  it('rejects an invalid or reserved slug with VALIDATION_ERROR before writing', async () => {
    const input: CreateTenantInput = {
      name: 'Otro',
      category: 'Salud',
      timezone: 'Europe/Madrid',
      profile: { slug: 'Mi Slug!' },
    };
    await expect(service.create(input)).rejects.toMatchObject({
      extensions: { code: 'VALIDATION_ERROR' },
    });
  });

  it('rejects malformed JSON brandColors/policies with VALIDATION_ERROR', async () => {
    const input: CreateTenantInput = {
      name: 'Otro',
      category: 'Salud',
      timezone: 'Europe/Madrid',
      profile: { slug: 'rona-piercing', brandColors: '{broken' },
    };
    await expect(service.create(input)).rejects.toMatchObject({
      extensions: { code: 'VALIDATION_ERROR' },
    });
  });

  it('updates the profile fields and persists policies (partial update keeps the rest)', async () => {
    const input: UpdateBusinessProfileInput = {
      bio: 'Estudio de referencia',
      address: 'Calle Mayor 7',
      instagram: 'https://instagram.com/estudioana',
      policies: [{ title: 'Cancelación', body: 'Avisa con 24 h.' }],
    };
    const updated = await service.updateProfile(scoped('t1'), input);
    expect(updated.profile?.bio).toBe('Estudio de referencia');
    expect(updated.profile?.address).toBe('Calle Mayor 7');
    expect(updated.profile?.policies).toEqual([
      { title: 'Cancelación', body: 'Avisa con 24 h.' },
    ]);
    // name/category untouched (partial update)
    expect(updated.name).toBe('Estudio Ana');
  });

  it('reads structured policies on the public profile (empty when none)', async () => {
    tenant.profile = makeProfile({ policies: [{ title: 'Cancelación', body: '24h' }] });
    const found = await service.findBySlug('estudio-ana');
    expect(found?.profile?.policies).toEqual([{ title: 'Cancelación', body: '24h' }]);

    tenant.profile = makeProfile({ policies: null });
    const empty = await service.findBySlug('estudio-ana');
    expect(empty?.profile?.policies).toEqual([]);
  });

  it('rejects an anonymous profile update with UNAUTHENTICATED', async () => {
    await expect(
      service.updateProfile(undefined, { bio: 'x' }),
    ).rejects.toMatchObject({ extensions: { code: 'UNAUTHENTICATED' } });
    await expect(
      service.updateProfile({}, { bio: 'x' }),
    ).rejects.toMatchObject({ extensions: { code: 'UNAUTHENTICATED' } });
  });

  it('rejects a malformed URL with VALIDATION_ERROR', async () => {
    await expect(
      service.updateProfile(scoped('t1'), { instagram: 'not-a-url' }),
    ).rejects.toMatchObject({ extensions: { code: 'VALIDATION_ERROR' } });
  });

  it('rejects a taken slug with CONFLICT and preserves the previous value', async () => {
    await expect(
      service.updateProfile(scoped('t1'), { slug: TAKEN_SLUG }),
    ).rejects.toMatchObject({ extensions: { code: 'CONFLICT' } });
    expect(tenant.profile?.slug).toBe('estudio-ana');
  });

  it('rejects half-empty policies with VALIDATION_ERROR', async () => {
    await expect(
      service.updateProfile(scoped('t1'), { policies: [{ title: '', body: 'x' }] }),
    ).rejects.toMatchObject({ extensions: { code: 'VALIDATION_ERROR' } });
  });

  it('toggles the public page visibility (isPublic)', async () => {
    expect(tenant.isPublic).toBe(true);
    const updated = await service.updateProfile(scoped('t1'), { isPublic: false });
    expect(updated.isPublic).toBe(false);
    // Other tenant/profile fields are preserved by the partial update.
    expect(updated.name).toBe('Estudio Ana');
    expect(updated.profile?.slug).toBe('estudio-ana');
  });

  it('exposes isPublic on the aggregate read', async () => {
    const found = await service.findBySlug('estudio-ana');
    expect(found?.isPublic).toBe(true);
  });
});
