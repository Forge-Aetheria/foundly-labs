'use server';

import type { Resource } from '../../../shared/types/appointments';
import { fail, zodFields, type ActionResult } from '../../../shared/infra/result';
import { adminTenantId } from '../../../shared/utils/tenant-scope';
import { getAccessToken } from '../../../shared/infra/authServer';
import {
  createRemoteSpecialist,
  deleteRemoteSpecialist,
  updateRemoteSpecialist,
} from '../../../shared/infra/remoteCatalog';
import { staffActiveSchema, staffIdSchema, staffSchema, updateStaffSchema } from './schemas';

/**
 * Staff server actions (feature 010 — T010). The API (`remoteCatalog`) is the
 * only store of truth; no in-memory seam. `serviceIds` remains a known local
 * gap of the API surface (data-model.md §5) and is intentionally not sent.
 */

export async function createStaff(input: unknown): Promise<ActionResult<Resource>> {
  const tenant = await adminTenantId();
  if (!tenant.ok) return tenant;
  const parsed = staffSchema.safeParse(input);
  if (!parsed.success) {
    return fail('VALIDATION_ERROR', 'Datos del profesional inválidos.', zodFields(parsed.error));
  }
  const token = await getAccessToken();
  return createRemoteSpecialist(token, tenant.data, {
    name: parsed.data.name,
    role: parsed.data.role ?? null,
    bio: parsed.data.bio ?? null,
    avatar: parsed.data.avatar ?? null,
    active: parsed.data.active ?? true,
  });
}

export async function updateStaff(input: unknown): Promise<ActionResult<Resource>> {
  const tenant = await adminTenantId();
  if (!tenant.ok) return tenant;
  const parsed = updateStaffSchema.safeParse(input);
  if (!parsed.success) {
    return fail('VALIDATION_ERROR', 'Datos del profesional inválidos.', zodFields(parsed.error));
  }
  const token = await getAccessToken();
  return updateRemoteSpecialist(token, tenant.data, parsed.data.id, {
    name: parsed.data.name,
    role: parsed.data.role ?? null,
    bio: parsed.data.bio ?? null,
    avatar: parsed.data.avatar ?? null,
    active: parsed.data.active ?? true,
  });
}

export async function setStaffActive(input: unknown): Promise<ActionResult<Resource>> {
  const tenant = await adminTenantId();
  if (!tenant.ok) return tenant;
  const parsed = staffActiveSchema.safeParse(input);
  if (!parsed.success) {
    return fail('VALIDATION_ERROR', 'Estado del profesional inválido.', zodFields(parsed.error));
  }
  const token = await getAccessToken();
  return updateRemoteSpecialist(token, tenant.data, parsed.data.id, {
    active: parsed.data.active,
  });
}

export async function removeStaff(input: unknown): Promise<ActionResult<{ id: string }>> {
  const tenant = await adminTenantId();
  if (!tenant.ok) return tenant;
  const parsed = staffIdSchema.safeParse(input);
  if (!parsed.success) {
    return fail('VALIDATION_ERROR', 'Profesional inválido.', zodFields(parsed.error));
  }
  const token = await getAccessToken();
  return deleteRemoteSpecialist(token, parsed.data.id);
}