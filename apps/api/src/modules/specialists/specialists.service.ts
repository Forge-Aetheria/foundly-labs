import { Injectable } from '@nestjs/common';
import type { Prisma } from '@foundly/database';
import { PrismaService } from '../../shared/prisma/prisma.service';
import {
  conflictError,
  isUniqueViolation,
  notFoundError,
  resolveTenantId,
  validationError,
} from '../../shared/tenant-scope';
import { TenantScopeInput } from '../../shared/tenant-scope';
import {
  CreateSpecialistInput,
  SpecialistObject,
  UpdateSpecialistInput,
} from './specialists.types';

const SPECIALIST_INCLUDE = {
  assignments: {
    include: { service: { select: { id: true, name: true } } },
  },
} satisfies Prisma.SpecialistInclude;

type SpecialistWithServices = Prisma.SpecialistGetPayload<{
  include: typeof SPECIALIST_INCLUDE;
}>;

@Injectable()
export class SpecialistsService {
  constructor(private readonly prismaService: PrismaService) {}

  async findSpecialists(scope: TenantScopeInput): Promise<SpecialistObject[]> {
    const tenantId = await resolveTenantId(this.prismaService.client, scope);
    if (tenantId === null) {
      return [];
    }
    const rows = await this.prismaService.client.specialist.findMany({
      where: { tenantId },
      include: SPECIALIST_INCLUDE,
      orderBy: { name: 'asc' },
    });
    return rows.map((row) => this.toSpecialistObject(row));
  }

  async findSpecialist(id: string): Promise<SpecialistObject | null> {
    const row = await this.prismaService.client.specialist.findUnique({
      where: { id },
      include: SPECIALIST_INCLUDE,
    });
    return row ? this.toSpecialistObject(row) : null;
  }

  async serviceSpecialists(serviceId: string): Promise<SpecialistObject[]> {
    const rows = await this.prismaService.client.specialistService.findMany({
      where: { serviceId },
      include: { specialist: { include: SPECIALIST_INCLUDE } },
    });
    return rows.map((row) => this.toSpecialistObject(row.specialist));
  }

  async createSpecialist(input: CreateSpecialistInput): Promise<SpecialistObject> {
    if (!input.name?.trim()) {
      throw validationError('Specialist name is required');
    }
    const tenantId = await resolveTenantId(this.prismaService.client, input);
    if (tenantId === null) {
      throw notFoundError('Business not found');
    }
    const data = {
      tenantId,
      name: input.name.trim(),
      role: input.role ?? null,
      avatar: input.avatar ?? null,
      bio: input.bio ?? null,
      active: input.active ?? true,
    } satisfies Prisma.SpecialistUncheckedCreateInput;

    const created = await this.prismaService.client.specialist.create({
      data,
      include: SPECIALIST_INCLUDE,
    });
    return this.toSpecialistObject(created);
  }

  async updateSpecialist(id: string, input: UpdateSpecialistInput): Promise<SpecialistObject> {
    if (input.name != null && !input.name.trim()) {
      throw validationError('Specialist name must not be empty');
    }
    const existing = await this.prismaService.client.specialist.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) {
      throw notFoundError('Specialist not found');
    }
    const data: Prisma.SpecialistUpdateInput = {
      ...(input.name != null ? { name: input.name.trim() } : {}),
      ...(input.role !== undefined ? { role: input.role } : {}),
      ...(input.avatar !== undefined ? { avatar: input.avatar } : {}),
      ...(input.bio !== undefined ? { bio: input.bio } : {}),
      ...(input.active != null ? { active: input.active } : {}),
    };
    const updated = await this.prismaService.client.specialist.update({
      where: { id },
      data,
      include: SPECIALIST_INCLUDE,
    });
    return this.toSpecialistObject(updated);
  }

  async removeSpecialist(id: string): Promise<boolean> {
    const existing = await this.prismaService.client.specialist.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) {
      throw notFoundError('Specialist not found');
    }
    await this.prismaService.client.$transaction([
      this.prismaService.client.specialistService.deleteMany({
        where: { specialistId: id },
      }),
      this.prismaService.client.specialist.delete({ where: { id } }),
    ]);
    return true;
  }

  async assignServiceToSpecialist(
    specialistId: string,
    serviceId: string,
  ): Promise<SpecialistObject> {
    const specialist = await this.prismaService.client.specialist.findUnique({
      where: { id: specialistId },
      select: { id: true, tenantId: true },
    });
    if (!specialist) {
      throw notFoundError('Specialist not found');
    }
    const service = await this.prismaService.client.service.findUnique({
      where: { id: serviceId },
      select: { id: true, tenantId: true },
    });
    if (!service) {
      throw notFoundError('Service not found');
    }
    if (specialist.tenantId !== service.tenantId) {
      throw notFoundError('Service and specialist belong to different businesses');
    }
    try {
      await this.prismaService.client.specialistService.create({
        data: { specialistId, serviceId },
      });
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw conflictError('Service already assigned to this specialist');
      }
      throw error;
    }
    const assigned = await this.findSpecialist(specialistId);
    if (!assigned) {
      throw notFoundError('Specialist not found');
    }
    return assigned;
  }

  async unassignServiceFromSpecialist(
    specialistId: string,
    serviceId: string,
  ): Promise<SpecialistObject> {
    const result = await this.prismaService.client.specialistService.deleteMany({
      where: { specialistId, serviceId },
    });
    if (result.count === 0) {
      throw notFoundError('Assignment not found');
    }
    const updated = await this.findSpecialist(specialistId);
    if (!updated) {
      throw notFoundError('Specialist not found');
    }
    return updated;
  }

  private toSpecialistObject(row: SpecialistWithServices): SpecialistObject {
    return {
      id: row.id,
      tenantId: row.tenantId,
      name: row.name,
      role: row.role ?? null,
      avatar: row.avatar ?? null,
      bio: row.bio ?? null,
      active: row.active,
      services: row.assignments.map((assignment) => ({
        id: assignment.service.id,
        name: assignment.service.name,
      })),
    };
  }
}
