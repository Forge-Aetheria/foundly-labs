import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { validationError } from '../../shared/tenant-scope';
import type { TenantScopeInput } from '../../shared/tenant-scope';
import type { ReviewState } from './reviews.types';

/** Storage-row view used across the store/service (createdAt as ISO string). */
export interface ReviewRow {
  id: string;
  tenantId: string;
  author: string;
  rating: number;
  comment: string;
  state: ReviewState;
  createdAt: string;
}

export const REVIEWS_STORE = Symbol('REVIEWS_STORE');

/** Narrow persistence seam over the Prisma methods this module uses (replaced in tests). */
export interface ReviewsStore {
  resolveTenantId(scope: TenantScopeInput): Promise<string | null>;
  listByTenant(tenantId: string, state?: ReviewState): Promise<ReviewRow[]>;
  create(
    tenantId: string,
    input: { author: string; rating: number; comment: string },
  ): Promise<ReviewRow>;
  setState(id: string, tenantId: string, state: ReviewState): Promise<ReviewRow | null>;
  deleteById(id: string, tenantId: string): Promise<boolean>;
}

const reviewSelect = {
  id: true,
  tenantId: true,
  author: true,
  rating: true,
  comment: true,
  state: true,
  createdAt: true,
} as const;

interface ReviewSelectRow {
  id: string;
  tenantId: string;
  author: string;
  rating: number;
  comment: string;
  state: ReviewState;
  createdAt: Date;
}

function toRow(row: ReviewSelectRow): ReviewRow {
  return {
    id: row.id,
    tenantId: row.tenantId,
    author: row.author,
    rating: row.rating,
    comment: row.comment,
    state: row.state,
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

  async listByTenant(tenantId: string, state?: ReviewState): Promise<ReviewRow[]> {
    const rows = await this.prismaService.client.review.findMany({
      where: state ? { tenantId, state } : { tenantId },
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
        state: 'pending',
      },
      select: reviewSelect,
    });
    return toRow(row);
  }

  async setState(id: string, tenantId: string, state: ReviewState): Promise<ReviewRow | null> {
    const { count } = await this.prismaService.client.review.updateMany({
      where: { id, tenantId },
      data: { state },
    });
    if (count === 0) {
      return null;
    }
    const row = await this.prismaService.client.review.findUnique({
      where: { id },
      select: reviewSelect,
    });
    return row ? toRow(row) : null;
  }

  async deleteById(id: string, tenantId: string): Promise<boolean> {
    const { count } = await this.prismaService.client.review.deleteMany({
      where: { id, tenantId },
    });
    return count > 0;
  }
}
