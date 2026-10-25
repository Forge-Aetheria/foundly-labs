import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AddGalleryItemInput, AddGalleryItemMutation } from '@/shared/api/generated';
import type { ErrorCode } from '@/shared/api/result';
import { useSession } from '@/shared/auth/session-context';
import { addGalleryItem, fetchGallery, removeGalleryItem, type GalleryPhoto } from './services';

export class GalleryError extends Error {
  constructor(
    readonly code: ErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'GalleryError';
  }
}

function galleryKey(tenantId: string | null) {
  return ['gallery', tenantId] as const;
}

export function useGallery() {
  const { tenantId } = useSession();

  return useQuery<GalleryPhoto[], GalleryError>({
    queryKey: galleryKey(tenantId),
    enabled: Boolean(tenantId),
    queryFn: async () => {
      if (!tenantId) return [];
      const result = await fetchGallery(tenantId);
      if (!result.ok) throw new GalleryError(result.code, result.message);
      return result.data;
    },
  });
}

export function useAddGalleryItem() {
  const { tenantId } = useSession();
  const queryClient = useQueryClient();

  return useMutation<AddGalleryItemMutation['addGalleryItem'], GalleryError, AddGalleryItemInput>({
    mutationFn: async (input) => {
      const result = await addGalleryItem(input);
      if (!result.ok) throw new GalleryError(result.code, result.message);
      return result.data;
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: galleryKey(tenantId) });
    },
  });
}

export function useRemoveGalleryItem() {
  const { tenantId } = useSession();
  const queryClient = useQueryClient();

  return useMutation<true, GalleryError, string>({
    mutationFn: async (id) => {
      const result = await removeGalleryItem(id);
      if (!result.ok) throw new GalleryError(result.code, result.message);
      return result.data;
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: galleryKey(tenantId) });
    },
  });
}
