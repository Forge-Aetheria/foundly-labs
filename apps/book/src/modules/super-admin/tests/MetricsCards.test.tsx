import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { FoundlyThemeProvider } from '@foundly/ui';
import { MetricsCards } from '../components/MetricsCards';
import { PlanDistribution } from '../components/PlanDistribution';
import type { PlatformMetricsView } from '../utils/types';

function metrics(overrides: Partial<PlatformMetricsView> = {}): PlatformMetricsView {
  return {
    businessesTotal: 12,
    businessesActive: 9,
    usersTotal: 40,
    usersActive: 30,
    usersAvailable: true,
    plansFree: 7,
    plansPro: 5,
    proConversion: 5 / 12,
    ...overrides,
  };
}

describe('MetricsCards (020)', () => {
  it('renders the business, user and conversion figures', () => {
    render(
      <FoundlyThemeProvider>
        <MetricsCards metrics={metrics()} />
      </FoundlyThemeProvider>,
    );
    expect(screen.getByText('Total negocios')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('9')).toBeInTheDocument();
    expect(screen.getByText('40')).toBeInTheDocument();
    expect(screen.getByText('42%')).toBeInTheDocument();
  });

  it('shows the unavailable state for users when the metric is unavailable', () => {
    render(
      <FoundlyThemeProvider>
        <MetricsCards metrics={metrics({ usersAvailable: false, usersTotal: null, usersActive: null })} />
      </FoundlyThemeProvider>,
    );
    expect(screen.getByText('No disponible')).toBeInTheDocument();
  });

  it('renders the FREE vs PRO distribution', () => {
    render(
      <FoundlyThemeProvider>
        <PlanDistribution metrics={metrics()} />
      </FoundlyThemeProvider>,
    );
    expect(screen.getByText('FREE 7')).toBeInTheDocument();
    expect(screen.getByText('PRO 5')).toBeInTheDocument();
  });
});
