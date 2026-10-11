import { Injectable } from '@nestjs/common';
import type { Prisma } from '@foundly/database';
import { PrismaService } from '../../shared/prisma/prisma.service';
import {
  notFoundError,
  parseJsonField,
  resolveTenantId,
  validationError,
} from '../../shared/tenant-scope';
import { TenantScopeInput } from '../../shared/tenant-scope';
import {
  AvailabilityObject,
  CreateAvailabilityInput,
  UpdateAvailabilityInput,
} from './availability.types';

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

type AvailabilityRow = Prisma.AvailabilityGetPayload<Record<string, never>>;

function validateRange(input: {
  weekday?: number | null;
  startTime?: string | null;
  endTime?: string | null;
  slotGranularityMinutes?: number | null;
  minLeadTimeMinutes?: number | null;
  bookingHorizonDays?: number | null;
}): void {
  if (input.weekday != null && (input.weekday < 0 || input.weekday > 6)) {
    throw validationError('weekday must be between 0 and 6');
  }
  if (input.startTime != null && !TIME_PATTERN.test(input.startTime)) {
    throw validationError('startTime must use HH:mm');
  }
  if (input.endTime != null && !TIME_PATTERN.test(input.endTime)) {
    throw validationError('endTime must use HH:mm');
  }
  if (input.startTime != null && input.endTime != null && input.endTime <= input.startTime) {
    throw validationError('endTime must be strictly after startTime');
  }
  if (input.slotGranularityMinutes != null && input.slotGranularityMinutes < 1) {
    throw validationError('slotGranularityMinutes must be at least 1');
  }
  if (input.minLeadTimeMinutes != null && input.minLeadTimeMinutes < 0) {
    throw validationError('minLeadTimeMinutes must be non-negative');
  }
  if (input.bookingHorizonDays != null && input.bookingHorizonDays < 0) {
    throw validationError('bookingHorizonDays must be non-negative');
  }
}

function serializeJson(value: unknown): string | null {
  return value == null ? null : JSON.stringify(value);
}

@Injectable()
export class AvailabilityService {
  constructor(private readonly prismaService: PrismaService) {}

  async findAvailability(
    scope: TenantScopeInput,
    specialistId?: string | null,
  ): Promise<AvailabilityObject[]> {
    const tenantId = await resolveTenantId(this.prismaService.client, scope);
    if (tenantId === null) {
      return [];
    }
    const where: Prisma.AvailabilityWhereInput = {
      tenantId,
      ...(specialistId ? { OR: [{ specialistId: null }, { specialistId }] } : {}),
    };
    const rows = await this.prismaService.client.availability.findMany({
      where,
      orderBy: [{ weekday: 'asc' }, { startTime: 'asc' }],
    });
    return rows.map((row) => this.toAvailabilityObject(row));
  }

  async createAvailability(input: CreateAvailabilityInput): Promise<AvailabilityObject> {
    validateRange(input);
    const tenantId = await resolveTenantId(this.prismaService.client, input);
    if (tenantId === null) {
      throw notFoundError('Business not found');
    }
    const breaks = parseJsonField(input.breaks, 'breaks');
    const data = {
      tenantId,
      specialistId: input.specialistId ?? null,
      weekday: input.weekday,
      startTime: input.startTime,
      endTime: input.endTime,
      slotGranularityMinutes: input.slotGranularityMinutes ?? 30,
      minLeadTimeMinutes: input.minLeadTimeMinutes ?? 0,
      bookingHorizonDays: input.bookingHorizonDays ?? 60,
      ...(breaks != null ? { breaks } : {}),
    } as Prisma.AvailabilityUncheckedCreateInput;

    const created = await this.prismaService.client.availability.create({ data });
    return this.toAvailabilityObject(created);
  }

  async updateAvailability(
    id: string,
    input: UpdateAvailabilityInput,
  ): Promise<AvailabilityObject> {
    const existing = await this.prismaService.client.availability.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) {
      throw notFoundError('Availability entry not found');
    }
    validateRange(input);
    const incomingBreaks =
      input.breaks !== undefined ? parseJsonField(input.breaks, 'breaks') : null;
    const data: Prisma.AvailabilityUpdateInput = {
      ...(input.specialistId !== undefined ? { specialistId: input.specialistId } : {}),
      ...(input.weekday != null ? { weekday: input.weekday } : {}),
      ...(input.startTime != null ? { startTime: input.startTime } : {}),
      ...(input.endTime != null ? { endTime: input.endTime } : {}),
      ...(input.slotGranularityMinutes != null
        ? { slotGranularityMinutes: input.slotGranularityMinutes }
        : {}),
      ...(input.minLeadTimeMinutes != null ? { minLeadTimeMinutes: input.minLeadTimeMinutes } : {}),
      ...(input.bookingHorizonDays != null ? { bookingHorizonDays: input.bookingHorizonDays } : {}),
      ...(input.breaks !== undefined && incomingBreaks !== null ? { breaks: incomingBreaks } : {}),
    };
    const updated = await this.prismaService.client.availability.update({
      where: { id },
      data,
    });
    return this.toAvailabilityObject(updated);
  }

  async removeAvailability(id: string): Promise<boolean> {
    const result = await this.prismaService.client.availability.deleteMany({
      where: { id },
    });
    if (result.count === 0) {
      throw notFoundError('Availability entry not found');
    }
    return true;
  }

  private toAvailabilityObject(row: AvailabilityRow): AvailabilityObject {
    return {
      id: row.id,
      tenantId: row.tenantId,
      specialistId: row.specialistId,
      weekday: row.weekday,
      startTime: row.startTime,
      endTime: row.endTime,
      slotGranularityMinutes: row.slotGranularityMinutes,
      minLeadTimeMinutes: row.minLeadTimeMinutes,
      bookingHorizonDays: row.bookingHorizonDays,
      breaks: serializeJson(row.breaks),
    };
  }
}
