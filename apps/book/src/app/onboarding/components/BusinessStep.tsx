'use client';

import { useState } from 'react';
import { Button, Stack, TextField, Typography } from '@foundly/ui';
import { suggestSlug, validateSlug as validateSlugRules } from '../../../domain/tenancy/slug';
import { validateSlug as checkSlugAvailability } from '../../../features/onboarding/actions';
import { businessSchema, type BusinessFields } from '../../../features/onboarding/schemas';

export interface BusinessStepProps {
  initial: BusinessFields | null;
  onComplete: (business: BusinessFields) => void;
}

type SlugStatus = 'idle' | 'format' | 'reserved';

/** Step 2 — business data with public-URL feedback (FR-008/FR-009). */
export function BusinessStep({ initial, onComplete }: BusinessStepProps) {
  const [values, setValues] = useState<BusinessFields>(
    initial ?? { name: '', slug: '', category: '' },
  );
  const [errors, setErrors] = useState<Partial<Record<keyof BusinessFields, string>>>({});
  const [slugStatus, setSlugStatus] = useState<SlugStatus>('idle');
  const [slugHint, setSlugHint] = useState<string | null>(null);

  function setField(field: keyof BusinessFields, value: string) {
    setValues((prev) => ({ ...prev, [field]: value }));
    if (field === 'slug') {
      const check = validateSlugRules(value.trim());
      if (check.ok === true) {
        setSlugStatus('idle');
        setSlugHint('Disponibilidad por confirmar.');
      } else if (check.reason === 'format') {
        setSlugStatus('format');
        setSlugHint('Formato no válido (minúsculas y guiones).');
      } else {
        setSlugStatus('reserved');
        setSlugHint('Esa URL está reservada.');
      }
    }
  }

  async function submit() {
    const parsed = businessSchema.safeParse(values);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? '_');
        if (!(key in fieldErrors)) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }
    const availability = await checkSlugAvailability(values.slug);
    if (!availability.available && availability.reason === 'taken') {
      setErrors((prev) => ({ ...prev, slug: 'Esa URL ya está en uso.' }));
      return;
    }
    onComplete(parsed.data);
  }

  const suggestion = values.name.trim() ? suggestSlug(values.name) : null;

  return (
    <Stack spacing={2}>
      <TextField
        label="Nombre del negocio"
        name="name"
        required
        fullWidth
        value={values.name}
        onChange={(value) => setField('name', value)}
        error={Boolean(errors.name)}
        helperText={errors.name}
      />
      <TextField
        label="URL pública"
        name="slug"
        required
        fullWidth
        value={values.slug}
        onChange={(value) => setField('slug', value)}
        error={Boolean(errors.slug) || slugStatus === 'format' || slugStatus === 'reserved'}
        helperText={errors.slug ?? slugHint ?? undefined}
      />
      {suggestion ? (
        <Typography variant="caption" color="text.secondary">
          Sugerencia: {suggestion}
        </Typography>
      ) : null}
      <Typography variant="caption" color="text.secondary">
        Tu URL será: foundlylabs.lat/book/{values.slug.trim() || 'tu-negocio'}
      </Typography>
      <TextField
        label="Categoría"
        name="category"
        required
        fullWidth
        value={values.category}
        onChange={(value) => setField('category', value)}
        error={Boolean(errors.category)}
        helperText={errors.category}
      />
      <Stack direction="row" justifyContent="flex-end">
        <Button variant="primary" onClick={submit}>
          Continuar
        </Button>
      </Stack>
    </Stack>
  );
}