import { Pressable, StyleSheet } from 'react-native';
import { useState } from 'react';
import { AppText } from '@/shared/ui/AppText';
import { TextField } from '@/shared/ui/TextField';
import { spacing } from '@/shared/theme/tokens';

export interface PasswordFieldProps {
  value: string;
  onChangeText: (value: string) => void;
  error?: string;
}

export function PasswordField({ value, onChangeText, error }: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <TextField
      label="Contraseña"
      value={value}
      onChangeText={onChangeText}
      error={error}
      secureTextEntry={!visible}
      autoCapitalize="none"
      autoCorrect={false}
      textContentType="password"
      rightAccessory={
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          onPress={() => setVisible((current) => !current)}
          style={styles.toggle}
        >
          <AppText variant="caption">{visible ? 'Ocultar' : 'Mostrar'}</AppText>
        </Pressable>
      }
    />
  );
}

const styles = StyleSheet.create({
  toggle: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs },
});
