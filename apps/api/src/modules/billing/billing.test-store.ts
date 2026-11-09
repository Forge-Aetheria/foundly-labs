import { Prisma } from '@foundly/database';
import type { SubscriptionPlan } from '../subscription/subscription.types';
import type {
  BillingStore,
  CompletePaymentInput,
  CreatePaymentTransactionInput,
  PaymentTransactionRow,
} from './billing.store';

const DAY_MS = 24 * 60 * 60 * 1000;

export type MemoryBillingStore = BillingStore & {
  seed(row: PaymentTransactionRow): PaymentTransactionRow;
  getTenantExpiry(tenantId: string): Date | null;
  setTenantExpiry(tenantId: string, expiresAt: Date | null): void;
};

export function createMemoryBillingStore(): MemoryBillingStore {
  const rows = new Map<string, PaymentTransactionRow>();
  const tenantExpiry = new Map<string, Date | null>();
  let sequence = 0;

  const store: MemoryBillingStore = {
    async create(input: CreatePaymentTransactionInput): Promise<PaymentTransactionRow> {
      sequence += 1;
      const now = new Date();
      const row: PaymentTransactionRow = {
        id: `pay-${sequence}`,
        tenantId: input.tenantId,
        plan: input.plan,
        gateway: input.gateway,
        status: input.status,
        amount: new Prisma.Decimal(input.amount),
        currency: input.currency,
        gatewayOrderId: input.gatewayOrderId ?? null,
        referenceNumber: input.referenceNumber ?? null,
        metadata: (input.metadata ?? null) as Prisma.JsonValue | null,
        expiresAt: null,
        paidAt: null,
        reviewedBy: null,
        reviewedAt: null,
        createdAt: now,
        updatedAt: now,
      };
      rows.set(row.id, row);
      return row;
    },

    async findById(id: string) {
      return rows.get(id) ?? null;
    },

    async findByGatewayOrderId(gateway, gatewayOrderId) {
      return (
        [...rows.values()].find(
          (row) => row.gateway === gateway && row.gatewayOrderId === gatewayOrderId,
        ) ?? null
      );
    },

    async findManualByReference(tenantId, gateway, referenceNumber) {
      return (
        [...rows.values()].find(
          (row) =>
            row.tenantId === tenantId &&
            row.gateway === gateway &&
            row.referenceNumber === referenceNumber,
        ) ?? null
      );
    },

    async listByTenant(tenantId, limit, offset) {
      return [...rows.values()]
        .filter((row) => row.tenantId === tenantId)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(offset, offset + limit);
    },

    async updateCheckout(id, gatewayOrderId, metadata) {
      const row = rows.get(id);
      if (!row) throw new Error('Payment not found');
      row.gatewayOrderId = gatewayOrderId;
      row.metadata = metadata as Prisma.JsonValue;
      row.updatedAt = new Date();
      return row;
    },

    async markStatus(id, status, metadata) {
      const row = rows.get(id);
      if (!row) throw new Error('Payment not found');
      row.status = status;
      if (metadata != null) row.metadata = metadata as Prisma.JsonValue;
      row.updatedAt = new Date();
      return row;
    },

    async completeTransaction(input: CompletePaymentInput) {
      const row = rows.get(input.transactionId);
      if (!row) return null;
      if (row.status === 'COMPLETED') return row;

      const now = new Date();
      const current = tenantExpiry.get(row.tenantId) ?? null;
      const base = current && current.getTime() > now.getTime() ? current : now;
      const expiresAt = new Date(base.getTime() + input.durationDays * DAY_MS);

      row.status = 'COMPLETED';
      row.paidAt = now;
      row.expiresAt = expiresAt;
      row.updatedAt = now;
      if (input.metadata != null) row.metadata = input.metadata as Prisma.JsonValue;
      if (input.reviewedBy) {
        row.reviewedBy = input.reviewedBy;
        row.reviewedAt = now;
      }
      tenantExpiry.set(row.tenantId, expiresAt);
      return row;
    },

    seed(row) {
      rows.set(row.id, row);
      return row;
    },

    getTenantExpiry(tenantId) {
      return tenantExpiry.get(tenantId) ?? null;
    },

    setTenantExpiry(tenantId, expiresAt) {
      tenantExpiry.set(tenantId, expiresAt);
    },
  };

  return store;
}

export function seedPaymentRow(
  overrides: Partial<PaymentTransactionRow> = {},
): PaymentTransactionRow {
  const now = new Date();
  return {
    id: 'pay-1',
    tenantId: 't1',
    plan: 'PRO' as SubscriptionPlan,
    gateway: 'PAGO_MOVIL',
    status: 'PENDING_APPROVAL',
    amount: new Prisma.Decimal('29.99'),
    currency: 'USD',
    gatewayOrderId: null,
    referenceNumber: 'REF-1',
    metadata: null,
    expiresAt: null,
    paidAt: null,
    reviewedBy: null,
    reviewedAt: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}
