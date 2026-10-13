'use client';

import { Card, Stack, Typography } from '@foundly/ui';
import { GLASS_CARD_SX } from '../../../shared/utils/landingCanon';

/**
 * Galería (feature 010 — T014, US5).
 * The gallery has no backend counterpart yet: this surface renders a clean
 * empty state and never shows mocked photos or fake actions (FR-007/FR-009).
 */
export function GalleryManager() {
  return (
    <Card
      header={
        <Stack spacing={0.25}>
          <Typography variant="h5" component="h1">
            Galería
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Fotos del negocio que se muestran en la vista pública.
          </Typography>
        </Stack>
      }
    >
      <Card sx={GLASS_CARD_SX}>
        <Stack spacing={1} alignItems="center" sx={{ py: 4, textAlign: 'center' }}>
          <Typography variant="h6" component="h2">
            Todavía no hay fotos
          </Typography>
          <Typography variant="body2" color="text.secondary">
            La galería aún no está disponible: todavía no tiene soporte en el backend. No se muestran
            fotos de ejemplo.
          </Typography>
        </Stack>
      </Card>
    </Card>
  );
}