'use client';

import { useState } from 'react';
import { Button, Stack, Typography } from '@foundly/ui';
import { PRIMARY_BUTTON_SX, SECONDARY_BUTTON_SX } from '../../../../app/components/landingCanon';
import type { PublicSpecialist } from '../../types';

/** Step 1 — specialist selection (FR-010); shown only when > 1 active specialist. */
export function SpecialistStep({
  specialists,
  onContinue,
}: {
  specialists: PublicSpecialist[];
  onContinue: (specialistId: string) => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <Stack spacing={2}>
      <Typography variant="body2" color="text.secondary">
        Elige tu especialista
      </Typography>
      {specialists.map((specialist) => (
        <Button
          key={specialist.id}
          variant={selected === specialist.id ? 'primary' : 'secondary'}
          sx={selected === specialist.id ? PRIMARY_BUTTON_SX : SECONDARY_BUTTON_SX}
          onClick={() => setSelected(specialist.id)}
        >
          {specialist.name}
        </Button>
      ))}
      <Stack direction="row" justifyContent="flex-end">
        <Button
          variant="primary"
          sx={PRIMARY_BUTTON_SX}
          disabled={!selected}
          onClick={() => {
            if (selected) onContinue(selected);
          }}
        >
          Continuar
        </Button>
      </Stack>
    </Stack>
  );
}