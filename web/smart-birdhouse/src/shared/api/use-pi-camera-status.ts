import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';
import { fetchPiCameraStatus, startPiRecording, stopPiRecording } from './pi';
import { queryKeys } from './query-keys';
import { REFETCH_INTERVAL_PI_STATUS_MS, STALE_TIME_OFFSET_MS } from '@/shared/constants/query';

export function usePiCameraStatus(enabled: boolean, refetchIntervalMs = REFETCH_INTERVAL_PI_STATUS_MS) {
  return useQuery({
    queryKey: queryKeys.pi.cameraStatus,
    queryFn: fetchPiCameraStatus,
    refetchInterval: refetchIntervalMs,
    refetchIntervalInBackground: false,
    staleTime: refetchIntervalMs - STALE_TIME_OFFSET_MS,
    enabled,
  });
}

export function useStopPiRecording() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: stopPiRecording,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pi.cameraStatus });
    },
  });
}

export function useStartPiRecording() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: startPiRecording,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pi.cameraStatus });
    },
  });
}
