/** Email pattern used by the hero email capture (lead → register redirect). */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Resolves the registration redirect from the hero email capture:
 * a valid email carries it encoded on `/register?email=…`, otherwise `/register`.
 */
export function heroCaptureHref(email: string): string {
  const trimmed = email.trim();
  return EMAIL_PATTERN.test(trimmed)
    ? `/register?email=${encodeURIComponent(trimmed)}`
    : '/register';
}