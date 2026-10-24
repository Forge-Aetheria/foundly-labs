import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button } from '@/shared/ui/Button';
import { TextField } from '@/shared/ui/TextField';
import { AppText } from '@/shared/ui/AppText';
import { colors, spacing } from '@/shared/theme/tokens';
import { validateLogin, type LoginErrors, type LoginValues } from '../schemas';
import { PasswordField } from './PasswordField';

export interface LoginFormProps {
  onSubmit: (values: LoginValues) => Promise<string | null>;
}

export function LoginForm({ onSubmit }: LoginFormProps) {
  const [values, setValues] = useState<LoginValues>({ email: '', password: '' });
  const [errors, setErrors] = useState<LoginErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const submit = async () => {
    const validation = validateLogin(values);
    setErrors(validation);
    setFormError(null);
    if (Object.keys(validation).length > 0) {
      return;
    }
    setPending(true);
    try {
      const message = await onSubmit(values);
      if (message) setFormError(message);
    } finally {
      setPending(false);
    }
  };

  return (
    <View style={styles.form}>
      <TextField
        label="Correo electrónico"
        value={values.email}
        onChangeText={(email) => setValues((current) => ({ ...current, email }))}
        error={errors.email}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        textContentType="emailAddress"
      />
      <PasswordField
        value={values.password}
        onChangeText={(password) => setValues((current) => ({ ...current, password }))}
        error={errors.password}
      />
      {formError ? (
        <AppText variant="caption" color={colors.negative} accessibilityRole="alert">
          {formError}
        </AppText>
      ) : null}
      <Button label="Entrar" onPress={() => void submit()} loading={pending} />
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: spacing.md },
});
