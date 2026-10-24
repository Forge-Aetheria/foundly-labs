import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'vitest-axe';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FoundlyThemeProvider } from '@foundly/ui';
import type { Tenant } from '../../../shared/types/tenancy';
import { ToastProvider } from '../../../shared/components/Toaster';
import { ProfileEditor } from '../components/ProfileEditor';
import { checkImage } from '../utils/image-rules';

const { updateMock, uploadMock } = vi.hoisted(() => ({
  updateMock: vi.fn(),
  uploadMock: vi.fn(),
}));

vi.mock('../hooks', () => ({
  useUpdateProfile: () => updateMock,
  useUploadProfileImage: () => uploadMock,
}));
vi.mock('../utils/image-rules', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../utils/image-rules')>();
  return { ...actual, checkImage: vi.fn() };
});

function makeTenant(): Tenant {
  return {
    id: 'ten-ana',
    name: 'Estudio Ana',
    slug: 'estudio-ana',
    category: 'BARBERIAS_PELUQUERIAS',
    tags: ['Corte', 'Color'],
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
    isPublic: true,
    license: null,
    avatar: null,
    cover: null,
    bio: 'Estudio de referencia en Madrid.',
    address: 'Calle Mayor 7, 28013 Madrid',
    phone: '+34 612 345 678',
    social: { instagram: 'https://instagram.com/estudioana' },
    policies: [
      { id: 'policy-0', tenantId: 'ten-ana', title: 'Cancelación', body: 'Avisa con 24 h.' },
    ],
    createdAt: '2026-10-08T00:00:00.000Z',
    updatedAt: '2026-10-08T00:00:00.000Z',
  };
}

function renderEditor(profile: Tenant | null = makeTenant(), error: string | null = null) {
  return render(
    <FoundlyThemeProvider>
      <ToastProvider>
        <ProfileEditor profile={profile} error={error} />
      </ToastProvider>
    </FoundlyThemeProvider>,
  );
}

