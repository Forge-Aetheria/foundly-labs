'use client';

import { useState } from 'react';
import { TextField } from '@foundly/ui';
import { useDirectorySearch } from '../hooks';

export interface DirectorySearchProps {
  value: string;
}

/** Debounced search input (feature 019): writes the term to the URL so the server re-renders. */
export function DirectorySearch({ value }: DirectorySearchProps) {
  const [term, setTerm] = useState(value);
  const search = useDirectorySearch();

  return (
    <TextField
      name="q"
      label="Buscar negocios"
      placeholder="Nombre, categoría o ciudad"
      value={term}
      onChange={(next) => {
        setTerm(next);
        search(next);
      }}
      fullWidth
      sx={{ maxWidth: 480 }}
    />
  );
}
