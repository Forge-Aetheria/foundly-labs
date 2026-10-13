import { Card, Container, Stack, Typography } from '@foundly/ui';
import { LoginForm } from './components/LoginForm';

/** Sign-in view (feature 009 — US1; feature 012 session-expiry notice). Server shell around the client form. */
export function LoginView({ sessionExpired = false }: { sessionExpired?: boolean }) {
  return (
    <Container maxWidth="sm" sx={{ py: { xs: 6, md: 10 } }}>
      <Stack spacing={3}>
        <Stack spacing={0.5}>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
            Accede a tu panel
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Gestiona tu agenda, servicios y equipo con tu cuenta de Foundly.
          </Typography>
        </Stack>
        <Card>
          <LoginForm sessionExpired={sessionExpired} />
        </Card>
      </Stack>
    </Container>
  );
}
