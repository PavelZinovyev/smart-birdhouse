import { useEffect, useRef } from 'react';
import { syncPiTimeFromPhone } from '../api/pi';

/** Защита от двойного вызова в React Strict Mode и от слишком частых POST. */
const SYNC_DEBOUNCE_MS = 1500;

let lastSyncAt = 0;

/**
 * При включении Raspberry Pi передаёт на неё время телефона.
 * В UI ничего не показывает — нужно для корректных имён файлов и mtime на Pi (превью в списке видео).
 */
export function useSyncPiTimeWhenPiOn(piPowerOn: boolean): void {
  const prevOnRef = useRef<boolean | undefined>(undefined);

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

    syncPiTimeFromPhone(now).catch(() => {
      // Pi недоступен или сеть — не мешаем UI
    });
  }, [piPowerOn]);
}
