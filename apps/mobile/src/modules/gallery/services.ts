import {
  AddGalleryItemDocument,
  GalleryDocument,
  RemoveGalleryItemDocument,
  type AddGalleryItemInput,
  type AddGalleryItemMutation,
  type GalleryQuery,
  type RemoveGalleryItemMutation,
} from '@/shared/api/generated';
import { apiRequest } from '@/shared/api/client';
import { getAccessToken } from '@/shared/auth/supabase';
import { fail, ok, type ActionResult } from '@/shared/api/result';

export type GalleryPhoto = GalleryQuery['gallery'][number];

export async function fetchGallery(tenantId: string): Promise<ActionResult<GalleryPhoto[]>> {
  const token = await getAccessToken();
  if (!token) return fail('UNAUTHENTICATED', 'Tu sesión ha expirado.');
  const result = await apiRequest<GalleryQuery>(GalleryDocument, { tenantId }, { token });
  return result.ok ? ok(result.data.gallery) : result;
}

export async function addGalleryItem(
  input: AddGalleryItemInput,
): Promise<ActionResult<GalleryPhoto>> {
  const token = await getAccessToken();
  if (!token) return fail('UNAUTHENTICATED', 'Tu sesión ha expirado.');
  const result = await apiRequest<AddGalleryItemMutation>(
    AddGalleryItemDocument,
    { input },
    { token },
  );
  return result.ok ? ok(result.data.addGalleryItem) : result;
}

export async function removeGalleryItem(id: string): Promise<ActionResult<true>> {
  const token = await getAccessToken();
  if (!token) return fail('UNAUTHENTICATED', 'Tu sesión ha expirado.');
  const result = await apiRequest<RemoveGalleryItemMutation>(
    RemoveGalleryItemDocument,
    { id },
    { token },
  );
  return result.ok ? ok(true) : result;
}
