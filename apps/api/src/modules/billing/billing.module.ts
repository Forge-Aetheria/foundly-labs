import { Module } from '@nestjs/common';
import { SharedPrismaModule } from '../../shared/prisma/prisma.module';
import { PlatformModule } from '../platform/platform.module';
import { BillingConfig } from './billing.config';
import { BillingService } from './billing.service';
import { BILLING_STORE, PrismaBillingStore } from './billing.store';
import { BillingResolver } from './billing.resolver';
import { BillingWebhookController } from './billing-webhook.controller';
import { ManualPaymentNotifier } from './manual-payment.notifier';
import { BinanceProvider } from './providers/binance.provider';
import { PaypalProvider } from './providers/paypal.provider';
import { BINANCE_PROVIDER, PAYPAL_PROVIDER } from './providers/payment-provider';

@Module({
  imports: [SharedPrismaModule, PlatformModule],
  controllers: [BillingWebhookController],
  providers: [
    { provide: BILLING_STORE, useClass: PrismaBillingStore },
    BillingConfig,
    { provide: PAYPAL_PROVIDER, useClass: PaypalProvider },
    { provide: BINANCE_PROVIDER, useClass: BinanceProvider },
    ManualPaymentNotifier,
    BillingService,
    BillingResolver,
  ],
  exports: [BillingService, BILLING_STORE],
})
export class BillingModule {}
