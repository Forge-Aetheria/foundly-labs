'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Stack, TextField, Typography } from '@foundly/ui';
import { signIn } from '../../../shared/infra/sessionActions';

/** Sign-in form (feature 009 — US1). Calls the `signIn` Server Action. */
export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fields, setFields] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setFields({});
    setSubmitting(true);

    try {
      const result = await signIn({ email, password });
      if (result.ok) {
        router.push(result.data.redirectTo);
        router.refresh();
        return;
      }
      setFormError(result.error.message);
      setFields(result.error.fields ?? {});
    } catch {
      setFormError('No se pudo iniciar sesión. Inténtalo de nuevo.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate>
      <Stack spacing={2}>
        <TextField
          label="Email"
          name="email"
          type="email"
          required
          fullWidth
          value={email}
          onChange={setEmail}
          error={Boolean(fields.email)}
          helperText={fields.email}
        />
        <TextField
          label="Contraseña"
          name="password"
          type="password"
          required
          fullWidth
          value={password}
          onChange={setPassword}
          error={Boolean(fields.password)}
          helperText={fields.password}
        />
        {formError ? (
          <Typography role="alert" variant="body2" sx={{ color: 'error.main' }}>
            {formError}
          </Typography>
        ) : null}
        <Stack direction="row" justifyContent="flex-end">
          <Button type="submit" variant="primary" loading={submitting} disabled={submitting}>
            Entrar
          </Button>
        </Stack>
      </Stack>
    </form>
  );
}
