import { Inject, Injectable } from '@nestjs/common';
import { GraphQLError } from 'graphql';
import { notFoundError, validationError } from '../../shared/tenant-scope';
import type { AuthUser } from '../auth/jwt.types';
import {
  NOTIFICATION_STORE,
  type NotificationRow,
  type NotificationStore,
} from './notifications.store';
import { NotificationObject, type NotificationType } from './notifications.types';

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;
const EXPIRING_WINDOW_MS = 3 * 24 * 60 * 60 * 1000;
const DEDUPE_WINDOW_MS = 24 * 60 * 60 * 1000;

function scopeError(): GraphQLError {
  return new GraphQLError('Missing tenant scope', {
    extensions: { code: 'UNAUTHENTICATED' },
  });
}

export interface NotificationListInput {
  read?: boolean | null;
  limit?: number | null;
  offset?: number | null;
}

export interface NewOnlineBookingInput {
  tenantId: string;
  serviceName: string;
  clientName: string;
  startAt: Date;
}

function toObject(row: NotificationRow): NotificationObject {
  return {
    id: row.id,
    type: row.type as NotificationType,
    title: row.title,
    message: row.message,
    read: row.read,
    createdAt: row.createdAt.toISOString(),
  };
}

function formatWhen(startAt: Date): string {
  return new Intl.DateTimeFormat('es-ES', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'UTC',
  }).format(startAt);
}

/** Owns the tenant-scoped notification inbox and the automatic triggers (feature 020). */
@Injectable()
export class NotificationsService {
  private readonly syncing = new Set<string>();

  constructor(@Inject(NOTIFICATION_STORE) private readonly store: NotificationStore) {}

  /** Resolve the authoritative tenant scope from the authenticated identity (never client input). */
  requireTenant(user: Pick<AuthUser, 'tenantId'> | undefined): string {
    if (!user?.tenantId) {
      throw scopeError();
    }
    return user.tenantId;
  }

  /** Newest-first, optionally filtered by read state, bounded/paginated. */
  async list(
    user: Pick<AuthUser, 'tenantId'> | undefined,
    input: NotificationListInput,
  ): Promise<NotificationObject[]> {
    const tenantId = this.requireTenant(user);
    const { limit, offset } = this.normalizePaging(input);
    await this.syncSubscriptionNotifications(tenantId);
    const rows = await this.store.list(tenantId, { read: input.read ?? null, limit, offset });
    return rows.map(toObject);
  }

  /** Unread count for the authenticated business. */
  async countUnread(user: Pick<AuthUser, 'tenantId'> | undefined): Promise<number> {
    const tenantId = this.requireTenant(user);
    await this.syncSubscriptionNotifications(tenantId);
    return this.store.countUnread(tenantId);
  }

  /** Mark one notification as read (idempotent; NOT_FOUND for unknown/foreign). */
  async markRead(
    user: Pick<AuthUser, 'tenantId'> | undefined,
    id: string,
  ): Promise<NotificationObject> {
    const tenantId = this.requireTenant(user);
    const row = await this.store.markRead(tenantId, id);
    if (!row) {
      throw notFoundError('Notification not found');
    }
    return toObject(row);
  }

  /** Mark every notification of the business as read; returns the number updated. */
  async markAllRead(user: Pick<AuthUser, 'tenantId'> | undefined): Promise<number> {
    const tenantId = this.requireTenant(user);
    return this.store.markAllRead(tenantId);
  }

  /** Permanently delete one notification (NOT_FOUND for unknown/foreign). */
  async delete(user: Pick<AuthUser, 'tenantId'> | undefined, id: string): Promise<boolean> {
    const tenantId = this.requireTenant(user);
    const removed = await this.store.remove(tenantId, id);
    if (!removed) {
      throw notFoundError('Notification not found');
    }
    return true;
  }

  /** Trigger: a successful public online booking raises exactly one NEW_BOOKING notification. */
  async notifyNewOnlineBooking(input: NewOnlineBookingInput): Promise<void> {
    await this.store.create({
      tenantId: input.tenantId,
      type: 'NEW_BOOKING',
      title: 'Nueva reserva online',
      message: `${input.clientName} reservó «${input.serviceName}» para el ${formatWhen(input.startAt)}.`,
    });
  }

  /**
   * Trigger (lazy, on read): materialise SUBSCRIPTION_EXPIRING (≤ 3 days) or
   * SUBSCRIPTION_EXPIRED (past). Deduped per type within a 24 h window.
   */
  async syncSubscriptionNotifications(tenantId: string): Promise<void> {
    if (this.syncing.has(tenantId)) {
      return;
    }
    this.syncing.add(tenantId);
    try {
      const subscription = await this.store.getSubscription(tenantId);
      if (!subscription?.expiresAt) {
        return;
      }
      const now = Date.now();
      const expiry = subscription.expiresAt.getTime();

      let type: 'SUBSCRIPTION_EXPIRING' | 'SUBSCRIPTION_EXPIRED';
      let title: string;
      let message: string;
      if (expiry <= now) {
        type = 'SUBSCRIPTION_EXPIRED';
        title = 'Suscripción vencida';
        message = 'Tu suscripción ha vencido. Renueva para recuperar los beneficios de tu plan.';
      } else if (expiry - now <= EXPIRING_WINDOW_MS) {
        type = 'SUBSCRIPTION_EXPIRING';
        title = 'Suscripción por vencer';
        message = 'Tu suscripción vence en los próximos días. Renuévala para mantener tu plan.';
      } else {
        return;
      }

      const latest = await this.store.latestByType(tenantId, type);
      if (latest && now - latest.createdAt.getTime() < DEDUPE_WINDOW_MS) {
        return;
      }
      await this.store.create({ tenantId, type, title, message });
    } finally {
      this.syncing.delete(tenantId);
    }
  }

  private normalizePaging(input: NotificationListInput): { limit: number; offset: number } {
    const limit = input.limit ?? DEFAULT_LIMIT;
    if (!Number.isInteger(limit) || limit <= 0) {
      throw validationError('limit must be a positive integer');
    }
    const offset = input.offset ?? 0;
    if (!Number.isInteger(offset) || offset < 0) {
      throw validationError('offset must be a non-negative integer');
    }
    return { limit: Math.min(limit, MAX_LIMIT), offset };
  }
}
