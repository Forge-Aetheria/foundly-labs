import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { AppText } from '@/shared/ui/AppText';
import { Button } from '@/shared/ui/Button';
import { TextField } from '@/shared/ui/TextField';
import { colors, radii, spacing } from '@/shared/theme/tokens';
import { useChangePassword } from '@/modules/auth/hooks';

export function SecuritySettingsTab() {
  const changePassword = useChangePassword();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [notice, setNotice] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);

  async function submit() {
    setNotice(null);
    try {
      await changePassword.mutateAsync({ currentPassword, newPassword, confirmPassword });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setNotice({ tone: 'ok', text: 'Contraseña actualizada correctamente.' });
    } catch (error) {
      setNotice({
        tone: 'error',
        text: error instanceof Error ? error.message : 'No pudimos actualizar la contraseña.',
      });
    }
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scroll}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.section}>
        <AppText variant="heading">Seguridad</AppText>
        <AppText color={colors.textSecondary}>
          Cambia la contraseña con la que accedes a tu panel.
        </AppText>
      </View>

      <View style={styles.card}>
        <TextField
          label="Contraseña actual"
          value={currentPassword}
          onChangeText={setCurrentPassword}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TextField
          label="Nueva contraseña"
          value={newPassword}
          onChangeText={setNewPassword}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
        />
        <AppText variant="caption" color={colors.textMuted}>
          Mínimo 8 caracteres, con letras y números.
        </AppText>
        <TextField
          label="Repite la nueva contraseña"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
        />

        {notice ? (
          <AppText
            variant="caption"
            color={notice.tone === 'ok' ? colors.positive : colors.negative}
            accessibilityRole="alert"
          >
            {notice.text}
          </AppText>
        ) : null}

        <Button
          label={changePassword.isPending ? 'Guardando…' : 'Guardar contraseña'}
          onPress={() => void submit()}
          loading={changePassword.isPending}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { gap: spacing.lg, paddingVertical: spacing.lg, paddingBottom: spacing.xl },
  section: { gap: spacing.xs },
  card: {
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
});
