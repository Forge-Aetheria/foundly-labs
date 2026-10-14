import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FoundlyThemeProvider } from '@foundly/ui';
import type { PublicService, PublicSpecialist } from '../utils/types';
import { BookingFlow } from '../dialogs/BookingFlow';

type BookResult =
  { ok: true; data: { id: string } } | { ok: false; error: { code: string; message: string } };

const { fetchSlotsMock, bookMock, methodsMock, uploadMock } = vi.hoisted(() => ({
  fetchSlotsMock: vi.fn(async ({ startDate, endDate }: { startDate: string; endDate: string }) => {
    const days: string[] = [];
    const start = new Date(`${startDate}T00:00:00Z`);
    const end = new Date(`${endDate}T00:00:00Z`);
    for (let cursor = new Date(start); cursor <= end; cursor.setUTCDate(cursor.getUTCDate() + 1)) {
      days.push(cursor.toISOString().slice(0, 10));
    }
    const today = new Date().toISOString().slice(0, 10);
    return days
      .filter((date) => date >= today)
      .map((date) => ({
        date,
        slots: [{ startAt: `${date}T07:00:00.000Z`, endAt: `${date}T07:30:00.000Z` }],
      }));
  }),
  bookMock: vi.fn(async (): Promise<BookResult> => ({ ok: true, data: { id: 'a-online-1' } })),
  methodsMock: vi.fn(async () => ({
    ok: true,
    data: [
      {
        id: 'pm1',
        tenantId: 'ten-ana',
        type: 'pago_movil',
        title: 'Pago Móvil',
        details: JSON.stringify({ bank: 'Banco X', phone: '0414' }),
        instructions: null,
        active: true,
      },
    ],
  })),
  uploadMock: vi.fn(async () => ({ ok: true, data: { url: 'https://x.test/proof.png' } })),
}));

vi.mock('../hooks', () => ({
  useFetchOfferedSlots: () => fetchSlotsMock,
  useBookAppointment: () => bookMock,
  useFetchPublicPaymentMethods: () => methodsMock,
  useUploadPaymentProof: () => uploadMock,
}));

const service: PublicService = {
  id: 'svc-corte',
  name: 'Corte de cabello',
  description: null,
  durationMinutes: 30,
  priceCents: 2000,
  currency: 'EUR',
  requiresAdvance: false,
  advanceKind: null,
  advanceValue: null,
};

const advanceService: PublicService = {
  ...service,
  requiresAdvance: true,
  advanceKind: 'percent',
  advanceValue: 50,
};

const specialists: PublicSpecialist[] = [
  { id: 'res-ana', name: 'Ana', role: 'Peluquera senior', avatar: null, bio: null },
  { id: 'res-luis', name: 'Luis', role: 'Barbero', avatar: null, bio: null },
];

async function pickSlot(user: ReturnType<typeof userEvent.setup>) {
  const day = (await screen.findAllByRole('button', { name: /con huecos disponibles/ }))[0]!;
  await user.click(day);
  const slot = await screen.findByRole('button', { name: '07:00' });
  await user.click(slot);
  await user.click(screen.getByRole('button', { name: 'Continuar' }));
}

describe('BookingFlow (FR-009…FR-015 + advance 017)', () => {
  beforeEach(() => {
    fetchSlotsMock.mockClear();
    bookMock.mockClear();
    methodsMock.mockClear();
    uploadMock.mockClear();
    bookMock.mockResolvedValue({ ok: true, data: { id: 'a-online-1' } });
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

    await user.click(screen.getByRole('button', { name: 'Ana' }));
    await user.click(screen.getByRole('button', { name: 'Continuar' }));
    await pickSlot(user);

    await user.type(screen.getByLabelText(/Nombre/), 'Luis');
    await user.type(screen.getByLabelText(/Email/), 'luis@mail.dev');
    await user.type(screen.getByLabelText(/Teléfono/), '+34600123456');
    await user.click(screen.getByRole('button', { name: 'Continuar' }));

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

  it('inserts the mandatory advance step only when the service requires it', async () => {
    const user = userEvent.setup();
    render(
      <FoundlyThemeProvider>
        <BookingFlow
          service={advanceService}
          tenantSlug="estudio-ana"
          specialists={specialists}
          onClose={() => {}}
        />
      </FoundlyThemeProvider>,
    );

    await user.click(screen.getByRole('button', { name: 'Ana' }));
    await user.click(screen.getByRole('button', { name: 'Continuar' }));
    await pickSlot(user);

    await user.type(screen.getByLabelText(/Nombre/), 'Luis');
    await user.type(screen.getByLabelText(/Email/), 'luis@mail.dev');
    await user.type(screen.getByLabelText(/Teléfono/), '+34600123456');
    await user.click(screen.getByRole('button', { name: 'Continuar' }));

    // Advance step
    expect(screen.getByText(/Adelanto requerido/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Pago Móvil' }));
    fireEvent.change(screen.getByLabelText(/Número de referencia/), { target: { value: 'REF-1' } });
    const file = new File(['proof'], 'proof.png', { type: 'image/png' });
    fireEvent.change(screen.getByLabelText('Comprobante de pago'), { target: { files: [file] } });
    await screen.findByText('Comprobante adjunto');
    await user.click(screen.getByRole('button', { name: 'Continuar' }));

    await user.click(screen.getByRole('button', { name: 'Confirmar cita' }));
    await waitFor(() =>
      expect(bookMock).toHaveBeenCalledWith(
        expect.objectContaining({
          paymentMethodType: 'pago_movil',
          advanceAmountCents: 1000,
          paymentReference: 'REF-1',
          paymentProofUrl: 'https://x.test/proof.png',
        }),
      ),
    );
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
    await pickSlot(user);
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
    await pickSlot(user);

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
    await pickSlot(user);

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
