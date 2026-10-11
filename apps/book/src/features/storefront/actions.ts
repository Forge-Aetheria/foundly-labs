import type { Resource } from '../../domain/appointments/types';
import type { GalleryPhoto, PortalPolicy, Tenant } from '../../domain/tenancy/types';
import { normalizeSlug, validateSlug } from '../../domain/tenancy/slug';
import { getCurrentSession, requireRole, requireTenant } from '../../server/auth';
import { fail, ok, zodFields, type ActionResult } from '../../server/result';
import { getStore } from '../../server/store';
import {
  galleryPhotoIdSchema,
  galleryPhotoSchema,
  policiesSchema,
  profileSchema,
  staffActiveSchema,
  staffIdSchema,
  staffSchema,
  updateStaffSchema,
} from './schemas';

/**
 * Mutations that back the storefront admin sections (`/admin/staff`,
 * `/admin/gallery`, `/admin/profile`). They operate on the same in-memory store
 * seam read by the public landing (`getPublicBusiness`), so edits made in the
 * admin surface in the tenant's public profile (FR-017 / 003 FR-016).
 *
 * The tenant id is always resolved from the session — never from the client.
 */

/** Resolve the acting admin's tenant from the Foundly Pass session seam. */
function adminTenantId(): ActionResult<string> {
  const role = requireRole(getCurrentSession(), ['admin']);
  if (!role.ok) return role;
  const tenant = requireTenant(role.data);
  if (!tenant.ok) return tenant;
  return ok(role.data.tenantId as string);
}

function clean(value: string | null | undefined): string | null {
  const trimmed = typeof value === 'string' ? value.trim() : '';
  return trimmed ? trimmed : null;
}

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
    return fail('VALIDATION_ERROR', 'Algún servicio asignado no pertenece al catálogo del negocio.', {
      serviceIds: 'Servicio desconocido.',
    });
  }
  return ok(value);
}

/* ------------------------------------------------------------------ *
 * Equipo / Staff (Tenant resources shown as specialists)              *
 * ------------------------------------------------------------------ */

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

/* ------------------------------------------------------------------ *
 * Perfil / Acerca de (Tenant identity + contact)                      *
 * ------------------------------------------------------------------ */

/** Assigned service ids must belong to the tenant's own catalog. */
function validateSlugForTenant(tenant: Tenant, slug: string | undefined): ActionResult<string | null> {
  if (!slug) return ok(null);
  const candidate = normalizeSlug(slug);
  if (!candidate) {
    return fail('VALIDATION_ERROR', 'Formato de URL no válido.', { slug: 'Formato de URL no válido.' });
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
  const social = { instagram: clean(instagram) ?? undefined, whatsapp: clean(whatsapp) ?? undefined };
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

/* ------------------------------------------------------------------ *
 * Galería (Tenant gallery photos, 006)                                *
 * ------------------------------------------------------------------ */

export function addGalleryPhoto(input: unknown): ActionResult<GalleryPhoto[]> {
  const auth = adminTenantId();
  if (!auth.ok) return auth;
  const parsed = galleryPhotoSchema.safeParse(input);
  if (!parsed.success) {
    return fail('VALIDATION_ERROR', 'Datos de la imagen inválidos.', zodFields(parsed.error));
  }
  const tenant = getStore().tenants.find((item) => item.id === auth.data);
  if (!tenant) return fail('NOT_FOUND', 'Negocio no encontrado.');

  const gallery = tenant.gallery ?? [];
  if (gallery.some((photo) => photo.url === parsed.data.url)) {
    return fail('CONFLICT', 'Esa imagen ya está en la galería.', {
      url: 'Esa imagen ya está en la galería.',
    });
  }
  const photo: GalleryPhoto = {
    id: crypto.randomUUID(),
    url: parsed.data.url,
    title: clean(parsed.data.title) ?? undefined,
    description: clean(parsed.data.description) ?? undefined,
    category: parsed.data.category,
  };
  tenant.gallery = [...gallery, photo];
  tenant.updatedAt = new Date().toISOString();
  return ok(tenant.gallery);
}

export function removeGalleryPhoto(input: unknown): ActionResult<GalleryPhoto[]> {
  const auth = adminTenantId();
  if (!auth.ok) return auth;
  const parsed = galleryPhotoIdSchema.safeParse(input);
  if (!parsed.success) {
    return fail('VALIDATION_ERROR', 'Foto de galería inválida.', zodFields(parsed.error));
  }
  const tenant = getStore().tenants.find((item) => item.id === auth.data);
  if (!tenant) return fail('NOT_FOUND', 'Negocio no encontrado.');

  const gallery = tenant.gallery ?? [];
  const exists = gallery.some((photo) => photo.id === parsed.data.id);
  if (!exists) {
    return fail('NOT_FOUND', 'Foto no encontrada en la galería.');
  }
  tenant.gallery = gallery.filter((photo) => photo.id !== parsed.data.id);
  tenant.updatedAt = new Date().toISOString();
  return ok(tenant.gallery);
}
