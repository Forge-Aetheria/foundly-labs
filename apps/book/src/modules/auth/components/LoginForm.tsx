import { useState, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button, Stack, TextField, Typography } from '@foundly/ui';
import { useSignIn } from '../hooks';
import { PasswordField } from '../../../shared/components/PasswordField';

/** Sign-in form (feature 009/024): interacts through `useSignIn`. */
export function LoginForm({ sessionExpired = false }: { sessionExpired?: boolean }) {
  const navigate = useNavigate();
  const location = useLocation();
  const signIn = useSignIn();
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
      if (!result.ok) {
        setFormError(result.error.message);
        setFields(result.error.fields ?? {});
        setSubmitting(false);
        return;
      }
      const from = (location.state as { from?: string } | null)?.from;
      const target = from && from.startsWith('/') && !from.startsWith('/login') ? from : result.data.redirectTo;
      navigate(target, { replace: true });
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
          <Button type="submit" variant="primary" loading={submitting} disabled={submitting}>
            Entrar
          </Button>
        </Stack>
      </Stack>
    </form>
  );
}
