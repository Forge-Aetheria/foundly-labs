import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { validationError } from '../../shared/tenant-scope';
import type { TenantScopeInput } from '../../shared/tenant-scope';
import { PaymentMethodType } from './payments.types';

/** Storage-row view used across the store/service (timestamps as ISO strings). */
export interface PaymentMethodRow {
  id: string;
  tenantId: string;
  type: PaymentMethodType;
  label: string | null;
  details: string | null;
  instructions: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpsertPaymentMethodData {
  label?: string | null;
  details?: string | null;
  instructions?: string | null;
  active?: boolean | null;
}

export const PAYMENTS_STORE = Symbol('PAYMENTS_STORE');

/** Narrow persistence seam over the Prisma methods this module uses (replaced in tests). */
export interface PaymentsStore {
  resolveTenantId(scope: TenantScopeInput): Promise<string | null>;
  listByTenant(tenantId: string, active?: boolean): Promise<PaymentMethodRow[]>;
  getByType(tenantId: string, type: PaymentMethodType): Promise<PaymentMethodRow | null>;
  upsertByType(
    tenantId: string,
    type: PaymentMethodType,
    data: UpsertPaymentMethodData,
  ): Promise<PaymentMethodRow>;
  deleteById(id: string, tenantId: string): Promise<boolean>;
}

const paymentMethodSelect = {
  id: true,
  tenantId: true,
  type: true,
  label: true,
  details: true,
  instructions: true,
  active: true,
  createdAt: true,
  updatedAt: true,
} as const;

interface PaymentMethodSelectRow {
  id: string;
  tenantId: string;
  type: PaymentMethodType;
  label: string | null;
  details: string | null;
  instructions: string | null;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

function toRow(row: PaymentMethodSelectRow): PaymentMethodRow {
  return {
    id: row.id,
    tenantId: row.tenantId,
    type: row.type,
    label: row.label,
    details: row.details,
    instructions: row.instructions,
    active: row.active,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

/** Real implementation over the shared Prisma client (single persistence seam). */
@Injectable()
export class PrismaPaymentsStore implements PaymentsStore {
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

  async listByTenant(tenantId: string, active?: boolean): Promise<PaymentMethodRow[]> {
    const rows = await this.prismaService.client.paymentMethod.findMany({
      where: active === undefined ? { tenantId } : { tenantId, active },
      orderBy: { type: 'asc' },
      select: paymentMethodSelect,
    });
    return rows.map(toRow);
  }

  async getByType(tenantId: string, type: PaymentMethodType): Promise<PaymentMethodRow | null> {
    const row = await this.prismaService.client.paymentMethod.findUnique({
      where: { tenantId_type: { tenantId, type } },
      select: paymentMethodSelect,
    });
    return row ? toRow(row) : null;
  }

  async upsertByType(
    tenantId: string,
    type: PaymentMethodType,
    data: UpsertPaymentMethodData,
  ): Promise<PaymentMethodRow> {
    const row = await this.prismaService.client.paymentMethod.upsert({
      where: { tenantId_type: { tenantId, type } },
      create: {
        tenantId,
        type,
        label: data.label ?? null,
        details: data.details ?? null,
        instructions: data.instructions ?? null,
        active: data.active ?? false,
      },
      update: {
        ...(data.label !== undefined ? { label: data.label } : {}),
        ...(data.details !== undefined ? { details: data.details } : {}),
        ...(data.instructions !== undefined ? { instructions: data.instructions } : {}),
        ...(data.active !== undefined && data.active !== null ? { active: data.active } : {}),
      },
      select: paymentMethodSelect,
    });
    return toRow(row);
  }

  async deleteById(id: string, tenantId: string): Promise<boolean> {
    const { count } = await this.prismaService.client.paymentMethod.deleteMany({
      where: { id, tenantId },
    });
    return count > 0;
  }
}
