'use server';

import { apiRequest } from '../../shared/api/client';
import {
  CreateMySpecialistDocument,
  DeleteMySpecialistDocument,
  MySpecialistsDocument,
  UpdateMySpecialistDocument,
  type MySpecialistsQuery,
} from '../../shared/api/generated';
import { getAccessToken } from '../../shared/auth/authServer';
import { fail, ok, zodFields, type ActionResult } from '../../shared/types/result';
import { adminTenantId } from '../../shared/utils/tenant-scope';
import type { Resource } from '../../shared/types/appointments';
import { staffActiveSchema, staffIdSchema, staffSchema, updateStaffSchema } from './utils/schemas';

/**
 * Staff module — server data access (feature 011; constitution §5.VI).
 * Codegen documents/types only. `serviceIds` remains a known API gap.
 */

type ApiSpecialist = MySpecialistsQuery['mySpecialists'][number];

const LOCAL_TIMEZONE = 'Europe/Madrid';

function mapSpecialist(dto: ApiSpecialist, tenantId: string): Resource {
  return {
    id: dto.id,
    name: dto.name,
    type: 'professional',
    active: dto.active,
    timezone: LOCAL_TIMEZONE,
    tenantId,
    role: dto.role ?? null,
    avatar: dto.avatar ?? null,
    bio: dto.bio ?? null,
  };
}

/** The tenant's professionals, active and inactive. SERVER-ONLY, no fallback. */
export async function listStaff(tenantId: string): Promise<ActionResult<Resource[]>> {
  const token = await getAccessToken();
  const result = await apiRequest(MySpecialistsDocument, { active: null }, { token });
  if (!result.ok) return result;
  return ok(result.data.mySpecialists.map((dto) => mapSpecialist(dto, tenantId)));
}

export async function createStaff(input: unknown): Promise<ActionResult<Resource>> {
  const tenant = await adminTenantId();
  if (!tenant.ok) return tenant;
  const parsed = staffSchema.safeParse(input);
  if (!parsed.success) {
    return fail('VALIDATION_ERROR', 'Datos del profesional inválidos.', zodFields(parsed.error));
  }
  const token = await getAccessToken();
  const result = await apiRequest(
    CreateMySpecialistDocument,
    {
      input: {
        name: parsed.data.name,
        role: parsed.data.role ?? null,
        bio: parsed.data.bio ?? null,
        avatar: parsed.data.avatar ?? null,
        active: parsed.data.active ?? true,
      },
    },
    { token },
  );
  if (!result.ok) return result;
  return ok(mapSpecialist(result.data.createMySpecialist, tenant.data));
}

export async function updateStaff(input: unknown): Promise<ActionResult<Resource>> {
  const tenant = await adminTenantId();
  if (!tenant.ok) return tenant;
  const parsed = updateStaffSchema.safeParse(input);
  if (!parsed.success) {
    return fail('VALIDATION_ERROR', 'Datos del profesional inválidos.', zodFields(parsed.error));
  }
  const token = await getAccessToken();
  const result = await apiRequest(
    UpdateMySpecialistDocument,
    {
      id: parsed.data.id,
      input: {
        name: parsed.data.name,
        role: parsed.data.role ?? null,
        bio: parsed.data.bio ?? null,
        avatar: parsed.data.avatar ?? null,
        active: parsed.data.active ?? true,
      },
    },
    { token },
  );
  if (!result.ok) return result;
  return ok(mapSpecialist(result.data.updateMySpecialist, tenant.data));
}

export async function setStaffActive(input: unknown): Promise<ActionResult<Resource>> {
  const tenant = await adminTenantId();
  if (!tenant.ok) return tenant;
  const parsed = staffActiveSchema.safeParse(input);
  if (!parsed.success) {
    return fail('VALIDATION_ERROR', 'Estado del profesional inválido.', zodFields(parsed.error));
  }
  const token = await getAccessToken();
  const result = await apiRequest(
    UpdateMySpecialistDocument,
    { id: parsed.data.id, input: { active: parsed.data.active } },
    { token },
  );
  if (!result.ok) return result;
  return ok(mapSpecialist(result.data.updateMySpecialist, tenant.data));
}

export async function removeStaff(input: unknown): Promise<ActionResult<{ id: string }>> {
  const tenant = await adminTenantId();
  if (!tenant.ok) return tenant;
  const parsed = staffIdSchema.safeParse(input);
  if (!parsed.success) {
    return fail('VALIDATION_ERROR', 'Profesional inválido.', zodFields(parsed.error));
  }
  const token = await getAccessToken();
  const result = await apiRequest(DeleteMySpecialistDocument, { id: parsed.data.id }, { token });
  if (!result.ok) return result;
  return ok({ id: parsed.data.id });
}