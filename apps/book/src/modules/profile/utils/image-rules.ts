/**
 * Profile image rules (feature 016, US4).
 *
 * Images are URL strings today (no upload pipeline), so only the aspects that can
 * be measured client-side are enforced: when an image loads, its aspect must match
 * the rule within a tolerance; when it cannot be measured (CORS/remote/timeout),
 * the rules degrade to guidance and the save is allowed.
 */
export interface ImageRule {
  kind: 'avatar' | 'cover';
  label: string;
  /** Target width/height ratio (1 = square, 3 = banner). */
  aspect: number;
  recommendedWidth: number;
  recommendedHeight: number;
  /** Guidance only while images are URLs (bytes cannot be measured). */
  maxBytes: number;
  /** Relative tolerance on the aspect ratio. */
  tolerance: number;
}

export const AVATAR_RULE: ImageRule = {
  kind: 'avatar',
  label: 'cuadrada (1:1)',
  aspect: 1,
  recommendedWidth: 512,
  recommendedHeight: 512,
  maxBytes: 2_000_000,
  tolerance: 0.02,
};

export const COVER_RULE: ImageRule = {
  kind: 'cover',
  label: 'banner (3:1)',
  aspect: 3,
  recommendedWidth: 1200,
  recommendedHeight: 400,
  maxBytes: 4_000_000,
  tolerance: 0.02,
};

export interface MeasuredImage {
  width: number;
  height: number;
}

/** Recommended-dimensions copy for the editor helper text. */
export function ruleGuidance(rule: ImageRule): string {
  return `Recomendado: ${rule.label}, ${rule.recommendedWidth}×${rule.recommendedHeight}px.`;
}

/** Resolve an image's natural dimensions, or `null` when it cannot be measured. */
export function measureImage(url: string, timeoutMs = 5000): Promise<MeasuredImage | null> {
  return new Promise((resolve) => {
    if (typeof Image === 'undefined') {
      resolve(null);
      return;
    }
    const image = new Image();
    let settled = false;
    const finish = (value: MeasuredImage | null) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      image.onload = null;
      image.onerror = null;
      resolve(value);
    };
    const timer = setTimeout(() => finish(null), timeoutMs);
    image.crossOrigin = 'anonymous';
    image.onload = () =>
      finish(
        image.naturalWidth && image.naturalHeight
          ? { width: image.naturalWidth, height: image.naturalHeight }
          : null,
      );
    image.onerror = () => finish(null);
    image.src = url;
  });
}

export type ImageCheck = { ok: true; measured: boolean } | { ok: false; message: string };

/** Validate a URL against a rule; blocks only when the image is measurable and violates it. */
export async function checkImage(url: string, rule: ImageRule): Promise<ImageCheck> {
  const trimmed = url.trim();
  if (!trimmed) {
    return { ok: true, measured: false };
  }
  const measured = await measureImage(trimmed);
  if (!measured) {
    return { ok: true, measured: false };
  }
  const actual = measured.width / measured.height;
  const relative = Math.abs(actual - rule.aspect) / rule.aspect;
  if (relative > rule.tolerance) {
    return {
      ok: false,
      message: `La imagen debe ser ${rule.label}. Se recomienda ${rule.recommendedWidth}×${rule.recommendedHeight}px.`,
    };
  }
  return { ok: true, measured: true };
}
