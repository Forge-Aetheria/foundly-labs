'use client';

import { useState } from 'react';
import { Button, Stack, TextField } from '@foundly/ui';
import { PRIMARY_BUTTON_SX, SECONDARY_BUTTON_SX } from '../../../shared/utils/landingCanon';
import { clientDetailsSchema, type ClientDetails } from '../utils/schemas';

type Field = keyof Omit<ClientDetails, 'notes'> | 'notes';

/** Step 3 — client data with inline validation (FR-012). */
export function ClientStep({
  value,
  onSubmit,
  onBack,
}: {
  value: ClientDetails | null;
  onSubmit: (client: ClientDetails) => void;
  onBack: () => void;
}) {
  const [values, setValues] = useState<ClientDetails>(
    value ?? { clientName: '', clientEmail: '', clientPhone: '', notes: '' },
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  function setField(field: Field, fieldValue: string) {
    setValues((prev) => ({ ...prev, [field]: fieldValue }));
  }

  function submit() {
    const parsed = clientDetailsSchema.safeParse(values);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? '_');
        if (!(key in fieldErrors)) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }
    onSubmit(parsed.data);
  }

  return (
    <Stack spacing={2}>
      <TextField
        label="Nombre"
        value={values.clientName}
        onChange={(fieldValue) => setField('clientName', fieldValue)}
        error={Boolean(errors.clientName)}
        helperText={errors.clientName}
      />
      <TextField
        label="Email"
        type="email"
        value={values.clientEmail}
        onChange={(fieldValue) => setField('clientEmail', fieldValue)}
        error={Boolean(errors.clientEmail)}
        helperText={errors.clientEmail}
      />
      <TextField
        label="Teléfono"
        value={values.clientPhone}
        onChange={(fieldValue) => setField('clientPhone', fieldValue)}
        error={Boolean(errors.clientPhone)}
        helperText={errors.clientPhone}
      />
      <TextField
        label="Notas (opcional)"
        value={values.notes ?? ''}
        onChange={(fieldValue) => setField('notes', fieldValue)}
      />
      <Stack direction="row" justifyContent="flex-end" spacing={1}>
        <Button variant="secondary" sx={SECONDARY_BUTTON_SX} onClick={onBack}>
          Atrás
        </Button>
        <Button variant="primary" sx={PRIMARY_BUTTON_SX} onClick={submit}>
          Continuar
        </Button>
      </Stack>
    </Stack>
  );
}
