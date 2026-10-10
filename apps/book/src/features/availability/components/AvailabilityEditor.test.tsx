import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'vitest-axe';
import { describe, expect, it } from 'vitest';
import { FoundlyThemeProvider } from '@foundly/ui';
import { AvailabilityEditor } from './AvailabilityEditor';

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

describe('AvailabilityEditor (admin availability)', () => {
  it('renders the weekly config, toggles and save button', async () => {
    const { container } = render(
      <FoundlyThemeProvider>
        <AvailabilityEditor rules={rules} blocks={[]} />
      </FoundlyThemeProvider>,
    );

    expect(screen.getByText('Disponibilidad')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Guardar disponibilidad' })).toBeInTheDocument();
    expect(screen.getByText('Lunes')).toBeInTheDocument();
    expect(screen.getByText('Domingo')).toBeInTheDocument();
    expect(screen.getByText('0 bloqueo(s) de horario configurados.')).toBeInTheDocument();

    const results = await axe(container, { rules: { 'color-contrast': { enabled: false } } });
    expect(results.violations).toHaveLength(0);
  });

  it('toggles a day and confirms the save', async () => {
    const user = userEvent.setup();
    render(
      <FoundlyThemeProvider>
        <AvailabilityEditor rules={rules} blocks={[]} />
      </FoundlyThemeProvider>,
    );

    await user.click(screen.getByRole('button', { name: 'Lunes' }));
    expect(screen.getAllByText('Cerrado')).toHaveLength(7);

    await user.click(screen.getByRole('button', { name: 'Guardar disponibilidad' }));
    expect(screen.getByText('Guardado')).toBeInTheDocument();
  });
});