import * as ImagePicker from 'expo-image-picker';
import { fail, ok, type ActionResult } from '@/shared/api/result';
import { supabase } from '@/shared/auth/supabase';

const BUCKET = 'tenant-media';
const MAX_BYTES = 5 * 1024 * 1024;

function extensionFor(mimeType: string | null | undefined, uri: string): string {
  if (mimeType?.includes('png')) return 'png';
  if (mimeType?.includes('webp')) return 'webp';
  const match = /\.([a-zA-Z0-9]+)$/.exec(uri);
  return match?.[1]?.toLowerCase() ?? 'jpg';
}

export async function pickAndUploadTenantLogo(
  tenantId: string,
): Promise<ActionResult<{ url: string }>> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    return fail('VALIDATION_ERROR', 'Necesitamos acceso a tus fotos para cambiar el logo.');
  }

  const picked = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.85,
  });
  if (picked.canceled || !picked.assets[0]) {
    return fail('STATE_ERROR', 'No se seleccionó ninguna imagen.');
  }

  const asset = picked.assets[0];
  if (asset.fileSize && asset.fileSize > MAX_BYTES) {
    return fail('VALIDATION_ERROR', 'La imagen supera el máximo de 5 MB.');
  }

  const response = await fetch(asset.uri);
  const body = await response.arrayBuffer();
  if (body.byteLength > MAX_BYTES) {
    return fail('VALIDATION_ERROR', 'La imagen supera el máximo de 5 MB.');
  }

  const extension = extensionFor(asset.mimeType, asset.uri);
  const path = `${tenantId}/logo/${Date.now()}.${extension}`;
  const contentType = asset.mimeType ?? `image/${extension === 'jpg' ? 'jpeg' : extension}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, body, {
    contentType,
    upsert: false,
  });
  if (error) {
    return fail('STATE_ERROR', 'No se pudo subir la imagen. Inténtalo de nuevo.');
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return ok({ url: data.publicUrl });
}
