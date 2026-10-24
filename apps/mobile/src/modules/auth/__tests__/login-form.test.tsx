import { fireEvent, render, screen } from '@testing-library/react-native';
import { LoginForm } from '../components/LoginForm';

describe('LoginForm', () => {
  it('toggles password visibility without losing the value', async () => {
    await render(<LoginForm onSubmit={async () => null} />);
    const password = screen.getByLabelText('Contraseña');
    await fireEvent.changeText(password, 'secreto');
    expect(password.props.secureTextEntry).toBe(true);

    await fireEvent.press(screen.getByRole('button', { name: 'Mostrar contraseña' }));
    expect(screen.getByLabelText('Contraseña').props.secureTextEntry).toBe(false);
    expect(screen.getByLabelText('Contraseña').props.value).toBe('secreto');
  });

  it('shows validation errors before calling the API', async () => {
    const onSubmit = jest.fn(async () => null);
    await render(<LoginForm onSubmit={onSubmit} />);
    await fireEvent.press(screen.getByRole('button', { name: 'Entrar' }));
    expect(screen.getByText('Introduce tu correo electrónico.')).toBeTruthy();
    expect(screen.getByText('Introduce tu contraseña.')).toBeTruthy();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('shows the provider error returned by the submit handler', async () => {
    await render(<LoginForm onSubmit={async () => 'Credenciales inválidas'} />);
    await fireEvent.changeText(screen.getByLabelText('Correo electrónico'), 'ana@foundly.dev');
    await fireEvent.changeText(screen.getByLabelText('Contraseña'), 'secret');
    await fireEvent.press(screen.getByRole('button', { name: 'Entrar' }));
    expect(await screen.findByText('Credenciales inválidas')).toBeTruthy();
  });
});
