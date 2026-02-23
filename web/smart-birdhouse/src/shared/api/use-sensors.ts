import { useQuery } from '@tanstack/react-query';
import { fetchSensors, type SensorsData, type SensorsResult } from './sensors';
import { queryKeys } from './query-keys';
import { REFETCH_INTERVAL_SENSORS_MS, STALE_TIME_OFFSET_MS } from '@/shared/constants/query';

function sensorsQueryFn(): Promise<SensorsResult> {
  return fetchSensors();
}

/**
 * Данные сенсоров с кэшем и автообновлением.
 * Новый запрос не стартует, пока предыдущий в pending (TanStack Query по умолчанию).
 */
export function useSensors(refetchIntervalMs = REFETCH_INTERVAL_SENSORS_MS) {
  const query = useQuery({
    queryKey: queryKeys.sensors,
    queryFn: sensorsQueryFn,
    refetchInterval: refetchIntervalMs,
    refetchIntervalInBackground: false,
    staleTime: refetchIntervalMs - STALE_TIME_OFFSET_MS,
  });

  const result = query.data;
  const data: SensorsData | null = result?.data ?? null;
  const isMock = result?.isMock ?? false;

  return {
    data,
    loading: query.isPending,
    error: query?.error?.message,
    isMock,
    refetch: query.refetch,
    isFetching: query.isFetching,
  };
}
