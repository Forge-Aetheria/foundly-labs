'use client';

import { useCallback, useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';

const DEBOUNCE_MS = 300;

/**
 * Client search hook (feature 019; constitution §5.VI): debounces the term and writes it to the
 * URL query (`?q=`), so the server re-renders the directory. Uses `replace` to keep history clean.
 */
export function useDirectorySearch(): (term: string) => void {
  const router = useRouter();
  const pathname = usePathname();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) {
        clearTimeout(timer.current);
      }
    },
    [],
  );

  return useCallback(
    (term: string) => {
      if (timer.current) {
        clearTimeout(timer.current);
      }
      timer.current = setTimeout(() => {
        const trimmed = term.trim();
        const target = pathname ?? '/negocios';
        router.replace(trimmed ? `${target}?q=${encodeURIComponent(trimmed)}` : target);
      }, DEBOUNCE_MS);
    },
    [router, pathname],
  );
}
