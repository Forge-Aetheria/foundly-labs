import { Inject, Injectable } from '@nestjs/common';
import { createLogger } from '../../shared/logger/logger';
import { PUSH_TOKEN_STORE, type PushTokenStore } from './push-tokens.store';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
const BATCH_SIZE = 100;

interface ExpoPushMessage {
  to: string;
  title: string;
  body: string;
  sound: 'default';
  data: { type: string; notificationId: string };
}

interface ExpoPushTicket {
  status: 'ok' | 'error';
  details?: { error?: string };
}

interface ExpoPushResponse {
  data?: ExpoPushTicket[];
}

export interface PushPayload {
  notificationId: string;
  type: string;
  title: string;
  message: string;
}

@Injectable()
export class ExpoPushService {
  private readonly logger = createLogger();

  constructor(@Inject(PUSH_TOKEN_STORE) private readonly store: PushTokenStore) {}

  async sendToTenant(tenantId: string, payload: PushPayload): Promise<void> {
    try {
      const tokens = await this.store.listByTenant(tenantId);
      if (tokens.length === 0) return;

      for (let index = 0; index < tokens.length; index += BATCH_SIZE) {
        const batch = tokens.slice(index, index + BATCH_SIZE);
        const messages: ExpoPushMessage[] = batch.map((row) => ({
          to: row.token,
          title: payload.title,
          body: payload.message,
          sound: 'default',
          data: { type: payload.type, notificationId: payload.notificationId },
        }));

        const response = await fetch(EXPO_PUSH_URL, {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Accept-Encoding': 'gzip, deflate',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(messages),
        });
        if (!response.ok) continue;

        const body = (await response.json()) as ExpoPushResponse;
        const tickets = body.data ?? [];
        await Promise.all(
          tickets.map(async (ticket, ticketIndex) => {
            if (ticket.status === 'error' && ticket.details?.error === 'DeviceNotRegistered') {
              const token = batch[ticketIndex]?.token;
              if (token) await this.store.removeByToken(token);
            }
          }),
        );
      }
    } catch (error) {
      this.logger.warn({ err: error, tenantId }, 'Expo push delivery failed');
    }
  }
}
