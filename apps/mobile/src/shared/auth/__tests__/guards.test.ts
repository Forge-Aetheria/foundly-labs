import {
  resolveEntryRedirect,
  shouldRedirectAwayFromLogin,
  shouldShowTabs,
  LOGIN_ROUTE,
  TABS_ROUTE,
} from '../guards';

describe('auth guards', () => {
  it('sends anonymous sessions to login', () => {
    expect(resolveEntryRedirect('anonymous')).toBe(LOGIN_ROUTE);
    expect(shouldShowTabs('anonymous')).toBe(false);
  });

  it('sends tenant-bound sessions to tabs', () => {
    expect(resolveEntryRedirect('authenticated')).toBe(TABS_ROUTE);
    expect(shouldShowTabs('authenticated')).toBe(true);
  });

  it('sends sessions without tenant to login', () => {
    expect(resolveEntryRedirect('missing-tenant')).toBe(LOGIN_ROUTE);
    expect(shouldRedirectAwayFromLogin('missing-tenant')).toBe(false);
  });

  it('does not redirect away from login when anonymous', () => {
    expect(shouldRedirectAwayFromLogin('anonymous')).toBe(false);
  });

  it('keeps loading neutral', () => {
    expect(resolveEntryRedirect('loading')).toBeNull();
  });
});
