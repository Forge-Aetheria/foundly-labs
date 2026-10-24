import type { Metadata } from 'next';
import { Card, Container, Stack, Typography } from '@foundly/ui';
import { PublicFooter } from '../../shared/components/PublicFooter';
import { PublicHeader } from '../../shared/components/PublicHeader';

export const metadata: Metadata = {
  title: 'Política de Privacidad — Foundly Book',
  description: 'Cómo trata Foundly Book los datos de tu negocio y de tus clientes.',
};

/** Public privacy page linked from the onboarding footer. */
export default function PrivacyPage() {
  return (
    <Stack sx={{ minHeight: '100vh' }}>
      <PublicHeader />
      <Container maxWidth="md" sx={{ flexGrow: 1, py: { xs: 4, md: 6 } }}>
        <Card
          header={
            <Typography variant="h4" component="h1">
              Política de Privacidad
            </Typography>
          }
        >
          <Stack spacing={2}>
            <Typography variant="body2" color="text.secondary">
              Recogemos únicamente los datos necesarios para crear tu cuenta, publicar tu página de
              reservas y gestionar las citas de tus clientes.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              No vendemos tus datos. La información se almacena en proveedores de infraestructura
              con medidas de seguridad razonables y se usa solo para operar Foundly Book.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Puedes solicitar la exportación o eliminación de tus datos escribiendo al equipo de
              Foundly Labs.
            </Typography>
          </Stack>
        </Card>
      </Container>
      <PublicFooter />
    </Stack>
  );
}
