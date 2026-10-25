export type SessionStatus = 'loading' | 'anonymous' | 'authenticated' | 'missing-tenant';

export const LOGIN_ROUTE = '/(auth)/login';
export const DRAWER_HOME_ROUTE = '/agenda';

export function resolveEntryRedirect(status: SessionStatus): string | null {
  if (status === 'authenticated') return DRAWER_HOME_ROUTE;
  if (status === 'anonymous' || status === 'missing-tenant') return LOGIN_ROUTE;
  return null;
}

export function shouldShowDrawer(status: SessionStatus): boolean {
  return status === 'authenticated';
}

export function shouldRedirectAwayFromLogin(status: SessionStatus): boolean {
  return status === 'authenticated';
}
