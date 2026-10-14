import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'vitest-axe';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FoundlyThemeProvider } from '@foundly/ui';
import type { TimeBlock } from '../../../shared/types/appointments';
import { AvailabilityEditor } from '../components/AvailabilityEditor';

const { saveMock, addMock, removeMock } = vi.hoisted(() => ({
  saveMock: vi.fn(),
  addMock: vi.fn(),
  removeMock: vi.fn(),
}));

vi.mock('../hooks', () => ({
  useSaveAvailability: () => saveMock,
  useAddTimeBlock: () => addMock,
  useRemoveTimeBlock: () => removeMock,
}));

const rules = [
  {
    id: 'rule-1',
    resourceId: 'r1',
    weekday: 1,
    startTime: '09:00',
    endTime: '18:00',
    slotGranularityMinutes: 30,
    minLeadTimeMinutes: 0,
    bookingHorizonDays: 60,
  },
];

const blocks: TimeBlock[] = [
  {
    id: 'tb1',
    resourceId: 'ten-ana',
    startAt: '2026-12-24T09:00:00.000Z',
    endAt: '2026-12-24T13:00:00.000Z',
    kind: 'block',
    recurrence: 'none',
    recurrenceUntil: null,
    reason: 'Nochebuena',
  },
];

function renderEditor(initialBlocks: TimeBlock[] = blocks) {
  return render(
    <FoundlyThemeProvider>
      <AvailabilityEditor rules={rules} blocks={initialBlocks} />
    </FoundlyThemeProvider>,
  );
}

describe('AvailabilityEditor (admin schedules, features 015/022)', () => {
  beforeEach(() => {
    saveMock.mockReset();
    addMock.mockReset();
    removeMock.mockReset();
  });

  it('renders the weekly schedule, the real blocks and the save button', async () => {
    const { container } = renderEditor();

    expect(screen.getByText('Horario y disponibilidad')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Guardar horario semanal' })).toBeInTheDocument();
    expect(screen.getByText('1 bloqueo(s) configurados.')).toBeInTheDocument();
    expect(screen.getByText('2026-12-24 · 09:00–13:00')).toBeInTheDocument();
    expect(screen.getByText('Nochebuena')).toBeInTheDocument();

    const results = await axe(container, { rules: { 'color-contrast': { enabled: false } } });
    expect(results.violations).toHaveLength(0);
  });

  it('shows a clean empty state when there are no blocks', () => {
    renderEditor([]);
    expect(screen.getByText('0 bloqueo(s) configurados.')).toBeInTheDocument();
    expect(screen.getByText(/No hay bloqueos/)).toBeInTheDocument();
  });

  it('saves the weekly schedule through the server action', async () => {
    saveMock.mockResolvedValue({ ok: true, data: { updated: true } });
    const user = userEvent.setup();
    renderEditor();

    await user.click(screen.getByRole('button', { name: 'Guardar horario semanal' }));

    expect(saveMock).toHaveBeenCalledWith({
      days: expect.arrayContaining([
        { weekday: 1, isOpen: true, startTime: '09:00', endTime: '18:00' },
      ]),
    });
    expect(await screen.findByText('Guardado')).toBeInTheDocument();
  });

  it('adds a time-range block through the server action', async () => {
    addMock.mockResolvedValue({
      ok: true,
      data: {
        id: 'tb2',
        resourceId: 'ten-ana',
        startAt: '2026-12-31T09:00:00',
        endAt: '2026-12-31T13:00:00',
        kind: 'block',
        recurrence: 'none',
        recurrenceUntil: null,
        reason: 'Fin de año',
      },
    });
    const user = userEvent.setup();
    renderEditor([]);

    await user.type(screen.getByLabelText(/Fecha/), '2026-12-31');
    await user.type(screen.getByLabelText(/Motivo/), 'Fin de año');
    await user.click(screen.getByRole('button', { name: 'Bloquear' }));

    expect(addMock).toHaveBeenCalledWith({
      date: '2026-12-31',
      startTime: '09:00',
      endTime: '13:00',
      reason: 'Fin de año',
    });
    expect(await screen.findByText('2026-12-31 · 09:00–13:00')).toBeInTheDocument();
  });

  it('blocks a full day when "Días completos" is selected', async () => {
    addMock.mockResolvedValue({
      ok: true,
      data: {
        id: 'tb3',
        resourceId: 'ten-ana',
        startAt: '2027-01-01T00:00:00',
        endAt: '2027-01-01T23:59:00',
        kind: 'block',
        recurrence: 'none',
        recurrenceUntil: null,
        reason: 'Año nuevo',
      },
    });
    const user = userEvent.setup();
    renderEditor([]);

    await user.click(screen.getByText('Días completos'));
    await user.type(screen.getByLabelText(/Fecha/), '2027-01-01');
    await user.click(screen.getByRole('button', { name: 'Bloquear' }));

    expect(addMock).toHaveBeenCalledWith({
      date: '2027-01-01',
      startTime: '00:00',
      endTime: '23:59',
      reason: '',
    });
    expect(await screen.findByText('Día completo')).toBeInTheDocument();
  });

  it('surfaces an inline error returned by the add action', async () => {
    addMock.mockResolvedValue({
      ok: false,
      error: { code: 'VALIDATION_ERROR', message: 'Datos del bloqueo inválidos.', fields: { date: 'Fecha inválida.' } },
    });
    const user = userEvent.setup();
    renderEditor([]);

    await user.click(screen.getByRole('button', { name: 'Bloquear' }));
    expect(await screen.findByText('Fecha inválida.')).toBeInTheDocument();
  });

  it('removes a block after confirming the dialog', async () => {
    removeMock.mockResolvedValue({ ok: true, data: { id: 'tb1' } });
    const user = userEvent.setup();
    renderEditor();

    await user.click(screen.getByRole('button', { name: 'Desbloquear' }));
    await user.click(screen.getByRole('button', { name: 'Sí, desbloquear' }));

    expect(removeMock).toHaveBeenCalledWith({ id: 'tb1' });
    expect(screen.queryByText('Nochebuena')).not.toBeInTheDocument();
  });
});
