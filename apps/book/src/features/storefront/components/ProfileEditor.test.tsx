import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'vitest-axe';
import { beforeEach, describe, expect, it } from 'vitest';
import { FoundlyThemeProvider } from '@foundly/ui';
import type { Tenant } from '../../../domain/tenancy/types';
import { resetStore } from '../../../server/store';
import { getPublicBusiness } from '../../public-booking/queries';
import { ProfileEditor } from './ProfileEditor';

function makeTenant(): Tenant {
  return {
    id: 'ten-ana',
    name: 'Estudio Ana',
    slug: 'estudio-ana',
    category: 'Peluquería',
    status: 'active',
    ownerUserId: 'u-owner-ana',
    defaultAppointmentDurationMinutes: 30,
    businessHours: [1, 2, 3, 4, 5, 6].map((weekday) => ({
      weekday,
      isOpen: true,
      startTime: '09:00',
      endTime: '18:00',
    })),
    currency: 'EUR',
    timezone: 'Europe/Madrid',
    onlineBookingEnabled: true,
    license: null,
    avatar: null,
    cover: null,
    bio: 'Estudio de referencia en Madrid.',
    address: 'Calle Mayor 7, 28013 Madrid',
    phone: '+34 612 345 678',
    social: { instagram: 'https://instagram.com/estudioana' },
    createdAt: '2026-10-08T00:00:00.000Z',
    updatedAt: '2026-10-08T00:00:00.000Z',
  };
}

describe('ProfileEditor (admin Perfil, US4 storefront)', () => {
  beforeEach(() => {
    resetStore();
  });

  it('renders the identity and contact form prefilled', async () => {
    const { container } = render(
      <FoundlyThemeProvider>
        <ProfileEditor profile={makeTenant()} />
      </FoundlyThemeProvider>,
    );

    expect(screen.getByText('Perfil y Acerca de')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Guardar perfil' })).toBeInTheDocument();
    expect(screen.getByLabelText('Nombre del negocio')).toHaveValue('Estudio Ana');
    expect(screen.getByLabelText('Teléfono')).toHaveValue('+34 612 345 678');
    expect(screen.getByLabelText('Instagram')).toHaveValue('https://instagram.com/estudioana');

    const results = await axe(container, { rules: { 'color-contrast': { enabled: false } } });
    expect(results.violations).toHaveLength(0);
  });

  it('saves the profile and reflects it in the public portal query', async () => {
    const user = userEvent.setup();
    render(
      <FoundlyThemeProvider>
        <ProfileEditor profile={makeTenant()} />
      </FoundlyThemeProvider>,
    );

    const name = screen.getByLabelText('Nombre del negocio');
    await user.clear(name);
    await user.type(name, 'Estudio Ana Beauty');
    await user.click(screen.getByRole('button', { name: 'Guardar perfil' }));

    expect(screen.getByText('Guardado')).toBeInTheDocument();
    const portal = getPublicBusiness('estudio-ana');
    expect(portal.status).toBe('available');
    if (portal.status === 'available') {
      expect(portal.business.name).toBe('Estudio Ana Beauty');
    }
  });
});