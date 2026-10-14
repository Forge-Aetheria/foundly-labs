'use server';

import { apiRequestAdmin } from '../../shared/api/admin-request';
import {
  ManagedBusinessesDocument,
  OverrideTenantSubscriptionDocument,
  PlatformMetricsDocument,
  SubscriptionPlan,
  SubscriptionStatus,
  type ManagedBusinessesQuery,
  type OverrideTenantSubscriptionInput,
} from '../../shared/api/generated';
import { fail, ok, zodFields, type ActionResult } from '../../shared/types/result';
import { overrideInputSchema } from './utils/schemas';
import type {
  ManagedBusinessView,
  PlanValue,
  PlatformMetricsView,
  StatusValue,
} from './utils/types';

/**
 * Super Admin module — server data access (feature 020; constitution §5.VI).
 * Codegen documents/types only; the session bearer is injected by `apiRequestAdmin`.
 * Authorization is enforced by the API (`FORBIDDEN` is surfaced to the caller).
 */

type ApiManagedBusiness = ManagedBusinessesQuery['managedBusinesses'][number];

const PLAN_VALUE: Record<SubscriptionPlan, PlanValue> = {
  [SubscriptionPlan.Free]: 'FREE',
  [SubscriptionPlan.Pro]: 'PRO',
};
const STATUS_VALUE: Record<SubscriptionStatus, StatusValue> = {
  [SubscriptionStatus.Active]: 'active',
  [SubscriptionStatus.PastDue]: 'past_due',
  [SubscriptionStatus.Expired]: 'expired',
  [SubscriptionStatus.Canceled]: 'canceled',
};
const PLAN_ENUM: Record<PlanValue, SubscriptionPlan> = {
  FREE: SubscriptionPlan.Free,
  PRO: SubscriptionPlan.Pro,
};
const STATUS_ENUM: Record<StatusValue, SubscriptionStatus> = {
  active: SubscriptionStatus.Active,
  past_due: SubscriptionStatus.PastDue,
  expired: SubscriptionStatus.Expired,
  canceled: SubscriptionStatus.Canceled,
};

function mapBusiness(dto: ApiManagedBusiness): ManagedBusinessView {
  return {
    tenantId: dto.tenantId,
    slug: dto.slug,
    name: dto.name,
    plan: PLAN_VALUE[dto.plan],
    status: STATUS_VALUE[dto.status],
    expiresAt: dto.expiresAt ?? null,
  };
}

/** Global platform metrics (Super Admin only; a `FORBIDDEN` failure drives the access-denied state). */
export async function getPlatformMetrics(): Promise<ActionResult<PlatformMetricsView>> {
  const result = await apiRequestAdmin(PlatformMetricsDocument, {});
  if (!result.ok) {
    return result;
  }
  const metrics = result.data.platformMetrics;
  return ok({
    businessesTotal: metrics.businesses.total,
    businessesActive: metrics.businesses.active,
    usersTotal: metrics.users.total ?? null,
    usersActive: metrics.users.active ?? null,
    usersAvailable: metrics.users.available,
    plansFree: metrics.plans.free,
    plansPro: metrics.plans.pro,
    proConversion: metrics.proConversion,
  });
}

/** Bounded, searchable list of all businesses. */
export async function getManagedBusinesses(input: {
  query?: string | null;
  limit?: number | null;
  offset?: number | null;
}): Promise<ActionResult<ManagedBusinessView[]>> {
  const term = input.query?.trim() || null;
  const result = await apiRequestAdmin(ManagedBusinessesDocument, {
    query: term,
    limit: input.limit ?? null,
    offset: input.offset ?? null,
  });
  if (!result.ok) {
    return result;
  }
  return ok(result.data.managedBusinesses.map(mapBusiness));
}

/** Forced subscription override (partial; only provided fields change). */
export async function overrideSubscription(
  input: unknown,
): Promise<ActionResult<ManagedBusinessView>> {
  const parsed = overrideInputSchema.safeParse(input);
  if (!parsed.success) {
    return fail('VALIDATION_ERROR', 'Datos de suscripción inválidos.', zodFields(parsed.error));
  }
  const { tenantId, plan, status, expiresAt } = parsed.data;
  const mutationInput: OverrideTenantSubscriptionInput = { tenantId };
  if (plan !== undefined) {
    mutationInput.plan = PLAN_ENUM[plan];
  }
  if (status !== undefined) {
    mutationInput.status = STATUS_ENUM[status];
  }
  if (expiresAt !== undefined) {
    mutationInput.expiresAt = expiresAt;
  }
  const result = await apiRequestAdmin(OverrideTenantSubscriptionDocument, {
    input: mutationInput,
  });
  if (!result.ok) {
    return result;
  }
  return ok(mapBusiness(result.data.overrideTenantSubscription));
}
