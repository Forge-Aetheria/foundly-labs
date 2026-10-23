'use client';

import { Card, Stack, Typography } from '@foundly/ui';
import { PasswordForm } from './components/PasswordForm';

/** Security settings view (feature 009 — US5): change the account password. */
export function SecurityView({ embedded = false }: { embedded?: boolean }) {
  return (
    <Stack spacing={3}>
      <Stack spacing={0.5}>
        <Typography
          variant="h5"
          component={embedded ? 'h2' : 'h1'}
          sx={{ fontWeight: 700 }}
        >
          Seguridad
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Cambia la contraseña con la que accedes a tu panel.
        </Typography>
      </Stack>
      <Card
        header={
          <Typography variant="h6" component="h2" sx={{ fontWeight: 600 }}>
            Contraseña
          </Typography>
        }
      >
        <PasswordForm />
      </Card>
    </Stack>
  );
}
