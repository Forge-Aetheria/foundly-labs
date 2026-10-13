import { Injectable } from '@nestjs/common';
import type { Prisma } from '@foundly/database';
import { GraphQLError } from 'graphql';
import { PrismaService } from '../../shared/prisma/prisma.service';
import type { AuthUser } from '../auth/jwt.types';
import {
  BusinessProfileObject,
  CreateTenantInput,
  PortalPolicyObject,
  ServiceObject,
  TenantObject,
  UpdateBusinessProfileInput,
} from './tenants.types';

const RESERVED_SLUGS = ['admin', 'onboarding', 'api', 'www', 'app', 'public', 'static', 'assets'];

const SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])?$/;

const MAX_NAME_LENGTH = 120;
const MAX_CATEGORY_LENGTH = 120;
const MAX_BIO_LENGTH = 2000;
const MAX_POLICY_TITLE_LENGTH = 120;
const MAX_POLICY_BODY_LENGTH = 2000;

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

function notFoundError(message = 'Resource not found'): GraphQLError {
  return new GraphQLError(message, {
    extensions: { code: 'NOT_FOUND' },
  });
}

function conflictError(message = 'Conflict'): GraphQLError {
  return new GraphQLError(message, {
    extensions: { code: 'CONFLICT' },
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

function assertAbsoluteUrl(value: string): void {
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw validationError('Links must be valid absolute URLs');
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw validationError('Links must use http or https');
  }
}

interface PolicyLike {
  title: string;
  body: string;
}

function isPolicyLike(value: unknown): value is PolicyLike {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const record = value as { title?: unknown; body?: unknown };
  return typeof record.title === 'string' && typeof record.body === 'string';
}

/** Parse the stored `policies` Json into the public list (invalid shapes are dropped). */
function parsePolicies(value: unknown): PortalPolicyObject[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter(isPolicyLike).map((policy) => ({ title: policy.title, body: policy.body }));
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
        throw conflictError('Slug already taken');
      }
      throw error;
    }
  }

  /** Partial update of the business identity + profile, scoped to the owner's tenant (feature 013). */
  async updateProfile(
    user: Pick<AuthUser, 'tenantId'> | undefined,
    input: UpdateBusinessProfileInput,
  ): Promise<TenantObject> {
    const tenantId = this.requireTenant(user);

    const tenantData: Record<string, unknown> = {};
    if (input.name != null) {
      const name = input.name.trim();
      if (!name) throw validationError('name is required');
      if (name.length > MAX_NAME_LENGTH) {
        throw validationError(`name must be at most ${MAX_NAME_LENGTH} characters`);
      }
      tenantData.name = name;
    }
    if (input.category != null) {
      const category = input.category.trim();
      if (!category) throw validationError('category is required');
      if (category.length > MAX_CATEGORY_LENGTH) {
        throw validationError(`category must be at most ${MAX_CATEGORY_LENGTH} characters`);
      }
      tenantData.category = category;
    }

    const profileData: Record<string, unknown> = {};
    if (input.slug != null && input.slug.trim()) {
      const slug = input.slug.trim();
      if (!SLUG_PATTERN.test(slug) || RESERVED_SLUGS.includes(slug)) {
        throw validationError('Invalid or reserved slug');
      }
      profileData.slug = slug;
    }
    if (input.bio !== undefined) {
      if (input.bio != null && input.bio.length > MAX_BIO_LENGTH) {
        throw validationError(`bio must be at most ${MAX_BIO_LENGTH} characters`);
      }
      profileData.bio = input.bio ?? null;
    }
    if (input.address !== undefined) profileData.address = input.address ?? null;
    if (input.phone !== undefined) profileData.phone = input.phone ?? null;
    for (const field of ['instagram', 'whatsapp', 'logo', 'cover'] as const) {
      const value = input[field];
      if (value !== undefined) {
        const trimmed = value?.trim() ?? '';
        if (trimmed) assertAbsoluteUrl(trimmed);
        profileData[field] = trimmed ? trimmed : null;
      }
    }
    if (input.policies !== undefined) {
      profileData.policies = this.validatePolicies(input.policies ?? []);
    }

    const existing = await this.prismaService.client.tenant.findUnique({
      where: { id: tenantId },
      select: { id: true, profile: { select: { id: true } } },
    });
    if (!existing) {
      throw notFoundError('Business not found');
    }

    try {
      if (Object.keys(tenantData).length > 0) {
        await this.prismaService.client.tenant.update({
          where: { id: tenantId },
          data: tenantData as Prisma.TenantUpdateInput,
        });
      }
      if (Object.keys(profileData).length > 0) {
        if (existing.profile) {
          await this.prismaService.client.businessProfile.update({
            where: { tenantId },
            data: profileData as Prisma.BusinessProfileUpdateInput,
          });
        } else {
          const slug = typeof profileData.slug === 'string' ? profileData.slug : '';
          if (!slug) throw validationError('slug is required to create the profile');
          await this.prismaService.client.businessProfile.create({
            data: { ...profileData, tenantId, slug } as unknown as Prisma.BusinessProfileCreateInput,
          });
        }
      }
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw conflictError('Slug already taken');
      }
      throw error;
    }

    const updated = await this.prismaService.client.tenant.findUnique({
      where: { id: tenantId },
      include: TENANT_INCLUDE,
    });
    if (!updated) {
      throw notFoundError('Business not found');
    }
    return this.toTenantObject(updated);
  }

  private validatePolicies(policies: { title: string; body: string }[]): { title: string; body: string }[] {
    return policies.map((policy) => {
      const title = policy.title?.trim() ?? '';
      const body = policy.body?.trim() ?? '';
      if (!title || !body) {
        throw validationError('Policy title and body are required');
      }
      if (title.length > MAX_POLICY_TITLE_LENGTH || body.length > MAX_POLICY_BODY_LENGTH) {
        throw validationError('Policy title or body is too long');
      }
      return { title, body };
    });
  }

  private requireTenant(user: Pick<AuthUser, 'tenantId'> | undefined): string {
    if (!user?.tenantId) {
      throw new GraphQLError('Missing tenant scope', {
        extensions: { code: 'UNAUTHENTICATED' },
      });
    }
    return user.tenantId;
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
      policies: parsePolicies(profile?.policies),
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
