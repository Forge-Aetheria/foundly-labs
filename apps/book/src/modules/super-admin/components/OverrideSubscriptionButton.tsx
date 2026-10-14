'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@foundly/ui';
import { OverrideSubscriptionDialog } from '../dialogs/OverrideSubscriptionDialog';
import type { ManagedBusinessView } from '../utils/types';

export interface OverrideSubscriptionButtonProps {
  business: ManagedBusinessView;
}

/** Row action: opens the override dialog and refreshes the console on a successful change. */
export function OverrideSubscriptionButton({ business }: OverrideSubscriptionButtonProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  return (
    <>
      <Button
        variant="secondary"
        onClick={() => setOpen(true)}
        aria-label={`Editar suscripción de ${business.name}`}
      >
        Editar
      </Button>
      <OverrideSubscriptionDialog
        open={open}
        business={business}
        onClose={() => setOpen(false)}
        onSaved={() => router.refresh()}
      />
    </>
  );
}
