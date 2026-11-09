import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BillingWebhookController } from './billing-webhook.controller';
import type { BillingService } from './billing.service';
import { WebhookVerificationError } from './providers/payment-provider';

function request(rawBody?: Buffer): RawBodyRequest<Request> {
  return { rawBody } as RawBodyRequest<Request>;
}

describe('BillingWebhookController', () => {
  let service: { handleWebhook: ReturnType<typeof vi.fn> };
  let controller: BillingWebhookController;

  beforeEach(() => {
    service = { handleWebhook: vi.fn(async () => undefined) };
    controller = new BillingWebhookController(service as unknown as BillingService);
  });

  it('accepts a valid PayPal webhook', async () => {
    await expect(
      controller.paypal(request(Buffer.from('{"id":"evt"}')), { 'paypal-transmission-id': 'x' }),
    ).resolves.toEqual({ ok: true });
    expect(service.handleWebhook).toHaveBeenCalledWith(
      'PAYPAL',
      expect.any(Buffer),
      expect.any(Object),
    );
  });

  it('accepts a valid Binance webhook', async () => {
    await expect(
      controller.binance(request(Buffer.from('{"bizId":"evt"}')), {}),
    ).resolves.toEqual({ ok: true });
    expect(service.handleWebhook).toHaveBeenCalledWith(
      'BINANCE',
      expect.any(Buffer),
      expect.any(Object),
    );
  });

  it('returns 401 for an invalid signature', async () => {
    service.handleWebhook.mockRejectedValue(new WebhookVerificationError('bad signature'));
    await expect(controller.paypal(request(Buffer.from('{}')), {})).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('returns 400 when the raw body is missing', async () => {
    await expect(controller.binance(request(undefined), {})).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});
