export type SessionStatus = 'loading' | 'anonymous' | 'authenticated' | 'missing-tenant';

export const LOGIN_ROUTE = '/(auth)/login';
export const TABS_ROUTE = '/(tabs)';

export function resolveEntryRedirect(status: SessionStatus): string | null {
  if (status === 'authenticated') return TABS_ROUTE;
  if (status === 'anonymous' || status === 'missing-tenant') return LOGIN_ROUTE;
  return null;
}

export function shouldShowTabs(status: SessionStatus): boolean {
  return status === 'authenticated';
}

export function shouldRedirectAwayFromLogin(status: SessionStatus): boolean {
  return status === 'authenticated';
}
