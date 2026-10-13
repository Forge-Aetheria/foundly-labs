import { Inject, Injectable } from '@nestjs/common';
import { GraphQLError } from 'graphql';
import { notFoundError, validationError } from '../../shared/tenant-scope';
import type { TenantScopeInput } from '../../shared/tenant-scope';
import type { AuthUser } from '../auth/jwt.types';
import { TIME_BLOCK_STORE, type TimeBlockRow, type TimeBlockStore } from './time-block.store';
import type { AddTimeBlockInput } from './time-block.types';

const MAX_REASON_LENGTH = 200;

function scopeError(): GraphQLError {
  return new GraphQLError('Missing tenant scope', {
    extensions: { code: 'UNAUTHENTICATED' },
  });
}

function parseInstant(value: string | null | undefined, field: string): Date {
  const raw = typeof value === 'string' ? value.trim() : '';
  if (!raw) {
    throw validationError(`${field} is required`);
  }
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) {
    throw validationError(`${field} must be a valid date-time`);
  }
  return date;
}

/** Tenant-scoped time-block reads/writes (feature 014). */
@Injectable()
export class TimeBlockService {
  constructor(@Inject(TIME_BLOCK_STORE) private readonly store: TimeBlockStore) {}

  /** Public read: blocks of a business by id or public slug (unknown slug → empty). */
  async list(scope: TenantScopeInput, specialistId?: string | null): Promise<TimeBlockRow[]> {
    const tenantId = await this.store.resolveTenantId(scope);
    if (!tenantId) {
      return [];
    }
    return this.store.list(tenantId, specialistId ?? null);
  }

  async add(
    user: Pick<AuthUser, 'tenantId'> | undefined,
    input: AddTimeBlockInput,
  ): Promise<TimeBlockRow> {
    const tenantId = this.requireTenant(user);
    const startAt = parseInstant(input.startAt, 'startAt');
    const endAt = parseInstant(input.endAt, 'endAt');
    if (endAt.getTime() <= startAt.getTime()) {
      throw validationError('endAt must be after startAt');
    }

    let specialistId: string | null = null;
    if (input.specialistId) {
      const belongs = await this.store.specialistBelongsToTenant(input.specialistId, tenantId);
      if (!belongs) {
        throw validationError('Unknown specialist');
      }
      specialistId = input.specialistId;
    }

    const reason = input.reason?.trim() ? input.reason.trim() : null;
    if (reason && reason.length > MAX_REASON_LENGTH) {
      throw validationError(`reason must be at most ${MAX_REASON_LENGTH} characters`);
    }

    return this.store.create(tenantId, { specialistId, startAt, endAt, reason });
  }

  async remove(user: Pick<AuthUser, 'tenantId'> | undefined, id: string): Promise<boolean> {
    const tenantId = this.requireTenant(user);
    const removed = await this.store.removeById(id, tenantId);
    if (!removed) {
      throw notFoundError('Time block not found');
    }
    return true;
  }

  private requireTenant(user: Pick<AuthUser, 'tenantId'> | undefined): string {
    if (!user?.tenantId) {
      throw scopeError();
    }
    return user.tenantId;
  }
}
