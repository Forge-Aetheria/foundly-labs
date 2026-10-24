import { Injectable } from '@nestjs/common';
import type { NotificationType } from '@foundly/database';
import { PrismaService } from '../../shared/prisma/prisma.service';

/** Storage-row view of a notification (Prisma returns `createdAt` as a Date). */
export interface NotificationRow {
  id: string;
  tenantId: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
}

export interface NotificationCreateInput {
  tenantId: string;
  type: NotificationType;
  title: string;
  message: string;
}

export interface NotificationListOptions {
  read?: boolean | null;
  limit: number;
  offset: number;
}

/** The subscription fields needed to derive expiry notifications. */
export interface NotificationSubscriptionState {
  plan: string;
  status: string;
  expiresAt: Date | null;
}

export const NOTIFICATION_STORE = Symbol('NOTIFICATION_STORE');

/** Narrow persistence seam over the Prisma methods this module uses (replaced in tests). */
export interface NotificationStore {
  list(tenantId: string, options: NotificationListOptions): Promise<NotificationRow[]>;
  countUnread(tenantId: string): Promise<number>;
  markRead(tenantId: string, id: string): Promise<NotificationRow | null>;
  markAllRead(tenantId: string): Promise<number>;
  remove(tenantId: string, id: string): Promise<boolean>;
  create(input: NotificationCreateInput): Promise<NotificationRow>;
  latestByType(tenantId: string, type: NotificationType): Promise<NotificationRow | null>;
  getSubscription(tenantId: string): Promise<NotificationSubscriptionState | null>;
}

/** Real implementation over the shared Prisma client (single persistence seam). */
@Injectable()
export class PrismaNotificationStore implements NotificationStore {
  constructor(private readonly prismaService: PrismaService) {}

  list(tenantId: string, options: NotificationListOptions): Promise<NotificationRow[]> {
    return this.prismaService.client.notification.findMany({
      where: {
        tenantId,
        ...(options.read === null || options.read === undefined ? {} : { read: options.read }),
      },
      orderBy: { createdAt: 'desc' },
      take: options.limit,
      skip: options.offset,
    });
  }

  countUnread(tenantId: string): Promise<number> {
    return this.prismaService.client.notification.count({ where: { tenantId, read: false } });
  }

  async markRead(tenantId: string, id: string): Promise<NotificationRow | null> {
    const existing = await this.prismaService.client.notification.findFirst({
      where: { id, tenantId },
    });
    if (!existing) {
      return null;
    }
    if (existing.read) {
      return existing;
    }
    return this.prismaService.client.notification.update({ where: { id }, data: { read: true } });
  }

  async markAllRead(tenantId: string): Promise<number> {
    const result = await this.prismaService.client.notification.updateMany({
      where: { tenantId, read: false },
      data: { read: true },
    });
    return result.count;
  }

  async remove(tenantId: string, id: string): Promise<boolean> {
    const result = await this.prismaService.client.notification.deleteMany({
      where: { id, tenantId },
    });
    return result.count > 0;
  }

  create(input: NotificationCreateInput): Promise<NotificationRow> {
    return this.prismaService.client.notification.create({ data: input });
  }

  latestByType(tenantId: string, type: NotificationType): Promise<NotificationRow | null> {
    return this.prismaService.client.notification.findFirst({
      where: { tenantId, type },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getSubscription(tenantId: string): Promise<NotificationSubscriptionState | null> {
    const row = await this.prismaService.client.tenant.findUnique({
      where: { id: tenantId },
      select: {
        subscriptionPlan: true,
        subscriptionStatus: true,
        subscriptionExpiresAt: true,
      },
    });
    if (!row) {
      return null;
    }
    return {
      plan: row.subscriptionPlan,
      status: row.subscriptionStatus,
      expiresAt: row.subscriptionExpiresAt,
    };
  }
}
