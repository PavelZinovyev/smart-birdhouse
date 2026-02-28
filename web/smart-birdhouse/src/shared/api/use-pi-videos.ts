import { useQuery } from '@tanstack/react-query';
import { fetchPiVideos, type PiVideoFile } from './pi-videos';
import { queryKeys } from './query-keys';
import { REFETCH_INTERVAL_PI_STATUS_MS, STALE_TIME_OFFSET_MS } from '@/shared/constants/query';

export function usePiVideos(refetchIntervalMs = REFETCH_INTERVAL_PI_STATUS_MS) {
  const query = useQuery({
    queryKey: queryKeys.pi.videos,
    queryFn: fetchPiVideos,
    refetchInterval: refetchIntervalMs,
    refetchIntervalInBackground: false,
    staleTime: refetchIntervalMs - STALE_TIME_OFFSET_MS,
  });

  const files: PiVideoFile[] = query.data?.files ?? [];

  return {
    files,
    loading: query.isPending,
    error: query.error?.message ?? null,
    isSuccess: query.isSuccess && query.data !== null,
    refetch: query.refetch,
  };
}
