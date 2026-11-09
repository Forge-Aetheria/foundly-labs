import {
  BadRequestException,
  Controller,
  Headers,
  HttpCode,
  Post,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';
import { BillingService } from './billing.service';
import { PaymentGateway } from './billing.types';
import { WebhookVerificationError } from './providers/payment-provider';

@Controller('api/v1/billing/webhooks')
export class BillingWebhookController {
  constructor(private readonly service: BillingService) {}

  @Post('paypal')
  @HttpCode(200)
  async paypal(
    @Req() request: RawBodyRequest<Request>,
    @Headers() headers: Record<string, string | string[] | undefined>,
  ): Promise<{ ok: true }> {
    return this.handle(PaymentGateway.PAYPAL, request, headers);
  }

  @Post('binance')
  @HttpCode(200)
  async binance(
    @Req() request: RawBodyRequest<Request>,
    @Headers() headers: Record<string, string | string[] | undefined>,
  ): Promise<{ ok: true }> {
    return this.handle(PaymentGateway.BINANCE, request, headers);
  }

  private async handle(
    gateway: PaymentGateway,
    request: RawBodyRequest<Request>,
    headers: Record<string, string | string[] | undefined>,
  ): Promise<{ ok: true }> {
    const rawBody = request.rawBody;
    if (!rawBody || rawBody.length === 0) {
      throw new BadRequestException('Missing raw webhook body');
    }
    try {
      await this.service.handleWebhook(gateway, rawBody, headers);
      return { ok: true };
    } catch (error) {
      if (error instanceof WebhookVerificationError) {
        throw new UnauthorizedException(error.message);
      }
      throw error;
    }
  }
}
