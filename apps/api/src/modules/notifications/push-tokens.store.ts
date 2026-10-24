import { Injectable } from '@nestjs/common';
import type { PushPlatform } from '@prisma/client';
import { PrismaService } from '../../shared/prisma/prisma.service';

export interface PushDeviceTokenRow {
  id: string;
  tenantId: string;
  userId: string;
  token: string;
  platform: PushPlatform;
  deviceId: string | null;
  createdAt: Date;
  updatedAt: Date;
  lastSeenAt: Date;
}

export interface RegisterPushTokenData {
  tenantId: string;
  userId: string;
  token: string;
  platform: PushPlatform;
  deviceId?: string | null;
}

export const PUSH_TOKEN_STORE = Symbol('PUSH_TOKEN_STORE');

export interface PushTokenStore {
  upsert(input: RegisterPushTokenData): Promise<PushDeviceTokenRow>;
  remove(tenantId: string, token: string): Promise<boolean>;
  listByTenant(tenantId: string): Promise<PushDeviceTokenRow[]>;
  removeByToken(token: string): Promise<void>;
}

@Injectable()
export class PrismaPushTokenStore implements PushTokenStore {
  constructor(private readonly prismaService: PrismaService) {}

  upsert(input: RegisterPushTokenData): Promise<PushDeviceTokenRow> {
    const now = new Date();
    return this.prismaService.client.pushDeviceToken.upsert({
      where: { token: input.token },
      create: {
        tenantId: input.tenantId,
        userId: input.userId,
        token: input.token,
        platform: input.platform,
        deviceId: input.deviceId ?? null,
        lastSeenAt: now,
      },
      update: {
        tenantId: input.tenantId,
        userId: input.userId,
        platform: input.platform,
        deviceId: input.deviceId ?? null,
        lastSeenAt: now,
      },
    });
  }

  async remove(tenantId: string, token: string): Promise<boolean> {
    const result = await this.prismaService.client.pushDeviceToken.deleteMany({
      where: { tenantId, token },
    });
    return result.count > 0;
  }

  listByTenant(tenantId: string): Promise<PushDeviceTokenRow[]> {
    return this.prismaService.client.pushDeviceToken.findMany({ where: { tenantId } });
  }

  async removeByToken(token: string): Promise<void> {
    await this.prismaService.client.pushDeviceToken.deleteMany({ where: { token } });
  }
}
