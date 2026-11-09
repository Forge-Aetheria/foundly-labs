import { Injectable } from '@nestjs/common';
import { billingStateError } from './billing.errors';

export interface BillingPlanConfig {
  amount: string;
  currency: 'USD';
  durationDays: number;
}

export interface PaypalConfig {
  baseUrl: string;
  clientId: string;
  clientSecret: string;
  planId: string;
  webhookId: string;
}

export interface BinanceConfig {
  baseUrl: string;
  apiKey: string;
  apiSecret: string;
  webhookSecret: string;
}

export interface ManualInstructionsConfig {
  bank: string;
  cedula: string;
  phone: string;
  rateVesPerUsd: string;
  note: string | null;
}

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw billingStateError(`${name} is not configured`);
  }
  return value;
}

function optional(name: string, fallback: string): string {
  return process.env[name]?.trim() || fallback;
}

/** Reads billing configuration from the server environment; fails closed when incomplete. */
@Injectable()
export class BillingConfig {
  proPlan(): BillingPlanConfig {
    const amount = required('BILLING_PRO_AMOUNT_USD');
    if (!/^\d+(\.\d{1,2})?$/.test(amount) || Number(amount) <= 0) {
      throw billingStateError('BILLING_PRO_AMOUNT_USD is invalid');
    }
    const durationDays = Number(required('BILLING_PRO_DURATION_DAYS'));
    if (!Number.isInteger(durationDays) || durationDays <= 0) {
      throw billingStateError('BILLING_PRO_DURATION_DAYS is invalid');
    }
    return { amount, currency: 'USD', durationDays };
  }

  paypal(): PaypalConfig {
    return {
      baseUrl: optional('PAYPAL_API_BASE', 'https://api-m.sandbox.paypal.com'),
      clientId: required('PAYPAL_CLIENT_ID'),
      clientSecret: required('PAYPAL_CLIENT_SECRET'),
      planId: required('PAYPAL_PLAN_ID'),
      webhookId: required('PAYPAL_WEBHOOK_ID'),
    };
  }

  binance(): BinanceConfig {
    return {
      baseUrl: optional('BINANCE_PAY_API_BASE', 'https://bpay.binanceapi.com'),
      apiKey: required('BINANCE_PAY_API_KEY'),
      apiSecret: required('BINANCE_PAY_API_SECRET'),
      webhookSecret: optional('BINANCE_PAY_WEBHOOK_SECRET', required('BINANCE_PAY_API_SECRET')),
    };
  }

  manualInstructions(): ManualInstructionsConfig {
    return {
      bank: required('BILLING_MANUAL_BANK'),
      cedula: required('BILLING_MANUAL_CEDULA'),
      phone: required('BILLING_MANUAL_PHONE'),
      rateVesPerUsd: required('BILLING_MANUAL_RATE_VES_PER_USD'),
      note: process.env.BILLING_MANUAL_NOTE?.trim() || null,
    };
  }

  returnUrl(): string {
    return optional('BILLING_CHECKOUT_RETURN_URL', 'http://localhost:3001/admin/configuracion');
  }

  cancelUrl(): string {
    return optional('BILLING_CHECKOUT_CANCEL_URL', 'http://localhost:3001/admin/configuracion');
  }

  alertWebhookUrl(): string | null {
    const value = process.env.BILLING_ALERT_WEBHOOK_URL?.trim();
    return value || null;
  }

  isManualGateway(gateway: string): boolean {
    return gateway === 'PAGO_MOVIL' || gateway === 'TRANSFERENCIA';
  }
}
