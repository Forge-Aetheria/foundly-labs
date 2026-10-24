import { Inject, Injectable } from '@nestjs/common';
import { GraphQLError } from 'graphql';
import type { AuthUser } from '../auth/jwt.types';
import {
  PUSH_TOKEN_STORE,
  type PushDeviceTokenRow,
  type PushTokenStore,
} from './push-tokens.store';
import type { RegisterPushTokenInput } from './push-tokens.types';

const EXPO_TOKEN_PATTERN = /^(ExponentPushToken|ExpoPushToken)\[[A-Za-z0-9_-]+\]$/;

function unauthenticated(): GraphQLError {
  return new GraphQLError('Missing tenant scope', {
    extensions: { code: 'UNAUTHENTICATED' },
  });
}

function invalidToken(): GraphQLError {
  return new GraphQLError('Invalid push token', {
    extensions: { code: 'VALIDATION_ERROR' },
  });
}

@Injectable()
export class PushTokensService {
  constructor(@Inject(PUSH_TOKEN_STORE) private readonly store: PushTokenStore) {}

  async register(
    user: Pick<AuthUser, 'sub' | 'tenantId'> | undefined,
    input: RegisterPushTokenInput,
  ): Promise<PushDeviceTokenRow> {
    if (!user?.tenantId) throw unauthenticated();
    if (!EXPO_TOKEN_PATTERN.test(input.token)) throw invalidToken();
    return this.store.upsert({
      tenantId: user.tenantId,
      userId: user.sub,
      token: input.token,
      platform: input.platform,
      deviceId: input.deviceId ?? null,
    });
  }

  async unregister(user: Pick<AuthUser, 'tenantId'> | undefined, token: string): Promise<boolean> {
    if (!user?.tenantId) throw unauthenticated();
    return this.store.remove(user.tenantId, token);
  }
}
