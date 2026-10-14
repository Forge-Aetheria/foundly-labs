import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import { getEffectiveSession } from '../../shared/auth/authServer';
import { LOGIN_ROUTE } from '../../shared/auth/authConstants';

/**
 * Super Admin console guard (feature 020): anonymous visitors are sent to sign-in; the
 * platform-role check is enforced by the API and surfaced as an access-denied state.
 */
export default async function SuperAdminLayout({ children }: { children: ReactNode }) {
  const session = await getEffectiveSession();
  if (!session) {
    redirect(LOGIN_ROUTE);
  }
  return <>{children}</>;
}
