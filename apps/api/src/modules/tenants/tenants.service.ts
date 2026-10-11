import { Injectable } from '@nestjs/common';
import type { Prisma } from '@foundly/database';
import { GraphQLError } from 'graphql';
import { PrismaService } from '../../shared/prisma/prisma.service';
import {
  BusinessProfileObject,
  CreateTenantInput,
  ServiceObject,
  TenantObject,
} from './tenants.types';

const RESERVED_SLUGS = ['admin', 'onboarding', 'api', 'www', 'app', 'public', 'static', 'assets'];

const SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])?$/;

const TENANT_INCLUDE = {
  profile: true,
  services: true,
} satisfies Prisma.TenantInclude;

type TenantWithProfile = Prisma.TenantGetPayload<{
  include: typeof TENANT_INCLUDE;
}>;

function validationError(message: string): GraphQLError {
  return new GraphQLError(message, {
    extensions: { code: 'VALIDATION_ERROR' },
  });
}

function isUniqueViolation(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) {
    return false;
  }
  return 'code' in error && (error as { code?: unknown }).code === 'P2002';
}

function serializeJson(value: unknown): string | null {
  return value == null ? null : JSON.stringify(value);
}

@Injectable()
export class TenantsService {
  constructor(private readonly prismaService: PrismaService) {}

  async findAll(): Promise<TenantObject[]> {
    const rows = await this.prismaService.client.tenant.findMany({
      include: TENANT_INCLUDE,
    });
    return rows.map((row) => this.toTenantObject(row));
  }

  async findBySlug(slug: string): Promise<TenantObject | null> {
    const businessProfile = await this.prismaService.client.businessProfile.findUnique({
      where: { slug },
      include: { tenant: { include: TENANT_INCLUDE } },
    });
    return businessProfile ? this.toTenantObject(businessProfile.tenant) : null;
  }

  async create(input: CreateTenantInput): Promise<TenantObject> {
    const slug = input.profile.slug;
    if (!SLUG_PATTERN.test(slug) || RESERVED_SLUGS.includes(slug)) {
      throw validationError('Invalid or reserved slug');
    }

    let brandColors: unknown;
    let policies: unknown;
    try {
      brandColors =
        input.profile.brandColors != null ? JSON.parse(input.profile.brandColors) : null;
      policies = input.profile.policies != null ? JSON.parse(input.profile.policies) : null;
    } catch {
      throw validationError('brandColors/policies must be valid JSON');
    }

    const data = {
      name: input.name,
      category: input.category,
      timezone: input.timezone,
      currency: input.currency ?? 'EUR',
      profile: {
        create: {
          slug,
          bio: input.profile.bio ?? null,
          address: input.profile.address ?? null,
          phone: input.profile.phone ?? null,
          instagram: input.profile.instagram ?? null,
          whatsapp: input.profile.whatsapp ?? null,
          logo: input.profile.logo ?? null,
          cover: input.profile.cover ?? null,
          brandColors,
          policies,
        },
      },
    } as unknown as Prisma.TenantCreateInput;

    try {
      const created = await this.prismaService.client.tenant.create({
        data,
        include: TENANT_INCLUDE,
      });
      return this.toTenantObject(created);
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new GraphQLError('Slug already taken', {
          extensions: { code: 'CONFLICT' },
        });
      }
      throw error;
    }
  }

  private toTenantObject(row: TenantWithProfile): TenantObject {
    return {
      id: row.id,
      name: row.name,
      category: row.category,
      status: row.status,
      timezone: row.timezone,
      currency: row.currency,
      profile: row.profile ? this.toProfileObject(row.profile) : null,
      services: row.services.map((service) => this.toServiceObject(service)),
    };
  }

  private toProfileObject(profile: TenantWithProfile['profile']): BusinessProfileObject {
    return {
      id: profile?.id ?? '',
      slug: profile?.slug ?? '',
      bio: profile?.bio ?? null,
      address: profile?.address ?? null,
      phone: profile?.phone ?? null,
      instagram: profile?.instagram ?? null,
      whatsapp: profile?.whatsapp ?? null,
      logo: profile?.logo ?? null,
      cover: profile?.cover ?? null,
      brandColors: serializeJson(profile?.brandColors),
      policies: serializeJson(profile?.policies),
    };
  }

  private toServiceObject(service: TenantWithProfile['services'][number]): ServiceObject {
    return {
      id: service.id,
      name: service.name,
      description: service.description ?? null,
      durationMinutes: service.durationMinutes,
      priceCents: service.priceCents,
      currency: service.currency,
      category: service.category ?? null,
      active: service.active,
    };
  }
}
