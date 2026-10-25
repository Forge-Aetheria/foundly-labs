import { Linking } from 'react-native';
import { openExternalLink } from '../open-external-link';

describe('openExternalLink', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('opens https and mailto links', async () => {
    const spy = jest.spyOn(Linking, 'openURL').mockResolvedValue(true as never);

    await expect(openExternalLink('https://foundlylabs.com')).resolves.toEqual({ ok: true });
    await expect(openExternalLink('mailto:soporte@foundlylabs.com')).resolves.toEqual({
      ok: true,
    });
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it('rejects unsupported schemes', async () => {
    const spy = jest.spyOn(Linking, 'openURL');
    spy.mockClear();
    await expect(openExternalLink('ftp://example.com')).resolves.toMatchObject({ ok: false });
    await expect(openExternalLink('javascript:alert(1)')).resolves.toMatchObject({ ok: false });
    expect(spy).not.toHaveBeenCalled();
  });

  it('maps platform failures to a user-facing result', async () => {
    jest.spyOn(Linking, 'openURL').mockRejectedValue(new Error('no handler'));
    await expect(openExternalLink('https://foundlylabs.com')).resolves.toMatchObject({
      ok: false,
      message: expect.stringContaining('No pudimos abrir'),
    });
  });
});
