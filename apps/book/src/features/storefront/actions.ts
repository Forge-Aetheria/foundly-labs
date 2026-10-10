import type { Resource } from '../../domain/appointments/types';
import type { Tenant } from '../../domain/tenancy/types';
import { getCurrentSession, requireRole, requireTenant } from '../../server/auth';
import { fail, ok, zodFields, type ActionResult } from '../../server/result';
import { getStore } from '../../server/store';
import {
  galleryImageSchema,
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

  resource.name = parsed.data.name;
  resource.role = clean(parsed.data.role);
  resource.avatar = clean(parsed.data.avatar);
  resource.bio = clean(parsed.data.bio);
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

export function updateProfile(input: unknown): ActionResult<Tenant> {
  const auth = adminTenantId();
  if (!auth.ok) return auth;
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) {
    return fail('VALIDATION_ERROR', 'Datos del negocio inválidos.', zodFields(parsed.error));
  }
  const tenant = getStore().tenants.find((item) => item.id === auth.data);
  if (!tenant) return fail('NOT_FOUND', 'Negocio no encontrado.');

  const { name, category, bio, address, phone, avatar, cover, instagram, whatsapp } = parsed.data;
  tenant.name = name;
  tenant.category = category;
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

/* ------------------------------------------------------------------ *
 * Galería (Tenant gallery images)                                     *
 * ------------------------------------------------------------------ */

export function addGalleryImage(input: unknown): ActionResult<string[]> {
  const auth = adminTenantId();
  if (!auth.ok) return auth;
  const parsed = galleryImageSchema.safeParse(input);
  if (!parsed.success) {
    return fail('VALIDATION_ERROR', 'Imagen inválida.', zodFields(parsed.error));
  }
  const tenant = getStore().tenants.find((item) => item.id === auth.data);
  if (!tenant) return fail('NOT_FOUND', 'Negocio no encontrado.');

  const gallery = tenant.gallery ?? [];
  if (gallery.includes(parsed.data.url)) {
    return fail('CONFLICT', 'Esa imagen ya está en la galería.');
  }
  tenant.gallery = [...gallery, parsed.data.url];
  tenant.updatedAt = new Date().toISOString();
  return ok(tenant.gallery);
}

export function removeGalleryImage(input: unknown): ActionResult<string[]> {
  const auth = adminTenantId();
  if (!auth.ok) return auth;
  const parsed = galleryImageSchema.safeParse(input);
  if (!parsed.success) {
    return fail('VALIDATION_ERROR', 'Imagen inválida.', zodFields(parsed.error));
  }
  const tenant = getStore().tenants.find((item) => item.id === auth.data);
  if (!tenant) return fail('NOT_FOUND', 'Negocio no encontrado.');

  const gallery = tenant.gallery ?? [];
  if (!gallery.includes(parsed.data.url)) {
    return fail('NOT_FOUND', 'Imagen no encontrada en la galería.');
  }
  tenant.gallery = gallery.filter((url) => url !== parsed.data.url);
  tenant.updatedAt = new Date().toISOString();
  return ok(tenant.gallery);
}
