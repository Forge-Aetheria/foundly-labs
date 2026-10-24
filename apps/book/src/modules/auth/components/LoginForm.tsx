'use client';

import { useState, useTransition, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Stack, TextField, Typography } from '@foundly/ui';
import { useSignIn } from '../hooks';
import { PasswordField } from '../../../shared/components/PasswordField';

/** Sign-in form (feature 009 — US1; feature 012 session-expiry notice). Interacts through `useSignIn`. */
export function LoginForm({ sessionExpired = false }: { sessionExpired?: boolean }) {
  const router = useRouter();
  const signIn = useSignIn();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fields, setFields] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [navigating, startNavigation] = useTransition();
  const busy = submitting || navigating;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setFields({});
    setSubmitting(true);

    try {
      const result = await signIn({ email, password });
      if (!result.ok) {
        setFormError(result.error.message);
        setFields(result.error.fields ?? {});
        setSubmitting(false);
        return;
      }
      // Keep the loading state until the App Router lands on the admin workspace
      // (the form unmounts on success); only an error clears it.
      startNavigation(() => {
        router.push(result.data.redirectTo);
        router.refresh();
      });
    } catch {
      setFormError('No se pudo iniciar sesión. Inténtalo de nuevo.');
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate>
      <Stack spacing={2}>
        {sessionExpired ? (
          <Typography role="status" variant="body2" sx={{ color: 'primary.main', fontWeight: 600 }}>
            Tu sesión ha caducado. Vuelve a iniciar sesión para continuar.
          </Typography>
        ) : null}
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
        <PasswordField
          label="Contraseña"
          name="password"
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
          <Button type="submit" variant="primary" loading={busy} disabled={busy}>
            Entrar
          </Button>
        </Stack>
      </Stack>
    </form>
  );
}
