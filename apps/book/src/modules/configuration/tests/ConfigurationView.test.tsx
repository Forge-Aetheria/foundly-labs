import { describe, expect, it } from 'vitest';
import { CONFIG_TABS, parseConfigurationTab } from '../ConfigurationView';

describe('ConfigurationView tabs', () => {
  it('includes the subscription tab', () => {
    expect(CONFIG_TABS).toContain('suscripcion');
  });

  it('parses the subscription tab from the URL', () => {
    expect(parseConfigurationTab('suscripcion')).toBe('suscripcion');
    expect(parseConfigurationTab('unknown')).toBe('perfil');
    expect(parseConfigurationTab(null)).toBe('perfil');
  });
});
