import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FoundlyThemeProvider } from '@foundly/ui';
import { OverrideSubscriptionDialog } from '../dialogs/OverrideSubscriptionDialog';
import type { ManagedBusinessView } from '../utils/types';

const { overrideMock } = vi.hoisted(() => ({ overrideMock: vi.fn() }));
vi.mock('../hooks', () => ({ useOverrideSubscription: () => overrideMock }));

const business: ManagedBusinessView = {
  tenantId: 't1',
  slug: 'estudio-ana',
  name: 'Estudio Ana',
  plan: 'FREE',
  status: 'active',
  expiresAt: null,
};

function renderDialog() {
  const onSaved = vi.fn();
  const onClose = vi.fn();
  render(
    <FoundlyThemeProvider>
      <OverrideSubscriptionDialog open business={business} onClose={onClose} onSaved={onSaved} />
    </FoundlyThemeProvider>,
  );
  return { onSaved, onClose };
}

describe('OverrideSubscriptionDialog (020)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('blocks submitting with no change', async () => {
    const user = userEvent.setup();
    const { onSaved } = renderDialog();
    await user.click(screen.getByRole('button', { name: 'Guardar' }));
    expect(overrideMock).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent('Cambia al menos un campo.');
    expect(onSaved).not.toHaveBeenCalled();
  });

  it('submits the changed plan and notifies on success', async () => {
    const user = userEvent.setup();
    overrideMock.mockResolvedValue({ ok: true, data: { ...business, plan: 'PRO' } });
    const { onSaved, onClose } = renderDialog();
    await user.click(screen.getByText('PRO'));
    await user.click(screen.getByRole('button', { name: 'Guardar' }));
    expect(overrideMock).toHaveBeenCalledWith({ tenantId: 't1', plan: 'PRO' });
    expect(onSaved).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it('shows the inline error on a rejected override', async () => {
    const user = userEvent.setup();
    overrideMock.mockResolvedValue({ ok: false, error: { code: 'FORBIDDEN', message: 'x' } });
    const { onSaved, onClose } = renderDialog();
    await user.click(screen.getByText('PRO'));
    await user.click(screen.getByRole('button', { name: 'Guardar' }));
    expect(screen.getByRole('alert')).toHaveTextContent('No tienes permisos');
    expect(onSaved).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });
});
