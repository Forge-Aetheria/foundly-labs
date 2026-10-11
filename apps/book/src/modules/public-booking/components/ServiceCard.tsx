'use client';

import { Badge, Button, Card, Stack, Typography } from '@foundly/ui';
import { GLASS_CARD_SX, PRIMARY_BUTTON_SX } from '../../../shared/utils/landingCanon';
import { formatPrice } from '../../../shared/utils/format';
import type { PublicService } from '../utils/types';

export interface ServiceCardProps {
  service: PublicService;
  onReserve: (service: PublicService) => void;
}

/** Servicios tab card: name, description, duration, current price and a pill "Reservar". */
export function ServiceCard({ service, onReserve }: ServiceCardProps) {
  return (
    <Card
      sx={GLASS_CARD_SX}
      header={
        <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
          <Typography variant="h6" component="h2">
            {service.name}
          </Typography>
          <Badge pill status="neutral">
            {service.durationMinutes} min
          </Badge>
        </Stack>
      }
    >
      <Stack spacing={1.5}>
        {service.description ? (
          <Typography variant="body2" color="text.secondary">
            {service.description}
          </Typography>
        ) : null}
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="body1" sx={{ fontWeight: 600 }}>
            {formatPrice(service.priceCents, service.currency)}
          </Typography>
          <Button variant="primary" sx={PRIMARY_BUTTON_SX} onClick={() => onReserve(service)}>
            Reservar
          </Button>
        </Stack>
      </Stack>
    </Card>
  );
}
