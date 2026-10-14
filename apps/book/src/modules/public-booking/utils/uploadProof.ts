'use client';

import { createBrowserSupabaseClient } from '../../../shared/auth/supabase/client';
import { fail, ok, type ActionResult } from '../../../shared/types/result';

/** Supabase Storage bucket that holds booking advance proofs (feature 017). */
export const PAYMENT_PROOF_BUCKET = 'payment-proofs';
export const MAX_PROOF_BYTES = 5 * 1024 * 1024;
export const ACCEPTED_PROOF_TYPES = ['image/png', 'image/jpeg', 'image/webp'] as const;

/** Validate the proof file (format + size) before uploading. */
export function validateProofFile(file: File): { ok: true } | { ok: false; message: string } {
  if (!(ACCEPTED_PROOF_TYPES as readonly string[]).includes(file.type)) {
    return { ok: false, message: 'Formato no admitido. Usa PNG, JPG o WEBP.' };
  }
  if (file.size > MAX_PROOF_BYTES) {
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
 * Upload a payment proof screenshot to Supabase Storage and return its public URL.
 * Failures keep the entered data intact so the client can retry.
 */
export async function uploadPaymentProof(
  file: File,
  tenantSlug: string,
): Promise<ActionResult<{ url: string }>> {
  const validation = validateProofFile(file);
  if (!validation.ok) {
    return fail('VALIDATION_ERROR', validation.message);
  }
  const supabase = createBrowserSupabaseClient();
  if (!supabase) {
    return fail('STATE_ERROR', 'La subida de comprobantes no está disponible.');
  }
  const path = `${tenantSlug}/${randomId()}.${extensionFor(file.type)}`;
  const { error } = await supabase.storage
    .from(PAYMENT_PROOF_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });
  if (error) {
    return fail('STATE_ERROR', 'No se pudo subir el comprobante. Inténtalo de nuevo.');
  }
  const { data } = supabase.storage.from(PAYMENT_PROOF_BUCKET).getPublicUrl(path);
  return ok({ url: data.publicUrl });
}
