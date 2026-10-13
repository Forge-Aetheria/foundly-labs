import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { validationError } from '../../shared/tenant-scope';
import type { TenantScopeInput } from '../../shared/tenant-scope';

/** Storage-row view used across the store/service (createdAt as ISO string). */
export interface ReviewRow {
  id: string;
  tenantId: string;
  author: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export const REVIEWS_STORE = Symbol('REVIEWS_STORE');

/** Narrow persistence seam over the Prisma methods this module uses (replaced in tests). */
export interface ReviewsStore {
  resolveTenantId(scope: TenantScopeInput): Promise<string | null>;
  listByTenant(tenantId: string): Promise<ReviewRow[]>;
  create(
    tenantId: string,
    input: { author: string; rating: number; comment: string },
  ): Promise<ReviewRow>;
}

const reviewSelect = {
  id: true,
  tenantId: true,
  author: true,
  rating: true,
  comment: true,
  createdAt: true,
} as const;

interface ReviewSelectRow {
  id: string;
  tenantId: string;
  author: string;
  rating: number;
  comment: string;
  createdAt: Date;
}

function toRow(row: ReviewSelectRow): ReviewRow {
  return {
    id: row.id,
    tenantId: row.tenantId,
    author: row.author,
    rating: row.rating,
    comment: row.comment,
    createdAt: row.createdAt.toISOString(),
  };
}

/** Real implementation over the shared Prisma client (single persistence seam). */
@Injectable()
export class PrismaReviewsStore implements ReviewsStore {
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

  async listByTenant(tenantId: string): Promise<ReviewRow[]> {
    const rows = await this.prismaService.client.review.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      select: reviewSelect,
    });
    return rows.map(toRow);
  }

  async create(
    tenantId: string,
    input: { author: string; rating: number; comment: string },
  ): Promise<ReviewRow> {
    const row = await this.prismaService.client.review.create({
      data: {
        tenantId,
        author: input.author,
        rating: input.rating,
        comment: input.comment,
      },
      select: reviewSelect,
    });
    return toRow(row);
  }
}
