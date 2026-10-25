import { render, screen } from '@testing-library/react-native';
import { LoadingState } from '../LoadingState';

describe('LoadingState', () => {
  it('renders the default and overlay variants with a label', async () => {
    const first = await render(<LoadingState label="Cargando agenda…" />);
    expect(screen.getByText('Cargando agenda…')).toBeTruthy();
    expect(screen.getByLabelText('Cargando agenda…')).toBeTruthy();
    first.unmount();

    await render(<LoadingState variant="overlay" label="Actualizando pagos…" />);
    expect(screen.getByText('Actualizando pagos…')).toBeTruthy();
  });
});
