'use server';

import { apiRequestAdmin } from '../../shared/api/admin-request';
import {
  AddGalleryItemDocument,
  GalleryDocument,
  RemoveGalleryItemDocument,
  type GalleryQuery,
} from '../../shared/api/generated';
import { fail, ok, zodFields, type ActionResult } from '../../shared/types/result';
import {
  GALLERY_CATEGORIES,
  type GalleryCategory,
  type GalleryPhoto,
} from '../../shared/types/tenancy';
import { addGalleryItemSchema, removeGalleryItemSchema } from './utils/schemas';

/**
 * Gallery module — server data access (feature 013; constitution §5.VI).
 * Codegen documents/types only. Reads/writes go through the session-aware
 * transport (`apiRequestAdmin`) so session expiry is handled globally.
 */

type ApiGalleryItem = GalleryQuery['gallery'][number];

function toCategory(value: string | null | undefined): GalleryCategory | undefined {
  return typeof value === 'string' && (GALLERY_CATEGORIES as readonly string[]).includes(value)
    ? (value as GalleryCategory)
    : undefined;
}

function mapGalleryItem(dto: ApiGalleryItem): GalleryPhoto {
  return {
    id: dto.id,
    url: dto.url,
    title: dto.title ?? undefined,
    description: dto.description ?? undefined,
    category: toCategory(dto.category),
  };
}

/** The tenant's gallery. SERVER-ONLY, no fallback. */
export async function listGallery(tenantId: string): Promise<ActionResult<GalleryPhoto[]>> {
  const result = await apiRequestAdmin(GalleryDocument, { tenantId, tenantSlug: null });
  if (!result.ok) return result;
  return ok(result.data.gallery.map(mapGalleryItem));
}

/** Add a photo to the authenticated owner's gallery. */
export async function addGalleryItem(input: unknown): Promise<ActionResult<GalleryPhoto>> {
  const parsed = addGalleryItemSchema.safeParse(input);
  if (!parsed.success) {
    return fail('VALIDATION_ERROR', 'Datos de la foto inválidos.', zodFields(parsed.error));
  }
  const result = await apiRequestAdmin(AddGalleryItemDocument, {
    input: {
      url: parsed.data.url,
      title: parsed.data.title?.trim() ? parsed.data.title.trim() : null,
      description: parsed.data.description?.trim() ? parsed.data.description.trim() : null,
      category: parsed.data.category ?? null,
    },
  });
  if (!result.ok) return result;
  return ok(mapGalleryItem(result.data.addGalleryItem));
}

/** Remove one of the authenticated owner's photos. */
export async function removeGalleryItem(input: unknown): Promise<ActionResult<{ id: string }>> {
  const parsed = removeGalleryItemSchema.safeParse(input);
  if (!parsed.success) {
    return fail('VALIDATION_ERROR', 'Foto inválida.', zodFields(parsed.error));
  }
  const result = await apiRequestAdmin(RemoveGalleryItemDocument, { id: parsed.data.id });
  if (!result.ok) return result;
  return ok({ id: parsed.data.id });
}
