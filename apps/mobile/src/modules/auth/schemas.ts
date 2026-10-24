export interface LoginValues {
  email: string;
  password: string;
}

export interface LoginErrors {
  email?: string;
  password?: string;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateLogin(values: LoginValues): LoginErrors {
  const errors: LoginErrors = {};
  const email = values.email.trim();
  if (!email) {
    errors.email = 'Introduce tu correo electrónico.';
  } else if (!EMAIL_PATTERN.test(email)) {
    errors.email = 'Introduce un correo electrónico válido.';
  }
  if (!values.password) {
    errors.password = 'Introduce tu contraseña.';
  }
  return errors;
}
