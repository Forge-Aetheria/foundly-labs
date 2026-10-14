/**
 * Race an outbound promise against a wall-clock timeout, resolving to `fallback`
 * when the timeout wins. Serverless platforms kill a hung function at their max
 * duration (Vercel: 300 s); this bounds every auth/network call so a slow or
 * unreachable provider degrades to a typed failure instead of an infinite hang.
 *
 * Framework-free and Edge-safe (used by `src/middleware.ts`).
 */
export function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return new Promise<T>((resolve) => {
    const timer = setTimeout(() => resolve(fallback), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      () => {
        clearTimeout(timer);
        resolve(fallback);
      },
    );
  });
}

/** Default budget for a single outbound auth/session call (8 s). */
export const AUTH_CALL_TIMEOUT_MS = 8000;
