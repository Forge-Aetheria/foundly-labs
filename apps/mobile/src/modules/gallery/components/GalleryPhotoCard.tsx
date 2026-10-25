import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { AppText } from '@/shared/ui/AppText';
import { Button } from '@/shared/ui/Button';
import { colors, radii, spacing } from '@/shared/theme/tokens';
import { galleryCategoryLabel } from '../categories';
import type { GalleryPhoto } from '../services';

export function GalleryPhotoCard({
  photo,
  deleting = false,
  onDelete,
}: {
  photo: GalleryPhoto;
  deleting?: boolean;
  onDelete: () => void;
}) {
  const [broken, setBroken] = useState(false);
  const category = galleryCategoryLabel(photo.category);

  return (
    <View style={styles.card}>
      {broken ? (
        <View style={styles.broken}>
          <Ionicons name="image-outline" size={26} color={colors.textMuted} />
          <AppText variant="caption" color={colors.textMuted} style={styles.center}>
            No se pudo cargar la imagen.
          </AppText>
        </View>
      ) : (
        <Image
          source={{ uri: photo.url }}
          style={styles.image}
          resizeMode="cover"
          accessibilityLabel={photo.title ?? 'Foto de la galería'}
          onError={() => setBroken(true)}
        />
      )}

      <View style={styles.body}>
        {photo.title ? <AppText variant="label">{photo.title}</AppText> : null}
        {photo.description ? (
          <AppText variant="caption" color={colors.textSecondary} numberOfLines={2}>
            {photo.description}
          </AppText>
        ) : null}
        {category ? (
          <View style={styles.category}>
            <AppText variant="caption" color={colors.textSecondary}>
              {category}
            </AppText>
          </View>
        ) : null}
        <Button
          label="Quitar foto"
          variant="ghost"
          loading={deleting}
          disabled={deleting}
          onPress={onDelete}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    overflow: 'hidden',
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  image: { width: '100%', aspectRatio: 4 / 3, backgroundColor: colors.surfaceMuted },
  broken: {
    width: '100%',
    aspectRatio: 4 / 3,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    padding: spacing.md,
    backgroundColor: colors.surfaceMuted,
  },
  body: { gap: spacing.xs, padding: spacing.md },
  category: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceMuted,
  },
  center: { textAlign: 'center' },
});
