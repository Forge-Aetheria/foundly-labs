'use client';

import { useEffect, useState } from 'react';
import { listMyReviews } from './actions';
import { ReviewModerationList } from './components/ReviewModerationList';
import { ModuleSkeleton } from '../../shared/components/ModuleSkeleton';
import type { AdminResourceState } from '../../shared/hooks/useAdminResource';
import type { Review } from '../../shared/types/tenancy';

/** Reviews moderation view (client): loaded after mount. */
export function ModerationView() {
  const [state, setState] = useState<AdminResourceState<Review[]>>({ status: 'loading' });

  useEffect(() => {
    let active = true;
    listMyReviews()
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
          message: error instanceof Error ? error.message : 'No pudimos cargar las reseñas.',
        });
      });

    return () => {
      active = false;
    };
  }, []);

  if (state.status === 'loading') {
    return <ModuleSkeleton />;
  }

  return (
    <ReviewModerationList
      reviews={state.status === 'ready' ? state.data : []}
      error={state.status === 'error' ? state.message : null}
    />
  );
}
