import { Injectable } from '@nestjs/common';
import type { Prisma } from '@foundly/database';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { notFoundError, resolveTenantId, validationError } from '../../shared/tenant-scope';
import { AdvanceKind } from '../payments/payments.types';
import { CreateServiceInput, ServiceObject, UpdateServiceInput } from './services.types';

const ADVANCE_KINDS = new Set<string>(Object.values(AdvanceKind));

/** Validate a full advance rule (used on create): a positive value is required when enabled. */
function assertAdvanceRule(kind: AdvanceKind | null | undefined, value: number | null | undefined): void {
  if (kind == null || !ADVANCE_KINDS.has(kind)) {
    throw validationError('advanceKind must be fixed or percent');
  }
  if (!Number.isInteger(value) || (value ?? 0) < 1) {
    throw validationError('advanceValue must be a positive integer');
  }
  if (kind === AdvanceKind.percent && (value ?? 0) > 100) {
    throw validationError('advanceValue must be at most 100 for a percentage');
  }
}


const SERVICE_INCLUDE = {
  assignments: {
    include: { specialist: { select: { id: true, name: true } } },
  },
} satisfies Prisma.ServiceInclude;

type ServiceWithSpecialists = Prisma.ServiceGetPayload<{
  include: typeof SERVICE_INCLUDE;
}>;

export interface ServicesFilter {
  tenantId?: string | null;
  tenantSlug?: string | null;
  category?: string | null;
  minDuration?: number | null;
  maxDuration?: number | null;
}

function validateCreate(input: CreateServiceInput): void {
  if (!input.name?.trim()) {
    throw validationError('Service name is required');
  }
  if (input.durationMinutes <= 0) {
    throw validationError('durationMinutes must be positive');
  }
  const buffer = input.bufferMinutes ?? 0;
  if (buffer < 0) {
    throw validationError('bufferMinutes must be non-negative');
  }
  if (input.priceCents < 0) {
    throw validationError('priceCents must be non-negative');
  }
  if (input.requiresAdvance === true) {
    assertAdvanceRule(input.advanceKind, input.advanceValue);
  }
}

function validateUpdate(input: UpdateServiceInput): void {
  if (input.name != null && !input.name.trim()) {
    throw validationError('Service name must not be empty');
  }
  if (input.durationMinutes != null && input.durationMinutes <= 0) {
    throw validationError('durationMinutes must be positive');
  }
  if (input.bufferMinutes != null && input.bufferMinutes < 0) {
    throw validationError('bufferMinutes must be non-negative');
  }
  if (input.priceCents != null && input.priceCents < 0) {
    throw validationError('priceCents must be non-negative');
  }
  if (input.requiresAdvance === true) {
    assertAdvanceRule(input.advanceKind, input.advanceValue);
    return;
  }
  if (input.advanceKind != null && !ADVANCE_KINDS.has(input.advanceKind)) {
    throw validationError('advanceKind must be fixed or percent');
  }
  if (
    input.advanceValue != null &&
    (!Number.isInteger(input.advanceValue) || input.advanceValue < 1)
  ) {
    throw validationError('advanceValue must be a positive integer');
  }
  if (input.advanceKind === AdvanceKind.percent && (input.advanceValue ?? 0) > 100) {
    throw validationError('advanceValue must be at most 100 for a percentage');
  }
}

@Injectable()
export class ServicesService {
  constructor(private readonly prismaService: PrismaService) {}

  async findServices(filter: ServicesFilter): Promise<ServiceObject[]> {
    const tenantId = await resolveTenantId(this.prismaService.client, filter);
    if (tenantId === null) {
      return [];
    }
    const where: Prisma.ServiceWhereInput = {
      tenantId,
      ...(filter.category != null ? { category: filter.category } : {}),
      ...(filter.minDuration != null || filter.maxDuration != null
        ? {
            durationMinutes: {
              ...(filter.minDuration != null ? { gte: filter.minDuration } : {}),
              ...(filter.maxDuration != null ? { lte: filter.maxDuration } : {}),
            },
          }
        : {}),
    };
    const rows = await this.prismaService.client.service.findMany({
      where,
      include: SERVICE_INCLUDE,
      orderBy: { name: 'asc' },
    });
    return rows.map((row) => this.toServiceObject(row));
  }

