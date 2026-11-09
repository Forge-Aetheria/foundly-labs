import { Injectable } from '@nestjs/common';
import { Prisma } from '@foundly/database';
import { PrismaService } from '../../shared/prisma/prisma.service';
import type { PaymentGateway, PaymentStatus } from './billing.types';
import type { SubscriptionPlan } from '../subscription/subscription.types';

export interface PaymentTransactionRow {
  id: string;
  tenantId: string;
  plan: SubscriptionPlan;
  gateway: PaymentGateway;
  status: PaymentStatus;
  amount: Prisma.Decimal;
  currency: string;
  gatewayOrderId: string | null;
  referenceNumber: string | null;
  metadata: Prisma.JsonValue | null;
  expiresAt: Date | null;
  paidAt: Date | null;
  reviewedBy: string | null;
  reviewedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePaymentTransactionInput {
  tenantId: string;
  plan: SubscriptionPlan;
  gateway: PaymentGateway;
  status: PaymentStatus;
  amount: string;
  currency: string;
  gatewayOrderId?: string | null;
  referenceNumber?: string | null;
  metadata?: Prisma.InputJsonValue | null;
}

export interface CompletePaymentInput {
  transactionId: string;
  durationDays: number;
  reviewedBy?: string | null;
  metadata?: Prisma.InputJsonValue | null;
}

export const BILLING_STORE = Symbol('BILLING_STORE');

/** Narrow persistence seam for billing (replaced by a memory store in tests). */
export interface BillingStore {
  create(input: CreatePaymentTransactionInput): Promise<PaymentTransactionRow>;
  findById(id: string): Promise<PaymentTransactionRow | null>;
  findByGatewayOrderId(
    gateway: PaymentGateway,
    gatewayOrderId: string,
  ): Promise<PaymentTransactionRow | null>;
  findManualByReference(
    tenantId: string,
    gateway: PaymentGateway,
    referenceNumber: string,
  ): Promise<PaymentTransactionRow | null>;
  listByTenant(
    tenantId: string,
    limit: number,
    offset: number,
  ): Promise<PaymentTransactionRow[]>;
  updateCheckout(
    id: string,
    gatewayOrderId: string,
    metadata: Prisma.InputJsonValue,
  ): Promise<PaymentTransactionRow>;
  markStatus(
    id: string,
    status: PaymentStatus,
    metadata?: Prisma.InputJsonValue | null,
  ): Promise<PaymentTransactionRow>;
  /** Atomically marks the payment completed and extends the tenant subscription. */
  completeTransaction(input: CompletePaymentInput): Promise<PaymentTransactionRow | null>;
}

const DAY_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class PrismaBillingStore implements BillingStore {
  constructor(private readonly prismaService: PrismaService) {}

  create(input: CreatePaymentTransactionInput): Promise<PaymentTransactionRow> {
    return this.prismaService.client.paymentTransaction.create({
      data: {
        tenantId: input.tenantId,
        plan: input.plan,
        gateway: input.gateway,
        status: input.status,
        amount: new Prisma.Decimal(input.amount),
        currency: input.currency,
        gatewayOrderId: input.gatewayOrderId ?? null,
        referenceNumber: input.referenceNumber ?? null,
        ...(input.metadata != null ? { metadata: input.metadata } : {}),
      },
    });
  }

  findById(id: string): Promise<PaymentTransactionRow | null> {
    return this.prismaService.client.paymentTransaction.findUnique({ where: { id } });
  }

  findByGatewayOrderId(
    gateway: PaymentGateway,
    gatewayOrderId: string,
  ): Promise<PaymentTransactionRow | null> {
    return this.prismaService.client.paymentTransaction.findUnique({
      where: { gateway_gatewayOrderId: { gateway, gatewayOrderId } },
    });
  }

  findManualByReference(
    tenantId: string,
    gateway: PaymentGateway,
    referenceNumber: string,
  ): Promise<PaymentTransactionRow | null> {
    return this.prismaService.client.paymentTransaction.findFirst({
      where: { tenantId, gateway, referenceNumber },
    });
  }

  listByTenant(
    tenantId: string,
    limit: number,
    offset: number,
  ): Promise<PaymentTransactionRow[]> {
    return this.prismaService.client.paymentTransaction.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });
  }

  updateCheckout(
    id: string,
    gatewayOrderId: string,
    metadata: Prisma.InputJsonValue,
  ): Promise<PaymentTransactionRow> {
    return this.prismaService.client.paymentTransaction.update({
      where: { id },
      data: { gatewayOrderId, metadata },
    });
  }

  markStatus(
    id: string,
    status: PaymentStatus,
    metadata?: Prisma.InputJsonValue | null,
  ): Promise<PaymentTransactionRow> {
    return this.prismaService.client.paymentTransaction.update({
      where: { id },
      data: {
        status,
        ...(metadata != null ? { metadata } : {}),
      },
    });
  }

  completeTransaction(input: CompletePaymentInput): Promise<PaymentTransactionRow | null> {
    return this.prismaService.client.$transaction(async (tx) => {
      const current = await tx.paymentTransaction.findUnique({
        where: { id: input.transactionId },
      });
      if (!current) return null;
      if (current.status === 'COMPLETED') return current;

      const tenant = await tx.tenant.findUnique({
        where: { id: current.tenantId },
        select: { subscriptionExpiresAt: true },
      });
      if (!tenant) return null;

      const now = new Date();
      const base =
        tenant.subscriptionExpiresAt && tenant.subscriptionExpiresAt.getTime() > now.getTime()
          ? tenant.subscriptionExpiresAt
          : now;
      const expiresAt = new Date(base.getTime() + input.durationDays * DAY_MS);

      const completed = await tx.paymentTransaction.update({
        where: { id: current.id },
        data: {
          status: 'COMPLETED',
          paidAt: now,
          expiresAt,
          ...(input.metadata != null ? { metadata: input.metadata } : {}),
          ...(input.reviewedBy ? { reviewedBy: input.reviewedBy, reviewedAt: now } : {}),
        },
      });

      await tx.tenant.update({
        where: { id: current.tenantId },
        data: {
          subscriptionPlan: 'PRO',
          subscriptionStatus: 'active',
          subscriptionExpiresAt: expiresAt,
        },
      });

      return completed;
    });
  }
}
