import { Module } from '@nestjs/common';
import { PAYMENTS_STORE, PrismaPaymentsStore } from './payments.store';
import { PaymentsService } from './payments.service';
import { PaymentsResolver } from './payments.resolver';

@Module({
  providers: [
    { provide: PAYMENTS_STORE, useClass: PrismaPaymentsStore },
    PaymentsService,
    PaymentsResolver,
  ],
})
export class PaymentsModule {}
