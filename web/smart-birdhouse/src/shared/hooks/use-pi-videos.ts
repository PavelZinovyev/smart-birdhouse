import { useQuery } from '@tanstack/react-query';
import { deletePiVideo, fetchPiVideos, type IPiVideoFile } from '../api/pi-videos';
import { queryKeys } from '../api/query-keys';
import { useMutationWithInvalidate } from './use-mutation-with-invalidate';
import { REFETCH_INTERVAL_PI_STATUS_MS, STALE_TIME_OFFSET_MS } from '@/shared/constants/query';

export function usePiVideos(refetchIntervalMs = REFETCH_INTERVAL_PI_STATUS_MS) {
  const query = useQuery({
    queryKey: queryKeys.pi.videos,
    queryFn: fetchPiVideos,
    refetchInterval: refetchIntervalMs,
    refetchIntervalInBackground: false,
    staleTime: refetchIntervalMs - STALE_TIME_OFFSET_MS,
  });

  const files: IPiVideoFile[] = query.data?.files ?? [];
  const hasNoFilesYet = files.length === 0;
  const loading = query.isPending || (query.isFetching && hasNoFilesYet);

  return {
    files,
    loading,
    error: query.error?.message ?? null,
    isSuccess: query.isSuccess && query.data !== null,
    refetch: query.refetch,
  };
}

export function useDeletePiVideo() {
  const mutation = useMutationWithInvalidate({
    mutationFn: (name: string) => deletePiVideo(name),
    invalidateKeys: [queryKeys.pi.videos],
  });

  const { mutate, mutateAsync, isPending, variables, error } = mutation;

  return {
    deleteVideo: mutate,
    deleteVideoAsync: mutateAsync,
    isDeleting: isPending,
    deletingName: variables ?? null,
    deleteError: error,
  };
}
