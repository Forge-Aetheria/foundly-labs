import type { DayAvailability } from '../../../shared/types/availability';
import { computeAvailability } from '../../../shared/utils/computeAvailability';
import type { Tenant } from '../../../shared/types/tenancy';
import { GALLERY_CATEGORY_LABELS } from '../../../shared/types/tenancy';
import { getStore } from '../../../shared/infra/store';
import type { PublicBusinessProfile, PublicService, PublicSpecialist } from './types';

export type ResolveResult =
  | { status: 'unavailable'; reason: 'not-found' | 'draft' | 'suspended' }
  | { status: 'available'; business: PublicBusinessProfile };

/** Resolve the catalog service names a specialist performs (005-staff-management). */
function resolveSpecialistServices(
  store: ReturnType<typeof getStore>,
  tenantId: string,
  serviceIds: string[],
): string[] {
  const catalog = store.services.filter(
    (service) => service.tenantId === tenantId && service.active,
  );
  return serviceIds
    .map((id) => catalog.find((service) => service.id === id)?.name)
    .filter((name): name is string => Boolean(name));
}

/** Current applicable rate for a service (effective period contains `at`). */
function currentRate(serviceId: string, at: Date) {
  const atMs = at.getTime();
  return getStore()
    .rates.filter(
      (rate) =>
        rate.serviceId === serviceId &&
        new Date(rate.effectiveFrom).getTime() <= atMs &&
        (rate.effectiveTo === null || new Date(rate.effectiveTo).getTime() > atMs),
    )
    .sort((a, b) => new Date(b.effectiveFrom).getTime() - new Date(a.effectiveFrom).getTime())[0];
}

/** Resolve the tenant's public mini-site; exposes no data for non-active tenants (FR-016). */
export function getPublicBusiness(slug: string, now: Date = new Date()): ResolveResult {
  const store = getStore();
  const tenant = store.tenants.find((item) => item.slug === slug);
  if (!tenant) return { status: 'unavailable', reason: 'not-found' };
  if (tenant.status !== 'active') {
    return { status: 'unavailable', reason: tenant.status === 'draft' ? 'draft' : 'suspended' };
  }

  const services: PublicService[] = store.services
    .filter((service) => service.tenantId === tenant.id && service.active)
    .map((service) => {
      const rate = currentRate(service.id, now);
      return {
        id: service.id,
        name: service.name,
        description: service.description,
        durationMinutes: service.durationMinutes,
        priceCents: rate?.amountCents ?? 0,
        currency: rate?.currency ?? tenant.currency,
        category: service.category ?? undefined,
      };
    });

  const specialists: PublicSpecialist[] = store.resources
    .filter((resource) => resource.tenantId === tenant.id && resource.active)
    .map((resource) => ({
      id: resource.id,
      name: resource.name,
      role: resource.role,
      avatar: resource.avatar,
      bio: resource.bio,
      services: resolveSpecialistServices(store, tenant.id, resource.serviceIds ?? []),
    }));

  const policies = store.portalPolicies
    .filter((policy) => policy.tenantId === tenant.id)
    .map((policy) => ({ title: policy.title, body: policy.body }));

  const tenantReviews = store.reviews
    .filter((review) => review.tenantId === tenant.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const rating =
    tenantReviews.length === 0
      ? null
      : Math.round(
          (tenantReviews.reduce((sum, review) => sum + review.rating, 0) / tenantReviews.length) *
            10,
        ) / 10;

  return {
    status: 'available',
    business: {
      slug: tenant.slug,
      name: tenant.name,
      category: tenant.category,
      avatar: tenant.avatar,
      cover: tenant.cover,
      bio: tenant.bio,
      address: tenant.address,
      phone: tenant.phone,
      social: tenant.social,
      timezone: tenant.timezone,
      services,
      specialists,
      weeklyHours: tenant.businessHours,
      policies,
      gallery: (tenant.gallery ?? []).map((photo) => ({
        id: photo.id,
        url: photo.url,
        title: photo.title,
        description: photo.description,
        category: photo.category ? GALLERY_CATEGORY_LABELS[photo.category] : undefined,
      })),
      rating,
      reviewCount: tenantReviews.length,
      reviews: tenantReviews.map((review) => ({
        id: review.id,
        author: review.author,
        rating: review.rating,
        comment: review.comment,
        date: review.date,
      })),
    },
  };
}

export interface DateRange {
  startDate: string;
  endDate: string;
}

/**
 * Offered slots for a tenant's service by reusing the pure availability engine
 * (research R5). `resourceId` scopes slots to a specialist; defaults to the
 * tenant's first resource. Deterministic when `now` is provided.
 */
export function getOfferedSlots(
  tenant: Tenant,
  serviceId: string,
  range: DateRange,
  now: Date = new Date(),
  resourceId?: string,
): DayAvailability[] {
  const service = getStore().services.find(
    (item) => item.id === serviceId && item.tenantId === tenant.id && item.active,
  );
  if (!service) return [];

  const resource = resourceId
    ? getStore().resources.find((item) => item.tenantId === tenant.id && item.id === resourceId)
    : getStore().resources.find((item) => item.tenantId === tenant.id);
  if (!resource) return [];

  const rules = getStore().availabilityRules.filter((rule) => rule.resourceId === resource.id);
  const blocks = getStore()
    .timeBlocks.filter((block) => block.resourceId === resource.id)
    .map((block) => ({
      startAt: new Date(block.startAt),
      endAt: new Date(block.endAt),
      kind: block.kind,
    }));
  const appointments = getStore()
    .appointments.filter((appointment) => appointment.resourceId === resource.id)
    .map((appointment) => ({
      startAt: new Date(appointment.startAt),
      endAt: new Date(appointment.endAt),
      status: appointment.status,
    }));

  return computeAvailability({
    resourceId: resource.id,
    service: { durationMinutes: service.durationMinutes, bufferMinutes: service.bufferMinutes },
    range,
    timezone: tenant.timezone,
    rules,
    blocks,
    appointments,
    now,
  });
}
