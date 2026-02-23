/** Интервалы опроса и stale для TanStack Query */

export const REFETCH_INTERVAL_SENSORS_MS = 5000;
export const REFETCH_INTERVAL_PI_STATUS_MS = 3000;

/** Вычитаем из refetchInterval для staleTime, чтобы данные не считались свежими до следующего запроса */
export const STALE_TIME_OFFSET_MS = 500;
