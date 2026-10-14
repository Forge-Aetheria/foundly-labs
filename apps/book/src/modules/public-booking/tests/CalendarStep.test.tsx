import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FoundlyThemeProvider } from '@foundly/ui';
import { CalendarStep } from '../dialogs/CalendarStep';

const { fetchMock } = vi.hoisted(() => ({ fetchMock: vi.fn() }));

vi.mock('../hooks', () => ({ useFetchOfferedSlots: () => fetchMock }));

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

describe('CalendarStep (feature 017, US2)', () => {
  beforeEach(() => {
    fetchMock.mockReset();
    fetchMock.mockImplementation(async ({ startDate, endDate }: { startDate: string; endDate: string }) => {
      const today = todayKey();
      const day = startDate > today ? startDate : today <= endDate ? today : startDate;
      return [
        {
          date: day,
          slots: [{ startAt: `${day}T07:00:00.000Z`, endAt: `${day}T07:30:00.000Z` }],
        },
      ];
    });
  });

  function renderCalendar(onSelect = vi.fn()) {
    render(
      <FoundlyThemeProvider>
        <CalendarStep
          tenantSlug="estudio-ana"
          serviceId="svc-corte"
          value={null}
          onSelect={onSelect}
          onContinue={vi.fn()}
          onBack={vi.fn()}
        />
      </FoundlyThemeProvider>,
    );
    return { onSelect };
  }

  it('renders a real calendar grid and reveals slots for the selected day', async () => {
    const { onSelect } = renderCalendar();
    const user = userEvent.setup();

    expect(screen.getByLabelText('Calendario de disponibilidad')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Mes anterior' })).toBeInTheDocument();

    const day = (await screen.findAllByRole('button', { name: /con huecos disponibles/ }))[0]!;
    await user.click(day);

    const slot = await screen.findByRole('button', { name: '07:00' });
    await user.click(slot);
    expect(onSelect).toHaveBeenCalledWith({
      startAt: expect.stringContaining('T07:00:00.000Z'),
      endAt: expect.stringContaining('T07:30:00.000Z'),
    });
  });

  it('refetches availability when navigating months', async () => {
    renderCalendar();
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: 'Mes siguiente' }));
    expect(fetchMock.mock.calls.length).toBeGreaterThanOrEqual(2);
  });
});
