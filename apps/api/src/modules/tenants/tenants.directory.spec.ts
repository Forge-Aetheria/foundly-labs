import { describe, expect, it, vi } from 'vitest';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { TenantsService } from './tenants.service';

interface DirectoryRow {
  id: string;
  name: string;
  category: string;
  profile: {
    slug: string;
    bio: string | null;
    address: string | null;
    phone: string | null;
    logo: string | null;
    cover: string | null;
  } | null;
  availability: { weekday: number; startTime: string; endTime: string }[];
}

function makeRow(): DirectoryRow {
  return {
    id: 't1',
    name: 'Estudio Ana',
    category: 'Peluquería',
    profile: {
      slug: 'estudio-ana',
      bio: 'Estudio de referencia en Madrid.',
      address: 'Calle Mayor 7, Madrid',
      phone: '+34 612 345 678',
      logo: 'https://cdn/logo.png',
      cover: 'https://cdn/cover.png',
    },
    availability: [
      { weekday: 1, startTime: '10:00', endTime: '18:00' },
      { weekday: 1, startTime: '09:00', endTime: '17:00' },
      { weekday: 3, startTime: '11:00', endTime: '20:00' },
    ],
  };
}

function makeService(rows: DirectoryRow[]): {
  service: TenantsService;
  findMany: ReturnType<typeof vi.fn>;
} {
  const findMany = vi.fn(async () => rows);
  const client = { tenant: { findMany } };
  const service = new TenantsService({ client } as unknown as PrismaService);
  return { service, findMany };
}

describe('TenantsService.searchBusinesses (018-business-directory)', () => {
  it('maps eligible businesses to directory summaries with an aggregated schedule', async () => {
    const { service } = makeService([makeRow()]);
    const results = await service.searchBusinesses({});
    expect(results).toHaveLength(1);
    expect(results[0]).toEqual({
      tenantId: 't1',
      slug: 'estudio-ana',
      name: 'Estudio Ana',
      category: 'Peluquería',
      description: 'Estudio de referencia en Madrid.',
      address: 'Calle Mayor 7, Madrid',
      phone: '+34 612 345 678',
      logo: 'https://cdn/logo.png',
      cover: 'https://cdn/cover.png',
      schedule: [
        { weekday: 1, startTime: '09:00', endTime: '18:00' },
        { weekday: 3, startTime: '11:00', endTime: '20:00' },
      ],
    });
  });

  it('scopes to active, public businesses with a profile and at least one active service', async () => {
    const { service, findMany } = makeService([]);
    await service.searchBusinesses({});
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: 'active',
          isPublic: true,
          profile: { isNot: null },
          services: { some: { active: true } },
        }),
      }),
    );
    // No search term → no OR filter.
    expect(findMany.mock.calls[0]?.[0].where).not.toHaveProperty('OR');
  });

  it('searches name, category and address case-insensitively when a term is given', async () => {
    const { service, findMany } = makeService([]);
    await service.searchBusinesses({ query: '  Madrid  ' });
    const where = findMany.mock.calls[0]?.[0].where as { OR: unknown[] };
    expect(where.OR).toEqual([
      { name: { contains: 'Madrid', mode: 'insensitive' } },
      { category: { contains: 'Madrid', mode: 'insensitive' } },
      { profile: { is: { address: { contains: 'Madrid', mode: 'insensitive' } } } },
    ]);
  });

  it('applies a default limit, caps the maximum and honors the offset', async () => {
    const { service, findMany } = makeService([]);
    await service.searchBusinesses({});
    expect(findMany.mock.calls[0]?.[0]).toMatchObject({ take: 20, skip: 0 });

    await service.searchBusinesses({ limit: 500, offset: 40 });
    expect(findMany.mock.calls[1]?.[0]).toMatchObject({ take: 100, skip: 40 });
  });

  it('rejects invalid paging input with VALIDATION_ERROR and reads nothing', async () => {
    const { service, findMany } = makeService([]);
    await expect(service.searchBusinesses({ limit: 0 })).rejects.toMatchObject({
      extensions: { code: 'VALIDATION_ERROR' },
    });
    await expect(service.searchBusinesses({ offset: -1 })).rejects.toMatchObject({
      extensions: { code: 'VALIDATION_ERROR' },
    });
    expect(findMany).not.toHaveBeenCalled();
  });

  it('returns an empty list without an error when nothing matches', async () => {
    const { service } = makeService([]);
    await expect(service.searchBusinesses({ query: 'nada' })).resolves.toEqual([]);
  });

  it('handles a business with no availability (empty schedule)', async () => {
    const row = makeRow();
    row.availability = [];
    const { service } = makeService([row]);
    const results = await service.searchBusinesses({});
    expect(results[0]?.schedule).toEqual([]);
  });
});
