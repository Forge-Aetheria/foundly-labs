import { Inject, Injectable } from '@nestjs/common';
import { GraphQLError } from 'graphql';
import type { AuthUser } from '../auth/jwt.types';
import { notFoundError, validationError } from '../../shared/tenant-scope';
import type { TenantScopeInput } from '../../shared/tenant-scope';
import {
  PAYMENTS_STORE,
  type PaymentMethodRow,
  type PaymentsStore,
  type UpsertPaymentMethodData,
} from './payments.store';
import { PaymentMethodType, type UpsertPaymentMethodInput } from './payments.types';

const MAX_TEXT_LENGTH = 2000;

const VALID_TYPES = new Set<string>(Object.values(PaymentMethodType));

function scopeError(): GraphQLError {
  return new GraphQLError('Missing tenant scope', {
    extensions: { code: 'UNAUTHENTICATED' },
  });
}

function normalizeText(value: string | null | undefined, field: string): string | null {
  if (value == null) {
    return null;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  if (trimmed.length > MAX_TEXT_LENGTH) {
    throw validationError(`${field} must be at most ${MAX_TEXT_LENGTH} characters`);
  }
  return trimmed;
}

/** Public active-only read + authenticated tenant-scoped payment-method configuration. */
@Injectable()
export class PaymentsService {
  constructor(@Inject(PAYMENTS_STORE) private readonly store: PaymentsStore) {}

  /** Resolve the authoritative tenant scope from the authenticated identity (never client input). */
  requireTenant(user: Pick<AuthUser, 'tenantId'> | undefined): string {
    if (!user?.tenantId) {
      throw scopeError();
    }
    return user.tenantId;
  }

  /** Authenticated: the caller's methods (any active state). */
  async listForAdmin(user: Pick<AuthUser, 'tenantId'> | undefined): Promise<PaymentMethodRow[]> {
    const tenantId = this.requireTenant(user);
    return this.store.listByTenant(tenantId);
  }

  /** Public: a business's ACTIVE methods only. Unknown slug → empty. */
  async listPublic(scope: TenantScopeInput): Promise<PaymentMethodRow[]> {
    const tenantId = await this.store.resolveTenantId(scope);
    if (!tenantId) {
      return [];
    }
    return this.store.listByTenant(tenantId, true);
  }

  /** Authenticated: create or replace the method for (tenant, type). */
  async upsert(
    user: Pick<AuthUser, 'tenantId'> | undefined,
    input: UpsertPaymentMethodInput,
  ): Promise<PaymentMethodRow> {
    const tenantId = this.requireTenant(user);
    if (!VALID_TYPES.has(input.type)) {
      throw validationError('Unknown payment method type');
    }
    const data: UpsertPaymentMethodData = {
      title: normalizeText(input.title, 'title'),
      details: normalizeText(input.details, 'details'),
      instructions: normalizeText(input.instructions, 'instructions'),
      active: input.active ?? false,
    };
    return this.store.upsertByType(tenantId, input.type, data);
  }

  /** Authenticated: delete one of the caller's methods. */
  async remove(user: Pick<AuthUser, 'tenantId'> | undefined, id: string): Promise<boolean> {
    const tenantId = this.requireTenant(user);
    const deleted = await this.store.deleteById(id, tenantId);
    if (!deleted) {
      throw notFoundError('Payment method not found');
    }
    return true;
  }
}
