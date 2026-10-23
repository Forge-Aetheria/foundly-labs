'use client';

import { useEffect, useState } from 'react';
import { listPaymentMethods } from './actions';
import { PaymentsConfig } from './components/PaymentsConfig';
import { ModuleSkeleton } from '../../shared/components/ModuleSkeleton';
import type { AdminResourceState } from '../../shared/hooks/useAdminResource';
import type { PaymentMethod } from '../../shared/types/payments';

/** Payments tab (client): payment methods loaded after mount. */
export function PaymentsView({ embedded = false }: { embedded?: boolean }) {
  const [state, setState] = useState<AdminResourceState<PaymentMethod[]>>({ status: 'loading' });

  useEffect(() => {
    let active = true;
    listPaymentMethods()
      .then((result) => {
        if (!active) {
          return;
        }
        setState(
          result.ok
            ? { status: 'ready', data: result.data }
            : { status: 'error', message: result.error.message },
        );
      })
      .catch((error: unknown) => {
        if (!active) {
          return;
        }
        setState({
          status: 'error',
          message:
            error instanceof Error ? error.message : 'No pudimos cargar los métodos de pago.',
        });
      });

    return () => {
      active = false;
    };
  }, []);

  if (state.status === 'loading') {
    return <ModuleSkeleton rows={3} />;
  }

  return (
    <PaymentsConfig
      methods={state.status === 'ready' ? state.data : []}
      error={state.status === 'error' ? state.message : null}
      embedded={embedded}
    />
  );
}
