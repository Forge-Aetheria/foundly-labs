'use client';

import Image from 'next/image';
import { Card, Stack, Typography } from '@foundly/ui';
import type { BookingDraft } from '../../../domain/tenancy/types';

/** Left (visual) panel of the onboarding split layout: brand, inspiration and live preview. */
export function BrandPanel({ draft }: { draft: BookingDraft }) {
  const businessName = draft.business?.name?.trim() || 'Tu negocio';
  const slug = draft.business?.slug?.trim() || 'tu-negocio';

  return (
    <Stack spacing={3}>
      <Stack direction="row" spacing={1.5} alignItems="center">
        <Image src="/icon.png" alt="" width={40} height={40} priority />
        <Typography variant="h6" component="p" sx={{ fontWeight: 700 }}>
          Foundly Book
        </Typography>
      </Stack>

      <Typography
        variant="h4"
        component="p"
        sx={{ fontWeight: 700, lineHeight: 1.2, letterSpacing: '-0.02em' }}
      >
        Tu agenda en piloto automático
      </Typography>
      <Typography variant="body2" component="p" color="text.secondary">
        Registra el negocio, define horarios y tu primer servicio, y empieza a recibir citas online
        en minutos.
      </Typography>

      <Card
        header={
          <Typography variant="h6" component="p" sx={{ fontWeight: 600 }}>
            Vista previa
          </Typography>
        }
      >
        <Stack spacing={0.5}>
          <Typography variant="body1" sx={{ fontWeight: 600 }}>
            {businessName}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            foundlylabs.lat/book/{slug}
          </Typography>
          {draft.business?.category ? (
            <Typography variant="caption" color="text.secondary">
              {draft.business.category}
            </Typography>
          ) : null}
          {draft.setup?.defaultAppointmentDurationMinutes ? (
            <Typography variant="caption" color="text.secondary">
              Citas de {draft.setup.defaultAppointmentDurationMinutes} min
            </Typography>
          ) : null}
        </Stack>
      </Card>
    </Stack>
  );
}