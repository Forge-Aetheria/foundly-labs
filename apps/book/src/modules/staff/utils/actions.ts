import type { Resource } from '../../../shared/types/appointments';
import { fail, ok, zodFields, type ActionResult } from '../../../shared/infra/result';
import { getStore } from '../../../shared/infra/store';
import { adminTenantId, clean } from '../../../shared/utils/tenant-scope';
import { staffActiveSchema, staffIdSchema, staffSchema, updateStaffSchema } from './schemas';

/** Every assigned service must belong to the tenant's own catalog (005). */
function validateServiceIds(
  tenantId: string,
  serviceIds: string[] | undefined,
): ActionResult<string[]> {
  const own = new Set(
    getStore()
      .services.filter((service) => service.tenantId === tenantId)
      .map((service) => service.id),
  );
  const value = serviceIds ?? [];
  const invalid = value.filter((id) => !own.has(id));
  if (invalid.length > 0) {
    return fail(
      'VALIDATION_ERROR',
      'Algún servicio asignado no pertenece al catálogo del negocio.',
      {
        serviceIds: 'Servicio desconocido.',
      },
    );
  }
  return ok(value);
}

export function createStaff(input: unknown): ActionResult<Resource> {
  const auth = adminTenantId();
  if (!auth.ok) return auth;
  const parsed = staffSchema.safeParse(input);
  if (!parsed.success) {
    return fail('VALIDATION_ERROR', 'Datos del profesional inválidos.', zodFields(parsed.error));
  }
  const tenant = getStore().tenants.find((item) => item.id === auth.data);
  if (!tenant) return fail('NOT_FOUND', 'Negocio no encontrado.');
  const serviceCheck = validateServiceIds(tenant.id, parsed.data.serviceIds);
  if (!serviceCheck.ok) return serviceCheck;

  const resource: Resource = {
    id: crypto.randomUUID(),
    name: parsed.data.name,
    type: 'professional',
    active: parsed.data.active ?? true,
    timezone: tenant.timezone,
    tenantId: tenant.id,
    role: clean(parsed.data.role),
    avatar: clean(parsed.data.avatar),
    bio: clean(parsed.data.bio),
    serviceIds: serviceCheck.data,
  };
  getStore().resources.push(resource);
  return ok(resource);
}

export function updateStaff(input: unknown): ActionResult<Resource> {
  const auth = adminTenantId();
  if (!auth.ok) return auth;
  const parsed = updateStaffSchema.safeParse(input);
  if (!parsed.success) {
    return fail('VALIDATION_ERROR', 'Datos del profesional inválidos.', zodFields(parsed.error));
  }
  const resource = getStore().resources.find(
    (item) => item.id === parsed.data.id && item.tenantId === auth.data,
  );
  if (!resource) return fail('NOT_FOUND', 'Profesional no encontrado.');
  const serviceCheck = validateServiceIds(resource.tenantId, parsed.data.serviceIds);
  if (!serviceCheck.ok) return serviceCheck;

  resource.name = parsed.data.name;
  resource.role = clean(parsed.data.role);
  resource.avatar = clean(parsed.data.avatar);
  resource.bio = clean(parsed.data.bio);
  resource.serviceIds = serviceCheck.data;
  if (parsed.data.active !== undefined) resource.active = parsed.data.active;
  return ok(resource);
}

export function setStaffActive(input: unknown): ActionResult<Resource> {
  const auth = adminTenantId();
  if (!auth.ok) return auth;
  const parsed = staffActiveSchema.safeParse(input);
  if (!parsed.success) {
    return fail('VALIDATION_ERROR', 'Estado del profesional inválido.', zodFields(parsed.error));
  }
  const resource = getStore().resources.find(
    (item) => item.id === parsed.data.id && item.tenantId === auth.data,
  );
  if (!resource) return fail('NOT_FOUND', 'Profesional no encontrado.');
  resource.active = parsed.data.active;
  return ok(resource);
}

export function removeStaff(input: unknown): ActionResult<{ id: string }> {
  const auth = adminTenantId();
  if (!auth.ok) return auth;
  const parsed = staffIdSchema.safeParse(input);
  if (!parsed.success) {
    return fail('VALIDATION_ERROR', 'Profesional inválido.', zodFields(parsed.error));
  }
  const store = getStore();
  const index = store.resources.findIndex(
    (item) => item.id === parsed.data.id && item.tenantId === auth.data,
  );
  if (index < 0) return fail('NOT_FOUND', 'Profesional no encontrado.');
  store.resources.splice(index, 1);
  return ok({ id: parsed.data.id });
}
