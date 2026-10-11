import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FoundlyThemeProvider } from '@foundly/ui';
import type { PublicService, PublicSpecialist } from '../utils/types';
import { BookingFlow } from '../dialogs/BookingFlow';

type BookResult =
  { ok: true; data: { id: string } } | { ok: false; error: { code: string; message: string } };

const { fetchSlotsMock, bookMock } = vi.hoisted(() => ({
  fetchSlotsMock: vi.fn(async ({ startDate }: { startDate: string }) => [
    {
      date: startDate,
      slots: [{ startAt: `${startDate}T07:00:00.000Z`, endAt: `${startDate}T07:30:00.000Z` }],
    },
  ]),
  bookMock: vi.fn(async (): Promise<BookResult> => ({ ok: true, data: { id: 'a-online-1' } })),
}));

vi.mock('../utils/actions', () => ({
  fetchOfferedSlots: fetchSlotsMock,
  bookPublicAppointment: bookMock,
}));

const service: PublicService = {
  id: 'svc-corte',
  name: 'Corte de cabello',
  description: null,
  durationMinutes: 30,
  priceCents: 2000,
  currency: 'EUR',
};

const specialists: PublicSpecialist[] = [
  { id: 'res-ana', name: 'Ana', role: 'Peluquera senior', avatar: null, bio: null },
  { id: 'res-luis', name: 'Luis', role: 'Barbero', avatar: null, bio: null },
];

describe('BookingFlow (FR-009…FR-015, contracts/booking-flow.contract.md)', () => {
  beforeEach(() => {
    fetchSlotsMock.mockClear();
    bookMock.mockClear();
  });

  it('walks specialist → slot → client data → confirmation', async () => {
    const user = userEvent.setup();
    render(
      <FoundlyThemeProvider>
        <BookingFlow
          service={service}
          tenantSlug="estudio-ana"
          specialists={specialists}
          onClose={() => {}}
        />
      </FoundlyThemeProvider>,
    );

    // Step 1 — specialist (2 active)
    await user.click(screen.getByRole('button', { name: 'Ana' }));
    await user.click(screen.getByRole('button', { name: 'Continuar' }));

    // Step 2 — slot
    const slot = await screen.findByRole('button', { name: '07:00' });
    await user.click(slot);
    await user.click(screen.getByRole('button', { name: 'Continuar' }));

    // Step 3 — client data
    await user.type(screen.getByLabelText(/Nombre/), 'Luis');
    await user.type(screen.getByLabelText(/Email/), 'luis@mail.dev');
    await user.type(screen.getByLabelText(/Teléfono/), '+34600123456');
    await user.click(screen.getByRole('button', { name: 'Continuar' }));

    // Step 4 — confirmation summary
    expect(screen.getByText('Corte de cabello')).toBeInTheDocument();
    expect(screen.getByText(/Con Ana$/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Confirmar cita' }));

    await waitFor(() =>
      expect(bookMock).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantSlug: 'estudio-ana',
          serviceId: 'svc-corte',
          resourceId: 'res-ana',
          clientName: 'Luis',
          clientEmail: 'luis@mail.dev',
          clientPhone: '+34600123456',
        }),
      ),
    );
    expect(await screen.findByText(/cita solicitada/i)).toBeInTheDocument();
  });

  it('skips the specialist step when there is a single specialist', async () => {
    const user = userEvent.setup();
    render(
      <FoundlyThemeProvider>
        <BookingFlow
          service={service}
          tenantSlug="estudio-ana"
          specialists={[specialists[0]!]}
          onClose={() => {}}
        />
      </FoundlyThemeProvider>,
    );

    expect(screen.queryByRole('button', { name: 'Luis' })).not.toBeInTheDocument();
    const slot = await screen.findByRole('button', { name: '07:00' });
    await user.click(slot);
    await user.click(screen.getByRole('button', { name: 'Continuar' }));
    expect(screen.getByLabelText(/Nombre/)).toBeInTheDocument();
  });

  it('keeps the entered client data when going back', async () => {
    const user = userEvent.setup();
    render(
      <FoundlyThemeProvider>
        <BookingFlow
          service={service}
          tenantSlug="estudio-ana"
          specialists={specialists}
          onClose={() => {}}
        />
      </FoundlyThemeProvider>,
    );

    await user.click(screen.getByRole('button', { name: 'Ana' }));
    await user.click(screen.getByRole('button', { name: 'Continuar' }));
    const slot = await screen.findByRole('button', { name: '07:00' });
    await user.click(slot);
    await user.click(screen.getByRole('button', { name: 'Continuar' }));

    await user.type(screen.getByLabelText(/Nombre/), 'Luis');
    await user.type(screen.getByLabelText(/Email/), 'luis@mail.dev');
    await user.type(screen.getByLabelText(/Teléfono/), '+34600123456');
    await user.click(screen.getByRole('button', { name: 'Continuar' }));

    await user.click(screen.getByRole('button', { name: 'Atrás' }));
    const nameField = screen.getByLabelText(/Nombre/);
    expect(nameField).toHaveValue('Luis');
    expect(screen.getByLabelText(/Email/)).toHaveValue('luis@mail.dev');
  });

  it('surfaces a CONFLICT and keeps the client data (FR-014/FR-015)', async () => {
    bookMock.mockResolvedValueOnce({
      ok: false,
      error: { code: 'CONFLICT', message: 'Ese hueco ya está ocupado.' },
    });
    const user = userEvent.setup();
    render(
      <FoundlyThemeProvider>
        <BookingFlow
          service={service}
          tenantSlug="estudio-ana"
          specialists={specialists}
          onClose={() => {}}
        />
      </FoundlyThemeProvider>,
    );

    await user.click(screen.getByRole('button', { name: 'Ana' }));
    await user.click(screen.getByRole('button', { name: 'Continuar' }));
    const slot = await screen.findByRole('button', { name: '07:00' });
    await user.click(slot);
    await user.click(screen.getByRole('button', { name: 'Continuar' }));

    await user.type(screen.getByLabelText(/Nombre/), 'Luis');
    await user.type(screen.getByLabelText(/Email/), 'luis@mail.dev');
    await user.type(screen.getByLabelText(/Teléfono/), '+34600123456');
    await user.click(screen.getByRole('button', { name: 'Continuar' }));

    await user.click(screen.getByRole('button', { name: 'Confirmar cita' }));
    expect(await screen.findByText(/ocupado/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Atrás' }));
    expect(screen.getByLabelText(/Nombre/)).toHaveValue('Luis');
  });
});
