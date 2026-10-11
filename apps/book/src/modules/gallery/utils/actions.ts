import type { GalleryPhoto } from '../../../shared/types/tenancy';
import { fail, ok, zodFields, type ActionResult } from '../../../shared/infra/result';
import { getStore } from '../../../shared/infra/store';
import { adminTenantId, clean } from '../../../shared/utils/tenant-scope';
import { galleryPhotoIdSchema, galleryPhotoSchema } from './schemas';

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
