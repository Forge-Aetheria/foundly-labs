import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { validationError } from '../../shared/tenant-scope';
import type { TenantScopeInput } from '../../shared/tenant-scope';

/** Storage-row view used across the store/service (instants as ISO strings). */
export interface TimeBlockRow {
  id: string;
  tenantId: string;
  specialistId: string | null;
  startAt: string;
  endAt: string;
  reason: string | null;
}

export interface CreateTimeBlockRow {
  specialistId: string | null;
  startAt: Date;
  endAt: Date;
  reason: string | null;
}

export const TIME_BLOCK_STORE = Symbol('TIME_BLOCK_STORE');

/** Narrow persistence seam over the Prisma methods this module uses (replaced in tests). */
export interface TimeBlockStore {
  resolveTenantId(scope: TenantScopeInput): Promise<string | null>;
  list(tenantId: string, specialistId?: string | null): Promise<TimeBlockRow[]>;
  specialistBelongsToTenant(specialistId: string, tenantId: string): Promise<boolean>;
  create(tenantId: string, input: CreateTimeBlockRow): Promise<TimeBlockRow>;
  removeById(id: string, tenantId: string): Promise<boolean>;
}

const timeBlockSelect = {
  id: true,
  tenantId: true,
  specialistId: true,
  startAt: true,
  endAt: true,
  reason: true,
} as const;

interface TimeBlockSelectRow {
  id: string;
  tenantId: string;
  specialistId: string | null;
  startAt: Date;
  endAt: Date;
  reason: string | null;
}

function toRow(row: TimeBlockSelectRow): TimeBlockRow {
  return {
    id: row.id,
    tenantId: row.tenantId,
    specialistId: row.specialistId,
    startAt: row.startAt.toISOString(),
    endAt: row.endAt.toISOString(),
    reason: row.reason,
  };
}

/** Real implementation over the shared Prisma client (single persistence seam). */
@Injectable()
export class PrismaTimeBlockStore implements TimeBlockStore {
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

  async list(tenantId: string, specialistId?: string | null): Promise<TimeBlockRow[]> {
    const where = specialistId
      ? { tenantId, OR: [{ specialistId }, { specialistId: null }] }
      : { tenantId };
    const rows = await this.prismaService.client.timeBlock.findMany({
      where,
      orderBy: { startAt: 'asc' },
      select: timeBlockSelect,
    });
    return rows.map(toRow);
  }

  async specialistBelongsToTenant(specialistId: string, tenantId: string): Promise<boolean> {
    const found = await this.prismaService.client.specialist.findFirst({
      where: { id: specialistId, tenantId },
      select: { id: true },
    });
    return found !== null;
  }

  async create(tenantId: string, input: CreateTimeBlockRow): Promise<TimeBlockRow> {
    const row = await this.prismaService.client.timeBlock.create({
      data: {
        tenantId,
        specialistId: input.specialistId,
        startAt: input.startAt,
        endAt: input.endAt,
        reason: input.reason,
      },
      select: timeBlockSelect,
    });
    return toRow(row);
  }

  async removeById(id: string, tenantId: string): Promise<boolean> {
    const result = await this.prismaService.client.timeBlock.deleteMany({
      where: { id, tenantId },
    });
    return result.count > 0;
  }
}
