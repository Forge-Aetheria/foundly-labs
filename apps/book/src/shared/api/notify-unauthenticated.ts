/**
 * Global session-expiry signal (feature 024). The transport emits this when the
 * API rejects the session; the SessionProvider listens and performs a single
 * cache clear + redirect to `/login`.
 */
type Listener = () => void;

const listeners = new Set<Listener>();

export function onUnauthenticated(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function emitUnauthenticated(): void {
  for (const listener of listeners) {
    listener();
  }
}
