import { Inject, Injectable } from '@nestjs/common';
import { GraphQLError } from 'graphql';
import type { AuthUser } from '../auth/jwt.types';
import {
  conflictError,
  notFoundError,
  validationError,
} from '../../shared/tenant-scope';
import type {
  CreateMyServiceInput,
  CreateMySpecialistInput,
  UpdateMyServiceInput,
  UpdateMySpecialistInput,
} from './catalog.types';
import {
  CATALOG_STORE,
  type CatalogStore,
  type ServiceRow,
  type SpecialistRow,
} from './catalog.store';

function scopeError(): GraphQLError {
  return new GraphQLError('Missing tenant scope', {
    extensions: { code: 'UNAUTHENTICATED' },
  });
}

function isNonEmptyString(value: unknown): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

/** Authenticated, tenant-scoped CRUD for the core catalog entities. */
@Injectable()
export class CatalogService {
  constructor(@Inject(CATALOG_STORE) private readonly store: CatalogStore) {}

  /** Resolve the authoritative tenant scope from the authenticated identity (never client input). */
  requireTenant(user: Pick<AuthUser, 'tenantId'> | undefined): string {
    if (!user?.tenantId) {
      throw scopeError();
    }
    return user.tenantId;
  }

  async listServices(
    tenantId: string,
    active?: boolean,
  ): Promise<ServiceRow[]> {
    const rows = await this.store.listServices(tenantId);
    return active === undefined ? rows : rows.filter((row) => row.active === active);
  }

  async getService(id: string, tenantId: string): Promise<ServiceRow> {
    const row = await this.store.getService(id, tenantId);
    if (!row) {
      throw notFoundError('Service not found');
    }
    return row;
  }

  async createService(
    tenantId: string,
    input: CreateMyServiceInput,
  ): Promise<ServiceRow> {
    assertServiceCreate(input);
    const existing = await this.store.findServiceByName(tenantId, input.name);
    if (existing) {
      throw conflictError('A service with this name already exists');
    }
    return this.store.createService(tenantId, input);
  }

  async updateService(
    id: string,
    tenantId: string,
    input: UpdateMyServiceInput,
  ): Promise<ServiceRow> {
    await this.getService(id, tenantId);
    assertServiceUpdate(input);
    if (input.name !== undefined && input.name !== null) {
      const existing = await this.store.findServiceByName(tenantId, input.name);
      if (existing && existing.id !== id) {
        throw conflictError('A service with this name already exists');
      }
    }
    const updated = await this.store.updateService(id, tenantId, input);
    return updated ?? this.getService(id, tenantId);
  }

  async deleteService(id: string, tenantId: string): Promise<boolean> {
    await this.getService(id, tenantId);
    return this.store.deleteService(id, tenantId);
  }

  async listSpecialists(
    tenantId: string,
    active?: boolean,
  ): Promise<SpecialistRow[]> {
    const rows = await this.store.listSpecialists(tenantId);
    return active === undefined ? rows : rows.filter((row) => row.active === active);
  }

  async getSpecialist(id: string, tenantId: string): Promise<SpecialistRow> {
    const row = await this.store.getSpecialist(id, tenantId);
    if (!row) {
      throw notFoundError('Specialist not found');
    }
    return row;
  }

  async createSpecialist(
    tenantId: string,
    input: CreateMySpecialistInput,
  ): Promise<SpecialistRow> {
    if (!isNonEmptyString(input.name)) {
      throw validationError('Specialist name is required');
    }
    return this.store.createSpecialist(tenantId, input);
  }

  async updateSpecialist(
    id: string,
    tenantId: string,
    input: UpdateMySpecialistInput,
  ): Promise<SpecialistRow> {
    await this.getSpecialist(id, tenantId);
    if (input.name !== undefined && input.name !== null && !isNonEmptyString(input.name)) {
      throw validationError('Specialist name, when provided, must not be empty');
    }
    const updated = await this.store.updateSpecialist(id, tenantId, input);
    return updated ?? this.getSpecialist(id, tenantId);
  }

  async deleteSpecialist(id: string, tenantId: string): Promise<boolean> {
    await this.getSpecialist(id, tenantId);
    return this.store.deleteSpecialist(id, tenantId);
  }
}

function assertServiceCreate(input: CreateMyServiceInput): void {
  if (!isNonEmptyString(input.name)) {
    throw validationError('Service name is required');
  }
  if (!Number.isInteger(input.priceCents) || input.priceCents < 0) {
    throw validationError('priceCents must be a non-negative integer');
  }
  if (!Number.isInteger(input.durationMinutes) || input.durationMinutes <= 0) {
    throw validationError('durationMinutes must be a positive integer');
  }
}

function assertServiceUpdate(input: UpdateMyServiceInput): void {
  if (input.name !== undefined && input.name !== null && !isNonEmptyString(input.name)) {
    throw validationError('Service name, when provided, must not be empty');
  }
  if (
    input.priceCents !== undefined &&
    input.priceCents !== null &&
    (!Number.isInteger(input.priceCents) || input.priceCents < 0)
  ) {
    throw validationError('priceCents must be a non-negative integer');
  }
  if (
    input.durationMinutes !== undefined &&
    input.durationMinutes !== null &&
    (!Number.isInteger(input.durationMinutes) || input.durationMinutes <= 0)
  ) {
    throw validationError('durationMinutes must be a positive integer');
  }
}