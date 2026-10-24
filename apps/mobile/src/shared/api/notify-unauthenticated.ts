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
