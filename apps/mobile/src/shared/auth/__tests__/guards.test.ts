import {
  resolveEntryRedirect,
  shouldRedirectAwayFromLogin,
  shouldShowDrawer,
  DRAWER_HOME_ROUTE,
  LOGIN_ROUTE,
} from '../guards';

describe('auth guards', () => {
  it('sends anonymous sessions to login', () => {
    expect(resolveEntryRedirect('anonymous')).toBe(LOGIN_ROUTE);
    expect(shouldShowDrawer('anonymous')).toBe(false);
  });

  it('sends tenant-bound sessions to the drawer home', () => {
    expect(resolveEntryRedirect('authenticated')).toBe(DRAWER_HOME_ROUTE);
    expect(shouldShowDrawer('authenticated')).toBe(true);
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
