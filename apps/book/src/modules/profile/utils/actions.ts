import type { PortalPolicy, Tenant } from '../../../shared/types/tenancy';
import { normalizeSlug, validateSlug } from '../../../shared/utils/slug';
import { fail, ok, zodFields, type ActionResult } from '../../../shared/infra/result';
import { getStore } from '../../../shared/infra/store';
import { adminTenantId, clean } from '../../../shared/utils/tenant-scope';
import { policiesSchema, profileSchema } from './schemas';

/** Assigned service ids must belong to the tenant's own catalog. */
function validateSlugForTenant(
  tenant: Tenant,
  slug: string | undefined,
): ActionResult<string | null> {
  if (!slug) return ok(null);
  const candidate = normalizeSlug(slug);
  if (!candidate) {
    return fail('VALIDATION_ERROR', 'Formato de URL no válido.', {
      slug: 'Formato de URL no válido.',
    });
  }
  const others = getStore()
    .tenants.filter((item) => item.slug !== tenant.slug)
    .map((item) => item.slug);
  const check = validateSlug(candidate, others);
  if (!check.ok) {
    const message =
      check.reason === 'format'
        ? 'Formato de URL no válido.'
        : check.reason === 'reserved'
          ? 'Esa URL está reservada.'
          : 'Esa URL ya está en uso.';
    return fail('VALIDATION_ERROR', message, { slug: message });
  }
  return ok(candidate);
}

export function updateProfile(input: unknown): ActionResult<Tenant> {
  const auth = adminTenantId();
  if (!auth.ok) return auth;
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) {
    return fail('VALIDATION_ERROR', 'Datos del negocio inválidos.', zodFields(parsed.error));
  }
  const tenant = getStore().tenants.find((item) => item.id === auth.data);
  if (!tenant) return fail('NOT_FOUND', 'Negocio no encontrado.');

  const slugCheck = validateSlugForTenant(tenant, parsed.data.slug);
  if (!slugCheck.ok) return slugCheck;

  const { name, category, bio, address, phone, avatar, cover, instagram, whatsapp } = parsed.data;
  tenant.name = name;
  tenant.category = category;
  if (slugCheck.data) tenant.slug = slugCheck.data;
  tenant.bio = clean(bio);
  tenant.address = clean(address);
  tenant.phone = clean(phone);
  tenant.avatar = clean(avatar);
  tenant.cover = clean(cover);
  const social = {
    instagram: clean(instagram) ?? undefined,
    whatsapp: clean(whatsapp) ?? undefined,
  };
  tenant.social = social.instagram || social.whatsapp ? social : null;
  tenant.updatedAt = new Date().toISOString();
  return ok(tenant);
}

export function updatePolicies(input: unknown): ActionResult<PortalPolicy[]> {
  const auth = adminTenantId();
  if (!auth.ok) return auth;
  const parsed = policiesSchema.safeParse(input);
  if (!parsed.success) {
    return fail('VALIDATION_ERROR', 'Datos de las políticas inválidos.', zodFields(parsed.error));
  }
  const store = getStore();
  const tenant = store.tenants.find((item) => item.id === auth.data);
  if (!tenant) return fail('NOT_FOUND', 'Negocio no encontrado.');

  store.portalPolicies = store.portalPolicies.filter((policy) => policy.tenantId !== tenant.id);
  for (const entry of parsed.data) {
    store.portalPolicies.push({
      id: crypto.randomUUID(),
      tenantId: tenant.id,
      title: entry.title,
      body: clean(entry.body) ?? '',
    });
  }
  return ok(store.portalPolicies.filter((policy) => policy.tenantId === tenant.id));
}
