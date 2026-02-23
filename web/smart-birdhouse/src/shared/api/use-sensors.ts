import { useQuery } from '@tanstack/react-query';
import { fetchSensors, type SensorsData } from './sensors';
import { queryKeys } from './query-keys';
import { REFETCH_INTERVAL_SENSORS_MS, STALE_TIME_OFFSET_MS } from '@/shared/constants/query';

/**
 * Данные сенсоров с кэшем и автообновлением.
 * Новый запрос не стартует, пока предыдущий в pending (TanStack Query по умолчанию).
 */
export function useSensors(refetchIntervalMs = REFETCH_INTERVAL_SENSORS_MS) {
  const query = useQuery({
    queryKey: queryKeys.sensors,
    queryFn: fetchSensors,
    refetchInterval: refetchIntervalMs,
    refetchIntervalInBackground: false,
    staleTime: refetchIntervalMs - STALE_TIME_OFFSET_MS,
  });

  const data: SensorsData | null = query.data ?? null;

  return {
    data,
    loading: query.isPending,
    error: query?.error?.message,
    refetch: query.refetch,
    isFetching: query.isFetching,
  };
}
