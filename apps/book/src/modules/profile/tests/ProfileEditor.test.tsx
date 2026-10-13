import { render, screen } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { describe, expect, it } from 'vitest';
import { FoundlyThemeProvider } from '@foundly/ui';
import type { Tenant } from '../../../shared/types/tenancy';
import { ProfileEditor } from '../components/ProfileEditor';

function makeTenant(): Tenant {
  return {
    id: 'ten-ana',
    name: 'Estudio Ana',
    slug: 'estudio-ana',
    category: 'Peluquería',
    status: 'active',
    ownerUserId: 'u-owner-ana',
    defaultAppointmentDurationMinutes: 30,
    businessHours: [0, 1, 2, 3, 4, 5, 6].map((weekday) =>
      weekday === 0
        ? { weekday, isOpen: false, startTime: '', endTime: '' }
        : { weekday, isOpen: true, startTime: '09:00', endTime: '18:00' },
    ),
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

describe('ProfileEditor (admin Perfil y Acerca de, 007 — feature 010 read-only)', () => {
  it('renders the API profile read-only with an empty policies state', async () => {
    const { container } = render(
      <FoundlyThemeProvider>
        <ProfileEditor profile={makeTenant()} policies={[]} />
      </FoundlyThemeProvider>,
    );

    expect(screen.getByText('Perfil y Acerca de')).toBeInTheDocument();
    expect(screen.getByText('Solo lectura')).toBeInTheDocument();
    expect(screen.getByText('Estudio Ana')).toBeInTheDocument();
    expect(screen.getByText('Peluquería')).toBeInTheDocument();
    expect(screen.getByText('/book/estudio-ana')).toBeInTheDocument();
    expect(screen.getByText('+34 612 345 678')).toBeInTheDocument();
    expect(screen.getByText('Estudio de referencia en Madrid.')).toBeInTheDocument();

    // Policies have no backend: clean empty state, no mocked rows.
    expect(
      screen.getByText(
        'Todavía no hay políticas: esta sección aún no tiene soporte en el backend.',
      ),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText('Política 1 · Título')).not.toBeInTheDocument();

    // Editing is not available (no API mutation).
    expect(screen.queryByRole('button', { name: 'Guardar perfil' })).not.toBeInTheDocument();

    const results = await axe(container, { rules: { 'color-contrast': { enabled: false } } });
    expect(results.violations).toHaveLength(0);
  });

  it('surfaces a clean error when the profile cannot be loaded', () => {
    render(
      <FoundlyThemeProvider>
        <ProfileEditor profile={null} policies={[]} error="No se pudo cargar el perfil." />
      </FoundlyThemeProvider>,
    );

    expect(screen.getByRole('dialog')).toHaveTextContent('No se pudo cargar el perfil.');
    expect(screen.getByText('Horario no disponible todavía.')).toBeInTheDocument();
  });
});