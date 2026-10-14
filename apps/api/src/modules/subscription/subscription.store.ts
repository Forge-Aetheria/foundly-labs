import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import type { SubscriptionPlan, SubscriptionStatus } from './subscription.types';

/** Storage-row view used across the store/service. */
export interface SubscriptionRow {
  tenantId: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  expiresAt: Date | null;
}

/** The two countable plan limits. */
export type UsageKind = 'services' | 'team';

export const SUBSCRIPTION_STORE = Symbol('SUBSCRIPTION_STORE');

/** Narrow persistence seam over the Prisma methods this module uses (replaced in tests). */
export interface SubscriptionStore {
  getTenantSubscription(tenantId: string): Promise<SubscriptionRow | null>;
  countActive(tenantId: string, kind: UsageKind): Promise<number>;
}

/** Real implementation over the shared Prisma client (single persistence seam). */
@Injectable()
export class PrismaSubscriptionStore implements SubscriptionStore {
  constructor(private readonly prismaService: PrismaService) {}

  async getTenantSubscription(tenantId: string): Promise<SubscriptionRow | null> {
    const row = await this.prismaService.client.tenant.findUnique({
      where: { id: tenantId },
      select: {
        id: true,
        subscriptionPlan: true,
        subscriptionStatus: true,
        subscriptionExpiresAt: true,
      },
    });
    if (!row) {
      return null;
    }
    return {
      tenantId: row.id,
      plan: row.subscriptionPlan,
      status: row.subscriptionStatus,
      expiresAt: row.subscriptionExpiresAt,
    };
  }

  countActive(tenantId: string, kind: UsageKind): Promise<number> {
    if (kind === 'services') {
      return this.prismaService.client.service.count({ where: { tenantId, active: true } });
    }
    return this.prismaService.client.specialist.count({ where: { tenantId, active: true } });
  }
}
