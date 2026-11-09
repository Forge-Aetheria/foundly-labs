import type {
  PaymentGatewayView,
  PaymentStatusView,
  SubscriptionStatusView,
} from './types';

const CURRENCY_FORMAT: Record<string, string> = {
  USD: 'en-US',
  VES: 'es-VE',
};

export function formatAmount(amount: string, currency: string): string {
  const value = Number(amount);
  if (!Number.isFinite(value)) return `${amount} ${currency}`;
  return new Intl.NumberFormat(CURRENCY_FORMAT[currency] ?? 'es-ES', {
    style: 'currency',
    currency: currency || 'USD',
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatDate(value: string | null): string {
  if (!value) return 'Sin fecha';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Sin fecha';
  return new Intl.DateTimeFormat('es-ES', { dateStyle: 'medium' }).format(date);
}

export function subscriptionStatusLabel(status: SubscriptionStatusView): string {
  switch (status) {
    case 'active':
      return 'Activa';
    case 'past_due':
      return 'Pago pendiente';
    case 'expired':
      return 'Vencida';
    case 'canceled':
      return 'Cancelada';
  }
}

export function subscriptionStatusTone(
  status: SubscriptionStatusView,
): 'success' | 'warning' | 'error' | 'default' {
  switch (status) {
    case 'active':
      return 'success';
    case 'past_due':
      return 'warning';
    case 'expired':
    case 'canceled':
      return 'error';
  }
}

export function paymentStatusLabel(status: PaymentStatusView): string {
  switch (status) {
    case 'PENDING':
      return 'Pendiente de confirmación';
    case 'PENDING_APPROVAL':
      return 'Pendiente de aprobación';
    case 'COMPLETED':
      return 'Completado';
    case 'REJECTED':
      return 'Rechazado';
    case 'FAILED':
      return 'Fallido';
  }
}

export function paymentStatusTone(
  status: PaymentStatusView,
): 'success' | 'warning' | 'error' | 'info' {
  switch (status) {
    case 'COMPLETED':
      return 'success';
    case 'PENDING':
    case 'PENDING_APPROVAL':
      return 'warning';
    case 'REJECTED':
    case 'FAILED':
      return 'error';
  }
}

export function gatewayLabel(gateway: PaymentGatewayView): string {
  switch (gateway) {
    case 'PAYPAL':
      return 'PayPal';
    case 'BINANCE':
      return 'Binance Pay';
    case 'PAGO_MOVIL':
      return 'Pago Móvil';
    case 'TRANSFERENCIA':
      return 'Transferencia';
  }
}
