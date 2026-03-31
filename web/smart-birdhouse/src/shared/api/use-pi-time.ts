import { useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchPiTime, syncPiTimeFromPhone } from './pi';
import { queryKeys } from './query-keys';
import { REFETCH_INTERVAL_PI_TIME_MS, STALE_TIME_OFFSET_MS } from '@/shared/constants/query';

/** Защита от двойного вызова в React Strict Mode и от слишком частых POST. */
const SYNC_DEBOUNCE_MS = 1500;

let lastSyncAt = 0;

export type UseAutoSyncPiTimeResult = {
  /** Строка времени с Pi для вывода в разметке; `null` — Pi выключен, подпись не показываем. */
  piTimeLabel: string | null;
};

/**
 * Автосинхронизация времени телефона с Raspberry и опрос отображаемого времени Pi.
 */
export function useAutoSyncPiTime(piPowerOn: boolean): UseAutoSyncPiTimeResult {
  const queryClient = useQueryClient();
  const prevOnRef = useRef<boolean | undefined>(undefined);

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.pi.time,
    queryFn: fetchPiTime,
    enabled: piPowerOn,
    refetchInterval: REFETCH_INTERVAL_PI_TIME_MS,
    refetchIntervalInBackground: false,
    staleTime: REFETCH_INTERVAL_PI_TIME_MS - STALE_TIME_OFFSET_MS,
  });

  useEffect(() => {
    if (!piPowerOn) {
      prevOnRef.current = false;
      return;
    }

    const wasOff = prevOnRef.current === false;
    const isFirstWithOn = prevOnRef.current === undefined;
    prevOnRef.current = true;

    if (!isFirstWithOn && !wasOff) {
      return;
    }

    const now = Date.now();
    if (now - lastSyncAt < SYNC_DEBOUNCE_MS) {
      return;
    }
    lastSyncAt = now;

    syncPiTimeFromPhone(now)
      .then(() => {
        queryClient.invalidateQueries({ queryKey: queryKeys.pi.time });
      })
      .catch(() => {
        // Pi недоступен или сеть — не мешаем UI
      });
  }, [piPowerOn, queryClient]);

  const piTimeLabel = !piPowerOn ? null : isLoading ? 'загрузка…' : (data?.local ?? '—');

  return { piTimeLabel };
}
