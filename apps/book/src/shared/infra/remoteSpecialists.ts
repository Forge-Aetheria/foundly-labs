import { apiRequest } from './apiClient';
import type { ActionResult } from './result';

/**
 * Public specialists repository (feature 010 — T016).
 * `specialists(tenantId|tenantSlug)` is a public query (no bearer) used by the
 * public booking portal to list the tenant's bookable professionals.
 */

export interface PublicSpecialistDto {
  id: string;
  tenantId: string;
  name: string;
  role: string | null;
  avatar: string | null;
  bio: string | null;
  active: boolean;
  services: { id: string; name: string }[];
}

export interface PublicSpecialistFilter {
  tenantId?: string | null;
  tenantSlug?: string | null;
}

const SPECIALIST_FIELDS = /* GraphQL */ `
  id
  tenantId
  name
  role
  avatar
  bio
  active
  services {
    id
    name
  }
`;

const LIST_SPECIALISTS = /* GraphQL */ `
  query Specialists($tenantId: String, $tenantSlug: String) {
    specialists(tenantId: $tenantId, tenantSlug: $tenantSlug) {
      ${SPECIALIST_FIELDS}
    }
  }
`;

export async function listPublicSpecialists(
  filter: PublicSpecialistFilter,
): Promise<ActionResult<PublicSpecialistDto[]>> {
  const result = await apiRequest<{ specialists: PublicSpecialistDto[] }, PublicSpecialistFilter>(
    LIST_SPECIALISTS,
    {
      tenantId: filter.tenantId ?? null,
      tenantSlug: filter.tenantSlug ?? null,
    },
  );
  if (!result.ok) return result;
  return { ok: true, data: result.data.specialists };
}