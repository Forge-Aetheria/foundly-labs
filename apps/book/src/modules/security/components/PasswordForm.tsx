'use client';

import { useState, type FormEvent } from 'react';
import { Button, Stack, TextField, Typography } from '@foundly/ui';
import { changePassword } from '../../../shared/infra/securityActions';

/** Password change form (feature 009 — US5). Calls the `changePassword` action. */
export function PasswordForm() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fields, setFields] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  function reset() {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setFields({});
    setSuccess(false);
    setSubmitting(true);

    const result = await changePassword({ currentPassword, newPassword, confirmPassword });
    setSubmitting(false);

    if (result.ok) {
      reset();
      setSuccess(true);
      return;
    }

    setFormError(result.error.message);
    setFields(result.error.fields ?? {});
  }

  return (
    <form onSubmit={submit} noValidate>
      <Stack spacing={2}>
        <TextField
          label="Contraseña actual"
          name="currentPassword"
          type="password"
          required
          fullWidth
          value={currentPassword}
          onChange={setCurrentPassword}
          error={Boolean(fields.currentPassword)}
          helperText={fields.currentPassword}
        />
        <TextField
          label="Nueva contraseña"
          name="newPassword"
          type="password"
          required
          fullWidth
          value={newPassword}
          onChange={setNewPassword}
          error={Boolean(fields.newPassword)}
          helperText={fields.newPassword ?? 'Mínimo 8 caracteres, con letras y números.'}
        />
        <TextField
          label="Repite la nueva contraseña"
          name="confirmPassword"
          type="password"
          required
          fullWidth
          value={confirmPassword}
          onChange={setConfirmPassword}
          error={Boolean(fields.confirmPassword)}
          helperText={fields.confirmPassword}
        />
        {formError ? (
          <Typography role="alert" variant="body2" sx={{ color: 'error.main' }}>
            {formError}
          </Typography>
        ) : null}
        {success ? (
          <Typography role="status" variant="body2" sx={{ color: 'success.main' }}>
            Contraseña actualizada correctamente.
          </Typography>
        ) : null}
        <Stack direction="row" justifyContent="flex-end">
          <Button type="submit" variant="primary" loading={submitting} disabled={submitting}>
            Guardar contraseña
          </Button>
        </Stack>
      </Stack>
    </form>
  );
}
