'use client';

import { useState, type KeyboardEvent } from 'react';
import MuiTextField from '@mui/material/TextField';
import { Chip, Stack, Typography } from '@foundly/ui';

export interface TagsInputProps {
  label?: string;
  value: string[];
  onChange: (tags: string[]) => void;
  error?: boolean;
  helperText?: string;
  maxTags?: number;
}

function normalizeTag(value: string): string {
  return value
    .replace(/[^\p{L}\p{N}\s-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^-+|-+$/g, '')
    .slice(0, 30)
    .trim()
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toLocaleUpperCase('es') + word.slice(1).toLocaleLowerCase('es'))
    .join(' ');
}

/** Chip-based tag editor: add with Enter/comma, remove with the chip button or Backspace. */
export function TagsInput({
  label = 'Etiquetas',
  value,
  onChange,
  error = false,
  helperText,
  maxTags = 20,
}: TagsInputProps) {
  const [draft, setDraft] = useState('');

  function add(valueToAdd: string) {
    const clean = normalizeTag(valueToAdd);
    if (!clean) return;
    const exists = value.some(
      (tag) => tag.toLocaleLowerCase('es') === clean.toLocaleLowerCase('es'),
    );
    if (exists || value.length >= maxTags) {
      setDraft('');
      return;
    }
    onChange([...value, clean]);
    setDraft('');
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      add(draft);
      return;
    }
    if (event.key === 'Backspace' && draft.length === 0 && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  }

  return (
    <Stack spacing={1}>
      <MuiTextField
        label={label}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={() => add(draft)}
        error={error}
        helperText={helperText ?? 'Pulsa Enter o coma para añadir una etiqueta.'}
        fullWidth
        placeholder="Ej. Corte, Color, Madrid"
        slotProps={{
          htmlInput: { 'aria-label': label, onKeyDown: handleKeyDown },
        }}
      />
      {value.length > 0 ? (
        <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', rowGap: 1 }}>
          {value.map((tag) => (
            <Chip
              key={tag}
              label={tag}
              color="primary"
              onDelete={() => onChange(value.filter((item) => item !== tag))}
            />
          ))}
        </Stack>
      ) : (
        <Typography variant="caption" color="text.secondary">
          Sin etiquetas. Añade palabras clave para mejorar la búsqueda en el directorio.
        </Typography>
      )}
    </Stack>
  );
}
