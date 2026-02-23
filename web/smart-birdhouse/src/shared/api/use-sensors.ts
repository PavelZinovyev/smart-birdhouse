import { useQuery } from '@tanstack/react-query';
import { fetchSensors, type SensorsData, type SensorsResult } from './sensors';

export const SENSORS_QUERY_KEY = ['sensors'] as const;
const REFETCH_INTERVAL_MS = 5000;

function sensorsQueryFn(): Promise<SensorsResult> {
  return fetchSensors();
}

/**
 * Данные сенсоров с кэшем и автообновлением.
 * Новый запрос не стартует, пока предыдущий в pending (TanStack Query по умолчанию).
 */
export function useSensors(refetchIntervalMs = REFETCH_INTERVAL_MS) {
  const query = useQuery({
    queryKey: SENSORS_QUERY_KEY,
    queryFn: sensorsQueryFn,
    refetchInterval: refetchIntervalMs,
    refetchIntervalInBackground: false,
    staleTime: refetchIntervalMs - 500,
  });

  const result = query.data;
  const data: SensorsData | null = result?.data ?? null;
  const isMock = result?.isMock ?? false;
  const error = query?.error?.message;

  return {
    data,
    loading: query.isPending,
    error,
    isMock,
    refetch: query.refetch,
    isFetching: query.isFetching,
  };
}
