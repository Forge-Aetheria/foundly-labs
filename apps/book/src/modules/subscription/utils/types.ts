export type SubscriptionPlanView = 'FREE' | 'PRO';

export type SubscriptionStatusView = 'active' | 'past_due' | 'expired' | 'canceled';

export interface SubscriptionUsageView {
  used: number;
  limit: number;
  unlimited: boolean;
}

export interface SubscriptionSummaryView {
  plan: SubscriptionPlanView;
  effectivePlan: SubscriptionPlanView;
  status: SubscriptionStatusView;
  expiresAt: string | null;
  limits: {
    services: SubscriptionUsageView;
    team: SubscriptionUsageView;
  };
}

export type PaymentGatewayView = 'PAYPAL' | 'BINANCE' | 'PAGO_MOVIL' | 'TRANSFERENCIA';

export type PaymentStatusView =
  | 'PENDING'
  | 'PENDING_APPROVAL'
  | 'COMPLETED'
  | 'REJECTED'
  | 'FAILED';

export interface PaymentTransactionView {
  id: string;
  gateway: PaymentGatewayView;
  status: PaymentStatusView;
  plan: SubscriptionPlanView;
  amount: string;
  currency: string;
  gatewayOrderId: string | null;
  referenceNumber: string | null;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BillingPlanInstructionsView {
  amount: string;
  currency: string;
  durationDays: number;
}

export interface ManualPaymentInstructionsView {
  bank: string;
  cedula: string;
  phone: string;
  rateVesPerUsd: string;
  note: string | null;
}

export interface BillingInstructionsView {
  plan: BillingPlanInstructionsView;
  manual: ManualPaymentInstructionsView;
}

export interface CheckoutSessionView {
  transactionId: string;
  gateway: PaymentGatewayView;
  checkoutUrl: string | null;
  token: string | null;
  gatewayOrderId: string | null;
}

export interface ManualPaymentValues {
  gateway: 'PAGO_MOVIL' | 'TRANSFERENCIA';
  referenceNumber: string;
  bank: string;
  amount: string;
  currency: 'USD' | 'VES';
  phone: string;
}
