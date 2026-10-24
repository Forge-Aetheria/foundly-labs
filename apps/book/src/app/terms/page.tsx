import type { Metadata } from 'next';
import { Card, Container, Stack, Typography } from '@foundly/ui';
import { PublicFooter } from '../../shared/components/PublicFooter';
import { PublicHeader } from '../../shared/components/PublicHeader';

export const metadata: Metadata = {
  title: 'Términos de Servicio — Foundly Book',
  description: 'Condiciones de uso de Foundly Book.',
};

/** Public terms page linked from the onboarding footer. */
export default function TermsPage() {
  return (
    <Stack sx={{ minHeight: '100vh' }}>
      <PublicHeader />
      <Container maxWidth="md" sx={{ flexGrow: 1, py: { xs: 4, md: 6 } }}>
        <Card
          header={
            <Typography variant="h4" component="h1">
              Términos de Servicio
            </Typography>
          }
        >
          <Stack spacing={2}>
            <Typography variant="body2" color="text.secondary">
              Foundly Book es una plataforma de gestión de agendas y reservas online para negocios.
              Al crear una cuenta aceptas usar el servicio de forma responsable y mantener la
              información de tu negocio actualizada.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              El servicio se ofrece tal cual, con mejoras continuas. Foundly Labs no se hace
              responsable de citas incumplidas por parte de tus clientes ni de la disponibilidad de
              servicios de terceros integrados.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Puedes cancelar tu cuenta en cualquier momento. Los datos asociados se conservarán
              según la legislación aplicable.
            </Typography>
          </Stack>
        </Card>
      </Container>
      <PublicFooter />
    </Stack>
  );
}
