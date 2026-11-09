import { apiRequest } from '../api/client';
import { apiRequestAuthed } from '../api/authed-request';
import {
  MyBusinessDocument,
  TenantBySlugDocument,
  type MyBusinessQuery,
} from '../api/generated';
import { ok, type ActionResult } from '../types/result';
import type { PortalPolicy, Tenant, TenantStatus } from '../types/tenancy';

/**
 * Tenancy reads (feature 011; feature 024 — SPA). Codegen documents/types only;
 * `shared/tenancy` is the cross-cutting owner of tenant resolution.
 */

type ApiTenant = MyBusinessQuery['myBusiness'];

function mapTenantStatus(status: string): TenantStatus {
  return status === 'active' || status === 'suspended' || status === 'draft' ? status : 'draft';
}

/** Map an API `TenantObject` → domain `Tenant`. Known-gap fields fall back. */
export function mapTenant(dto: ApiTenant): Tenant {
  const profile = dto.profile;
  const social =
    profile?.instagram || profile?.whatsapp
      ? {
          instagram: profile?.instagram ?? undefined,
          whatsapp: profile?.whatsapp ?? undefined,
        }
      : null;
  const policies: PortalPolicy[] = (profile?.policies ?? []).map((policy, index) => ({
    id: `policy-${index}`,
    tenantId: dto.id,
    title: policy.title,
    body: policy.body,
  }));
  return {
    id: dto.id,
    name: dto.name,
    slug: profile?.slug ?? '',
    category: dto.category,
    tags: dto.tags,
    status: mapTenantStatus(dto.status),
    ownerUserId: '',
    defaultAppointmentDurationMinutes: 30,
    businessHours: [],
    currency: dto.currency,
    timezone: dto.timezone,
    isPublic: dto.isPublic,
    license: null,
    avatar: profile?.logo ?? null,
    cover: profile?.cover ?? null,
    bio: profile?.bio ?? null,
    address: profile?.address ?? null,
    phone: profile?.phone ?? null,
    social,
    policies,
    createdAt: '',
    updatedAt: '',
  };
}

/** Resolve a tenant by its public URL slug (credential-free). */
export async function getTenantBySlug(slug: string): Promise<ActionResult<Tenant | null>> {
  const result = await apiRequest(TenantBySlugDocument, { slug });
  if (!result.ok) return result;
  return ok(result.data.tenant ? mapTenant(result.data.tenant) : null);
}

/**
 * Resolve the business bound to the verified session. The API derives the
 * tenant exclusively from the JWT; the client never sends or filters by id.
 */
export async function getCurrentTenant(): Promise<ActionResult<Tenant>> {
  const result = await apiRequestAuthed(MyBusinessDocument, {});
  if (!result.ok) return result;
  return ok(mapTenant(result.data.myBusiness));
}
