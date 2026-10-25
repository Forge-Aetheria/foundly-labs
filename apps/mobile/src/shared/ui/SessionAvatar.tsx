import { Image, StyleSheet, View } from 'react-native';
import { AppText } from './AppText';
import { colors, radii } from '../theme/tokens';

export interface SessionAvatarProps {
  displayName: string;
  avatarUrl?: string | null;
  initials?: string;
  size?: number;
}

export function SessionAvatar({
  displayName,
  avatarUrl,
  initials,
  size = 38,
}: SessionAvatarProps) {
  const fallback = initials && initials.length > 0 ? initials : 'AD';
  const dimension = { width: size, height: size, borderRadius: size / 2 };

  if (avatarUrl) {
    return (
      <Image
        source={{ uri: avatarUrl }}
        accessibilityLabel={`Avatar de ${displayName}`}
        style={[styles.image, dimension]}
      />
    );
  }

  return (
    <View
      accessibilityLabel={`Avatar de ${displayName}`}
      style={[styles.fallback, dimension]}
    >
      <AppText variant="label" color={colors.primary} style={{ fontSize: size * 0.36 }}>
        {fallback}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    backgroundColor: colors.surfaceMuted,
    borderWidth: 2,
    borderColor: colors.borderStrong,
  },
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: radii.pill,
  },
});
