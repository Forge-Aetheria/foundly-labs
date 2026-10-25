import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Alert, FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { AppText } from '@/shared/ui/AppText';
import { EmptyState } from '@/shared/ui/EmptyState';
import { ErrorState } from '@/shared/ui/ErrorState';
import { LoadingState } from '@/shared/ui/LoadingState';
import { Screen } from '@/shared/ui/Screen';
import { colors, spacing } from '@/shared/theme/tokens';
import { useGallery, useRemoveGalleryItem } from './hooks';
import type { GalleryPhoto } from './services';
import { GalleryPhotoCard } from './components/GalleryPhotoCard';
import { GalleryPhotoFormModal } from './components/GalleryPhotoFormModal';

export function GalleryView() {
  const gallery = useGallery();
  const remove = useRemoveGalleryItem();
  const [formOpen, setFormOpen] = useState(false);

  if (gallery.isLoading) {
    return (
      <Screen>
        <LoadingState label="Cargando galería…" />
      </Screen>
    );
  }

  if (gallery.isError) {
    return (
      <Screen>
        <ErrorState message={gallery.error.message} onRetry={() => void gallery.refetch()} />
      </Screen>
    );
  }

  const photos = gallery.data ?? [];

  function confirmDelete(photo: GalleryPhoto) {
    Alert.alert('Quitar foto', '¿Eliminar esta foto de la galería?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: () => remove.mutate(photo.id),
      },
    ]);
  }

  return (
    <Screen>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <AppText variant="title">Galería</AppText>
            <AppText color={colors.textSecondary}>
              Fotos del negocio que se muestran en la vista pública.
            </AppText>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Añadir imagen"
            onPress={() => setFormOpen(true)}
            style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}
          >
            <Ionicons name="add" size={20} color={colors.surface} />
          </Pressable>
        </View>

        {remove.error ? (
          <AppText variant="caption" color={colors.negative} accessibilityRole="alert">
            {remove.error.message}
          </AppText>
        ) : null}

        <View style={styles.listContainer}>
          <FlatList
            data={photos}
            keyExtractor={(item) => item.id}
            numColumns={2}
            columnWrapperStyle={photos.length > 0 ? styles.row : undefined}
            contentContainerStyle={[styles.list, photos.length === 0 && styles.emptyList]}
            ListEmptyComponent={
              <EmptyState
                title="Todavía no hay fotos"
                message="Añade la primera imagen para mostrar tu negocio en la página pública."
              />
            }
            renderItem={({ item }) => (
              <GalleryPhotoCard
                photo={item}
                deleting={remove.isPending && remove.variables === item.id}
                onDelete={() => confirmDelete(item)}
              />
            )}
            refreshControl={
              <RefreshControl
                refreshing={gallery.isRefetching}
                onRefresh={() => void gallery.refetch()}
                tintColor={colors.primary}
              />
            }
          />
          {gallery.isFetching ? (
            <LoadingState variant="overlay" label="Actualizando galería…" />
          ) : null}
        </View>
      </View>

      <GalleryPhotoFormModal
        key={formOpen ? 'open' : 'closed'}
        visible={formOpen}
        onClose={() => setFormOpen(false)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, gap: spacing.md, paddingTop: spacing.lg },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  headerCopy: { flex: 1, gap: spacing.xs },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  pressed: { opacity: 0.7 },
  listContainer: { flex: 1 },
  list: { gap: spacing.md, paddingVertical: spacing.lg, paddingBottom: spacing.xl },
  emptyList: { flexGrow: 1 },
  row: { gap: spacing.md },
});
