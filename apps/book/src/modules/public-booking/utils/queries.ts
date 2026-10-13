import { fetchTenantBySlug } from '../../../shared/infra/remoteTenancy';
import { listPublicSpecialists } from '../../../shared/infra/remoteSpecialists';
import { listRemoteAvailability, type AvailabilityDto } from '../../../shared/infra/remoteAvailability';
import type { BusinessHours } from '../../../shared/types/tenancy';
import type { PublicBusinessProfile, PublicService, PublicSpecialist } from './types';

export type ResolveResult =
  | { status: 'unavailable'; reason: 'not-found' | 'draft' | 'suspended' }
  | { status: 'available'; business: PublicBusinessProfile };

/**
 * Derive the tenant's weekly opening hours from its tenant-level availability
 * (`specialistId` null). The API does not expose `businessHours` directly, so
 * the schedule is the honest source. Empty when there is no availability.
 */
export function deriveWeeklyHours(dtos: AvailabilityDto[]): BusinessHours[] {
  const tenantLevel = dtos.filter((dto) => dto.specialistId === null);
  if (tenantLevel.length === 0) return [];
  return [0, 1, 2, 3, 4, 5, 6].map((weekday) => {
    const rule = tenantLevel.find((item) => item.weekday === weekday);
    return rule
      ? { weekday, isOpen: true, startTime: rule.startTime, endTime: rule.endTime }
      : { weekday, isOpen: false, startTime: '', endTime: '' };
  });
}

/**
 * Public mini-site resolution (feature 008 — US1; feature 010 — T016).
 * SERVER-ONLY: identity/profile/services/specialists/availability come from the
 * API. Sections with no backend counterpart (policies, gallery, reviews) render
 * empty — never mocked (FR-007). No local fallback exists (FR-002).
 */
export async function getPublicBusinessRemote(slug: string): Promise<ResolveResult> {
  const remote = await fetchTenantBySlug(slug);
  if (!remote.ok) return { status: 'unavailable', reason: 'not-found' };
  const tenant = remote.data;
  if (!tenant) return { status: 'unavailable', reason: 'not-found' };
  if (tenant.status !== 'active') {
    return { status: 'unavailable', reason: tenant.status === 'draft' ? 'draft' : 'suspended' };
  }

  const services: PublicService[] = tenant.services
    .filter((service) => service.active)
    .map((service) => ({
      id: service.id,
      name: service.name,
      description: service.description,
      durationMinutes: service.durationMinutes,
      priceCents: service.priceCents,
      currency: service.currency,
      category: service.category ?? undefined,
    }));

  const specialistsResult = await listPublicSpecialists({ tenantSlug: slug });
  const specialists: PublicSpecialist[] = specialistsResult.ok
    ? specialistsResult.data
        .filter((specialist) => specialist.active)
        .map((specialist) => ({
          id: specialist.id,
          name: specialist.name,
          role: specialist.role,
          avatar: specialist.avatar,
          bio: specialist.bio,
          services: specialist.services.map((service) => service.name),
        }))
    : [];

  const availabilityResult = await listRemoteAvailability({ tenantSlug: slug });
  const weeklyHours = availabilityResult.ok ? deriveWeeklyHours(availabilityResult.data) : [];

  const profile = tenant.profile;
  return {
    status: 'available',
    business: {
      slug: profile?.slug ?? slug,
      name: tenant.name,
      category: tenant.category,
      avatar: profile?.logo ?? null,
      cover: profile?.cover ?? null,
      bio: profile?.bio ?? null,
      address: profile?.address ?? null,
      phone: profile?.phone ?? null,
      social: {
        instagram: profile?.instagram ?? undefined,
        whatsapp: profile?.whatsapp ?? undefined,
      },
      timezone: tenant.timezone,
      services,
      specialists,
      weeklyHours,
      policies: [],
      gallery: [],
      rating: null,
      reviewCount: 0,
      reviews: [],
    },
  };
}