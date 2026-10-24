import type { ReactNode } from 'react';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';
import { AppText } from './AppText';
import { colors, radii, spacing } from '../theme/tokens';

export interface TextFieldProps extends TextInputProps {
  label: string;
  error?: string;
  rightAccessory?: ReactNode;
}

export function TextField({ label, error, rightAccessory, style, ...rest }: TextFieldProps) {
  return (
    <View style={styles.wrapper}>
      <AppText variant="label">{label}</AppText>
      <View style={[styles.inputRow, error ? styles.inputError : null]}>
        <TextInput
          accessibilityLabel={label}
          placeholderTextColor={colors.textMuted}
          style={[styles.input, style]}
          {...rest}
        />
        {rightAccessory}
      </View>
      {error ? (
        <AppText variant="caption" color={colors.negative}>
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: spacing.xs },
  inputRow: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },
  inputError: { borderColor: colors.negative },
  input: { flex: 1, color: colors.textPrimary, fontSize: 16, paddingVertical: spacing.sm },
});
