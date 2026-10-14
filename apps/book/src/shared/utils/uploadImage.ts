'use client';

import { createBrowserSupabaseClient } from '../auth/supabase/client';
import { fail, ok, type ActionResult } from '../types/result';

/** Supabase Storage bucket that holds tenant-owned media (feature 021). */
export const TENANT_MEDIA_BUCKET = 'tenant-media';

/** Maximum accepted image size (matches feature 017). */
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

/** Accepted image formats (matches feature 017). */
export const ACCEPTED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp'] as const;

export type AcceptedImageType = (typeof ACCEPTED_IMAGE_TYPES)[number];

/** Media kind sub-folder used to namespace assets inside a tenant scope. */
export type MediaKind = 'logo' | 'cover' | 'avatar' | 'gallery';

export interface UploadImageOptions {
  /** Storage bucket (defaults to `TENANT_MEDIA_BUCKET`). */
  bucket?: string;
  /** Tenant scope / path prefix (tenant id, or slug for the payment-proof flow). */
  scope: string;
  /** Optional sub-folder under the scope (e.g. the media kind). */
  folder?: MediaKind;
}

/** Validate an image file (format + size) before uploading. */
export function validateImageFile(file: File): { ok: true } | { ok: false; message: string } {
  if (!(ACCEPTED_IMAGE_TYPES as readonly string[]).includes(file.type)) {
    return { ok: false, message: 'Formato no admitido. Usa PNG, JPG o WEBP.' };
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return { ok: false, message: 'La imagen supera el máximo de 5 MB.' };
  }
  return { ok: true };
}

function extensionFor(type: string): string {
  switch (type) {
    case 'image/png':
      return 'png';
    case 'image/webp':
      return 'webp';
    default:
      return 'jpg';
  }
}

function randomId(): string {
  const cryptoObj = globalThis.crypto;
  if (cryptoObj && typeof cryptoObj.randomUUID === 'function') {
    return cryptoObj.randomUUID();
  }
  return `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
}

/**
 * Upload an image to Supabase Storage and return its public URL.
 * Failures keep the caller's data intact so it can retry (feature 021).
 */
export async function uploadImage(
  file: File,
  options: UploadImageOptions,
): Promise<ActionResult<{ url: string }>> {
  const validation = validateImageFile(file);
  if (!validation.ok) {
    return fail('VALIDATION_ERROR', validation.message);
  }
  const supabase = createBrowserSupabaseClient();
  if (!supabase) {
    return fail('STATE_ERROR', 'La subida de imágenes no está disponible.');
  }
  const bucket = options.bucket ?? TENANT_MEDIA_BUCKET;
  const segments = [options.scope.trim(), options.folder].filter(
    (segment): segment is string => Boolean(segment),
  );
  const path = [...segments, `${randomId()}.${extensionFor(file.type)}`].join('/');
  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, file, { contentType: file.type, upsert: false });
  if (error) {
    return fail('STATE_ERROR', 'No se pudo subir la imagen. Inténtalo de nuevo.');
  }
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return ok({ url: data.publicUrl });
}
