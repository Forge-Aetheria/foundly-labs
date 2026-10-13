import { apiRequest } from './apiClient';
import type { ActionResult } from './result';

/** Tenancy GraphQL DTOs — feature 008 (tenancy.contract.md). */

export interface TenantProfileDto {
  slug: string;
  bio: string | null;
  address: string | null;
  phone: string | null;
  instagram: string | null;
  whatsapp: string | null;
  logo: string | null;
  cover: string | null;
}

export interface TenantServiceDto {
  id: string;
  name: string;
  description: string | null;
  durationMinutes: number;
  priceCents: number;
  currency: string;
  category: string | null;
  active: boolean;
}

export interface TenantDto {
  id: string;
  name: string;
  category: string;
  status: string;
  timezone: string;
  currency: string;
  profile: TenantProfileDto | null;
  services: TenantServiceDto[];
}

export interface CreateTenantRemoteInput {
  name: string;
  category: string;
  timezone: string;
  profile: {
    slug: string;
    bio?: string | null;
    address?: string | null;
    phone?: string | null;
    instagram?: string | null;
    whatsapp?: string | null;
    logo?: string | null;
    cover?: string | null;
  };
}

const TENANT_BY_SLUG = /* GraphQL */ `
  query TenantBySlug($slug: String!) {
    tenant(slug: $slug) {
      id
      name
      category
      status
      timezone
      currency
      profile {
        slug
        bio
        address
        phone
        instagram
        whatsapp
        logo
        cover
      }
      services {
        id
        name
        description
        durationMinutes
        priceCents
        currency
        category
        active
      }
    }
  }
`;

const CREATE_TENANT = /* GraphQL */ `
  mutation CreateTenant($input: CreateTenantInput!) {
    createTenant(input: $input) {
      id
      status
      profile {
        slug
      }
    }
  }
`;

const TENANTS = /* GraphQL */ `
  query Tenants {
    tenants {
      id
      name
      category
      status
      timezone
      currency
      profile {
        slug
        bio
        address
        phone
        instagram
        whatsapp
        logo
        cover
      }
      services {
        id
        name
        description
        durationMinutes
        priceCents
        currency
        category
        active
      }
    }
  }
`;

/** Public read of a business by slug (tenant(slug)) — portal authoritative fields. */
export async function fetchTenantBySlug(
  slug: string,
  token?: string | null,
): Promise<ActionResult<TenantDto | null>> {
  const result = await apiRequest<{ tenant: TenantDto | null }, { slug: string }>(
    TENANT_BY_SLUG,
    { slug },
    { token },
  );
  if (!result.ok) return result;
  return { ok: true, data: result.data.tenant };
}

/** Create the business record through the API (onboarding, server-side). */
export async function createRemoteTenant(
  input: CreateTenantRemoteInput,
): Promise<ActionResult<{ id: string; slug: string }>> {
  const result = await apiRequest<
    { createTenant: { id: string; status: string; profile: { slug: string } | null } },
    { input: CreateTenantRemoteInput }
  >(CREATE_TENANT, { input }, {});
  if (!result.ok) return result;
  return {
    ok: true,
    data: { id: result.data.createTenant.id, slug: result.data.createTenant.profile?.slug ?? '' },
  };
}

/**
 * Resolve a tenant by id through the API (admin layout / tenancy). The API has no
 * `tenantById`, so this lists tenants and finds the match (feature 010).
 */
export async function fetchTenantById(id: string): Promise<ActionResult<TenantDto | null>> {
  const result = await apiRequest<{ tenants: TenantDto[] }, Record<string, never>>(TENANTS, {});
  if (!result.ok) return result;
  return { ok: true, data: result.data.tenants.find((tenant) => tenant.id === id) ?? null };
}