  async findService(id: string): Promise<ServiceObject | null> {
    const row = await this.prismaService.client.service.findUnique({
      where: { id },
      include: SERVICE_INCLUDE,
    });
    return row ? this.toServiceObject(row) : null;
  }

  async createService(input: CreateServiceInput): Promise<ServiceObject> {
    validateCreate(input);
    const tenantId = await resolveTenantId(this.prismaService.client, input);
    if (tenantId === null) {
      throw notFoundError('Business not found');
    }
    const data = {
      tenantId,
      name: input.name.trim(),
      description: input.description ?? null,
      durationMinutes: input.durationMinutes,
      bufferMinutes: input.bufferMinutes ?? 0,
      category: input.category ?? null,
      priceCents: input.priceCents,
      currency: input.currency ?? 'EUR',
      active: input.active ?? true,
      requiresAdvance: input.requiresAdvance ?? false,
      advanceKind: input.requiresAdvance ? (input.advanceKind ?? null) : null,
      advanceValue: input.requiresAdvance ? (input.advanceValue ?? null) : null,
    } satisfies Prisma.ServiceUncheckedCreateInput;

    const created = await this.prismaService.client.service.create({
      data,
      include: SERVICE_INCLUDE,
    });
    return this.toServiceObject(created);
  }

  async updateService(id: string, input: UpdateServiceInput): Promise<ServiceObject> {
    validateUpdate(input);
    const existing = await this.prismaService.client.service.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) {
      throw notFoundError('Service not found');
    }
    const data: Prisma.ServiceUpdateInput = {
      ...(input.name != null ? { name: input.name.trim() } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.durationMinutes != null ? { durationMinutes: input.durationMinutes } : {}),
      ...(input.bufferMinutes != null ? { bufferMinutes: input.bufferMinutes } : {}),
      ...(input.category !== undefined ? { category: input.category } : {}),
      ...(input.priceCents != null ? { priceCents: input.priceCents } : {}),
      ...(input.currency != null ? { currency: input.currency } : {}),
      ...(input.active != null ? { active: input.active } : {}),
      ...(input.requiresAdvance === false
        ? { requiresAdvance: false, advanceKind: null, advanceValue: null }
        : {}),
      ...(input.requiresAdvance === true
        ? {
            requiresAdvance: true,
            advanceKind: input.advanceKind ?? null,
            advanceValue: input.advanceValue ?? null,
          }
        : {}),
      ...(input.requiresAdvance == null
        ? {
            ...(input.advanceKind !== undefined ? { advanceKind: input.advanceKind } : {}),
            ...(input.advanceValue !== undefined ? { advanceValue: input.advanceValue } : {}),
          }
        : {}),
    };
    const updated = await this.prismaService.client.service.update({
      where: { id },
      data,
      include: SERVICE_INCLUDE,
    });
    return this.toServiceObject(updated);
  }

  async removeService(id: string): Promise<boolean> {
    const existing = await this.prismaService.client.service.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) {
      throw notFoundError('Service not found');
    }
    await this.prismaService.client.$transaction([
      this.prismaService.client.specialistService.deleteMany({
        where: { serviceId: id },
      }),
      this.prismaService.client.service.delete({ where: { id } }),
    ]);
    return true;
  }

  private toServiceObject(row: ServiceWithSpecialists): ServiceObject {
    return {
      id: row.id,
      tenantId: row.tenantId,
      name: row.name,
      description: row.description ?? null,
      durationMinutes: row.durationMinutes,
      bufferMinutes: row.bufferMinutes,
      category: row.category ?? null,
      priceCents: row.priceCents,
      currency: row.currency,
      active: row.active,
      requiresAdvance: row.requiresAdvance,
      advanceKind: row.advanceKind ?? null,
      advanceValue: row.advanceValue ?? null,
      specialists: row.assignments.map((assignment) => ({
        id: assignment.specialist.id,
        name: assignment.specialist.name,
      })),
    };
  }
}
