import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import type { SubscriptionPlan, SubscriptionStatus } from '../subscription/subscription.types';

/** Storage-row view for the platform management table. */
export interface ManagedBusinessRow {
  tenantId: string;
  slug: string;
  name: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  expiresAt: Date | null;
}

/** Partial subscription patch (only provided fields change). */
export interface SubscriptionPatch {
  plan?: SubscriptionPlan;
  status?: SubscriptionStatus;
  expiresAt?: Date | null;
}

export const PLATFORM_STORE = Symbol('PLATFORM_STORE');

/** Narrow persistence seam over the Prisma methods the platform module uses. */
export interface PlatformStore {
  countTenants(): Promise<number>;
  countActiveTenants(): Promise<number>;
  countByPlan(): Promise<{ plan: SubscriptionPlan; count: number }[]>;
  listTenants(query: string | null, limit: number, offset: number): Promise<ManagedBusinessRow[]>;
  getTenant(tenantId: string): Promise<ManagedBusinessRow | null>;
  updateSubscription(
    tenantId: string,
    patch: SubscriptionPatch,
  ): Promise<ManagedBusinessRow | null>;
}

const tenantSelect = {
  id: true,
  name: true,
  subscriptionPlan: true,
  subscriptionStatus: true,
  subscriptionExpiresAt: true,
  profile: { select: { slug: true } },
} as const;

/** Real implementation over the shared Prisma client (single persistence seam). */
@Injectable()
export class PrismaPlatformStore implements PlatformStore {
  constructor(private readonly prismaService: PrismaService) {}

  countTenants(): Promise<number> {
    return this.prismaService.client.tenant.count();
  }

  countActiveTenants(): Promise<number> {
    return this.prismaService.client.tenant.count({ where: { status: 'active' } });
  }

  async countByPlan(): Promise<{ plan: SubscriptionPlan; count: number }[]> {
    const rows = await this.prismaService.client.tenant.groupBy({
      by: ['subscriptionPlan'],
      _count: { _all: true },
    });
    return rows.map((row) => ({ plan: row.subscriptionPlan, count: row._count._all }));
  }

  async listTenants(
    query: string | null,
    limit: number,
    offset: number,
  ): Promise<ManagedBusinessRow[]> {
    const rows = await this.prismaService.client.tenant.findMany({
      where: query
        ? {
            OR: [
              { name: { contains: query, mode: 'insensitive' } },
              { profile: { is: { slug: { contains: query, mode: 'insensitive' } } } },
            ],
          }
        : {},
      select: tenantSelect,
      orderBy: { name: 'asc' },
      take: limit,
      skip: offset,
    });
    return rows.map((row) => this.toRow(row));
  }

  async getTenant(tenantId: string): Promise<ManagedBusinessRow | null> {
    const row = await this.prismaService.client.tenant.findUnique({
      where: { id: tenantId },
      select: tenantSelect,
    });
    return row ? this.toRow(row) : null;
  }

  async updateSubscription(
    tenantId: string,
    patch: SubscriptionPatch,
  ): Promise<ManagedBusinessRow | null> {
    const data = {
      ...(patch.plan !== undefined ? { subscriptionPlan: patch.plan } : {}),
      ...(patch.status !== undefined ? { subscriptionStatus: patch.status } : {}),
      ...(patch.expiresAt !== undefined ? { subscriptionExpiresAt: patch.expiresAt } : {}),
    };
    if (Object.keys(data).length > 0) {
      const { count } = await this.prismaService.client.tenant.updateMany({
        where: { id: tenantId },
        data,
      });
      if (count === 0) {
        return null;
      }
    }
    return this.getTenant(tenantId);
  }

  private toRow(row: {
    id: string;
    name: string;
    subscriptionPlan: SubscriptionPlan;
    subscriptionStatus: SubscriptionStatus;
    subscriptionExpiresAt: Date | null;
    profile: { slug: string } | null;
  }): ManagedBusinessRow {
    return {
      tenantId: row.id,
      slug: row.profile?.slug ?? '',
      name: row.name,
      plan: row.subscriptionPlan,
      status: row.subscriptionStatus,
      expiresAt: row.subscriptionExpiresAt,
    };
  }
}