describe('ProfileEditor (admin Perfil, feature 014)', () => {
  beforeEach(() => {
    updateMock.mockReset();
    uploadMock.mockReset();
    vi.mocked(checkImage).mockReset();
    vi.mocked(checkImage).mockResolvedValue({ ok: true, measured: false });
  });

  it('renders the editable profile with current values, policies and hours', async () => {
    const { container } = renderEditor();

    expect(screen.getByText('Perfil y Acerca de')).toBeInTheDocument();
    expect(screen.getByLabelText(/Nombre del negocio/)).toHaveValue('Estudio Ana');
    expect(screen.getByLabelText(/URL pública/)).toHaveValue('estudio-ana');
    expect(screen.getByLabelText(/Teléfono/)).toHaveValue('+34 612 345 678');
    expect(screen.getByLabelText(/Instagram/)).toHaveValue('https://instagram.com/estudioana');
    expect(screen.getByRole('button', { name: 'Guardar perfil' })).toBeInTheDocument();
    // Existing policy rendered.
    expect(screen.getByDisplayValue('Cancelación')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Avisa con 24 h.')).toBeInTheDocument();

    const results = await axe(container, { rules: { 'color-contrast': { enabled: false } } });
    expect(results.violations).toHaveLength(0);
  });

  it('saves the edited profile through the hook', async () => {
    updateMock.mockResolvedValue({ ok: true, data: makeTenant() });
    const user = userEvent.setup();
    renderEditor();

    const nameField = screen.getByLabelText(/Nombre del negocio/);
    await user.clear(nameField);
    await user.type(nameField, 'Estudio Ana Renovado');
    await user.click(screen.getByRole('button', { name: 'Guardar perfil' }));

    expect(updateMock).toHaveBeenCalledTimes(1);
    const arg = updateMock.mock.calls[0]![0] as { name: string; policies: unknown[] };
    expect(arg.name).toBe('Estudio Ana Renovado');
    expect(arg.policies).toHaveLength(1);
    expect(await screen.findByText('Perfil guardado.')).toBeInTheDocument();
  });

  it('submits the selected master category and tag chips', async () => {
    updateMock.mockResolvedValue({ ok: true, data: makeTenant() });
    const user = userEvent.setup();
    renderEditor();

    await user.click(screen.getByRole('combobox', { name: /Categoría/ }));
    await user.click(screen.getByRole('option', { name: 'Salud y Bienestar' }));
    await user.type(screen.getByLabelText('Etiquetas'), 'masaje{Enter}');
    await user.click(screen.getByRole('button', { name: 'Guardar perfil' }));

    expect(updateMock).toHaveBeenCalledTimes(1);
    const arg = updateMock.mock.calls[0]![0] as { category: string; tags: string[] };
    expect(arg.category).toBe('SALUD_BIENESTAR');
    expect(arg.tags).toEqual(['Corte', 'Color', 'Masaje']);
  });

  it('surfaces an inline field error returned by the save action', async () => {
    updateMock.mockResolvedValue({
      ok: false,
      error: {
        code: 'CONFLICT',
        message: 'Esa URL pública ya está en uso.',
        fields: { slug: 'Esa URL pública ya está en uso.' },
      },
    });
    const user = userEvent.setup();
    renderEditor();

    await user.click(screen.getByRole('button', { name: 'Guardar perfil' }));

    expect(await screen.findByText('Esa URL pública ya está en uso.')).toBeInTheDocument();
  });

  it('uploads a logo and includes the resulting URL in the submission (feature 021)', async () => {
    updateMock.mockResolvedValue({ ok: true, data: makeTenant() });
    uploadMock.mockResolvedValue({ ok: true, data: { url: 'https://cdn.test/logo.png' } });
    const user = userEvent.setup();
    renderEditor();

    fireEvent.change(screen.getByLabelText('Subir Logo'), {
      target: { files: [new File([new Uint8Array(8)], 'logo.png', { type: 'image/png' })] },
    });
    await waitFor(() =>
      expect(screen.getByLabelText('Logo (URL)')).toHaveValue('https://cdn.test/logo.png'),
    );
    await user.click(screen.getByRole('button', { name: 'Guardar perfil' }));

    expect(updateMock).toHaveBeenCalledTimes(1);
    const arg = updateMock.mock.calls[0]![0] as { logo: string | null };
    expect(arg.logo).toBe('https://cdn.test/logo.png');
  });

  it('adds a policy to the submission', async () => {
    updateMock.mockResolvedValue({ ok: true, data: makeTenant() });
    const user = userEvent.setup();
    renderEditor();

    await user.click(screen.getByRole('button', { name: '+ Añadir política' }));
    fireEvent.change(screen.getByLabelText(/Título · política 2/), {
      target: { value: 'Depósito' },
    });
    fireEvent.change(screen.getAllByLabelText(/Contenido/)[1]!, {
      target: { value: 'Se pide un depósito.' },
    });
    await user.click(screen.getByRole('button', { name: 'Guardar perfil' }));

    const arg = updateMock.mock.calls[0]![0] as { policies: { title: string }[] };
    expect(arg.policies).toHaveLength(2);
    expect(arg.policies[1]?.title).toBe('Depósito');
  });

  it('shows a clean error dialog when the profile cannot be loaded', () => {
    renderEditor(null, 'No se pudo cargar el perfil.');
    expect(screen.getByRole('dialog')).toHaveTextContent('No se pudo cargar el perfil.');
  });

  it('toggles the public page visibility and persists it (isPublic)', async () => {
    updateMock.mockResolvedValue({ ok: true, data: makeTenant() });
    const user = userEvent.setup();
    renderEditor();

    const toggle = screen.getByLabelText('Habilitar la página pública');
    await user.click(toggle);
    await user.click(screen.getByRole('button', { name: 'Guardar perfil' }));

    const arg = updateMock.mock.calls[0]![0] as { isPublic: boolean };
    expect(arg.isPublic).toBe(false);
  });

  it('blocks saving when a measured image violates its rule', async () => {
    vi.mocked(checkImage).mockResolvedValueOnce({
      ok: false,
      message: 'La imagen debe ser cuadrada (1:1). Se recomienda 512×512px.',
    });
    const user = userEvent.setup();
    renderEditor();

    await user.click(screen.getByRole('button', { name: 'Guardar perfil' }));

    expect(await screen.findByText(/La imagen debe ser cuadrada \(1:1\)/)).toBeInTheDocument();
    expect(updateMock).not.toHaveBeenCalled();
  });
});
