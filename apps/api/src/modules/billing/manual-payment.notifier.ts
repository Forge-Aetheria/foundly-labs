import { Injectable } from '@nestjs/common';
import { createLogger } from '../../shared/logger/logger';
import { BillingConfig } from './billing.config';
import type { PaymentTransactionRow } from './billing.store';

/** Emits an auditable operational alert for a pending manual payment. */
@Injectable()
export class ManualPaymentNotifier {
  private readonly logger = createLogger();

  constructor(private readonly config: BillingConfig) {}

  async notifyPending(row: PaymentTransactionRow): Promise<void> {
    const event = {
      event: 'manual_payment_pending',
      transactionId: row.id,
      tenantId: row.tenantId,
      gateway: row.gateway,
      referenceNumber: row.referenceNumber,
      amount: row.amount.toString(),
      currency: row.currency,
    };
    this.logger.info(event, 'Manual subscription payment pending approval');

    const url = this.config.alertWebhookUrl();
    if (!url) return;
    try {
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event),
        signal: AbortSignal.timeout(5_000),
      });
    } catch (error) {
      this.logger.warn({ err: error, transactionId: row.id }, 'Manual payment alert failed');
    }
  }
}
