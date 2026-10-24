import { Injectable } from '@nestjs/common';
import { TenantCategory as PrismaTenantCategory, type Prisma } from '@foundly/database';
import { TENANT_CATEGORIES, categoryFromSearchTerm } from './tenant-categories';
import { GraphQLError } from 'graphql';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { sanitizeTag, sanitizeTags } from './tenant-tags';
import type { AuthUser } from '../auth/jwt.types';
import {
  BusinessProfileObject,
  BusinessScheduleObject,
  BusinessSummaryObject,
  CreateTenantInput,
  PortalPolicyObject,
  ServiceObject,
  TenantObject,
  UpdateBusinessProfileInput,
} from './tenants.types';

const RESERVED_SLUGS = ['admin', 'onboarding', 'api', 'www', 'app', 'public', 'static', 'assets'];

const SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])?$/;

const MAX_NAME_LENGTH = 120;
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

const DIRECTORY_DEFAULT_LIMIT = 20;
const DIRECTORY_MAX_LIMIT = 100;

const DIRECTORY_INCLUDE = {
  profile: true,
  availability: true,
} satisfies Prisma.TenantInclude;

type TenantForDirectory = Prisma.TenantGetPayload<{
  include: typeof DIRECTORY_INCLUDE;
}>;

export interface SearchBusinessesInput {
  query?: string | null;
  category?: string | null;
  limit?: number | null;
  offset?: number | null;
}

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

function requireCategory(value: string): PrismaTenantCategory {
  const category = value.trim() as PrismaTenantCategory;
  if (!TENANT_CATEGORIES.includes(category)) {
    throw validationError('Invalid tenant category');
  }
  return category;
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

  /** The authenticated owner's business, scoped by the verified JWT tenant claim. */
  async findForOwner(user: Pick<AuthUser, 'tenantId'> | undefined): Promise<TenantObject> {
    const tenantId = this.requireTenant(user);
    const row = await this.prismaService.client.tenant.findUnique({
      where: { id: tenantId },
      include: TENANT_INCLUDE,
    });
    if (!row) {
      throw notFoundError('Business not found');
    }
    return this.toTenantObject(row);
  }

  /**
   * Public discovery directory (018): active businesses with a public profile and at least one
   * active service, optionally filtered by name/category/address (case-insensitive), ordered by
   * name and bounded by limit/offset.
   */
  async searchBusinesses(input: SearchBusinessesInput): Promise<BusinessSummaryObject[]> {
    const limit = input.limit ?? DIRECTORY_DEFAULT_LIMIT;
    if (!Number.isInteger(limit) || limit <= 0) {
      throw validationError('limit must be a positive integer');
    }
    const take = Math.min(limit, DIRECTORY_MAX_LIMIT);
    const offset = input.offset ?? 0;
    if (!Number.isInteger(offset) || offset < 0) {
      throw validationError('offset must be a non-negative integer');
    }
    const term = input.query?.trim() ?? '';

    const where: Prisma.TenantWhereInput = {
      status: 'active',
      isPublic: true,
      profile: { isNot: null },
      services: { some: { active: true } },
    };

    if (input.category != null) {
      where.category = requireCategory(input.category) as PrismaTenantCategory;
    }

    if (term) {
      const matchedCategory = categoryFromSearchTerm(term);
      where.OR = [
        { name: { contains: term, mode: 'insensitive' } },
        { profile: { is: { address: { contains: term, mode: 'insensitive' } } } },
        { tags: { has: sanitizeTag(term) } },
        ...(matchedCategory ? [{ category: matchedCategory as PrismaTenantCategory }] : []),
      ];
    }

    const rows = await this.prismaService.client.tenant.findMany({
      where,
      include: DIRECTORY_INCLUDE,
      orderBy: { name: 'asc' },
      take,
      skip: offset,
    });
    return rows.map((row) => this.toBusinessSummary(row));
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
      category: requireCategory(input.category) as PrismaTenantCategory,
      tags: sanitizeTags(input.tags),
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
      tenantData.category = requireCategory(input.category) as PrismaTenantCategory;
    }
    if (input.tags != null) {
      tenantData.tags = sanitizeTags(input.tags);
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
    if (input.isPublic !== undefined && input.isPublic !== null) {
      tenantData.isPublic = input.isPublic;
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
            data: {
              ...profileData,
              tenantId,
              slug,
            } as unknown as Prisma.BusinessProfileCreateInput,
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

  private validatePolicies(
    policies: { title: string; body: string }[],
  ): { title: string; body: string }[] {
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

  /** Aggregate a business's availability into weekday opening ranges (earliest start, latest end). */
  private toSchedule(
    rules: { weekday: number; startTime: string; endTime: string }[],
  ): BusinessScheduleObject[] {
    const byWeekday = new Map<number, { startTime: string; endTime: string }>();
    for (const rule of rules) {
      const current = byWeekday.get(rule.weekday);
      if (!current) {
        byWeekday.set(rule.weekday, { startTime: rule.startTime, endTime: rule.endTime });
        continue;
      }
      byWeekday.set(rule.weekday, {
        startTime: rule.startTime < current.startTime ? rule.startTime : current.startTime,
        endTime: rule.endTime > current.endTime ? rule.endTime : current.endTime,
      });
    }
    return [...byWeekday.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([weekday, range]) => ({
        weekday,
        startTime: range.startTime,
        endTime: range.endTime,
      }));
  }

  private toBusinessSummary(row: TenantForDirectory): BusinessSummaryObject {
    return {
      tenantId: row.id,
      slug: row.profile?.slug ?? '',
      name: row.name,
      category: row.category,
      tags: row.tags ?? [],
      description: row.profile?.bio ?? null,
      address: row.profile?.address ?? null,
      phone: row.profile?.phone ?? null,
      logo: row.profile?.logo ?? null,
      cover: row.profile?.cover ?? null,
      schedule: this.toSchedule(row.availability),
    };
  }

  private toTenantObject(row: TenantWithProfile): TenantObject {
    return {
      id: row.id,
      name: row.name,
      category: row.category,
      tags: row.tags ?? [],
      status: row.status,
      timezone: row.timezone,
      currency: row.currency,
      isPublic: row.isPublic ?? true,
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
      requiresAdvance: service.requiresAdvance,
      advanceKind: service.advanceKind ?? null,
      advanceValue: service.advanceValue ?? null,
    };
  }
}
