import { useCallback, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import type { ActionResult } from '../types/result';

export interface AsyncActionState {
  /** True while an action is in flight; bind to `Button loading`. */
  pending: boolean;
  /**
   * Run an action with a double-submit guard: re-entrant calls while pending are
   * ignored and resolve to `undefined`. Errors are returned by the action itself.
   */
  run<T>(action: () => Promise<ActionResult<T>>): Promise<ActionResult<T> | undefined>;
}

/**
 * Standardizes pending state + double-submit prevention across admin forms
 * (feature 024 — backed by TanStack `useMutation`).
 */
export function useAsyncAction(): AsyncActionState {
  const inFlight = useRef(false);
  const mutation = useMutation({
    mutationFn: (action: () => Promise<ActionResult<unknown>>) => action(),
  });

  const run = useCallback(
    async <T,>(action: () => Promise<ActionResult<T>>) => {
      if (inFlight.current) {
        return undefined;
      }
      inFlight.current = true;
      try {
        const result = await mutation.mutateAsync(
          action as () => Promise<ActionResult<unknown>>,
        );
        return result as ActionResult<T>;
      } finally {
        inFlight.current = false;
      }
    },
    [mutation],
  );

  return { pending: mutation.isPending, run };
}
