'use client';

import type { ActionResult } from '../../../shared/types/result';
import {
  ACCEPTED_IMAGE_TYPES,
  MAX_IMAGE_BYTES,
  uploadImage,
  validateImageFile,
} from '../../../shared/utils/uploadImage';

/** Supabase Storage bucket that holds booking advance proofs (feature 017). */
export const PAYMENT_PROOF_BUCKET = 'payment-proofs';
export const MAX_PROOF_BYTES = MAX_IMAGE_BYTES;
export const ACCEPTED_PROOF_TYPES = ACCEPTED_IMAGE_TYPES;

/** Validate the proof file (format + size) before uploading. */
export function validateProofFile(file: File): { ok: true } | { ok: false; message: string } {
  return validateImageFile(file);
}

/**
 * Upload a payment proof screenshot to Supabase Storage and return its public URL.
 * Failures keep the entered data intact so the client can retry.
 *
 * Delegates to the generic `uploadImage` util (feature 021); the bucket and path
 * shape (`{tenantSlug}/{uuid}.{ext}`) are preserved from feature 017.
 */
export async function uploadPaymentProof(
  file: File,
  tenantSlug: string,
): Promise<ActionResult<{ url: string }>> {
  return uploadImage(file, { bucket: PAYMENT_PROOF_BUCKET, scope: tenantSlug });
}
