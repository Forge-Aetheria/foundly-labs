'use client';

import { useCallback, useRef, useState } from 'react';
import type { ActionResult } from '../types/result';

export interface AsyncActionState {
  /** True while an action is in flight; bind to `Button loading`. */
  pending: boolean;
  /**
   * Run an action with a double-submit guard: re-entrant calls while pending are
   * ignored and resolve to `undefined`. Errors are returned by the action itself
   * (never thrown), so callers route them with `errorSurface`.
   */
  run<T>(action: () => Promise<ActionResult<T>>): Promise<ActionResult<T> | undefined>;
}

/** Standardizes pending state + double-submit prevention across admin forms (feature 016, US2). */
export function useAsyncAction(): AsyncActionState {
  const [pending, setPending] = useState(false);
  const inFlight = useRef(false);

  const run = useCallback(async <T,>(action: () => Promise<ActionResult<T>>) => {
    if (inFlight.current) {
      return undefined;
    }
    inFlight.current = true;
    setPending(true);
    try {
      return await action();
    } finally {
      inFlight.current = false;
      setPending(false);
    }
  }, []);

  return { pending, run };
}
