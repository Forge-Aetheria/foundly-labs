import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'vitest-axe';
import { beforeEach, describe, expect, it } from 'vitest';
import { FoundlyThemeProvider } from '@foundly/ui';
import type { PortalPolicy, Tenant } from '../../../domain/tenancy/types';
import { getStore, resetStore } from '../../../server/store';
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

function renderEditor(policies: PortalPolicy[] = []) {
  return render(
    <FoundlyThemeProvider>
      <ProfileEditor profile={makeTenant()} policies={policies} />
    </FoundlyThemeProvider>,
  );
}

describe('ProfileEditor (admin Perfil y Acerca de, 007-business-profile)', () => {
  beforeEach(() => {
    resetStore();
  });

  it('renders identity, contact, hours summary and actions prefilled', async () => {
    const { container } = renderEditor();

    expect(screen.getByText('Perfil y Acerca de')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Guardar perfil' })).toBeInTheDocument();
    expect(screen.getByLabelText('Nombre del negocio')).toHaveValue('Estudio Ana');
    expect(screen.getByLabelText('Categoría')).toHaveValue('Peluquería');
    expect(screen.getByLabelText('URL pública')).toHaveValue('estudio-ana');
    expect(screen.getByLabelText('Teléfono')).toHaveValue('+34 612 345 678');
    expect(screen.getByLabelText('Instagram')).toHaveValue('https://instagram.com/estudioana');
    // Hours summary from availability: Mon–Sat open, Sunday closed.
    expect(screen.getByText('Domingo')).toBeInTheDocument();
    expect(screen.getAllByText('Cerrado').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('09:00 – 18:00').length).toBeGreaterThanOrEqual(1);
    // Policies empty state + add entry point.
    expect(screen.getByText(/Todavía no hay políticas/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '+ Añadir política' })).toBeInTheDocument();

    const results = await axe(container, { rules: { 'color-contrast': { enabled: false } } });
    expect(results.violations).toHaveLength(0);
  });

  it('shows a live logo preview when a URL is entered', async () => {
    const user = userEvent.setup();
    renderEditor();

    const logo = screen.getByLabelText('Logo (URL)');
    await user.type(logo, 'https://example.com/logo.png');
    expect(screen.getByAltText('Vista previa del logo')).toHaveAttribute(
      'src',
      'https://example.com/logo.png',
    );
  });

  it('blocks saving with an invalid/taken public URL', async () => {
    const user = userEvent.setup();
    renderEditor();

    const slug = screen.getByLabelText('URL pública');
    await user.clear(slug);
    await user.type(slug, 'admin');
    await user.click(screen.getByRole('button', { name: 'Guardar perfil' }));

    expect(screen.getByText('Esa URL está reservada.')).toBeInTheDocument();
    expect(screen.queryByText('Guardado')).not.toBeInTheDocument();
  });

  it('saves the profile (identity + policies) and reflects it on the public portal', async () => {
    const user = userEvent.setup();
    renderEditor();

    const name = screen.getByLabelText('Nombre del negocio');
    await user.clear(name);
    await user.type(name, 'Estudio Ana Beauty');

    await user.click(screen.getByRole('button', { name: '+ Añadir política' }));
    await user.type(screen.getByLabelText('Política 1 · Título'), 'Cancelación');
    await user.type(screen.getByLabelText('Política 1 · Descripción'), 'Cancela gratis hasta 24 h.');

    await user.click(screen.getByRole('button', { name: 'Guardar perfil' }));

    expect(screen.getByText('Guardado')).toBeInTheDocument();
    const portal = getPublicBusiness('estudio-ana');
    expect(portal.status).toBe('available');
    if (portal.status === 'available') {
      expect(portal.business.name).toBe('Estudio Ana Beauty');
      expect(portal.business.policies.map((p) => p.title)).toEqual(['Cancelación']);
    }
  });

  it('adds and removes a policy row', async () => {
    const user = userEvent.setup();
    renderEditor();

    await user.click(screen.getByRole('button', { name: '+ Añadir política' }));
    expect(screen.getByLabelText('Política 1 · Título')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Quitar' }));
    expect(screen.queryByLabelText('Política 1 · Título')).not.toBeInTheDocument();
    expect(screen.getByText(/Todavía no hay políticas/)).toBeInTheDocument();
  });

  it('prefills existing policies passed as props', () => {
    const seedPolicies: PortalPolicy[] = [
      { id: 'pol-1', tenantId: 'ten-ana', title: 'Cancelación', body: '24 h' },
    ];
    // Re-seed the store so the tenant has that policy too.
    const store = getStore();
    const existing = store.portalPolicies.filter((p) => p.tenantId !== 'ten-ana');
    store.portalPolicies = [...existing, seedPolicies[0]!];

    renderEditor(getStore().portalPolicies.filter((p) => p.tenantId === 'ten-ana'));
    expect(screen.getByLabelText('Política 1 · Título')).toHaveValue('Cancelación');
    expect(screen.getByLabelText('Política 1 · Descripción')).toHaveValue('24 h');
  });
});