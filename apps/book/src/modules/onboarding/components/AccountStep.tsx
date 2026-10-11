'use client';

import { useState } from 'react';
import { Button, Stack, TextField } from '@foundly/ui';
import { accountSchema, type AccountFields } from '../utils/schemas';

export interface AccountStepProps {
  initial: AccountFields | null;
  onComplete: (account: AccountFields) => void;
}

/** Step 1 — account data (FR-007). */
export function AccountStep({ initial, onComplete }: AccountStepProps) {
  const [values, setValues] = useState<AccountFields>(
    initial ?? { fullName: '', email: '', password: '' },
  );
  const [errors, setErrors] = useState<Partial<Record<keyof AccountFields, string>>>({});

  function setField(field: keyof AccountFields, value: string) {
    setValues((prev) => ({ ...prev, [field]: value }));
  }

  function submit() {
    const parsed = accountSchema.safeParse(values);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? '_');
        if (!(key in fieldErrors)) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }
    onComplete(parsed.data);
  }

  return (
    <Stack spacing={2}>
      <TextField
        label="Nombre completo"
        name="fullName"
        required
        fullWidth
        value={values.fullName}
        onChange={(value) => setField('fullName', value)}
        error={Boolean(errors.fullName)}
        helperText={errors.fullName}
      />
      <TextField
        label="Email"
        name="email"
        type="email"
        required
        fullWidth
        value={values.email}
        onChange={(value) => setField('email', value)}
        error={Boolean(errors.email)}
        helperText={errors.email}
      />
      <TextField
        label="Contraseña"
        name="password"
        type="password"
        required
        fullWidth
        value={values.password}
        onChange={(value) => setField('password', value)}
        error={Boolean(errors.password)}
        helperText={errors.password}
      />
      <Stack direction="row" justifyContent="flex-end">
        <Button variant="primary" onClick={submit}>
          Continuar
        </Button>
      </Stack>
    </Stack>
  );
}
