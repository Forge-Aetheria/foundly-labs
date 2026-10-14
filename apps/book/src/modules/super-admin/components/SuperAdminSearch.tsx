'use client';

import { useEffect, useRef, useState } from 'react';
import { TextField } from '@foundly/ui';
import { usePathname, useRouter } from 'next/navigation';

const DEBOUNCE_MS = 300;

export interface SuperAdminSearchProps {
  value: string;
}

/** Debounced search input (feature 020): writes `q` to the URL so the server re-renders. */
export function SuperAdminSearch({ value }: SuperAdminSearchProps) {
  const router = useRouter();
  const pathname = usePathname() ?? '/super-admin';
  const [term, setTerm] = useState(value);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) {
        clearTimeout(timer.current);
      }
    },
    [],
  );

  const handleChange = (next: string) => {
    setTerm(next);
    if (timer.current) {
      clearTimeout(timer.current);
    }
    timer.current = setTimeout(() => {
      const trimmed = next.trim();
      router.replace(trimmed ? `${pathname}?q=${encodeURIComponent(trimmed)}` : pathname);
    }, DEBOUNCE_MS);
  };

  return (
    <TextField
      name="q"
      label="Buscar negocios"
      placeholder="Nombre o enlace público"
      value={term}
      onChange={handleChange}
      fullWidth
      sx={{ maxWidth: 480 }}
    />
  );
}
