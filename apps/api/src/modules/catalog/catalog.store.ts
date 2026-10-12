import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import type {
  CreateMyServiceInput,
  CreateMySpecialistInput,
  UpdateMyServiceInput,
  UpdateMySpecialistInput,
} from './catalog.types';

/** Storage-row views used across the store/service (mirror the ratified schema fields used here). */
export interface ServiceRow {
  id: string;
  tenantId: string;
  name: string;
  description: string | null;
  priceCents: number;
  durationMinutes: number;
  category: string | null;
  active: boolean;
}

export interface SpecialistRow {
  id: string;
  tenantId: string;
  name: string;
  role: string | null;
  bio: string | null;
  avatar: string | null;
  active: boolean;
}

export const CATALOG_STORE = Symbol('CATALOG_STORE');

/** Narrow persistence seam over the Prisma methods this module uses (replaced in tests). */
export interface CatalogStore {
  listServices(tenantId: string): Promise<ServiceRow[]>;
  getService(id: string, tenantId: string): Promise<ServiceRow | null>;
  findServiceByName(tenantId: string, name: string): Promise<ServiceRow | null>;
  createService(tenantId: string, input: CreateMyServiceInput): Promise<ServiceRow>;
  updateService(id: string, tenantId: string, input: UpdateMyServiceInput): Promise<ServiceRow | null>;
  deleteService(id: string, tenantId: string): Promise<boolean>;

  listSpecialists(tenantId: string): Promise<SpecialistRow[]>;
  getSpecialist(id: string, tenantId: string): Promise<SpecialistRow | null>;
  createSpecialist(tenantId: string, input: CreateMySpecialistInput): Promise<SpecialistRow>;
  updateSpecialist(
    id: string,
    tenantId: string,
    input: UpdateMySpecialistInput,
  ): Promise<SpecialistRow | null>;
  deleteSpecialist(id: string, tenantId: string): Promise<boolean>;
}

const serviceSelect = {
  id: true,
  tenantId: true,
  name: true,
  description: true,
  priceCents: true,
  durationMinutes: true,
  category: true,
  active: true,
} as const;

const specialistSelect = {
  id: true,
  tenantId: true,
  name: true,
  role: true,
  bio: true,
  avatar: true,
  active: true,
} as const;

/** Real implementation over the shared Prisma client (single persistence seam). */
@Injectable()
export class PrismaCatalogStore implements CatalogStore {
  constructor(private readonly prismaService: PrismaService) {}

  listServices(tenantId: string): Promise<ServiceRow[]> {
    return this.prismaService.client.service.findMany({
      where: { tenantId },
      select: serviceSelect,
    });
  }

  getService(id: string, tenantId: string): Promise<ServiceRow | null> {
    return this.prismaService.client.service.findFirst({
      where: { id, tenantId },
      select: serviceSelect,
    });
  }

  findServiceByName(tenantId: string, name: string): Promise<ServiceRow | null> {
    return this.prismaService.client.service.findFirst({
      where: { tenantId, name },
      select: serviceSelect,
    });
  }

  createService(tenantId: string, input: CreateMyServiceInput): Promise<ServiceRow> {
    return this.prismaService.client.service.create({
      data: {
        tenantId,
        name: input.name,
        description: input.description ?? null,
        priceCents: input.priceCents,
        durationMinutes: input.durationMinutes,
        category: input.category ?? null,
        active: input.active ?? true,
      },
      select: serviceSelect,
    });
  }

  updateService(
    id: string,
    tenantId: string,
    input: UpdateMyServiceInput,
  ): Promise<ServiceRow | null> {
    return this.prismaService.client.service
      .updateMany({
        where: { id, tenantId },
        data: {
          ...(input.name !== undefined && input.name !== null ? { name: input.name } : {}),
          ...(input.description !== undefined ? { description: input.description } : {}),
          ...(input.priceCents !== undefined && input.priceCents !== null
            ? { priceCents: input.priceCents }
            : {}),
          ...(input.durationMinutes !== undefined && input.durationMinutes !== null
            ? { durationMinutes: input.durationMinutes }
            : {}),
          ...(input.category !== undefined ? { category: input.category } : {}),
          ...(input.active !== undefined && input.active !== null ? { active: input.active } : {}),
        },
      })
      .then((result) =>
        result.count > 0
          ? this.prismaService.client.service.findFirst({
              where: { id, tenantId },
              select: serviceSelect,
            })
          : null,
      );
  }

  async deleteService(id: string, tenantId: string): Promise<boolean> {
    const result = await this.prismaService.client.service.deleteMany({
      where: { id, tenantId },
    });
    return result.count > 0;
  }

  listSpecialists(tenantId: string): Promise<SpecialistRow[]> {
    return this.prismaService.client.specialist.findMany({
      where: { tenantId },
      select: specialistSelect,
    });
  }

  getSpecialist(id: string, tenantId: string): Promise<SpecialistRow | null> {
    return this.prismaService.client.specialist.findFirst({
      where: { id, tenantId },
      select: specialistSelect,
    });
  }

  createSpecialist(tenantId: string, input: CreateMySpecialistInput): Promise<SpecialistRow> {
    return this.prismaService.client.specialist.create({
      data: {
        tenantId,
        name: input.name,
        role: input.role ?? null,
        bio: input.bio ?? null,
        avatar: input.avatar ?? null,
        active: input.active ?? true,
      },
      select: specialistSelect,
    });
  }

  updateSpecialist(
    id: string,
    tenantId: string,
    input: UpdateMySpecialistInput,
  ): Promise<SpecialistRow | null> {
    return this.prismaService.client.specialist
      .updateMany({
        where: { id, tenantId },
        data: {
          ...(input.name !== undefined && input.name !== null ? { name: input.name } : {}),
          ...(input.role !== undefined ? { role: input.role } : {}),
          ...(input.bio !== undefined ? { bio: input.bio } : {}),
          ...(input.avatar !== undefined ? { avatar: input.avatar } : {}),
          ...(input.active !== undefined && input.active !== null ? { active: input.active } : {}),
        },
      })
      .then((result) =>
        result.count > 0
          ? this.prismaService.client.specialist.findFirst({
              where: { id, tenantId },
              select: specialistSelect,
            })
          : null,
      );
  }

  async deleteSpecialist(id: string, tenantId: string): Promise<boolean> {
    const owned = await this.prismaService.client.specialist.findFirst({
      where: { id, tenantId },
      select: { id: true },
    });
    if (!owned) {
      return false;
    }
    await this.prismaService.client.$transaction([
      this.prismaService.client.specialistService.deleteMany({ where: { specialistId: id } }),
      this.prismaService.client.specialist.delete({ where: { id } }),
    ]);
    return true;
  }
}