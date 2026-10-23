'use client';

import { useEffect, useState } from 'react';
import type { ActionResult } from '../types/result';

export type AdminResourceState<T> =
  | { status: 'loading' }
  | { status: 'ready'; data: T }
  | { status: 'error'; message: string };

/**
 * Client-side data loading for the admin modules: navigation mounts the page
 * immediately with a skeleton and the Server Action resolves afterwards, so the
 * route transition never waits on SSR/data.
 */
export function useAdminResource<T>(
  tenantId: string | undefined,
  load: (tenantId: string) => Promise<ActionResult<T>>,
  fallbackMessage = 'No pudimos cargar la información.',
): AdminResourceState<T> {
  const [state, setState] = useState<AdminResourceState<T>>({ status: 'loading' });

  useEffect(() => {
    if (!tenantId) {
      return;
    }

    let active = true;
    setState({ status: 'loading' });

    load(tenantId)
      .then((result) => {
        if (!active) {
          return;
        }
        setState(
          result.ok
            ? { status: 'ready', data: result.data }
            : { status: 'error', message: result.error.message },
        );
      })
      .catch((error: unknown) => {
        if (!active) {
          return;
        }
        setState({
          status: 'error',
          message: error instanceof Error ? error.message : fallbackMessage,
        });
      });

    return () => {
      active = false;
    };
  }, [tenantId, load, fallbackMessage]);

  return state;
}
