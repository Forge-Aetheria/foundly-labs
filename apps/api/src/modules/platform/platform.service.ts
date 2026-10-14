import { Inject, Injectable } from '@nestjs/common';
import { forbiddenError, unauthError } from '../auth/auth.guards';
import type { AuthUser } from '../auth/jwt.types';
import { notFoundError, validationError } from '../../shared/tenant-scope';
import { SubscriptionPlan, SubscriptionStatus } from '../subscription/subscription.types';
import {
  PLATFORM_IDENTITY,
  type PlatformIdentityClient,
} from './platform.identity';
import {
  PLATFORM_STORE,
  type ManagedBusinessRow,
  type PlatformStore,
  type SubscriptionPatch,
} from './platform.store';
import {
  type ManagedBusinessObject,
  type OverrideTenantSubscriptionInput,
  type PlatformMetricsObject,
} from './platform.types';

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

const PLAN_VALUES = new Set<string>(Object.values(SubscriptionPlan));
const STATUS_VALUES = new Set<string>(Object.values(SubscriptionStatus));

type PlatformUser = Pick<AuthUser, 'email' | 'platformRole'>;

function adminEmails(): string[] {
  return (process.env.PLATFORM_ADMIN_EMAILS ?? '')
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter((value) => value.length > 0);
}

/** Super Admin authorization + global platform operations (019). */
@Injectable()
export class PlatformService {
  constructor(
    @Inject(PLATFORM_STORE) private readonly store: PlatformStore,
    @Inject(PLATFORM_IDENTITY) private readonly identity: PlatformIdentityClient,
  ) {}

  /** A caller is Super Admin when the verified identity carries the platform role or an allow-listed email. */
  isSuperAdmin(user: PlatformUser | undefined): boolean {
    if (!user) {
      return false;
    }
    if (user.platformRole === 'super_admin') {
      return true;
    }
    return Boolean(user.email) && adminEmails().includes((user.email ?? '').toLowerCase());
  }

  /** Fail-closed authorization: missing identity → UNAUTHENTICATED; non-admin → FORBIDDEN. */
  requireSuperAdmin(user: PlatformUser | undefined): PlatformUser {
    if (!user) {
      throw unauthError();
    }
    if (!this.isSuperAdmin(user)) {
      throw forbiddenError('Super Admin access required');
    }
    return user;
  }

  /** Global metrics: business counts, plan distribution + PRO conversion, and user counts (degradable). */
  async getMetrics(): Promise<PlatformMetricsObject> {
    const [total, active, byPlan, userStats] = await Promise.all([
      this.store.countTenants(),
      this.store.countActiveTenants(),
      this.store.countByPlan(),
      this.identity.getUserStats(),
    ]);
    const counts = new Map<SubscriptionPlan, number>(byPlan.map((row) => [row.plan, row.count]));
    const free = counts.get(SubscriptionPlan.FREE) ?? 0;
    const pro = counts.get(SubscriptionPlan.PRO) ?? 0;
    return {
      businesses: { total, active },
      users: userStats
        ? { available: true, total: userStats.total, active: userStats.active }
        : { available: false, total: null, active: null },
      plans: { free, pro },
      proConversion: total > 0 ? pro / total : 0,
    };
  }

  /** Bounded, searchable list of every business with its subscription state. */
  async managedBusinesses(input: {
    query?: string | null;
    limit?: number | null;
    offset?: number | null;
  }): Promise<ManagedBusinessObject[]> {
    const limit = input.limit ?? DEFAULT_LIMIT;
    if (!Number.isInteger(limit) || limit <= 0) {
      throw validationError('limit must be a positive integer');
    }
    const offset = input.offset ?? 0;
    if (!Number.isInteger(offset) || offset < 0) {
      throw validationError('offset must be a non-negative integer');
    }
    const term = input.query?.trim() || null;
    const rows = await this.store.listTenants(term, Math.min(limit, MAX_LIMIT), offset);
    return rows.map((row) => this.toManagedBusiness(row));
  }

  /** Partial override of any business's plan/status/expiry (persist-only; entitlement follows 017). */
  async overrideSubscription(
    input: OverrideTenantSubscriptionInput,
  ): Promise<ManagedBusinessObject> {
    const patch: SubscriptionPatch = {};
    if (input.plan != null) {
      if (!PLAN_VALUES.has(input.plan)) {
        throw validationError('plan must be FREE or PRO');
      }
      patch.plan = input.plan;
    }
    if (input.status != null) {
      if (!STATUS_VALUES.has(input.status)) {
        throw validationError('status must be active, past_due, expired or canceled');
      }
      patch.status = input.status;
    }
    if (input.expiresAt !== undefined) {
      if (input.expiresAt === null) {
        patch.expiresAt = null;
      } else {
        const parsed = new Date(input.expiresAt);
        if (Number.isNaN(parsed.getTime())) {
          throw validationError('expiresAt must be a valid ISO-8601 date');
        }
        patch.expiresAt = parsed;
      }
    }
    const updated = await this.store.updateSubscription(input.tenantId, patch);
    if (!updated) {
      throw notFoundError('Business not found');
    }
    return this.toManagedBusiness(updated);
  }

  private toManagedBusiness(row: ManagedBusinessRow): ManagedBusinessObject {
    return {
      tenantId: row.tenantId,
      slug: row.slug,
      name: row.name,
      plan: row.plan,
      status: row.status,
      expiresAt: row.expiresAt ? row.expiresAt.toISOString() : null,
    };
  }
}
