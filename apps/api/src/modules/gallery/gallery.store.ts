import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { validationError } from '../../shared/tenant-scope';
import type { TenantScopeInput } from '../../shared/tenant-scope';
import type { AddGalleryItemInput } from './gallery.types';

/** Storage-row view used across the store/service (GraphQL `order` = persisted `sortOrder`). */
export interface GalleryRow {
  id: string;
  tenantId: string;
  url: string;
  title: string | null;
  description: string | null;
  category: string | null;
  order: number;
}

export const GALLERY_STORE = Symbol('GALLERY_STORE');

/** Narrow persistence seam over the Prisma methods this module uses (replaced in tests). */
export interface GalleryStore {
  resolveTenantId(scope: TenantScopeInput): Promise<string | null>;
  listByTenant(tenantId: string): Promise<GalleryRow[]>;
  findByUrl(tenantId: string, url: string): Promise<GalleryRow | null>;
  nextOrder(tenantId: string): Promise<number>;
  create(tenantId: string, input: AddGalleryItemInput, order: number): Promise<GalleryRow>;
  removeById(id: string, tenantId: string): Promise<boolean>;
}

const gallerySelect = {
  id: true,
  tenantId: true,
  url: true,
  title: true,
  description: true,
  category: true,
  sortOrder: true,
} as const;

interface GallerySelectRow {
  id: string;
  tenantId: string;
  url: string;
  title: string | null;
  description: string | null;
  category: string | null;
  sortOrder: number;
}

function toRow(row: GallerySelectRow): GalleryRow {
  return {
    id: row.id,
    tenantId: row.tenantId,
    url: row.url,
    title: row.title,
    description: row.description,
    category: row.category,
    order: row.sortOrder,
  };
}

/** Real implementation over the shared Prisma client (single persistence seam). */
@Injectable()
export class PrismaGalleryStore implements GalleryStore {
  constructor(private readonly prismaService: PrismaService) {}

  async resolveTenantId(scope: TenantScopeInput): Promise<string | null> {
    const { tenantId, tenantSlug } = scope;
    if (!tenantId && !tenantSlug) {
      throw validationError('Provide tenantId or tenantSlug');
    }
    if (tenantId) {
      return tenantId;
    }
    const profile = await this.prismaService.client.businessProfile.findUnique({
      where: { slug: tenantSlug ?? '' },
      select: { tenantId: true },
    });
    return profile?.tenantId ?? null;
  }

  async listByTenant(tenantId: string): Promise<GalleryRow[]> {
    const rows = await this.prismaService.client.galleryPhoto.findMany({
      where: { tenantId },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      select: gallerySelect,
    });
    return rows.map(toRow);
  }

  async findByUrl(tenantId: string, url: string): Promise<GalleryRow | null> {
    const row = await this.prismaService.client.galleryPhoto.findFirst({
      where: { tenantId, url },
      select: gallerySelect,
    });
    return row ? toRow(row) : null;
  }

  async nextOrder(tenantId: string): Promise<number> {
    const last = await this.prismaService.client.galleryPhoto.findFirst({
      where: { tenantId },
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    });
    return (last?.sortOrder ?? -1) + 1;
  }

  async create(tenantId: string, input: AddGalleryItemInput, order: number): Promise<GalleryRow> {
    const row = await this.prismaService.client.galleryPhoto.create({
      data: {
        tenantId,
        url: input.url,
        title: input.title ?? null,
        description: input.description ?? null,
        category: input.category ?? null,
        sortOrder: order,
      },
      select: gallerySelect,
    });
    return toRow(row);
  }

  async removeById(id: string, tenantId: string): Promise<boolean> {
    const result = await this.prismaService.client.galleryPhoto.deleteMany({
      where: { id, tenantId },
    });
    return result.count > 0;
  }
}
