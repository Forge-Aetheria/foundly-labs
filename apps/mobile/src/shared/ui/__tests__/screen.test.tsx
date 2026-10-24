import { render, screen } from '@testing-library/react-native';
import { AppText } from '../AppText';

describe('AppText', () => {
  it('renders its children', async () => {
    await render(<AppText>Foundly</AppText>);
    expect(screen.getByText('Foundly')).toBeTruthy();
  });
});
