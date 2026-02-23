import { useQuery } from '@tanstack/react-query';
import { fetchPiStatus, setPiPower, type PiStatus } from './pi';
import { queryKeys } from './query-keys';
import { useMutationWithInvalidate } from './use-mutation-with-invalidate';
import { REFETCH_INTERVAL_PI_STATUS_MS, STALE_TIME_OFFSET_MS } from '@/shared/constants/query';

function piStatusQueryFn(): Promise<PiStatus | null> {
  return fetchPiStatus();
}

export function usePiStatus(refetchIntervalMs = REFETCH_INTERVAL_PI_STATUS_MS) {
  return useQuery({
    queryKey: queryKeys.pi.status,
    queryFn: piStatusQueryFn,
    refetchInterval: refetchIntervalMs,
    refetchIntervalInBackground: false,
    staleTime: refetchIntervalMs - STALE_TIME_OFFSET_MS,
  });
}

export function usePiPower() {
  const mutation = useMutationWithInvalidate({
    mutationFn: ({ on, manual }: { on: boolean; manual: boolean }) => setPiPower(on, manual),
    invalidateKeys: [queryKeys.pi.status],
  });

  return {
    turnOnManual: () => mutation.mutate({ on: true, manual: true }),
    turnOff: () => mutation.mutate({ on: false, manual: false }),
    isPending: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  };
}
